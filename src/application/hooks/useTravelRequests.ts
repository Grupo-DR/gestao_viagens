// ============================================================
// APPLICATION — Hook — useTravelRequests
// Encapsula a subscription ao Firestore e normaliza documentos
// legados para o modelo v2 usando o mapeador de compatibilidade.
// Componentes nunca acessam db diretamente.
// ============================================================

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, Query, DocumentData } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../infrastructure/firebase/firebase';
import { RequestStatus, PurchaseStatus, ValidationStatus, TravelReason } from '../../domain/enums';
import { PolicyResult } from '../../domain/policy/enums';
import { mapLegacyToTravelRequest } from '../../domain/travelRequest.rules';
import type { TravelRequest, LegacyTravelRequest, UserProfile } from '../../domain/types';
import { UserRole } from '../../domain/enums';

// ──────────────────────────────────────────────
// Dados Mock para Modo Demo
// ──────────────────────────────────────────────

const MOCK_REQUESTS: TravelRequest[] = [
  {
    requestId: 'mock-1',
    status: RequestStatus.EM_VALIDACAO_CH,
    requester: {
      requesterId: 'demo-user',
      requesterName: 'Antonio Silva',
      requesterEmail: 'demo@empresa.com',
      requesterRole: UserRole.ADMINISTRATIVO,
    },
    employee: {
      chapa: '001020',
      employeeName: 'Carlos Alberto Lima',
      functionName: 'Técnico de Manutenção'
    },
    travel: {
      reason: TravelReason.FERIAS,
      origin: 'São Paulo (GRU)',
      destination: 'Fortaleza (FOR)',
      departureDateTime: '2026-05-10T08:00',
      returnDateTime: '2026-05-30T18:00',
      baggageRequired: true,
      costCenter: '102030 - Manutenção',
    },
    leavePeriod: {
      leaveStartDate: '2026-05-11',
      leaveEndDate: '2026-05-29',
    },
    validation: {
      validationRequired: true,
      validationStatus: ValidationStatus.PENDENTE,
      policyDecision: {
        result: PolicyResult.APPROVED,
        summary: 'Período solicitado dentro da janela oficial.',
        violations: [],
        warnings: [],
        evidence: {}
      }
    },
    purchase: { purchaseStatus: PurchaseStatus.AGUARDANDO },
    audit: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'antonio@empresa.com',
      history: [
        { status: RequestStatus.EM_VALIDACAO_CH, updatedBy: 'sistema', updatedByRole: UserRole.ADMINISTRATIVO, updatedAt: new Date().toISOString(), comment: 'Iniciado automaticamente.' }
      ]
    }
  },
  {
    requestId: 'mock-2',
    status: RequestStatus.DISPONIVEL_PARA_COMPRA,
    requester: {
      requesterId: 'demo-user',
      requesterName: 'Maria Helena',
      requesterEmail: 'demo@empresa.com',
      requesterRole: UserRole.ADMINISTRATIVO,
    },
    employee: {
      chapa: '002040',
      employeeName: 'Roberta Peixoto',
      functionName: 'Coordenadora RH'
    },
    travel: {
      reason: TravelReason.VISITA_TECNICA,
      origin: 'Rio de Janeiro (GIG)',
      destination: 'Belo Horizonte (CNF)',
      departureDateTime: '2026-04-20T10:00',
      returnDateTime: '2026-04-22T20:00',
      baggageRequired: false,
      costCenter: '506070 - RH Central',
      justification: 'Visita de alinhamento com a unidade regional.'
    },
    leavePeriod: {},
    validation: {
      validationRequired: false,
      validationStatus: ValidationStatus.NAO_APLICAVEL
    },
    purchase: { purchaseStatus: PurchaseStatus.AGUARDANDO },
    audit: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'antonio@empresa.com',
      history: []
    }
  }
];

// ──────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────

export type TravelListView = 'requester' | 'hr' | 'buyer' | 'all';

interface UseTravelRequestsOptions {
  view: TravelListView;
  /** uid do solicitante — obrigatório para view='requester' */
  userId?: string;
  /** Perfil do usuário para segregação de dados */
  user?: UserProfile | null;
}

interface UseTravelRequestsResult {
  requests: TravelRequest[];
  loading: boolean;
  error: string | null;
  isDemoMode: boolean;
}

// ──────────────────────────────────────────────
// Constrói a query certa para cada fila
// ──────────────────────────────────────────────

function buildQuery(view: TravelListView, userId?: string): Query<DocumentData> {
  const col = collection(db, 'travelRequests');

  switch (view) {
    case 'requester':
      // Fila do solicitante: filtra por UID — suporta campo legado requesterUid
      return query(col, where('requester.requesterId', '==', userId ?? ''), orderBy('audit.createdAt', 'desc'));

    case 'hr':
      // Fila CH: apenas solicitações aguardando validação
      return query(col, where('status', '==', RequestStatus.EM_VALIDACAO_CH), orderBy('audit.createdAt', 'desc'));

    case 'buyer':
      // Fila de compras: prontas para emissão + processos em andamento
      return query(
        col,
        where('status', 'in', [
          RequestStatus.DISPONIVEL_PARA_COMPRA, 
          RequestStatus.APROVADA, 
          RequestStatus.AGUARDANDO_APROVACAO_COMPRA,
          RequestStatus.EM_PROCESSO_DE_COMPRA,
          RequestStatus.COMPRA_RECUSADA
        ]),
        orderBy('audit.createdAt', 'desc')
      );

    case 'all':
    default:
      return query(col, orderBy('audit.createdAt', 'desc'));
  }
}

/**
 * Tenta interpretar um documento Firestore como v2 nativo.
 * Se falhar (documento legado), usa o mapeador de compatibilidade.
 */
function normalizeDocument(raw: DocumentData & { id: string }): TravelRequest {
  // Heurística: documentos v2 têm o campo "requester" como objeto
  if (raw['requester'] && typeof raw['requester'] === 'object') {
    return { ...(raw as unknown as TravelRequest), requestId: raw.id };
  }
  // Documento legado: mapear
  return { ...mapLegacyToTravelRequest(raw as unknown as LegacyTravelRequest), requestId: raw.id };
}

// ──────────────────────────────────────────────
// Hook principal
// ──────────────────────────────────────────────

export function useTravelRequests(options: UseTravelRequestsOptions): UseTravelRequestsResult {
  const { view, userId, user } = options;
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);

    let q: Query<DocumentData>;
    try {
      q = buildQuery(view, userId);
    } catch (err) {
      setError('Erro ao construir query.');
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const normalized = snapshot.docs.map((docSnap) =>
          normalizeDocument({ id: docSnap.id, ...docSnap.data() })
        );

        // Aplicar Filtro de SegregaÃ§Ã£o (MASTER e CH veem tudo)
        let filtered = normalized;
        if (user && user.role !== UserRole.MASTER && user.role !== UserRole.CAPITAL_HUMANO) {
           const allowedCCs = user.allowedCostCenters || [];
           filtered = normalized.filter(r => allowedCCs.includes(r.travel.costCenter));
        }

        setRequests(filtered);
        setLoading(false);
        setIsDemoMode(false);
      },
      (err) => {
        // Se for erro de permissão (Missing or insufficient permissions), ativa fallback de demonstração
        if (err.message.toLocaleLowerCase().includes('permission')) {
          console.warn('[Firestore] Acesso negado. Ativando Modo Demo com dados simulados.');
          
          // Carrega mocks + dados salvos no localStorage (novos registros criados pelo usuário)
          const localRequests: TravelRequest[] = JSON.parse(localStorage.getItem('demo_requests') || '[]');
          const allData = [...localRequests, ...MOCK_REQUESTS];
          
          // Filtra conforme a view solicitada
          let filtered = allData;
          if (view === 'hr') filtered = allData.filter(r => r.status === RequestStatus.EM_VALIDACAO_CH);
          if (view === 'buyer') filtered = allData.filter(r => [RequestStatus.DISPONIVEL_PARA_COMPRA, RequestStatus.APROVADA].includes(r.status));
          if (view === 'requester' && userId) filtered = allData.filter(r => r.requester.requesterId === userId);

          setRequests(filtered);
          setIsDemoMode(true);
          setLoading(false);
        } else {
          setError(err.message);
          setLoading(false);
          handleFirestoreError(err, OperationType.LIST, 'travelRequests');
        }
      }
    );

    return () => unsubscribe();
  }, [view, userId, user]);

  return { requests, loading, error, isDemoMode };
}
