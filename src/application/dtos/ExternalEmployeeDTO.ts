/**
 * DTOs que refletem EXATAMENTE a estrutura JSON do RM TOTVS DR Construtora.
 * Baseado no exemplo oficial fornecido pelo usuário.
 */

export interface ExternalVacationDTO {
  CHAPA: string;
  NOME: string;
  CODSITUACAO: string; // "A" - Ativo
  FUNCAO: string;
  CODTIPO: string;
  INICIOPERAQUIS: string; // ISO String 2025-07-09T00:00:00-03:00
  FIMPERAQUIS: string;
  SALDO: number;
  LIMITE: string;
  CODSECAO: string;
  DESCRICAO: string; // Centro de Custo: "3015.03 - VLI SERV..."
  PRAZO: string;
  PROGR_INICIO?: string; // Data programada RM
  PROGR_FIM?: string;    // Data programada RM
  PROGR_DIAS?: number;   // Quantidade programada RM
  PROGR_ABONO?: string;  // "S" ou "N" para abono pecuniário
}

export interface ExternalTimeOffDTO {
  CHAPA: string;
  NOME: string;
  DATAADMISSAO: string;
  TIPO: string;
  DESCRICAO: string; // Ex: "Sim, Moradia acima 600..."
  ESTADO: string;
  CIDADE: string;
  CODCCUSTO: string;
  NOME_CC: string;
  ULTIMA_FOLGA?: string; // ISO String
  DATA_PREVISTA?: string; // ISO String
}

/** DTO para lista de Centros de Custo (Extraído da DESCRICAO) */
export interface CostCenterDTO {
  CODIGO: string;
  NOME: string;
}

/** DTO para lista simplificada de colaboradores (Mapeado do ExternalVacationDTO) */
export interface EmployeeSummaryDTO {
  CHAPA: string;
  NOME: string;
  CARGO: string;
}
