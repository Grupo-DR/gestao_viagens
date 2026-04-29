import { describe, it, expect } from 'vitest';
import { 
  getInitialStatus, 
  canTransitionStatus, 
  needsValidation, 
  getStatusLabel,
  getAvailableTransitions,
  mapLegacyToTravelRequest 
} from '../travelRequest.rules';
import { RequestStatus, TravelReason, UserRole } from '../enums';

// ============================================================
// SUITE: needsValidation
// Regra: CH é determinado EXCLUSIVAMENTE pelo motivo da viagem.
// O tipo de passageiro (interno/externo) NÃO influencia.
// ============================================================
describe('needsValidation', () => {
  describe('Motivos que EXIGEM validação CH', () => {
    it('FOLGA → precisa de CH', () => {
      expect(needsValidation(TravelReason.FOLGA)).toBe(true);
    });
    it('FERIAS → precisa de CH', () => {
      expect(needsValidation(TravelReason.FERIAS)).toBe(true);
    });
    it('FOLGA_FERIAS → precisa de CH', () => {
      expect(needsValidation(TravelReason.FOLGA_FERIAS)).toBe(true);
    });
    it('ADMISSAO → precisa de CH', () => {
      expect(needsValidation(TravelReason.ADMISSAO)).toBe(true);
    });
    it('DEMISSAO → precisa de CH', () => {
      expect(needsValidation(TravelReason.DEMISSAO)).toBe(true);
    });
  });

  describe('Motivos que NÃO exigem validação CH', () => {
    it('TREINAMENTO → não precisa de CH', () => {
      expect(needsValidation(TravelReason.TREINAMENTO)).toBe(false);
    });
    it('VISITA_TECNICA → não precisa de CH', () => {
      expect(needsValidation(TravelReason.VISITA_TECNICA)).toBe(false);
    });
    it('VISITA_OBRA → não precisa de CH', () => {
      expect(needsValidation(TravelReason.VISITA_OBRA)).toBe(false);
    });
  });

  describe('Cenário 3 — Passageiro externo NÃO força CH', () => {
    it('Externo + TREINAMENTO → não precisa de CH', () => {
      expect(needsValidation(TravelReason.TREINAMENTO, 'external')).toBe(false);
    });
    it('Externo + FOLGA → precisa de CH (pelo motivo, não pelo tipo)', () => {
      expect(needsValidation(TravelReason.FOLGA, 'external')).toBe(true);
    });
    it('Interno + VISITA_OBRA → não precisa de CH', () => {
      expect(needsValidation(TravelReason.VISITA_OBRA, 'internal')).toBe(false);
    });
  });
});

// ============================================================
// SUITE: getInitialStatus
// Regra: não-CH vai para AGUARDANDO_APROVACAO_COMPRA (não para DISPONIVEL_PARA_COMPRA)
// ============================================================
describe('getInitialStatus', () => {
  it('asDraft=true → sempre RASCUNHO', () => {
    expect(getInitialStatus(TravelReason.TREINAMENTO, true)).toBe(RequestStatus.RASCUNHO);
    expect(getInitialStatus(TravelReason.FOLGA, true)).toBe(RequestStatus.RASCUNHO);
  });

  describe('Cenário 1 — Motivos COM CH', () => {
    it('FOLGA → EM_VALIDACAO_CH', () => {
      expect(getInitialStatus(TravelReason.FOLGA, false)).toBe(RequestStatus.EM_VALIDACAO_CH);
    });
    it('FERIAS → EM_VALIDACAO_CH', () => {
      expect(getInitialStatus(TravelReason.FERIAS, false)).toBe(RequestStatus.EM_VALIDACAO_CH);
    });
    it('FOLGA_FERIAS → EM_VALIDACAO_CH', () => {
      expect(getInitialStatus(TravelReason.FOLGA_FERIAS, false)).toBe(RequestStatus.EM_VALIDACAO_CH);
    });
    it('ADMISSAO → EM_VALIDACAO_CH', () => {
      expect(getInitialStatus(TravelReason.ADMISSAO, false)).toBe(RequestStatus.EM_VALIDACAO_CH);
    });
    it('DEMISSAO → EM_VALIDACAO_CH', () => {
      expect(getInitialStatus(TravelReason.DEMISSAO, false)).toBe(RequestStatus.EM_VALIDACAO_CH);
    });
  });

  describe('Cenário 2 — Motivos SEM CH', () => {
    it('TREINAMENTO → AGUARDANDO_APROVACAO_COMPRA (não DISPONIVEL_PARA_COMPRA)', () => {
      expect(getInitialStatus(TravelReason.TREINAMENTO, false)).toBe(RequestStatus.AGUARDANDO_APROVACAO_COMPRA);
      expect(getInitialStatus(TravelReason.TREINAMENTO, false)).not.toBe(RequestStatus.DISPONIVEL_PARA_COMPRA);
    });
    it('VISITA_TECNICA → AGUARDANDO_APROVACAO_COMPRA', () => {
      expect(getInitialStatus(TravelReason.VISITA_TECNICA, false)).toBe(RequestStatus.AGUARDANDO_APROVACAO_COMPRA);
    });
    it('VISITA_OBRA → AGUARDANDO_APROVACAO_COMPRA', () => {
      expect(getInitialStatus(TravelReason.VISITA_OBRA, false)).toBe(RequestStatus.AGUARDANDO_APROVACAO_COMPRA);
    });
  });

  describe('Cenário 3 — Passageiro externo não altera o fluxo', () => {
    it('Externo + TREINAMENTO → AGUARDANDO_APROVACAO_COMPRA', () => {
      expect(getInitialStatus(TravelReason.TREINAMENTO, false, 'external')).toBe(RequestStatus.AGUARDANDO_APROVACAO_COMPRA);
    });
    it('Externo + FOLGA → EM_VALIDACAO_CH (motivo define)', () => {
      expect(getInitialStatus(TravelReason.FOLGA, false, 'external')).toBe(RequestStatus.EM_VALIDACAO_CH);
    });
  });
});

// ============================================================
// SUITE: getAvailableTransitions
// Regra: fluxo correto com CH → AGUARDANDO → DISPONIVEL → EMITIDA
// ============================================================
describe('getAvailableTransitions', () => {
  describe('RASCUNHO', () => {
    it('GESTOR pode enviar para CH ou para Compras', () => {
      const transitions = getAvailableTransitions(RequestStatus.RASCUNHO, UserRole.GESTOR);
      expect(transitions).toContain(RequestStatus.EM_VALIDACAO_CH);
      expect(transitions).toContain(RequestStatus.AGUARDANDO_APROVACAO_COMPRA);
    });
    it('COMPRADOR NÃO pode transitar de RASCUNHO', () => {
      expect(getAvailableTransitions(RequestStatus.RASCUNHO, UserRole.COMPRADOR)).toHaveLength(0);
    });
  });

  describe('EM_VALIDACAO_CH', () => {
    it('Cenário 1 — CH aprova → AGUARDANDO_APROVACAO_COMPRA (não DISPONIVEL_PARA_COMPRA)', () => {
      const transitions = getAvailableTransitions(RequestStatus.EM_VALIDACAO_CH, UserRole.CAPITAL_HUMANO);
      expect(transitions).toContain(RequestStatus.AGUARDANDO_APROVACAO_COMPRA);
      expect(transitions).not.toContain(RequestStatus.DISPONIVEL_PARA_COMPRA);
    });
    it('Cenário 4 — CH reprova → REPROVADA (definitivo)', () => {
      const transitions = getAvailableTransitions(RequestStatus.EM_VALIDACAO_CH, UserRole.CAPITAL_HUMANO);
      expect(transitions).toContain(RequestStatus.REPROVADA);
    });
    it('CH NÃO pode usar PENDENTE_CORRECAO neste fluxo (definitivo)', () => {
      const transitions = getAvailableTransitions(RequestStatus.EM_VALIDACAO_CH, UserRole.CAPITAL_HUMANO);
      expect(transitions).not.toContain(RequestStatus.PENDENTE_CORRECAO);
    });
    it('COMPRADOR não pode agir em EM_VALIDACAO_CH', () => {
      expect(getAvailableTransitions(RequestStatus.EM_VALIDACAO_CH, UserRole.COMPRADOR)).toHaveLength(0);
    });
    it('MASTER pode agir em EM_VALIDACAO_CH', () => {
      const transitions = getAvailableTransitions(RequestStatus.EM_VALIDACAO_CH, UserRole.MASTER);
      expect(transitions).toContain(RequestStatus.AGUARDANDO_APROVACAO_COMPRA);
    });
  });

  describe('AGUARDANDO_APROVACAO_COMPRA', () => {
    it('Compra aprovada → DISPONIVEL_PARA_COMPRA (não EM_PROCESSO_DE_COMPRA)', () => {
      const transitions = getAvailableTransitions(RequestStatus.AGUARDANDO_APROVACAO_COMPRA, UserRole.COMPRADOR);
      expect(transitions).toContain(RequestStatus.DISPONIVEL_PARA_COMPRA);
      expect(transitions).not.toContain(RequestStatus.EM_PROCESSO_DE_COMPRA);
    });
    it('Cenário 5 — Compra recusada → COMPRA_RECUSADA', () => {
      const transitions = getAvailableTransitions(RequestStatus.AGUARDANDO_APROVACAO_COMPRA, UserRole.COMPRADOR);
      expect(transitions).toContain(RequestStatus.COMPRA_RECUSADA);
    });
    it('Pode ser cancelada', () => {
      const transitions = getAvailableTransitions(RequestStatus.AGUARDANDO_APROVACAO_COMPRA, UserRole.COMPRADOR);
      expect(transitions).toContain(RequestStatus.CANCELADA);
    });
  });

  describe('DISPONIVEL_PARA_COMPRA', () => {
    it('Comprador inicia a compra → EM_PROCESSO_DE_COMPRA', () => {
      const transitions = getAvailableTransitions(RequestStatus.DISPONIVEL_PARA_COMPRA, UserRole.COMPRADOR);
      expect(transitions).toContain(RequestStatus.EM_PROCESSO_DE_COMPRA);
    });
    it('Pode ser cancelada', () => {
      const transitions = getAvailableTransitions(RequestStatus.DISPONIVEL_PARA_COMPRA, UserRole.COMPRADOR);
      expect(transitions).toContain(RequestStatus.CANCELADA);
    });
  });

  describe('EM_PROCESSO_DE_COMPRA', () => {
    it('Comprador confirma emissão → EMITIDA', () => {
      const transitions = getAvailableTransitions(RequestStatus.EM_PROCESSO_DE_COMPRA, UserRole.COMPRADOR);
      expect(transitions).toContain(RequestStatus.EMITIDA);
    });
    it('Pode ser cancelada', () => {
      const transitions = getAvailableTransitions(RequestStatus.EM_PROCESSO_DE_COMPRA, UserRole.COMPRADOR);
      expect(transitions).toContain(RequestStatus.CANCELADA);
    });
  });

  describe('COMPRA_RECUSADA', () => {
    it('Status terminal — apenas cancelamento disponível', () => {
      const transitions = getAvailableTransitions(RequestStatus.COMPRA_RECUSADA, UserRole.COMPRADOR);
      expect(transitions).toEqual([RequestStatus.CANCELADA]);
    });
  });
});

// ============================================================
// SUITE: canTransitionStatus
// ============================================================
describe('canTransitionStatus', () => {
  it('Cenário 1 — CH aprova → AGUARDANDO_APROVACAO_COMPRA (não DISPONIVEL_PARA_COMPRA)', () => {
    expect(canTransitionStatus(
      RequestStatus.EM_VALIDACAO_CH, 
      RequestStatus.AGUARDANDO_APROVACAO_COMPRA, 
      UserRole.CAPITAL_HUMANO
    )).toBe(true);
    
    expect(canTransitionStatus(
      RequestStatus.EM_VALIDACAO_CH, 
      RequestStatus.DISPONIVEL_PARA_COMPRA, 
      UserRole.CAPITAL_HUMANO
    )).toBe(false);
  });

  it('Compra aprovada → DISPONIVEL_PARA_COMPRA', () => {
    expect(canTransitionStatus(
      RequestStatus.AGUARDANDO_APROVACAO_COMPRA,
      RequestStatus.DISPONIVEL_PARA_COMPRA,
      UserRole.COMPRADOR
    )).toBe(true);
  });

  it('Compra aprovada NÃO vai direto para EM_PROCESSO_DE_COMPRA', () => {
    expect(canTransitionStatus(
      RequestStatus.AGUARDANDO_APROVACAO_COMPRA,
      RequestStatus.EM_PROCESSO_DE_COMPRA,
      UserRole.COMPRADOR
    )).toBe(false);
  });

  it('COMPRADOR não pode agir em EM_VALIDACAO_CH', () => {
    expect(canTransitionStatus(
      RequestStatus.EM_VALIDACAO_CH,
      RequestStatus.AGUARDANDO_APROVACAO_COMPRA,
      UserRole.COMPRADOR
    )).toBe(false);
  });

  it('GESTOR não pode aprovar CH', () => {
    expect(canTransitionStatus(
      RequestStatus.EM_VALIDACAO_CH,
      RequestStatus.AGUARDANDO_APROVACAO_COMPRA,
      UserRole.GESTOR
    )).toBe(false);
  });

  it('ADMINISTRATIVO pode reenviar RASCUNHO para CH', () => {
    expect(canTransitionStatus(
      RequestStatus.RASCUNHO,
      RequestStatus.EM_VALIDACAO_CH,
      UserRole.ADMINISTRATIVO
    )).toBe(true);
  });

  it('ADMINISTRATIVO pode reenviar RASCUNHO para Compras (sem CH)', () => {
    expect(canTransitionStatus(
      RequestStatus.RASCUNHO,
      RequestStatus.AGUARDANDO_APROVACAO_COMPRA,
      UserRole.ADMINISTRATIVO
    )).toBe(true);
  });
});

// ============================================================
// SUITE: getStatusLabel
// ============================================================
describe('getStatusLabel', () => {
  it('AGUARDANDO_APROVACAO_COMPRA → "Aguardando Aprovação da Compra"', () => {
    expect(getStatusLabel(RequestStatus.AGUARDANDO_APROVACAO_COMPRA)).toBe('Aguardando Aprovação da Compra');
  });
  it('RASCUNHO → "Rascunho"', () => {
    expect(getStatusLabel(RequestStatus.RASCUNHO)).toBe('Rascunho');
  });
  it('EMITIDA → "Bilhete Emitido"', () => {
    expect(getStatusLabel(RequestStatus.EMITIDA)).toBe('Bilhete Emitido');
  });
});

// ============================================================
// SUITE: mapLegacyToTravelRequest
// ============================================================
describe('mapLegacyToTravelRequest', () => {
  it('should correctly map a legacy document to v2', () => {
    const legacy = {
      id: 'leg-123',
      passengerName: 'João Silva',
      reason: TravelReason.FERIAS,
      status: RequestStatus.EM_VALIDACAO_CH,
      createdAt: '2024-01-01T00:00:00Z',
      route: 'SP - RJ',
      requesterEmail: 'test@example.com'
    } as any;

    const result = mapLegacyToTravelRequest(legacy);
    expect(result.requestId).toBe('leg-123');
    expect((result.employee as any).employeeName).toBe('João Silva');
    expect(result.travel.origin).toBe('SP');
    expect(result.travel.destination).toBe('RJ');
    expect(result.validation.validationRequired).toBe(true);
  });

  it('Passageiro externo em TREINAMENTO: validationRequired = false', () => {
    const legacy = {
      id: 'leg-ext',
      passengerName: 'Maria Externa',
      reason: TravelReason.TREINAMENTO,
      status: RequestStatus.AGUARDANDO_APROVACAO_COMPRA,
      createdAt: '2024-01-01T00:00:00Z',
      route: 'SP - BH',
      requesterEmail: 'test@example.com'
    } as any;

    const result = mapLegacyToTravelRequest(legacy);
    expect(result.validation.validationRequired).toBe(false);
  });
});
