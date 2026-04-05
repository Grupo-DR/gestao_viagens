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

const COLLECTION = 'travelRequests';

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
    },
    travel: {
      reason: formData.reason,
      origin: formData.origin,
      destination: formData.destination,
      departureDateTime: formData.departureDateTime,
      returnDateTime: formData.returnDateTime || null,
      baggageRequired: formData.baggageRequired,
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
  try {
    await updateDoc(doc(db, COLLECTION, requestId), {
      status,
      'employee.chapa': formData.chapa,
      'employee.employeeName': formData.employeeName,
      'employee.functionName': formData.functionName,
      'travel.reason': formData.reason,
      'travel.origin': formData.origin,
      'travel.destination': formData.destination,
      'travel.departureDateTime': formData.departureDateTime,
      'travel.returnDateTime': formData.returnDateTime || null,
      'travel.baggageRequired': formData.baggageRequired,
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
    });
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

  try {
    await updateDoc(doc(db, COLLECTION, requestId), updates);
  } catch (error: unknown) {
    const errObj = error as { message?: string };
    if (errObj.message?.includes('permission')) {
      console.warn('[Demo Mode] Atualizando no localStorage devido à falta de permissão Firestore.');
      // Na demo, recarregaríamos do storage, aplicaríamos updates e salvaríamos de volta
      // Para simplificar, assumimos que o objeto na lista do hook já está correto ou será recarregado
      const localRequests: TravelRequest[] = JSON.parse(localStorage.getItem('demo_requests') || '[]');
      const index = localRequests.findIndex(r => r.requestId === requestId);
      if (index >= 0) {
        // Update raso para fins de demo
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
