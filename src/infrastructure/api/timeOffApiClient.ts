import { API_CONFIG, AUTH_HEADERS } from './config';
import { ExternalTimeOffDTO } from '../../application/dtos/ExternalEmployeeDTO';

/**
 * Cliente para consulta de folgas no Chronos.
 */
/**
 * Cliente para consulta de folgas no TOTVS RM.
 * Utiliza o ConsultaSQLServer do RM Framework.
 */
export const timeOffApiClient = {
  async fetchByChapa(chapa: string): Promise<ExternalTimeOffDTO | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);

    try {
      // RM SQL via Framework exige POST com parâmetros no body
      const response = await fetch(`${API_CONFIG.RM_SQL_BASE_URL}/FOLGA_BAIXADA/0/P`, {
        method: 'POST',
        headers: AUTH_HEADERS,
        body: JSON.stringify({
          parameters: {
            CHAPA: chapa
          }
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Erro na API de Folga RM: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Assume a resposta vem como lista de objetos ou envelopada
      const data = Array.isArray(result) ? result : (result.data || []);
      return data[0] || null;
    } finally {
      clearTimeout(timeoutId);
    }
  },
};
