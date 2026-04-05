import { useState, useCallback } from 'react';
import { getCompleteEmployeeData, EmployeeIntegrationResult } from '../use-cases/fetchEmployeeIntegrationData';

export interface UseEmployeeIntegrationResult {
  loading: boolean;
  error: string | null;
  data: EmployeeIntegrationResult | null;
  /**
   * Dispara a busca de dados do colaborador.
   */
  lookupEmployee: (chapa: string) => Promise<void>;
  /**
   * Reseta o estado do hook.
   */
  reset: () => void;
}

/**
 * Hook para encapsular o estado de busca e integração de dados do colaborador.
 */
export function useEmployeeIntegration(): UseEmployeeIntegrationResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EmployeeIntegrationResult | null>(null);

  const lookupEmployee = useCallback(async (chapa: string) => {
    if (!chapa.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await getCompleteEmployeeData(chapa);
      setData(result);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Falha na integração com sistemas RH.');
      console.error('[Employee Integration Error]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return { loading, error, data, lookupEmployee, reset };
}
