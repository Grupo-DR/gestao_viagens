import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, Query, DocumentData } from 'firebase/firestore';
import { db } from '../../infrastructure/firebase/firebase';
import { RequestStatus, PurchaseStatus, ValidationStatus, TravelReason, UserRole } from '../../domain/enums';
import type { TravelRequest, UserProfile } from '../../domain/types';
import { filterRequestsByGovernance } from '../../domain/travelRequest.governance';

// ──────────────────────────────────────────────
// Dados Mock para Modo Demo
// ──────────────────────────────────────────────

const MOCK_REQUESTS: TravelRequest[] = [
  {
    requestId: 'mock-march-1',
    status: RequestStatus.EMITIDA,
    requester: {
      requesterId: 'demo-user',
      requesterName: 'Demo User',
      requesterEmail: 'demo@empresa.com',
      requesterRole: UserRole.MASTER,
    },
    employee: {
      passengerType: 'internal',
      chapa: '003001',
      employeeName: 'João da Silva',
      functionName: 'Engenheiro Civil'
    },
    travel: {
      reason: TravelReason.VISITA_OBRA,
      origin: 'Belo Horizonte (CNF)',
      destination: 'São Paulo (GRU)',
      departureDateTime: '2026-03-15T09:00',
      returnDateTime: '2026-03-20T17:00',
      baggageRequired: true,
      costCenter: '3044.01 - Obra A',
      segments: [
        { 
          id: 's1', 
          origin: 'CNF', 
          destination: 'GRU', 
          departureDateTime: '2026-03-15T09:00', 
          priceQuote: 450,
          order: 1,
          transportMode: 'aereo',
          baggageRequired: true,
          direction: 'ida'
        }
      ]
    },
    purchase: { purchaseStatus: PurchaseStatus.EMITIDA, price: 450 },
    audit: {
      createdAt: '2026-03-10T10:00:00Z',
      updatedAt: '2026-03-12T10:00:00Z',
      createdBy: 'antonio@empresa.com',
      history: []
    },
    leavePeriod: {},
    validation: { validationRequired: false, validationStatus: ValidationStatus.NAO_APLICAVEL }
  },
  {
    requestId: 'mock-april-1',
    status: RequestStatus.EMITIDA,
    requester: {
      requesterId: 'demo-user',
      requesterName: 'Demo User',
      requesterEmail: 'demo@empresa.com',
      requesterRole: UserRole.MASTER,
    },
    employee: {
      passengerType: 'internal',
      chapa: '003002',
      employeeName: 'Maria Oliveira',
      functionName: 'Arquiteta'
    },
    travel: {
      reason: TravelReason.VISITA_TECNICA,
      origin: 'São Paulo (GRU)',
      destination: 'Rio de Janeiro (GIG)',
      departureDateTime: '2026-04-10T08:00',
      returnDateTime: '2026-04-12T18:00',
      baggageRequired: false,
      costCenter: '3044.01 - Obra A',
      segments: [
        { 
          id: 's2', 
          origin: 'GRU', 
          destination: 'GIG', 
          departureDateTime: '2026-04-10T08:00', 
          priceQuote: 850,
          order: 1,
          transportMode: 'aereo',
          baggageRequired: false,
          direction: 'ida'
        }
      ]
    },
    purchase: { purchaseStatus: PurchaseStatus.EMITIDA, price: 850 },
    audit: {
      createdAt: '2026-04-05T14:00:00Z',
      updatedAt: '2026-04-05T14:00:00Z',
      createdBy: 'antonio@empresa.com',
      history: []
    },
    leavePeriod: {},
    validation: { validationRequired: false, validationStatus: ValidationStatus.NAO_APLICAVEL }
  },
  {
    requestId: 'mock-april-2',
    status: RequestStatus.EM_VALIDACAO_CH,
    requester: {
      requesterId: 'demo-user',
      requesterName: 'Demo User',
      requesterEmail: 'demo@empresa.com',
      requesterRole: UserRole.MASTER,
    },
    employee: {
      passengerType: 'internal',
      chapa: '004001',
      employeeName: 'Ricardo Santos',
      functionName: 'Analista Financeiro'
    },
    travel: {
      reason: TravelReason.TREINAMENTO,
      origin: 'Curitiba (CWB)',
      destination: 'São Paulo (GRU)',
      departureDateTime: '2026-04-20T10:00',
      returnDateTime: '2026-04-22T20:00',
      baggageRequired: false,
      costCenter: '506070 - RH Central',
      segments: [
        { 
          id: 's3', 
          origin: 'CWB', 
          destination: 'GRU', 
          departureDateTime: '2026-04-20T10:00', 
          priceQuote: 620,
          order: 1,
          transportMode: 'aereo',
          baggageRequired: false,
          direction: 'ida'
        }
      ]
    },
    purchase: { purchaseStatus: PurchaseStatus.AGUARDANDO },
    audit: {
      createdAt: '2026-04-15T10:00:00Z',
      updatedAt: '2026-04-15T10:00:00Z',
      createdBy: 'antonio@empresa.com',
      history: []
    },
    leavePeriod: {},
    validation: { validationRequired: false, validationStatus: ValidationStatus.NAO_APLICAVEL }
  }
];

export type TravelListView = 'requester' | 'hr' | 'buyer' | 'all';

interface UseTravelRequestsOptions {
  view: TravelListView;
  userId?: string;
  user?: UserProfile | null;
  urgentOnly?: boolean;
}

interface UseTravelRequestsResult {
  requests: TravelRequest[];
  loading: boolean;
  error: string | null;
  isDemoMode: boolean;
}

function buildQuery(view: TravelListView, userId?: string): Query<DocumentData> {
  const col = collection(db, 'travelRequests');
  switch (view) {
    case 'requester':
      return query(col, where('requester.requesterId', '==', userId ?? ''), orderBy('audit.createdAt', 'desc'));
    case 'hr':
      return query(col, where('status', '==', RequestStatus.EM_VALIDACAO_CH), orderBy('audit.createdAt', 'desc'));
    case 'buyer':
      return query(col, where('status', '==', RequestStatus.DISPONIVEL_PARA_COMPRA), orderBy('audit.createdAt', 'desc'));
    default:
      return query(col, orderBy('audit.createdAt', 'desc'));
  }
}

export function useTravelRequests(options: UseTravelRequestsOptions): UseTravelRequestsResult {
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    setRequests([]);
    setLoading(true);
    const q = buildQuery(options.view, options.userId);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const raw = snapshot.docs.map(doc => ({ requestId: doc.id, ...doc.data() } as any));
        
        // Se a coleção estiver vazia no Firestore, usamos os dados de mock para garantir que o dashboard tenha conteúdo
        if (raw.length === 0) {
          const user = options.user || { uid: 'demo-user', name: 'Demo User', role: UserRole.MASTER, email: 'demo@empresa.com' };
          const filtered = filterRequestsByGovernance(MOCK_REQUESTS, user);
          setRequests(filtered);
          setIsDemoMode(true);
        } else {
          const filtered = filterRequestsByGovernance(raw, options.user || { uid: 'demo', name: 'Demo', role: UserRole.MASTER, email: 'demo@demo.com' });
          setRequests(filtered);
          setIsDemoMode(false);
        }
        setLoading(false);
      },
      (err) => {
        if (err.message.includes('permission')) {
          const user = options.user || { uid: 'demo-user', name: 'Demo User', role: UserRole.MASTER, email: 'demo@empresa.com' };
          const filtered = filterRequestsByGovernance(MOCK_REQUESTS, user);
          setRequests(filtered);
          setIsDemoMode(true);
        } else {
          setError(err.message);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [options.view, options.userId, options.user?.role, options.user?.allowedCostCenters?.length]);

  return { requests, loading, error, isDemoMode };
}
