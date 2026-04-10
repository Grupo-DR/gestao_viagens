import { PolicySeverity, PolicyResult } from './enums';
import { RequestStatus } from '../enums';

/**
 * Evidência detalhada para uma decisão de folga.
 */
export interface TimeOffPolicyEvidence {
  leaveStartDate: string;
  dataPrevista?: string;
  ultimaFolga?: string;
  diasUteisSolicitados?: number;
  regraExtraida?: string;
  limiteDetetado?: number;
}

/**
 * Evidência detalhada para uma decisão de férias.
 */
export interface VacationPolicyEvidence {
  leaveStartDate: string;
  leaveEndDate: string;
  inicioAquisitivo?: string;
  fimAquisitivo?: string;
  saldoDias: number;
  prazoLivre?: string;
  abonoProgramado?: boolean;
  diasProgramados?: number;
  diasSolicitados?: number;
}

/**
 * Evidência consolidada para casos híbridos.
 */
export interface CombinedPolicyEvidence {
  folga: TimeOffPolicyEvidence;
  ferias: VacationPolicyEvidence;
}

/**
 * Interface para uma regra de política.
 */
export interface PolicyRule {
  code: string;
  severity: PolicySeverity;
  message: string;
}

/**
 * Interface para a estrutura de decisão final da política.
 * Permite tipagem genérica para a evidência.
 */
export interface PolicyDecision<T = any> {
  result: PolicyResult;
  violations: PolicyRule[];
  warnings: PolicyRule[];
  evidence: T;
  summary: string;
}

/**
 * Interface para a estrutura de avaliação completa de uma viagem.
 * Separa explicitamente a política de datas da política geográfica.
 */
export interface TravelPolicyEvaluation {
  date: PolicyDecision;
  geo: PolicyDecision;
}
