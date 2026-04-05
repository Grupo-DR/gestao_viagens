import { vacationsApiClient } from '../../infrastructure/api/vacationsClient';
import { timeOffApiClient } from '../../infrastructure/api/timeOffApiClient';
import { EmployeeMapper } from '../mappers/EmployeeMapper';
import { EmployeeInfo, ValidationInfo } from '../../domain/types';
import { TravelReason } from '../../domain/enums';
import { ExternalVacationDTO, ExternalTimeOffDTO } from '../dtos/ExternalEmployeeDTO';

export interface EmployeeIntegrationResult {
  employeeInfo: EmployeeInfo;
  vacationValidation?: ValidationInfo;
  timeOffValidation?: ValidationInfo;
  // Dados brutos para o motor de regras
  rawVacation?: ExternalVacationDTO;
  rawTimeOff?: ExternalTimeOffDTO;
}

/**
 * Caso de uso: Busca dados de integração do colaborador via CHAPA.
 * Realiza as chamadas em paralelo para otimizar performance.
 */
export async function getCompleteEmployeeData(chapa: string): Promise<EmployeeIntegrationResult> {
  // Chamada em paralelo dos endpoints
  // Nota: o vacationsApiClient retorna uma lista (períodos de férias)
  const [vacationResults, timeOffResult] = await Promise.all([
    vacationsApiClient.fetchByChapa(chapa),
    timeOffApiClient.fetchByChapa(chapa),
  ]);

  if (vacationResults.length === 0) {
    throw new Error(`CHAPA ${chapa} não localizada no sistema Protheus.`);
  }

  // Pega o primeiro registro de férias para dados cadastrais
  const primaryVacation = vacationResults[0];

  return {
    employeeInfo: EmployeeMapper.mapToEmployeeInfo(primaryVacation),
    vacationValidation: EmployeeMapper.mapToVacationValidation(primaryVacation),
    timeOffValidation: timeOffResult ? EmployeeMapper.mapToTimeOffValidation(timeOffResult) : undefined,
    rawVacation: primaryVacation,
    rawTimeOff: timeOffResult || undefined,
  };
}
