/**
 * DTOs atualizados com campos para motor de regras de política.
 */

export interface ExternalVacationDTO {
  RA_CHAPA: string;
  RA_NOME: string;
  RA_CARGO: string;
  RA_SITUA: 'A' | 'D' | 'F'; 
  DATA_INICIO_PERIODO: string; // YYYYMMDD
  DATA_FIM_PERIODO: string;    // YYYYMMDD
  SALDO_DIAS: number;
  ELEGIVEL: 'S' | 'N';
  
  // Novos campos para programação oficial
  PROGR_INICIO?: string; // YYYYMMDD
  PROGR_FIM?: string;    // YYYYMMDD
  PROGR_ABONO?: string;  // YYYYMMDD
}

export interface ExternalTimeOffDTO {
  MATRICULA: string;
  NOME: string;
  SALDO_HORAS: string;
  FOLGAS_DISPONIVEIS: number;
  ULTIMA_FOLGA: string; // YYYY-MM-DD
  
  // Campo para elegibilidade de folga
  DATA_PREVISTA?: string; // YYYY-MM-DD
}

export interface APIErrorResponse {
  message: string;
  code: string;
}
