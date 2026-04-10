/**
 * Configuração centralizada para endpoints oficiais TOTVS RM.
 */

export const API_CONFIG = {
  // Base para todas as consultas SQL via RM Framework para ProduÃ§Ã£o
  RM_SQL_BASE_URL: import.meta.env.VITE_RM_SQL_BASE_URL || 'https://drconstrutora116480.rm.cloudtotvs.com.br:8051/api/framework/v1/consultaSQLServer/RealizaConsulta',
  TIMEOUT_MS: 15000, 
  SENTENCES: {
    FERIAS: 'VENCIMENTO_FER',
    FOLGA: 'FOLGA_BAIXADA',
    POLITICA: 'POLITICA_VIAGEM',
    MASTER_DATA: 'DADOS SOLIDES'
  }
};

export const AUTH_HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': import.meta.env.VITE_RM_AUTHORIZATION || 'Basic YXBpOmRyZHJAUHJvdiEh', 
};
