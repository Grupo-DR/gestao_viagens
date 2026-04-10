import { useState, useEffect } from 'react';
import { evaluateTravelPolicy } from '../use-cases/evaluateTravelPolicy.ts';
import { dateService } from '../services/dateService.ts';
import { TravelPolicyEvaluation } from '../../domain/policy/types.ts';
import { TravelRequestFormData } from '../../domain/types.ts';
import { EmployeeIntegrationResult } from '../use-cases/fetchEmployeeIntegrationData.ts';

/**
 * Hook dedicado para avaliação de política de viagens.
 * Encapsula a inteligência de QUANDO e COMO disparar as regras de negócio.
 */
export function usePolicyEvaluation(
  formData: TravelRequestFormData,
  integrationData: EmployeeIntegrationResult | null
) {
  const [evaluation, setEvaluation] = useState<TravelPolicyEvaluation | null>(null);

  useEffect(() => {
    // 1. Resolve datas normalizadas via adaptador
    const { startDate, endDate } = dateService.resolvePolicyDates(formData);
    
    // 2. Trava de segurança: Só avalia se houver colaborador e data de início
    if (!formData.chapa || !startDate) {
      setEvaluation(null);
      return;
    }

    // 3. Executa o caso de uso de domínio (mantendo pureza)
    const result = evaluateTravelPolicy(
      formData.reason,
      startDate,
      endDate,
      integrationData,
      formData.segments
    );

    setEvaluation(result);
  }, [formData, integrationData]);

  return { evaluation };
}
