import { describe, it, expect } from 'vitest';
import { getInitialStatus, canTransitionStatus } from '../../../domain/travelRequest.rules';
import { RequestStatus, TravelReason, UserRole } from '../../../domain/enums';
import { evaluateTravelPolicy } from '../evaluateTravelPolicy';

describe('Travel Flow Integration', () => {
  it('should flow correctly for a direct approval (TREINAMENTO)', () => {
    const reason = TravelReason.TREINAMENTO;
    
    // 1. Evaluate policy — retorna objeto com date e geo (sem .result direto)
    const policy = evaluateTravelPolicy(reason, '2024-01-01', '2024-01-10', null);
    expect(policy.date).toBeDefined();
    expect(policy.geo).toBeDefined();
    
    // 2. Status inicial correto: AGUARDANDO_APROVACAO_COMPRA (não DISPONIVEL_PARA_COMPRA)
    const status = getInitialStatus(reason, false);
    expect(status).toBe(RequestStatus.AGUARDANDO_APROVACAO_COMPRA);
    
    // 3. Comprador aprova a cotação → DISPONIVEL_PARA_COMPRA
    const canApprove = canTransitionStatus(status, RequestStatus.DISPONIVEL_PARA_COMPRA, UserRole.COMPRADOR);
    expect(canApprove).toBe(true);
    
    // 4. Comprador não pode emitir direto de AGUARDANDO
    const canEmitDirect = canTransitionStatus(status, RequestStatus.EMITIDA, UserRole.COMPRADOR);
    expect(canEmitDirect).toBe(false);
  });

  it('should flow correctly for a manual validation (FERIAS)', () => {
    const reason = TravelReason.FERIAS;
    
    // 1. Evaluate policy — retorna TravelPolicyEvaluation com date e geo
    const policy = evaluateTravelPolicy(reason, '2024-01-01', '2024-01-10', null);
    expect(policy.date).toBeDefined();
    expect(policy.geo).toBeDefined();
    
    // 2. Status inicial correto: EM_VALIDACAO_CH
    const status = getInitialStatus(reason, false);
    expect(status).toBe(RequestStatus.EM_VALIDACAO_CH);
    
    // 3. CH aprova → AGUARDANDO_APROVACAO_COMPRA (não DISPONIVEL_PARA_COMPRA)
    const canApprove = canTransitionStatus(status, RequestStatus.AGUARDANDO_APROVACAO_COMPRA, UserRole.CAPITAL_HUMANO);
    expect(canApprove).toBe(true);
    
    // 4. CH não pode aprovar direto para DISPONIVEL_PARA_COMPRA
    const canApproveDirectBuy = canTransitionStatus(status, RequestStatus.DISPONIVEL_PARA_COMPRA, UserRole.CAPITAL_HUMANO);
    expect(canApproveDirectBuy).toBe(false);
    
    // 5. CH pode reprovar (definitivo)
    const canReject = canTransitionStatus(status, RequestStatus.REPROVADA, UserRole.CAPITAL_HUMANO);
    expect(canReject).toBe(true);
  });
});
