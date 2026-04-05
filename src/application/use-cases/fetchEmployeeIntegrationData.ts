import { API_CONFIG } from '../../infrastructure/api/config.ts';
import { rmSqlClient } from '../../infrastructure/api/rmSqlClient.ts';
import { EmployeeMapper } from '../mappers/EmployeeMapper.ts';
import { EmployeeInfo, ValidationInfo } from '../../domain/types';
import { ExternalVacationDTO, ExternalTimeOffDTO } from '../dtos/ExternalEmployeeDTO.ts';

export interface EmployeeIntegrationResult {
  employeeInfo: EmployeeInfo;
  vacationValidation?: ValidationInfo;
  timeOffValidation?: ValidationInfo;
  rawVacation?: ExternalVacationDTO;
  rawTimeOff?: ExternalTimeOffDTO;
}

/**
 * Busca a base mestre de colaboradores (VENCIMENTO_FER).
 * Retorna a lista completa para extração de Centros de Custo e Colaboradores.
 */
export async function getMasterEmployeeList(): Promise<ExternalVacationDTO[]> {
  // Chamada GET para a lista completa
  return await rmSqlClient.executeSentence<ExternalVacationDTO>(API_CONFIG.SENTENCES.FERIAS);
}

/**
 * Busca a lista oficial de Centros de Custo extraídos da base mestre.
 */
export async function getCostCenterListFromMaster(masterList: ExternalVacationDTO[]) {
  return EmployeeMapper.mapToCostCenterList(masterList);
}

/**
 * Filtra a lista de colaboradores de um centro de custo específico na base mestre.
 */
export function filterEmployeesByCC(masterList: ExternalVacationDTO[], ccValue: string) {
  const filtered = masterList.filter(e => e.DESCRICAO === ccValue);
  return EmployeeMapper.mapToEmployeeSummaryList(filtered);
}

/**
 * Busca dados de integração detalhados do colaborador (Férias/Folgas/Política).
 */
export async function getCompleteEmployeeData(chapa: string): Promise<EmployeeIntegrationResult> {
  // Buscamos os dados individuais para CHAPA via GET
  // Nota: o RM ignorou o filtro na query string em testes de console,
  // mas aqui tentamos o GET para manter o protocolo 200.
  const [vacationResults, timeOffResults] = await Promise.all([
    rmSqlClient.executeSentence<ExternalVacationDTO>(API_CONFIG.SENTENCES.FERIAS, { CHAPA: chapa }),
    rmSqlClient.executeSentence<ExternalTimeOffDTO>(API_CONFIG.SENTENCES.FOLGA, { CHAPA: chapa }),
  ]);

  // Se o servidor ignorar o filtro e retornar a lista toda, filtramos localmente
  const employeeVacation = vacationResults.find(v => v.CHAPA === chapa);
  const employeeTimeOff = timeOffResults.find(t => t.CHAPA === chapa);

  if (!employeeVacation) {
    throw new Error(`Dados de CHAPA ${chapa} não encontrados nos endpoints RM.`);
  }

  return {
    employeeInfo: EmployeeMapper.mapToEmployeeInfo(employeeVacation),
    vacationValidation: EmployeeMapper.mapToVacationValidation(employeeVacation),
    timeOffValidation: employeeTimeOff ? EmployeeMapper.mapToTimeOffValidation(employeeTimeOff) : undefined,
    rawVacation: employeeVacation,
    rawTimeOff: employeeTimeOff || undefined,
  };
}
