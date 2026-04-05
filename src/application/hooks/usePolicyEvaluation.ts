import { useState, useEffect } from 'react';
import { evaluateTravelPolicy } from '../use-cases/evaluateTravelPolicy.ts';
import { dateService } from '../services/dateService.ts';
import { PolicyDecision } from '../../domain/policy/types.ts';
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
  const [policyDecision, setPolicyDecision] = useState<PolicyDecision | null>(null);

  useEffect(() => {
    // 1. Resolve datas normalizadas via adaptador
    const { startDate, endDate } = dateService.resolvePolicyDates(formData);
    
    // 2. Trava de segurança: Só avalia se houver colaborador e data de início
    if (!formData.chapa || !startDate) {
      setPolicyDecision(null);
      return;
    }

    // 3. Executa o caso de uso de domínio (mantendo pureza)
    const decision = evaluateTravelPolicy(
      formData.reason,
      startDate,
      endDate,
      integrationData
    );

    setPolicyDecision(decision);
  }, [
    formData.chapa, 
    formData.reason, 
    formData.leaveStartDate, 
    formData.leaveEndDate, 
    formData.departureDateTime, 
    formData.returnDateTime, 
    integrationData
  ]);

  return { policyDecision };
}
