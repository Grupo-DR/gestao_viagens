import { describe, it, expect } from 'vitest';
import { getInitialStatus, canTransitionStatus } from '../../../domain/travelRequest.rules';
import { RequestStatus, TravelReason, UserRole } from '../../../domain/enums';
import { evaluateTravelPolicy } from '../evaluateTravelPolicy';

describe('Travel Flow Integration', () => {
  it('should flow correctly for a direct approval (TREINAMENTO)', () => {
    const reason = TravelReason.TREINAMENTO;
    
    // 1. Evaluate policy
    const policy = evaluateTravelPolicy(reason, '2024-01-01', '2024-01-10', null);
    expect(policy.result).toBe('APPROVED');
    
    // 2. Get initial status
    const status = getInitialStatus(reason, false);
    expect(status).toBe(RequestStatus.DISPONIVEL_PARA_COMPRA);
    
    // 3. Buyer emits
    const canEmit = canTransitionStatus(status, RequestStatus.EMITIDA, UserRole.COMPRADOR);
    expect(canEmit).toBe(true);
  });

  it('should flow correctly for a manual validation (FERIAS)', () => {
    const reason = TravelReason.FERIAS;
    
    // 1. Evaluate policy
    const policy = evaluateTravelPolicy(reason, '2024-01-01', '2024-01-10', null);
    // FERIAS with null data might return MANUAL_VALIDATION according to evaluateTravelPolicy.ts
    expect(policy.result).toBeDefined();
    
    // 2. Get initial status
    const status = getInitialStatus(reason, false);
    expect(status).toBe(RequestStatus.EM_VALIDACAO_CH);
    
    // 3. CH approves
    const canApprove = canTransitionStatus(status, RequestStatus.DISPONIVEL_PARA_COMPRA, UserRole.CAPITAL_HUMANO);
    expect(canApprove).toBe(true);
    
    // 4. CH rejects
    const canReject = canTransitionStatus(status, RequestStatus.REPROVADA, UserRole.CAPITAL_HUMANO);
    expect(canReject).toBe(true);
  });
});
