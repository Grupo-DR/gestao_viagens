import { PolicySeverity, PolicyResult } from './enums.ts';
import { RequestStatus } from '../enums.ts';

/**
 * Evidência detalhada para uma decisão de folga.
 */
export interface TimeOffPolicyEvidence {
  leaveStartDate: string;
  dataPrevista?: string;
  ultimaFolga?: string;
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
