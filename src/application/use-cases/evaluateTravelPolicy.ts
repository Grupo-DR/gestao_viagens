import { TravelReason, RequestStatus } from '../../domain/enums';
import { PolicyResult } from '../../domain/policy/enums';
import { PolicyDecision } from '../../domain/policy/types';
import { PolicyEngine } from '../../domain/policy/rules';
import { EmployeeInfo, ValidationInfo } from '../../domain/types';
import { ExternalVacationDTO, ExternalTimeOffDTO } from '../dtos/ExternalEmployeeDTO';
import { EmployeeIntegrationResult } from './fetchEmployeeIntegrationData';

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
  
  // 1. Decisão para Motivos Críticos
  if (reason === TravelReason.FOLGA) {
    return PolicyEngine.evaluateTimeOff(startDate, integrationData?.rawTimeOff || null);
  }

  if (reason === TravelReason.FERIAS) {
    return PolicyEngine.evaluateVacation(startDate, endDate, integrationData?.rawVacation || null);
  }

  if (reason === TravelReason.FOLGA_FERIAS) {
    const folgaRes = PolicyEngine.evaluateTimeOff(startDate, null); // Simula sem dado específico
    const feriasRes = PolicyEngine.evaluateVacation(startDate, endDate, null);
    
    // Combinação simples: Se um bloqueia, o todo bloqueia.
    const result = (folgaRes.result === PolicyResult.REJECTED || feriasRes.result === PolicyResult.REJECTED) 
      ? PolicyResult.REJECTED 
      : PolicyResult.MANUAL_VALIDATION;

    return {
      result,
      violations: [...folgaRes.violations, ...feriasRes.violations],
      warnings: [...folgaRes.warnings, ...feriasRes.warnings],
      evidence: { folga: folgaRes.evidence, ferias: feriasRes.evidence },
      summary: 'Solicitação híbrida requer análise consolidada do CH.',
    };
  }

  // 2. Outros Motivos (Não críticos)
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
  if (decision.result === PolicyResult.APPROVED) {
    return RequestStatus.DISPONIVEL_PARA_COMPRA;
  }
  if (decision.result === PolicyResult.MANUAL_VALIDATION) {
    return RequestStatus.EM_VALIDACAO_CH;
  }
  // Se rejeitado ou com erro, volta como rascunho ou pendente de correção
  return RequestStatus.PENDENTE_CORRECAO;
}
