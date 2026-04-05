import { PolicySeverity, PolicyResult } from './enums';
import { RequestStatus } from '../enums';

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
 */
export interface PolicyDecision {
  result: PolicyResult;
  violations: PolicyRule[];
  warnings: PolicyRule[];
  evidence: Record<string, any>;
  summary: string;
}
