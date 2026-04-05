import { API_CONFIG, AUTH_HEADERS } from './config.ts';
import { ExternalVacationDTO } from '../../application/dtos/ExternalEmployeeDTO.ts';

/**
 * Cliente para consulta de férias no Protheus.
 */
/**
 * Cliente para consulta de férias no TOTVS RM.
 * Utiliza o ConsultaSQLServer do RM Framework.
 */
export const vacationsApiClient = {
  async fetchByChapa(chapa: string): Promise<ExternalVacationDTO[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);

    try {
      // RM SQL via Framework exige POST com parâmetros no body
      const response = await fetch(`${API_CONFIG.RM_SQL_BASE_URL}/${API_CONFIG.SENTENCES.FERIAS}/0/P`, {
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
        throw new Error(`Erro na API de Férias RM: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // O RM pode retornar os dados em um array direto ou dentro de um campo 'data'
      const data = Array.isArray(result) ? result : (result.data || []);
      return data as ExternalVacationDTO[];
    } finally {
      clearTimeout(timeoutId);
    }
  },
};
