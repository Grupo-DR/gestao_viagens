import { describe, it, expect } from 'vitest';
import { evaluateTravelPolicy } from '../evaluateTravelPolicy';
import { TravelReason } from '../../../domain/enums';
import { PolicyResult } from '../../../domain/policy/enums';

describe('evaluateTravelPolicy', () => {
  it('should auto-approve Treinamento, Visita Técnica, etc', () => {
    const reasons = [
      TravelReason.TREINAMENTO,
      TravelReason.VISITA_TECNICA,
      TravelReason.VISITA_OBRA,
      TravelReason.ADMISSAO,
      TravelReason.DEMISSAO
    ];

    reasons.forEach(reason => {
      const result = evaluateTravelPolicy(reason, '2024-01-01', '2024-01-10', null);
      expect(result.result).toBe(PolicyResult.APPROVED);
    });
  });

  it('should allow flow for Folga, Férias, and Folga+Férias (delegated to Engine)', () => {
    // Note: Since we are passing null integrationData, results depend on Engine behavior
    const reasons = [
      TravelReason.FOLGA,
      TravelReason.FERIAS,
      TravelReason.FOLGA_FERIAS
    ];

    reasons.forEach(reason => {
      // These usually return MANUAL_VALIDATION or APPROVED depending on Engine. 
      // For testing purposes with null data, we just ensure it doesn't crash.
      const result = evaluateTravelPolicy(reason, '2024-01-01', '2024-01-10', null);
      expect(result).toBeDefined();
    });
  });
});
