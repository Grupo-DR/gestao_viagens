// ============================================================
// TEST — buildFinancialOverview
// Valida os cenários de negócio da Visão Financeira.
// Regra: Valor executado vem de travel.segments[].priceQuote.
// Stack: Vitest
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  buildFinancialOverview,
  FinancialOverviewFilters,
} from '../application/use-cases/buildFinancialOverview';
import type { TravelRequest, TravelBudget } from '../domain/types';
import {
  RequestStatus,
  PurchaseStatus,
  UserRole,
  ValidationStatus,
} from '../domain/enums';

// ──────────────────────────────────────────────
// Factories
// ──────────────────────────────────────────────

const BASE_FILTERS: FinancialOverviewFilters = { year: 2026, month: 4 };

function makeRequest(overrides: Partial<TravelRequest> = {}): TravelRequest {
  const basePrice = 1072.74;
  return {
    requestId: 'req-test',
    status: RequestStatus.EMITIDA,
    requester: {
      requesterId: 'uid-1',
      requesterName: 'Test User',
      requesterEmail: 'test@test.com',
      requesterRole: UserRole.ADMINISTRATIVO,
    },
    employee: {
      passengerType: 'internal',
      chapa: '001',
      employeeName: 'Colaborador Teste',
    },
    travel: {
      reason: 'Visita à obra' as any,
      origin: 'BH',
      destination: 'SP',
      departureDateTime: '2026-04-10T08:00',
      baggageRequired: false,
      costCenter: '3019.03',
      // NOVO: Valor financeiro agora vem daqui
      segments: [{ 
        id: 's1', 
        order: 1, 
        transportMode: 'rodoviario', 
        origin: 'BH', 
        destination: 'SP', 
        departureDateTime: '2026-04-10T08:00', 
        baggageRequired: false, 
        direction: 'ida',
        priceQuote: basePrice 
      }],
    },
    leavePeriod: {},
    validation: { validationRequired: false, validationStatus: ValidationStatus.NAO_APLICAVEL },
    purchase: {
      purchaseStatus: PurchaseStatus.EMITIDA,
      price: 999999, // Valor do comprador deve ser IGNORADO pela visão financeira
      purchasedAt: '2026-04-10T12:00:00Z',
    },
    audit: {
      createdAt: '2026-04-05T10:00:00Z',
      updatedAt: '2026-04-10T12:00:00Z',
      createdBy: 'test@test.com',
      history: [],
    },
    ...overrides,
  };
}

function makeBudget(overrides: Partial<TravelBudget> = {}): TravelBudget {
  return {
    id: 'b-1',
    year: 2026,
    month: 'Abril',
    costCenter: '3019.03',
    category: 'rodoviario',
    value: 1450,
    ...overrides,
  };
}

// ──────────────────────────────────────────────
// Cenários de Agregação e Preço
// ──────────────────────────────────────────────

describe('Cenários de Agregação e Preço', () => {
  it('deve usar o somatório de priceQuote dos segmentos e IGNORAR o purchase.price', () => {
    const budget = makeBudget({ costCenter: '3019.03', value: 1450 });
    const request = makeRequest({
      travel: {
        ...makeRequest().travel,
        segments: [
          { id: 's1', order: 1, transportMode: 'aereo', origin: 'A', destination: 'B', departureDateTime: '2026-04-10T08:00', baggageRequired: false, direction: 'ida', priceQuote: 500 },
          { id: 's2', order: 2, transportMode: 'aereo', origin: 'B', destination: 'A', departureDateTime: '2026-04-15T08:00', baggageRequired: false, direction: 'volta', priceQuote: 450 },
        ]
      },
      purchase: { purchaseStatus: PurchaseStatus.EMITIDA, price: 2000, purchasedAt: '2026-04-10T12:00:00Z' }
    });

    const { rows } = buildFinancialOverview([request], [budget], BASE_FILTERS, [], UserRole.ADMINISTRATIVO, []);

    expect(rows).toHaveLength(1);
    expect(rows[0].executedAmount).toBe(950); // 500 + 450
    expect(rows[0].executedAmount).not.toBe(2000);
  });

  it('deve marcar como pendência se algum segmento não tiver priceQuote', () => {
    const request = makeRequest({
      travel: {
        ...makeRequest().travel,
        segments: [
          { id: 's1', order: 1, transportMode: 'aereo', origin: 'A', destination: 'B', departureDateTime: '2026-04-10T08:00', baggageRequired: false, direction: 'ida', priceQuote: 500 },
          { id: 's2', order: 2, transportMode: 'aereo', origin: 'B', destination: 'A', departureDateTime: '2026-04-15T08:00', baggageRequired: false, direction: 'volta' /* sem preço */ },
        ]
      }
    });

    const { summary, rows } = buildFinancialOverview([request], [], BASE_FILTERS, [], UserRole.ADMINISTRATIVO, []);

    expect(rows[0].executedAmount).toBe(0);
    expect(rows[0].missingPriceCount).toBe(1);
    expect(summary.missingPriceCount).toBe(1);
  });

  it('deve filtrar apenas status EMITIDA e CONCLUIDA', () => {
    const reqValidada = makeRequest({ status: RequestStatus.EM_VALIDACAO_CH });
    const reqEmitida = makeRequest({ status: RequestStatus.EMITIDA });

    const { summary } = buildFinancialOverview([reqValidada, reqEmitida], [], BASE_FILTERS, [], UserRole.ADMINISTRATIVO, []);

    expect(summary.issuedTotalCount).toBe(1);
  });
});

// ──────────────────────────────────────────────
// Cenário H: Hierarquia de Nomes
// ──────────────────────────────────────────────

describe('Cenário H — Hierarquia de Nomes', () => {
  it('Deve manter a prioridade do Dicionário Estático', () => {
    const budget = makeBudget({ costCenter: '3028.01', value: 1000 });
    const { rows } = buildFinancialOverview([], [budget], BASE_FILTERS, [], UserRole.ADMINISTRATIVO, []);
    expect(rows[0].costCenterLabel).toBe('3028.01 - INFRA ESTRUTURA - GERDAU S/A');
  });
});
