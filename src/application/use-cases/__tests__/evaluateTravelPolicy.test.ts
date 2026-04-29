import { describe, it, expect } from 'vitest';
import { evaluateTravelPolicy, suggestNextStatus } from '../evaluateTravelPolicy';
import { TravelReason, RequestStatus } from '../../../domain/enums';
import { PolicyResult } from '../../../domain/policy/enums';

/**
 * evaluateTravelPolicy retorna TravelPolicyEvaluation { date: PolicyDecision, geo: PolicyDecision }
 * Não há .result direto no retorno — deve acessar policy.date.result ou policy.geo.result.
 */
describe('evaluateTravelPolicy', () => {
  it('Motivos não-CH: dateDecision deve ser APPROVED', () => {
    const reasons = [
      TravelReason.TREINAMENTO,
      TravelReason.VISITA_TECNICA,
      TravelReason.VISITA_OBRA,
      TravelReason.ADMISSAO,
      TravelReason.DEMISSAO
    ];

    reasons.forEach(reason => {
      const result = evaluateTravelPolicy(reason, '2024-01-01', '2024-01-10', null);
      expect(result.date).toBeDefined();
      expect(result.date.result).toBe(PolicyResult.APPROVED);
      expect(result.geo).toBeDefined();
    });
  });

  it('Motivos CH (FOLGA/FERIAS/FOLGA_FERIAS): retorna objeto válido', () => {
    const reasons = [
      TravelReason.FOLGA,
      TravelReason.FERIAS,
      TravelReason.FOLGA_FERIAS
    ];

    reasons.forEach(reason => {
      const result = evaluateTravelPolicy(reason, '2024-01-01', '2024-01-10', null);
      expect(result.date).toBeDefined();
      expect(result.geo).toBeDefined();
      // Com dados nulos, pode retornar MANUAL_VALIDATION — apenas garante que não crashou
      expect(result.date.result).toBeDefined();
    });
  });
});

describe('suggestNextStatus', () => {
  const mockDecision = {
    result: PolicyResult.APPROVED,
    violations: [],
    warnings: [],
    evidence: {},
    summary: 'ok',
  };

  it('TREINAMENTO → AGUARDANDO_APROVACAO_COMPRA', () => {
    expect(suggestNextStatus(mockDecision, TravelReason.TREINAMENTO)).toBe(RequestStatus.AGUARDANDO_APROVACAO_COMPRA);
  });

  it('VISITA_TECNICA → AGUARDANDO_APROVACAO_COMPRA', () => {
    expect(suggestNextStatus(mockDecision, TravelReason.VISITA_TECNICA)).toBe(RequestStatus.AGUARDANDO_APROVACAO_COMPRA);
  });

  it('FOLGA → EM_VALIDACAO_CH', () => {
    expect(suggestNextStatus(mockDecision, TravelReason.FOLGA)).toBe(RequestStatus.EM_VALIDACAO_CH);
  });

  it('FERIAS → EM_VALIDACAO_CH', () => {
    expect(suggestNextStatus(mockDecision, TravelReason.FERIAS)).toBe(RequestStatus.EM_VALIDACAO_CH);
  });
});
