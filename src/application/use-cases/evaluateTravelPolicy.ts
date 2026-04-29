import { TravelReason, RequestStatus } from '../../domain/enums';
import { PolicyResult } from '../../domain/policy/enums';
import { PolicyDecision, TravelPolicyEvaluation } from '../../domain/policy/types';
import { PolicyEngine } from '../../domain/policy/rules';
import { TravelSegment } from '../../domain/types';
import { EmployeeIntegrationResult } from './fetchEmployeeIntegrationData';
import { getInitialStatus } from '../../domain/travelRequest.rules';

/**
 * Caso de Uso: Avalia a política da solicitação com base nos dados de integração.
 * Centraliza a lógica de conformidade e sugere o próximo status do workflow.
 * Versão v4: Desacopla as políticas de Data e Destino (Geográfica).
 */
export function evaluateTravelPolicy(
  reason: TravelReason,
  startDate: string,
  endDate: string,
  integrationData: EmployeeIntegrationResult | null,
  segments: TravelSegment[] = []
): TravelPolicyEvaluation {
  
  let dateDecision: PolicyDecision;

  // 1. Decisão para Políticas de Data (Folga/Férias)
  if (reason === TravelReason.FOLGA) {
    dateDecision = PolicyEngine.evaluateTimeOff(startDate, endDate, integrationData?.rawTimeOff || null);
  } else if (reason === TravelReason.FERIAS) {
    dateDecision = PolicyEngine.evaluateVacation(startDate, endDate, integrationData?.rawVacation || null);
  } else if (reason === TravelReason.FOLGA_FERIAS) {
    dateDecision = PolicyEngine.evaluateCombinedLeave(
      startDate, 
      endDate, 
      integrationData?.rawTimeOff || null,
      integrationData?.rawVacation || null
    );
  } else {
    // Motivos não sujeitos a políticas de afastamento
    dateDecision = {
      result: PolicyResult.APPROVED,
      violations: [],
      warnings: [],
      evidence: {},
      summary: 'Motivo não sujeito a políticas de afastamento.',
    };
  }

  // 2. Validação Geográfica (Destino vs Residência) - Independente
  const homeCity = integrationData?.masterData?.homeCity || integrationData?.rawVacation?.CIDADE || '';
  
  // Pega o último destino de IDA do itinerário
  const lastIda = [...segments]
    .filter(s => s.direction === 'ida' && s.destination)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .pop();

  let geoDecision: PolicyDecision;

  if (homeCity && lastIda && lastIda.destination) {
    geoDecision = PolicyEngine.evaluateGeographicMatch(homeCity, lastIda.destination);
  } else {
    // Resultado neutro se dados insuficientes para validar destino
    geoDecision = {
      result: PolicyResult.MANUAL_VALIDATION, // Alterado para evitar o "APPROVED" falso
      violations: [],
      warnings: [],
      evidence: { homeCity, destinationCity: lastIda?.destination },
      summary: 'Aguardando preenchimento do destino final.',
    };
  }

  return {
    date: dateDecision,
    geo: geoDecision
  };
}

/**
 * Sugere o próximo status do workflow com base no resultado da política e no motivo da viagem.
 * Respeita a regra de domínio: motivos CH vao para EM_VALIDACAO_CH,
 * os demais vão diretamente para AGUARDANDO_APROVACAO_COMPRA.
 *
 * @param decision - Resultado da avaliação de política (usado como contexto)
 * @param reason - Motivo da viagem (determina o fluxo correto)
 */
export function suggestNextStatus(decision: PolicyDecision, reason: TravelReason): RequestStatus {
  return getInitialStatus(reason, false);
}
