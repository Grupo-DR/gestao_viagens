import { API_CONFIG, AUTH_HEADERS } from './config.ts';

/**
 * Cliente genérico para o RM SQL Framework (Otimizado para GET).
 * O ambiente Cloud da DR Construtora exige GET para o endpoint RealizaConsulta.
 */
export const rmSqlClient = {
  /**
   * Executa uma sentença SQL no RM via GET.
   * Se parameters possuir campos, tenta passá-los como query string ou path.
   * Para listagens completas (ex: VENCIMENTO_FER), basta chamar sem parâmetros.
   */
  async executeSentence<T>(sentenceName: string, parameters: Record<string, string> = {}): Promise<T[]> {
    // Construção da URL baseada no padrão RM
    let url = `${API_CONFIG.RM_SQL_BASE_URL}/${sentenceName}/0/P`;
    
    // Se houver parâmetros (ex: CHAPA), tentamos o formato de query string compatível
    const queryParams = new URLSearchParams(parameters).toString();
    if (queryParams) {
      url += `?${queryParams}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);

    try {
      // Usamos GET para evitar o erro 405 Method Not Allowed
      const response = await fetch(url, {
        method: 'GET',
        headers: AUTH_HEADERS,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Erro RM API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // O RM Framework retorna os dados em um array direto ou no campo 'Result'
      return Array.isArray(data) ? data : (data.Result || []);
    } catch (error) {
      console.error(`[RM API] Falha na sentença ${sentenceName} via GET:`, error);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
};
