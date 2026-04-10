import { TravelReason, RequestStatus } from '../../domain/enums.ts';
import { PolicyResult } from '../../domain/policy/enums.ts';
import { PolicyDecision } from '../../domain/policy/types.ts';
import { PolicyEngine } from '../../domain/policy/rules.ts';
import { EmployeeInfo, ValidationInfo } from '../../domain/types.ts';
import { ExternalVacationDTO, ExternalTimeOffDTO } from '../dtos/ExternalEmployeeDTO.ts';
import { EmployeeIntegrationResult } from './fetchEmployeeIntegrationData.ts';

/**
 * Caso de Uso: Avalia a política da solicitação com base nos dados de integração.
 * Centraliza a lógica de conformidade e sugere o próximo status do workflow.
 */
export function evaluateTravelPolicy(
  reason: TravelReason,
  startDate: string,
  endDate: string,
  integrationData: EmployeeIntegrationResult | null
): PolicyDecision {
  
  // 1. Decisão para Motivos Críticos (Delegado ao Domínio - Sprint 2)
  if (reason === TravelReason.FOLGA) {
    return PolicyEngine.evaluateTimeOff(startDate, integrationData?.rawTimeOff || null);
  }

  if (reason === TravelReason.FERIAS) {
    return PolicyEngine.evaluateVacation(startDate, endDate, integrationData?.rawVacation || null);
  }

  if (reason === TravelReason.FOLGA_FERIAS) {
    return PolicyEngine.evaluateCombinedLeave(
      startDate, 
      endDate, 
      integrationData?.rawTimeOff || null,
      integrationData?.rawVacation || null
    );
  }

  // 2. Outros Motivos (Não sujeitos a políticas de afastamento)
  return {
    result: PolicyResult.APPROVED,
    violations: [],
    warnings: [],
    evidence: {},
    summary: 'Motivo não sujeito a políticas de afastamento.',
  };
}

/**
 * Sugere o próximo status do workflow com base no resultado da política.
 */
export function suggestNextStatus(decision: PolicyDecision): RequestStatus {
  // Sempre encaminha para o CH primeiro, independentemente de conformidade política
  if (decision.result === PolicyResult.APPROVED) {
    return RequestStatus.EM_VALIDACAO_CH;
  }
  
  // Se for análise manual ou violação de política, encaminha para o CH
  if (decision.result === PolicyResult.MANUAL_VALIDATION || decision.result === PolicyResult.REJECTED) {
    return RequestStatus.EM_VALIDACAO_CH;
  }
  
  // Fallback para erros técnicos ou estados inesperados
  return RequestStatus.PENDENTE_CORRECAO;
}
