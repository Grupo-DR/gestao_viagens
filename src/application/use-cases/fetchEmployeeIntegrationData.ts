// ============================================================
// APPLICATION — Use Case — Fetch Employee Integration Data
// Gerencia a orquestração de chamadas ao RM TOTVS (SQL).
// Versão Final (v3): Suporta busca mestre e filtros por CC.
// ============================================================

import { rmSqlClient } from '../../infrastructure/api/rmSqlClient';
import { API_CONFIG } from '../../infrastructure/api/config';
import { EmployeeMapper } from '../mappers/EmployeeMapper';
import type { ExternalVacationDTO, ExternalTimeOffDTO } from '../dtos/ExternalEmployeeDTO';
import { EmployeeInfo, VacationValidation, TimeOffValidation } from '../../domain/types';

/**
 * Resultado da consolidação dos dados de integração.
 */
export interface EmployeeIntegrationResult {
  employeeInfo: EmployeeInfo;
  vacationValidation: VacationValidation;
  timeOffValidation?: TimeOffValidation;
  rawVacation?: ExternalVacationDTO;
  rawTimeOff?: ExternalTimeOffDTO;
  masterData?: {
    cpf: string;
    birthDate: string;
    name: string;
    functionName: string;
    homeCity: string;
  };
}

/**
 * Retorna a lista completa de colaboradores disponíveis na base mestre (VENCIMENTO_FER).
 * Usado para popular filtros e seletores iniciais.
 */
export async function getMasterEmployeeList(): Promise<ExternalVacationDTO[]> {
  const results = await rmSqlClient.executeSentence<ExternalVacationDTO>(
    API_CONFIG.SENTENCES.FERIAS
  );
  return results;
}

/**
 * Retorna a lista de centros de custo únicos a partir da base mestre.
 */
export async function getCostCenterListFromMaster(masterList: ExternalVacationDTO[]) {
  return EmployeeMapper.mapToCostCenterList(masterList);
}

/**
 * Filtra colaboradores da base mestre por Centro de Custo.
 */
export function filterEmployeesByCC(masterList: ExternalVacationDTO[], ccCode: string) {
  return masterList
    .filter(e => String(e.DESCRICAO).trim() === String(ccCode).trim())
    .map(e => ({
      chapa: String(e.CHAPA).trim(),
      name: String(e.NOME).trim(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Busca dados complementares (CPF, Nascimento) via 'DADOS SOLIDES'.
 */
export async function getSlaveMasterData(chapa: string) {
  const results = await rmSqlClient.executeSentence<any>(
    API_CONFIG.SENTENCES.MASTER_DATA
  );
  
  const match = results.find((r: any) => String(r.CHAPA).trim() === String(chapa).trim());
  if (!match) return null;

  return {
    cpf: (match.CPF || '').replace(/\D/g, ''),
    birthDate: match.DTNASCIMENTO ? match.DTNASCIMENTO.split('T')[0] : '',
    name: match.NOME || '',
    functionName: match.NOME1 || '',
    homeCity: match.CIDADE || '',
  };
}

/**
 * Busca todos os dados de integração de um colaborador específico pela Chapa.
 */
export async function getCompleteEmployeeData(chapa: string): Promise<EmployeeIntegrationResult> {
  if (!chapa) throw new Error('Chapa é obrigatória para integração.');

  // Faz chamadas paralelas para performance (Folgas e Férias)
  const [vacationResults, timeOffResults] = await Promise.all([
    rmSqlClient.executeSentence<ExternalVacationDTO>(API_CONFIG.SENTENCES.FERIAS, { CHAPA: chapa }),
    rmSqlClient.executeSentence<ExternalTimeOffDTO>(API_CONFIG.SENTENCES.FOLGA, { CHAPA: chapa }),
  ]);

  // Se o servidor ignorar o filtro e retornar a lista toda, filtramos localmente
  const employeeVacation = vacationResults.find(v => String(v.CHAPA).trim() === String(chapa).trim());
  const employeeTimeOff = timeOffResults.find(t => String(t.CHAPA).trim() === String(chapa).trim());

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
