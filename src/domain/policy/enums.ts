/**
 * Enums para severidade e resultado da avaliação de política.
 */

export enum PolicySeverity {
  INFO = 'INFO',       // Apenas informativa
  WARNING = 'WARNING',   // Sugere atenção, não impede envio
  BLOCK = 'BLOCK',       // Impede o envio da solicitação
}

export enum PolicyResult {
  APPROVED = 'APPROVED',                     // Em conformidade total
  REJECTED = 'REJECTED',                     // Violação direta de política
  MANUAL_VALIDATION = 'MANUAL_VALIDATION',   // Requer análise humana do CH
}
