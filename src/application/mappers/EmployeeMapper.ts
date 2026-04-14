import { ExternalVacationDTO, ExternalTimeOffDTO } from '../dtos/ExternalEmployeeDTO';
import { 
  InternalPassenger, 
  VacationValidation,
  TimeOffValidation
} from '../../domain/types';
import { EmploymentStatus } from '../../domain/enums';

/**
 * Funções puras para mapear respostas de SQL do RM TOTVS DR Construtora.
 * Versão Final (v3): Retorna interfaces de validação tipadas para o motor de regras.
 */
export const EmployeeMapper = {
  
  /**
   * Mapeia dados básicos do colaborador.
   */
  mapToEmployeeInfo(data: ExternalVacationDTO): InternalPassenger {
    const statusMap: Record<string, EmploymentStatus> = {
      'A': EmploymentStatus.ATIVO,
      'D': EmploymentStatus.DEMITIDO,
      'F': EmploymentStatus.FERIAS,
    };

    return {
      passengerType: 'internal',
      chapa: data.CHAPA ?? '',
      employeeName: data.NOME ?? '',
      functionName: data.FUNCAO,
      employmentStatus: statusMap[data.CODSITUACAO] || EmploymentStatus.ATIVO,
      directOrIndirect: undefined,
    };
  },

  /**
   * Converte períodos de férias brutos em VacationValidation (v3).
   */
  mapToVacationValidation(data: ExternalVacationDTO): VacationValidation {
    // O RM retorna ISO String ou 'YYYY-MM-DD'
    const formatDate = (raw: string) => raw ? raw.split('T')[0] : '';
    
    return {
      chapa: data.CHAPA,
      hasBalance: data.SALDO > 0,
      vacationDays: data.SALDO || 0,
      accruedDays: 30, // Padrão CLT
      periodStart: formatDate(data.INICIOPERAQUIS),
      periodEnd: formatDate(data.FIMPERAQUIS),
      limitDate: formatDate(data.LIMITE || data.PRAZO),
      isExpired: data.PRAZO ? new Date(data.PRAZO) < new Date() : false
    };
  },

  /**
   * Converte saldo de folga em TimeOffValidation (v3).
   */
  mapToTimeOffValidation(data: ExternalTimeOffDTO): TimeOffValidation {
    const nextDate = data.DATA_PREVISTA ? new Date(data.DATA_PREVISTA) : null;
    const isEligible = nextDate ? nextDate <= new Date() : false;

    return {
      chapa: data.CHAPA,
      balance: isEligible ? 1 : 0, // No modelo RM, se passou da data é 1 folga
      isEligible
    };
  },

  /** 
   * Mapeia lista de Centros de Custo (Extraídos de DESCRICAO única do RM)
   */
  mapToCostCenterList(raw: ExternalVacationDTO[]): { code: string; label: string }[] {
    const uniqueKeys = new Set<string>();
    const list: { code: string; label: string }[] = [];

    raw.forEach(item => {
      const ccName = String(item.DESCRICAO || '').trim();
      if (ccName && !uniqueKeys.has(ccName)) {
        uniqueKeys.add(ccName);
        list.push({
          code: ccName,
          label: ccName
        });
      }
    });

    return list.sort((a, b) => a.label.localeCompare(b.label));
  },

  /** 
   * Mapeia lista de Colaboradores de um CC, garantindo chaves únicas de chapa.
   */
  mapToEmployeeSummaryList(raw: ExternalVacationDTO[]): { chapa: string; name: string }[] {
    const uniqueChapas = new Set<string>();

    return raw.reduce((acc, item) => {
      const chapa = String(item.CHAPA || '').trim();
      if (!chapa || uniqueChapas.has(chapa)) return acc;

      uniqueChapas.add(chapa);
      acc.push({
        chapa,
        name: String(item.NOME || '').trim(),
      });

      return acc;
    }, [] as { chapa: string; name: string }[]);
  }
};
