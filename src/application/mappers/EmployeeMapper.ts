import { ExternalVacationDTO, ExternalTimeOffDTO } from '../dtos/ExternalEmployeeDTO';
import { EmployeeInfo, ValidationInfo } from '../../domain/types';
import { EmploymentStatus, ValidationStatus } from '../../domain/enums';

/**
 * Funções puras para mapear respostas de SQL do Protheus/Chronos para o modelo interno.
 */
export const EmployeeMapper = {
  
  /**
   * Mapeia dados básicos e de férias.
   */
  mapToEmployeeInfo(vacation: ExternalVacationDTO): EmployeeInfo {
    const statusMap: Record<string, EmploymentStatus> = {
      'A': EmploymentStatus.ATIVO,
      'D': EmploymentStatus.DEMITIDO,
      'F': EmploymentStatus.FERIAS,
    };

    return {
      chapa: vacation.RA_CHAPA,
      employeeName: vacation.RA_NOME,
      functionName: vacation.RA_CARGO,
      employmentStatus: statusMap[vacation.RA_SITUA] || EmploymentStatus.ATIVO,
      directOrIndirect: undefined, // Esta informação não veio nestes endpoints
    };
  },

  /**
   * Converte períodos de férias brutos em ValidationInfo.
   */
  mapToVacationValidation(vacation: ExternalVacationDTO): ValidationInfo {
    const start = vacation.DATA_INICIO_PERIODO;
    const end = vacation.DATA_FIM_PERIODO;
    
    // Normalização de data YYYYMMDD -> YYYY-MM-DD
    const formatDate = (raw: string) => 
      raw && raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : undefined;

    return {
      validationRequired: true,
      validationType: 'Férias',
      validationStatus: vacation.ELEGIVEL === 'S' ? ValidationStatus.PENDENTE : ValidationStatus.REPROVADA,
      validationSummary: `Saldo: ${vacation.SALDO_DIAS} dias. Período: ${formatDate(start)} a ${formatDate(end)}.`,
      blockingReasons: vacation.ELEGIVEL === 'N' ? ['Saldo insuficiente ou período não permitido'] : [],
    };
  },

  /**
   * Converte saldo de folga em ValidationInfo.
   */
  mapToTimeOffValidation(timeOff: ExternalTimeOffDTO): ValidationInfo {
    return {
      validationRequired: true,
      validationType: 'Folga',
      validationStatus: timeOff.FOLGAS_DISPONIVEIS > 0 ? ValidationStatus.PENDENTE : ValidationStatus.REPROVADA,
      validationSummary: `Folgas disponíveis: ${timeOff.FOLGAS_DISPONIVEIS}. Saldo horas: ${timeOff.SALDO_HORAS}.`,
      blockingReasons: timeOff.FOLGAS_DISPONIVEIS <= 0 ? ['Sem saldo de folgas cadastrado no Chronos'] : [],
    };
  }
};
