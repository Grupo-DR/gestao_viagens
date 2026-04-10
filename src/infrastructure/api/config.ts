/**
 * Configuração centralizada para endpoints oficiais TOTVS RM.
 * Todos os valores são lidos de variáveis de ambiente (.env).
 */

const RM_API_URL = import.meta.env.VITE_RM_API_URL as string;
const RM_API_TOKEN = import.meta.env.VITE_RM_API_TOKEN as string;
const RM_TIMEOUT = Number(import.meta.env.VITE_RM_API_TIMEOUT_MS) || 8000;

if (!RM_API_URL) {
  console.warn('[Config] VITE_RM_API_URL não definida. Verifique o arquivo .env');
}

export const API_CONFIG = {
  // Base para todas as consultas SQL via RM Framework
  RM_SQL_BASE_URL: RM_API_URL,
  TIMEOUT_MS: RM_TIMEOUT,

  // Sentenças SQL configuradas no RM TOTVS
  SENTENCES: {
    FOLGA: 'FOLGA_BAIXADA',
    FERIAS: 'VENCIMENTO_FER',
    CC: 'CENTROS_CUSTO',
    COLAB_CC: 'COLAB_CC',
    MASTER_DATA: 'DADOS SOLIDES', // CPF + Nascimento por Chapa
  }
};

export const AUTH_HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': RM_API_TOKEN,
};
