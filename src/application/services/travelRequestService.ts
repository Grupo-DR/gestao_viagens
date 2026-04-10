// ============================================================
// APPLICATION — Service — Travel Request Service
// Camada de aplicação: orquestra comandos Firestore com regras de negócio.
// Nenhuma lógica de display aqui. Recebe UserProfile como contexto de auditoria.
// ============================================================

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../../infrastructure/firebase/firebase';
import { RequestStatus, PurchaseStatus, ValidationStatus } from '../../domain/enums';
import {
  getInitialStatus,
  needsValidation,
  canTransitionStatus,
} from '../../domain/travelRequest.rules';
import type {
  TravelRequest,
  TravelRequestFormData,
  UserProfile,
  HistoryEntry,
  PurchaseInfo,
} from '../../domain/types';
import { PolicyDecision } from '../../domain/policy/types';
import { suggestNextStatus } from '../use-cases/evaluateTravelPolicy';
import { deriveTravelSummaryFromSegments } from '../../domain/travelSegment.helpers';

const COLLECTION = 'travelRequests';

// ──────────────────────────────────────────────
// Configuração de Demo/Mock
// ──────────────────────────────────────────────

/** 
 * SET TO TRUE PARA TESTAR SEM FIREBASE (MODO LOCALSTORAGE)
 * Útil quando o banco está fora do ar ou com erros de validação.
 */
export const FORCE_MOCK_MODE = false;

// ──────────────────────────────────────────────
// Helpers internos para Mock/Demo
// ──────────────────────────────────────────────

function saveToLocalStorage(request: TravelRequest) {
  const localRequests: TravelRequest[] = JSON.parse(localStorage.getItem('demo_requests') || '[]');
  const index = localRequests.findIndex(r => r.requestId === request.requestId);
  
  if (index >= 0) {
    localRequests[index] = request;
  } else {
    localRequests.push(request);
  }
  
  localStorage.setItem('demo_requests', JSON.stringify(localRequests));
}

/** Cria uma entrada de histórico padronizada */
function buildHistoryEntry(
  status: RequestStatus,
  user: UserProfile,
  comment: string
): HistoryEntry {
  return {
    status,
    updatedBy: user.email,
    updatedAt: new Date().toISOString(),
    comment,
  };
}

// ──────────────────────────────────────────────
// Comandos públicos
// ──────────────────────────────────────────────

/**
 * Cria uma nova solicitação de viagem no Firestore.
 * Calcula o status inicial com base no motivo e na intenção (rascunho vs. envio).
 */
export async function createTravelRequest(
  formData: TravelRequestFormData,
  author: UserProfile,
  asDraft: boolean,
  policyDecision?: PolicyDecision
): Promise<string> {
  // O status inicial é RASCUNHO se asDraft, caso contrário sugerido pelo motor de regras
  const status = asDraft 
    ? RequestStatus.RASCUNHO 
    : (policyDecision ? suggestNextStatus(policyDecision) : getInitialStatus(formData.reason, false));
  const now = new Date().toISOString();

  const historyEntry = buildHistoryEntry(
    status,
    author,
    asDraft ? 'Solicitação salva como rascunho.' : 'Solicitação enviada.'
  );

  const document = {
    status,
    requester: {
      requesterId: author.uid,
      requesterName: author.name ?? '',
      requesterEmail: author.email,
      requesterRole: author.role,
    },
    employee: {
      chapa: formData.chapa,
      employeeName: formData.employeeName,
      functionName: formData.functionName,
      cpf: formData.cpf || null,
      birthDate: formData.birthDate || null,
    },
    travel: {
      reason: formData.reason,
      segments: formData.segments, // Fonte de verdade v3
      
      // Campos derivados (Recalculados no Service para máxima consistência)
      ...deriveTravelSummaryFromSegments(formData.segments),
      
      costCenter: formData.costCenter,
      projectCode: formData.projectCode || null,
      managerName: formData.managerName || null,
      justification: formData.justification || null,
    },
    leavePeriod: needsValidation(formData.reason)
      ? {
          leaveStartDate: formData.leaveStartDate || null,
          leaveEndDate: formData.leaveEndDate || null,
        }
      : {},
    validation: {
      validationRequired: needsValidation(formData.reason),
      validationStatus: needsValidation(formData.reason)
        ? ValidationStatus.PENDENTE
        : ValidationStatus.NAO_APLICAVEL,
      policyDecision: policyDecision || null,
    },
    purchase: {
      purchaseStatus: PurchaseStatus.AGUARDANDO,
    },
    audit: {
      createdAt: now,
      updatedAt: now,
      createdBy: author.email,
      history: [historyEntry],
    },
  };

  if (FORCE_MOCK_MODE) {
    console.info('[Mock Mode] Salvando nova solicitação no localStorage.');
    const mockId = `mock-${Math.random().toString(36).substr(2, 9)}`;
    saveToLocalStorage({ ...document, requestId: mockId } as TravelRequest);
    return mockId;
  }

  try {
    const ref = await addDoc(collection(db, COLLECTION), document);
    return ref.id;
  } catch (error: unknown) {
    const errObj = error as { message?: string };
    if (errObj.message?.includes('permission')) {
      console.warn('[Demo Mode] Salvando no localStorage devido à falta de permissão Firestore.');
      const mockId = `demo-${Math.random().toString(36).substr(2, 9)}`;
      saveToLocalStorage({ ...document, requestId: mockId } as TravelRequest);
      return mockId;
    }
    handleFirestoreError(error, OperationType.CREATE, COLLECTION);
  }
}

/**
 * Atualiza os dados de conteúdo de uma solicitação existente (edição pelo administrativo).
 */
export async function updateTravelRequest(
  requestId: string,
  formData: TravelRequestFormData,
  currentHistory: HistoryEntry[],
  author: UserProfile,
  asDraft: boolean,
  policyDecision?: PolicyDecision
): Promise<void> {
  const status = asDraft
    ? RequestStatus.RASCUNHO
    : (policyDecision ? suggestNextStatus(policyDecision) : getInitialStatus(formData.reason, false));

  const historyEntry = buildHistoryEntry(
    status,
    author,
    asDraft ? 'Alterações salvas como rascunho.' : 'Solicitação reenviada para análise.'
  );

  const path = `${COLLECTION}/${requestId}`;
  const updates = {
    status,
    'employee.chapa': formData.chapa,
    'employee.employeeName': formData.employeeName,
    'employee.functionName': formData.functionName,
    'employee.cpf': formData.cpf || null,
    'employee.birthDate': formData.birthDate || null,
    'travel.reason': formData.reason,
    'travel.segments': formData.segments, // Fonte de verdade v3
    
    // Campos derivados (Recalculados no Service para máxima consistência)
    ...deriveTravelSummaryFromSegments(formData.segments),
    
    'travel.costCenter': formData.costCenter,
    'travel.projectCode': formData.projectCode || null,
    'travel.managerName': formData.managerName || null,
    'travel.justification': formData.justification || null,
    'leavePeriod.leaveStartDate': formData.leaveStartDate || null,
    'leavePeriod.leaveEndDate': formData.leaveEndDate || null,
    'validation.validationRequired': needsValidation(formData.reason),
    'validation.policyDecision': policyDecision || null,
    'audit.updatedAt': new Date().toISOString(),
    'audit.history': [...currentHistory, historyEntry],
  };

  if (FORCE_MOCK_MODE) {
    console.info('[Mock Mode] Atualizando solicitação no localStorage.');
    const localRequests: TravelRequest[] = JSON.parse(localStorage.getItem('demo_requests') || '[]');
    const index = localRequests.findIndex(r => r.requestId === requestId);
    if (index >= 0) {
      // Nota: Em um mock ideal, faríamos merge profundo, mas para teste rápido de workflow:
      localRequests[index] = { ...localRequests[index], ...updates, requestId } as any; 
      localStorage.setItem('demo_requests', JSON.stringify(localRequests));
    }
    return;
  }

  try {
    await updateDoc(doc(db, COLLECTION, requestId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Muda o status de uma solicitação (ações de CH e comprador).
 * Sempre grava entrada de histórico com autor e comentário.
 */
export async function changeRequestStatus(
  requestId: string,
  currentStatus: RequestStatus,
  newStatus: RequestStatus,
  currentHistory: HistoryEntry[],
  author: UserProfile,
  comment: string,
  purchaseInfo?: Partial<PurchaseInfo>
): Promise<void> {
  // Validação Rígida de Workflow
  if (!canTransitionStatus(currentStatus, newStatus, author.role)) {
    throw new Error(`Transição de ${currentStatus} para ${newStatus} não permitida para o perfil ${author.role}.`);
  }

  const historyEntry = buildHistoryEntry(newStatus, author, comment);
  const path = `${COLLECTION}/${requestId}`;

  const updates: Record<string, unknown> = {
    status: newStatus,
    'audit.updatedAt': new Date().toISOString(),
    'audit.history': [...currentHistory, historyEntry],
  };

  // Se for emissão, salva também os dados de compra
  if (newStatus === RequestStatus.EMITIDA && purchaseInfo) {
    updates['purchase.airline'] = purchaseInfo.airline ?? null;
    updates['purchase.ticketNumber'] = purchaseInfo.ticketNumber ?? null;
    updates['purchase.price'] = purchaseInfo.price ?? null;
    updates['purchase.notes'] = purchaseInfo.notes ?? null;
    updates['purchase.purchaseStatus'] = PurchaseStatus.EMITIDA;
    updates['purchase.purchasedAt'] = new Date().toISOString();
    updates['purchase.purchasedBy'] = author.email;
  }

  // Sincroniza status de validação interna
  if (newStatus === RequestStatus.REPROVADA) {
    updates['validation.validationStatus'] = ValidationStatus.REPROVADA;
  }
  if (newStatus === RequestStatus.DISPONIVEL_PARA_COMPRA) {
    updates['validation.validationStatus'] = ValidationStatus.APROVADA;
  }
  if (newStatus === RequestStatus.PENDENTE_CORRECAO) {
    updates['validation.validationStatus'] = ValidationStatus.PENDENTE;
  }

  if (FORCE_MOCK_MODE) {
    console.info('[Mock Mode] Mudando status no localStorage.');
    const localRequests: TravelRequest[] = JSON.parse(localStorage.getItem('demo_requests') || '[]');
    const index = localRequests.findIndex(r => r.requestId === requestId);
    if (index >= 0) {
      localRequests[index] = { ...localRequests[index], ...updates, requestId } as TravelRequest;
      localStorage.setItem('demo_requests', JSON.stringify(localRequests));
    }
    return;
  }

  try {
    await updateDoc(doc(db, COLLECTION, requestId), updates);
  } catch (error: unknown) {
    const errObj = error as { message?: string };
    if (errObj.message?.includes('permission')) {
      console.warn('[Demo Mode] Atualizando no localStorage devido à falta de permissão Firestore.');
      const localRequests: TravelRequest[] = JSON.parse(localStorage.getItem('demo_requests') || '[]');
      const index = localRequests.findIndex(r => r.requestId === requestId);
      if (index >= 0) {
        localRequests[index] = { ...localRequests[index], ...updates, requestId } as TravelRequest;
        localStorage.setItem('demo_requests', JSON.stringify(localRequests));
      }
      return;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Remove permanentemente uma solicitação (somente rascunhos).
 */
export async function deleteTravelRequest(requestId: string): Promise<void> {
  const path = `${COLLECTION}/${requestId}`;
  try {
    await deleteDoc(doc(db, COLLECTION, requestId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
