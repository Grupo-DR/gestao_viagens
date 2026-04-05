import { ExternalVacationDTO, ExternalTimeOffDTO, CostCenterDTO, EmployeeSummaryDTO } from '../dtos/ExternalEmployeeDTO.ts';
import { EmployeeInfo, ValidationInfo } from '../../domain/types';
import { EmploymentStatus, ValidationStatus } from '../../domain/enums';

/**
 * Funções puras para mapear respostas de SQL do RM TOTVS DR Construtora.
 * Baseia-se no JSON real (CHAPA, NOME, DESCRICAO, SALDO) fornecido pelo usuário.
 */
export const EmployeeMapper = {
  
  /**
   * Mapeia dados básicos do colaborador.
   */
  mapToEmployeeInfo(data: ExternalVacationDTO): EmployeeInfo {
    const statusMap: Record<string, EmploymentStatus> = {
      'A': EmploymentStatus.ATIVO,
      'D': EmploymentStatus.DEMITIDO,
      'F': EmploymentStatus.FERIAS,
    };

    return {
      chapa: data.CHAPA,
      employeeName: data.NOME,
      functionName: data.FUNCAO,
      employmentStatus: statusMap[data.CODSITUACAO] || EmploymentStatus.ATIVO,
      directOrIndirect: undefined,
    };
  },

  /**
   * Converte períodos de férias brutos em ValidationInfo.
   */
  mapToVacationValidation(data: ExternalVacationDTO): ValidationInfo {
    const start = data.INICIOPERAQUIS;
    const end = data.FIMPERAQUIS;
    
    // O RM retorna ISO String ou 'YYYY-MM-DD'
    const formatDate = (raw: string) => raw ? raw.split('T')[0] : '—';

    return {
      validationRequired: true,
      validationType: 'Férias',
      validationStatus: data.SALDO > 0 ? ValidationStatus.PENDENTE : ValidationStatus.REPROVADA,
      validationSummary: `Saldo: ${data.SALDO} dias. Período aquisitivo: ${formatDate(start)} a ${formatDate(end)}.`,
      blockingReasons: data.SALDO <= 0 ? ['Saldo insuficiente de férias no período.'] : [],
    };
  },

  /**
   * Converte saldo de folga em ValidationInfo baseado no JSON real.
   */
  mapToTimeOffValidation(data: ExternalTimeOffDTO): ValidationInfo {
    const formatDate = (raw?: string) => raw ? raw.split('T')[0] : '—';
    const nextDate = data.DATA_PREVISTA ? new Date(data.DATA_PREVISTA) : null;
    const isEligible = nextDate ? nextDate <= new Date() : false;

    return {
      validationRequired: true,
      validationType: 'Folga',
      validationStatus: isEligible ? ValidationStatus.PENDENTE : ValidationStatus.REPROVADA,
      validationSummary: `Política: ${data.DESCRICAO}. Última folga: ${formatDate(data.ULTIMA_FOLGA)}. Próxima prevista: ${formatDate(data.DATA_PREVISTA)}.`,
      blockingReasons: !isEligible ? [`Aguardando data prevista (${formatDate(data.DATA_PREVISTA)}) para nova folga.`] : [],
    };
  },

  /** 
   * Mapeia lista de Centros de Custo (Extraídos de DESCRICAO única)
   */
  mapToCostCenterList(raw: ExternalVacationDTO[]): { code: string; label: string }[] {
    const uniqueCCs = new Set<string>();
    const list: { code: string; label: string }[] = [];

    raw.forEach(item => {
      if (item.DESCRICAO && !uniqueCCs.has(item.DESCRICAO)) {
        uniqueCCs.add(item.DESCRICAO);
        list.push({
          code: item.DESCRICAO,
          label: item.DESCRICAO
        });
      }
    });

    // Ordenar alfabeticamente para melhor UX
    return list.sort((a, b) => a.label.localeCompare(b.label));
  },

  /** 
   * Mapeia lista de Colaboradores de um CC 
   */
  mapToEmployeeSummaryList(raw: ExternalVacationDTO[]): { chapa: string; name: string; role: string }[] {
    return raw.map(e => ({
      chapa: e.CHAPA,
      name: e.NOME,
      role: e.FUNCAO
    }));
  }
};
