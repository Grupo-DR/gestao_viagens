import { describe, it, expect } from 'vitest';
import { RequestStatus, TravelReason, UserRole, ValidationStatus, PurchaseStatus } from '../enums';
import type { TravelRequest, HistoryEntry } from '../types';
import {
  getSubmissionDate,
  getHrValidationDetails,
  getPurchaseQueueDate,
  getPurchaseReleasedDate,
  getTicketIssuedDate,
  formatDuration,
  getHrValidationDuration,
  getPurchaseDuration,
  getTotalDuration,
  getDurationInHours,
  formatDurationFromHours,
  formatLeavePeriod,
  getPurchasePolicyStatus
} from '../travelRequest.audit';

// Helper para criar uma TravelRequest padrão simplificada para testes
function createMockRequest(overrides: Partial<TravelRequest> = {}): TravelRequest {
  return {
    requestId: 'test-req-123',
    status: RequestStatus.RASCUNHO,
    requester: {
      requesterId: 'user-1',
      requesterName: 'Solicitante Teste',
      requesterEmail: 'test@empresa.com',
      requesterRole: UserRole.ADMINISTRATIVO,
    },
    employee: {
      passengerType: 'internal',
      chapa: '12345',
      employeeName: 'Passageiro Teste',
    },
    travel: {
      reason: TravelReason.VISITA_OBRA,
      origin: 'BH',
      destination: 'SP',
      departureDateTime: '2026-06-20T10:00:00Z',
      baggageRequired: false,
      costCenter: '3044.01',
    },
    leavePeriod: {},
    validation: {
      validationRequired: false,
      validationStatus: ValidationStatus.NAO_APLICAVEL,
    },
    purchase: {
      purchaseStatus: PurchaseStatus.AGUARDANDO,
    },
    audit: {
      createdAt: '2026-06-19T10:00:00Z',
      updatedAt: '2026-06-19T10:00:00Z',
      createdBy: 'test@empresa.com',
      history: [],
    },
    ...overrides,
  };
}

describe('Audit Date Extractors', () => {
  describe('getSubmissionDate', () => {
    it('deve usar audit.createdAt se o histórico estiver vazio', () => {
      const req = createMockRequest({
        audit: {
          createdAt: '2026-06-19T10:00:00Z',
          updatedAt: '2026-06-19T10:00:00Z',
          createdBy: 'test@empresa.com',
          history: [],
        },
      } as any);

      expect(getSubmissionDate(req)).toBe('2026-06-19T10:00:00Z');
    });

    it('deve pegar o primeiro updatedAt de status diferente de Rascunho', () => {
      const history: HistoryEntry[] = [
        {
          status: RequestStatus.RASCUNHO,
          updatedBy: 'test@empresa.com',
          updatedByRole: UserRole.ADMINISTRATIVO,
          updatedAt: '2026-06-19T10:00:00Z',
          comment: 'Rascunho criado',
        },
        {
          status: RequestStatus.EM_VALIDACAO_CH,
          updatedBy: 'test@empresa.com',
          updatedByRole: UserRole.ADMINISTRATIVO,
          updatedAt: '2026-06-19T12:30:00Z',
          comment: 'Solicitação enviada',
        },
        {
          status: RequestStatus.AGUARDANDO_APROVACAO_COMPRA,
          updatedBy: 'hr@empresa.com',
          updatedByRole: UserRole.CAPITAL_HUMANO,
          updatedAt: '2026-06-19T15:00:00Z',
        },
      ];

      const req = createMockRequest({
        audit: {
          createdAt: '2026-06-19T10:00:00Z',
          updatedAt: '2026-06-19T15:00:00Z',
          createdBy: 'test@empresa.com',
          history,
        },
      });

      expect(getSubmissionDate(req)).toBe('2026-06-19T12:30:00Z');
    });
  });

  describe('getHrValidationDetails', () => {
    it('deve retornar não aplicável se validationRequired for false', () => {
      const req = createMockRequest({
        validation: {
          validationRequired: false,
          validationStatus: ValidationStatus.NAO_APLICAVEL,
        },
      });

      const details = getHrValidationDetails(req);
      expect(details.status).toBe('na');
      expect(details.label).toBe('Não aplicável');
      expect(details.date).toBeUndefined();
    });

    it('deve retornar pendente se validationRequired for true e ainda estiver em validação', () => {
      const req = createMockRequest({
        status: RequestStatus.EM_VALIDACAO_CH,
        validation: {
          validationRequired: true,
          validationStatus: ValidationStatus.PENDENTE,
        },
      });

      const details = getHrValidationDetails(req);
      expect(details.status).toBe('pending');
      expect(details.label).toBe('Pendente');
    });

    it('deve retornar aprovada com a data se houver transição para AGUARDANDO_APROVACAO_COMPRA', () => {
      const history: HistoryEntry[] = [
        {
          status: RequestStatus.EM_VALIDACAO_CH,
          updatedBy: 'test@empresa.com',
          updatedByRole: UserRole.ADMINISTRATIVO,
          updatedAt: '2026-06-19T10:00:00Z',
        },
        {
          status: RequestStatus.AGUARDANDO_APROVACAO_COMPRA,
          updatedBy: 'hr@empresa.com',
          updatedByRole: UserRole.CAPITAL_HUMANO,
          updatedAt: '2026-06-19T14:15:00Z',
          comment: 'Aprovado férias',
        },
      ];

      const req = createMockRequest({
        validation: {
          validationRequired: true,
          validationStatus: ValidationStatus.APROVADA,
        },
        audit: {
          createdAt: '2026-06-19T09:00:00Z',
          updatedAt: '2026-06-19T14:15:00Z',
          createdBy: 'test@empresa.com',
          history,
        },
      });

      const details = getHrValidationDetails(req);
      expect(details.status).toBe('approved');
      expect(details.label).toBe('Aprovada');
      expect(details.date).toBe('2026-06-19T14:15:00Z');
    });

    it('deve retornar reprovada com a data se validationStatus for REPROVADA', () => {
      const history: HistoryEntry[] = [
        {
          status: RequestStatus.EM_VALIDACAO_CH,
          updatedBy: 'test@empresa.com',
          updatedByRole: UserRole.ADMINISTRATIVO,
          updatedAt: '2026-06-19T10:00:00Z',
        },
        {
          status: RequestStatus.REPROVADA,
          updatedBy: 'hr@empresa.com',
          updatedByRole: UserRole.CAPITAL_HUMANO,
          updatedAt: '2026-06-19T11:20:00Z',
          comment: 'Sem saldo de férias',
        },
      ];

      const req = createMockRequest({
        validation: {
          validationRequired: true,
          validationStatus: ValidationStatus.REPROVADA,
        },
        audit: {
          createdAt: '2026-06-19T09:00:00Z',
          updatedAt: '2026-06-19T11:20:00Z',
          createdBy: 'test@empresa.com',
          history,
        },
      });

      const details = getHrValidationDetails(req);
      expect(details.status).toBe('rejected');
      expect(details.label).toBe('Reprovada');
      expect(details.date).toBe('2026-06-19T11:20:00Z');
    });
  });

  describe('getPurchaseQueueDate', () => {
    it('deve retornar a data de transição para AGUARDANDO_APROVACAO_COMPRA se existir', () => {
      const history: HistoryEntry[] = [
        {
          status: RequestStatus.AGUARDANDO_APROVACAO_COMPRA,
          updatedBy: 'hr@empresa.com',
          updatedByRole: UserRole.CAPITAL_HUMANO,
          updatedAt: '2026-06-19T16:00:00Z',
        },
      ];
      const req = createMockRequest({
        validation: { validationRequired: true, validationStatus: ValidationStatus.APROVADA },
        audit: {
          createdAt: '2026-06-19T10:00:00Z',
          updatedAt: '2026-06-19T16:00:00Z',
          createdBy: 'test',
          history,
        },
      });

      expect(getPurchaseQueueDate(req)).toBe('2026-06-19T16:00:00Z');
    });

    it('deve retornar a data de solicitação se validationRequired for false e status for posterior', () => {
      const req = createMockRequest({
        status: RequestStatus.AGUARDANDO_APROVACAO_COMPRA,
        validation: { validationRequired: false, validationStatus: ValidationStatus.NAO_APLICAVEL },
        audit: {
          createdAt: '2026-06-19T10:00:00Z',
          updatedAt: '2026-06-19T10:00:00Z',
          createdBy: 'test',
          history: [],
        },
      });

      expect(getPurchaseQueueDate(req)).toBe('2026-06-19T10:00:00Z');
    });
  });

  describe('getPurchaseReleasedDate', () => {
    it('deve extrair a data de transição para DISPONIVEL_PARA_COMPRA', () => {
      const history: HistoryEntry[] = [
        {
          status: RequestStatus.DISPONIVEL_PARA_COMPRA,
          updatedBy: 'buyer@empresa.com',
          updatedByRole: UserRole.COMPRADOR,
          updatedAt: '2026-06-19T17:45:00Z',
        },
      ];
      const req = createMockRequest({
        audit: {
          createdAt: '2026-06-19T10:00:00Z',
          updatedAt: '2026-06-19T17:45:00Z',
          createdBy: 'test',
          history,
        },
      });

      expect(getPurchaseReleasedDate(req)).toBe('2026-06-19T17:45:00Z');
    });
  });

  describe('getTicketIssuedDate', () => {
    it('deve priorizar a data em purchase.purchasedAt', () => {
      const req = createMockRequest({
        purchase: {
          purchaseStatus: PurchaseStatus.EMITIDA,
          purchasedAt: '2026-06-19T19:00:00Z',
        },
      });

      expect(getTicketIssuedDate(req)).toBe('2026-06-19T19:00:00Z');
    });

    it('deve usar o histórico como fallback se status for EMITIDA', () => {
      const history: HistoryEntry[] = [
        {
          status: RequestStatus.EMITIDA,
          updatedBy: 'buyer@empresa.com',
          updatedByRole: UserRole.COMPRADOR,
          updatedAt: '2026-06-19T18:15:00Z',
        },
      ];
      const req = createMockRequest({
        status: RequestStatus.EMITIDA,
        audit: {
          createdAt: '2026-06-19T10:00:00Z',
          updatedAt: '2026-06-19T18:15:00Z',
          createdBy: 'test',
          history,
        },
      });

      expect(getTicketIssuedDate(req)).toBe('2026-06-19T18:15:00Z');
    });
  });

  describe('formatDuration', () => {
    it('deve formatar minutos corretamente', () => {
      expect(formatDuration('2026-06-19T10:00:00Z', '2026-06-19T10:45:00Z')).toBe('45m');
    });

    it('deve formatar horas e minutos corretamente', () => {
      expect(formatDuration('2026-06-19T10:00:00Z', '2026-06-19T15:30:00Z')).toBe('5h 30m');
    });

    it('deve formatar dias e horas corretamente', () => {
      expect(formatDuration('2026-06-19T10:00:00Z', '2026-06-21T14:15:00Z')).toBe('2d 4h');
    });

    it('deve retornar traço para datas inválidas ou ordem incorreta', () => {
      expect(formatDuration('2026-06-19T10:00:00Z', '2026-06-19T09:00:00Z')).toBe('—');
    });
  });

  describe('getHrValidationDuration', () => {
    it('deve retornar traço se CH não for requerido', () => {
      const req = createMockRequest({
        validation: { validationRequired: false, validationStatus: ValidationStatus.NAO_APLICAVEL }
      });
      expect(getHrValidationDuration(req)).toBe('—');
    });

    it('deve calcular tempo correto de validação concluída', () => {
      const history: HistoryEntry[] = [
        {
          status: RequestStatus.EM_VALIDACAO_CH,
          updatedBy: 'test',
          updatedByRole: UserRole.ADMINISTRATIVO,
          updatedAt: '2026-06-19T10:00:00Z',
        },
        {
          status: RequestStatus.AGUARDANDO_APROVACAO_COMPRA,
          updatedBy: 'hr',
          updatedByRole: UserRole.CAPITAL_HUMANO,
          updatedAt: '2026-06-19T14:30:00Z',
        }
      ];
      const req = createMockRequest({
        validation: { validationRequired: true, validationStatus: ValidationStatus.APROVADA },
        audit: { createdAt: '2026-06-19T10:00:00Z', updatedAt: '2026-06-19T14:30:00Z', createdBy: 'test', history }
      });

      expect(getHrValidationDuration(req)).toBe('4h 30m');
    });
  });

  describe('getPurchaseDuration', () => {
    it('deve calcular a duração de compra desde a aprovação do CH', () => {
      const history: HistoryEntry[] = [
        {
          status: RequestStatus.EM_VALIDACAO_CH,
          updatedBy: 'test',
          updatedByRole: UserRole.ADMINISTRATIVO,
          updatedAt: '2026-06-19T10:00:00Z',
        },
        {
          status: RequestStatus.AGUARDANDO_APROVACAO_COMPRA,
          updatedBy: 'hr',
          updatedByRole: UserRole.CAPITAL_HUMANO,
          updatedAt: '2026-06-19T14:00:00Z',
        },
        {
          status: RequestStatus.EMITIDA,
          updatedBy: 'buyer',
          updatedByRole: UserRole.COMPRADOR,
          updatedAt: '2026-06-19T19:30:00Z',
        }
      ];
      const req = createMockRequest({
        status: RequestStatus.EMITIDA,
        validation: { validationRequired: true, validationStatus: ValidationStatus.APROVADA },
        purchase: { purchaseStatus: PurchaseStatus.EMITIDA, purchasedAt: '2026-06-19T19:30:00Z' },
        audit: { createdAt: '2026-06-19T10:00:00Z', updatedAt: '2026-06-19T19:30:00Z', createdBy: 'test', history }
      });

      expect(getPurchaseDuration(req)).toBe('5h 30m'); // De 14:00 até 19:30
    });
  });

  describe('getTotalDuration', () => {
    it('deve calcular o tempo total do ciclo da solicitação', () => {
      const req = createMockRequest({
        purchase: { purchaseStatus: PurchaseStatus.EMITIDA, purchasedAt: '2026-06-20T10:00:00Z' },
        audit: { createdAt: '2026-06-19T10:00:00Z', updatedAt: '2026-06-20T10:00:00Z', createdBy: 'test', history: [] }
      });

      expect(getTotalDuration(req)).toBe('1d 0h'); // De 19/10:00 até 20/10:00
    });
  });

  describe('getDurationInHours', () => {
    it('deve calcular horas corretamente', () => {
      expect(getDurationInHours('2026-06-19T10:00:00Z', '2026-06-19T15:30:00Z')).toBe(5.5);
      expect(getDurationInHours('2026-06-19T10:00:00Z', '2026-06-20T10:00:00Z')).toBe(24);
    });
  });

  describe('formatDurationFromHours', () => {
    it('deve formatar horas decimais para string legível', () => {
      expect(formatDurationFromHours(5.5)).toBe('5h 30m');
      expect(formatDurationFromHours(0.75)).toBe('45m');
      expect(formatDurationFromHours(25)).toBe('1d 1h');
    });
  });

  describe('formatLeavePeriod', () => {
    it('deve retornar traço se o motivo não for de afastamento', () => {
      const req = createMockRequest({
        travel: {
          reason: TravelReason.VISITA_OBRA,
          costCenter: '3044.01',
          origin: 'BH',
          destination: 'SP',
          departureDateTime: '2026-06-20T10:00:00Z',
          baggageRequired: false,
        },
        leavePeriod: {
          leaveStartDate: '2026-06-15',
          leaveEndDate: '2026-06-25',
        },
      });

      expect(formatLeavePeriod(req)).toBe('—');
    });

    it('deve retornar apenas a data inicial formatada se não houver data final', () => {
      const req = createMockRequest({
        travel: {
          reason: TravelReason.FERIAS,
          costCenter: '3044.01',
          origin: 'BH',
          destination: 'SP',
          departureDateTime: '2026-06-20T10:00:00Z',
          baggageRequired: false,
        },
        leavePeriod: {
          leaveStartDate: '2026-06-15',
        },
      });

      expect(formatLeavePeriod(req)).toBe('15/06/2026');
    });

    it('deve retornar o intervalo formatado se houver data inicial e final', () => {
      const req = createMockRequest({
        travel: {
          reason: TravelReason.FOLGA,
          costCenter: '3044.01',
          origin: 'BH',
          destination: 'SP',
          departureDateTime: '2026-06-20T10:00:00Z',
          baggageRequired: false,
        },
        leavePeriod: {
          leaveStartDate: '2026-06-15',
          leaveEndDate: '2026-06-20',
        },
      });

      expect(formatLeavePeriod(req)).toBe('15/06/2026 a 20/06/2026');
    });

    it('deve retornar traço se não houver data de início mesmo com o motivo correto', () => {
      const req = createMockRequest({
        travel: {
          reason: TravelReason.FOLGA_FERIAS,
          costCenter: '3044.01',
          origin: 'BH',
          destination: 'SP',
          departureDateTime: '2026-06-20T10:00:00Z',
          baggageRequired: false,
        },
        leavePeriod: {},
      });

      expect(formatLeavePeriod(req)).toBe('—');
    });
  });

  describe('getPurchasePolicyStatus', () => {
    it('deve retornar VENCIDA se a data de partida for anterior à data de submissão', () => {
      const req = createMockRequest({
        travel: {
          reason: TravelReason.VISITA_OBRA,
          costCenter: '3044.01',
          origin: 'BH',
          destination: 'SP',
          departureDateTime: '2026-06-10T10:00:00Z',
          baggageRequired: false,
        },
        audit: {
          createdAt: '2026-06-15T10:00:00Z',
          updatedAt: '2026-06-15T10:00:00Z',
          createdBy: 'test',
          history: [],
        },
      });

      const status = getPurchasePolicyStatus(req);
      expect(status.category).toBe('VENCIDA');
      expect(status.label).toBe('Vencida');
    });

    it('deve retornar NAO_RECOMENDAVEL se antecedência for menor que 30 dias', () => {
      const req = createMockRequest({
        travel: {
          reason: TravelReason.VISITA_OBRA,
          costCenter: '3044.01',
          origin: 'BH',
          destination: 'SP',
          departureDateTime: '2026-07-10T10:00:00Z', // 25 dias de antecedência
          baggageRequired: false,
        },
        audit: {
          createdAt: '2026-06-15T10:00:00Z',
          updatedAt: '2026-06-15T10:00:00Z',
          createdBy: 'test',
          history: [],
        },
      });

      const status = getPurchasePolicyStatus(req);
      expect(status.category).toBe('NAO_RECOMENDAVEL');
      expect(status.label).toBe('Não Recomendável');
    });

    it('deve retornar ALTA se antecedência for entre 30 e 45 dias', () => {
      const req = createMockRequest({
        travel: {
          reason: TravelReason.VISITA_OBRA,
          costCenter: '3044.01',
          origin: 'BH',
          destination: 'SP',
          departureDateTime: '2026-07-20T10:00:00Z', // 35 dias de antecedência
          baggageRequired: false,
        },
        audit: {
          createdAt: '2026-06-15T10:00:00Z',
          updatedAt: '2026-06-15T10:00:00Z',
          createdBy: 'test',
          history: [],
        },
      });

      const status = getPurchasePolicyStatus(req);
      expect(status.category).toBe('ALTA');
      expect(status.label).toBe('Alta Atenção');
    });

    it('deve retornar MEDIA se antecedência for entre 45 e 60 dias', () => {
      const req = createMockRequest({
        travel: {
          reason: TravelReason.VISITA_OBRA,
          costCenter: '3044.01',
          origin: 'BH',
          destination: 'SP',
          departureDateTime: '2026-08-01T10:00:00Z', // 47 dias de antecedência
          baggageRequired: false,
        },
        audit: {
          createdAt: '2026-06-15T10:00:00Z',
          updatedAt: '2026-06-15T10:00:00Z',
          createdBy: 'test',
          history: [],
        },
      });

      const status = getPurchasePolicyStatus(req);
      expect(status.category).toBe('MEDIA');
      expect(status.label).toBe('Média Atenção');
    });

    it('deve retornar IDEAL se antecedência for entre 60 e 90 dias', () => {
      const req = createMockRequest({
        travel: {
          reason: TravelReason.VISITA_OBRA,
          costCenter: '3044.01',
          origin: 'BH',
          destination: 'SP',
          departureDateTime: '2026-08-25T10:00:00Z', // 71 dias de antecedência
          baggageRequired: false,
        },
        audit: {
          createdAt: '2026-06-15T10:00:00Z',
          updatedAt: '2026-06-15T10:00:00Z',
          createdBy: 'test',
          history: [],
        },
      });

      const status = getPurchasePolicyStatus(req);
      expect(status.category).toBe('IDEAL');
      expect(status.label).toBe('Ideal para Compra');
    });

    it('deve retornar REGULAR se antecedência for maior que 90 dias', () => {
      const req = createMockRequest({
        travel: {
          reason: TravelReason.VISITA_OBRA,
          costCenter: '3044.01',
          origin: 'BH',
          destination: 'SP',
          departureDateTime: '2026-10-15T10:00:00Z', // 122 dias de antecedência
          baggageRequired: false,
        },
        audit: {
          createdAt: '2026-06-15T10:00:00Z',
          updatedAt: '2026-06-15T10:00:00Z',
          createdBy: 'test',
          history: [],
        },
      });

      const status = getPurchasePolicyStatus(req);
      expect(status.category).toBe('REGULAR');
      expect(status.label).toBe('Regular');
    });
  });
});
