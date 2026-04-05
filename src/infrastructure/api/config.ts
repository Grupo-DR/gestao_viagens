/**
 * Configuração centralizada para endpoints oficiais TOTVS RM.
 */

export const API_CONFIG = {
  // Base para todas as consultas SQL via RM Framework
  RM_SQL_BASE_URL: 'https://drconstrutora116480.rm.cloudtotvs.com.br:8051/api/framework/v1/consultaSQLServer/RealizaConsulta',
  TIMEOUT_MS: 8000, // Aumentado para consultas RM complexas
  
  // Sentenças SQL configuradas no RM TOTVS
  SENTENCES: {
    FOLGA: 'FOLGA_BAIXADA',
    FERIAS: 'VENCIMENTO_FER',
    CC: 'CENTROS_CUSTO',      // <--- Confirme se é este o nome no RM
    COLAB_CC: 'COLAB_CC'      // <--- Confirme se é este o nome no RM
  }
};

export const AUTH_HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': 'Basic YXBpOmRyZHJAUHJvdiEh', // api:drdr@Prov!!
};
