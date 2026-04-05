import { TravelReason } from '../enums';
import { PolicySeverity, PolicyResult } from './enums';
import { PolicyRule, PolicyDecision } from './types';
import { POLICY_RULES } from './catalog';
import { ExternalVacationDTO, ExternalTimeOffDTO } from '../../application/dtos/ExternalEmployeeDTO';

/**
 * Motor de regras puro para política de viagens.
 */
export const PolicyEngine = {
  
  /**
   * Avalia uma solicitação de folga.
   */
  evaluateTimeOff(leaveStartDate: string, timeOff: ExternalTimeOffDTO | null): PolicyDecision {
    const violations: PolicyRule[] = [];
    const warnings: PolicyRule[] = [];
    const evidence: Record<string, any> = { leaveStartDate, dataPrevista: timeOff?.DATA_PREVISTA };

    if (!timeOff?.DATA_PREVISTA) {
      warnings.push(POLICY_RULES.FOL_002);
      return {
        result: PolicyResult.MANUAL_VALIDATION,
        violations,
        warnings,
        evidence,
        summary: 'Data prevista não localizada no sistema RH.',
      };
    }

    // Regra: Não pode antes da data prevista
    if (leaveStartDate < timeOff.DATA_PREVISTA) {
      violations.push(POLICY_RULES.FOL_001);
    }

    const result = violations.length > 0 ? PolicyResult.REJECTED : PolicyResult.APPROVED;

    return {
      result,
      violations,
      warnings,
      evidence,
      summary: result === PolicyResult.APPROVED 
        ? 'Solicitação em conformidade com o cronograma de folgas.' 
        : 'Inconformidade na data de folga solicitada.',
    };
  },

  /**
   * Avalia uma solicitação de férias.
   */
  evaluateVacation(leaveStartDate: string, leaveEndDate: string, vacation: ExternalVacationDTO | null): PolicyDecision {
    const violations: PolicyRule[] = [];
    const warnings: PolicyRule[] = [];
    const evidence: Record<string, any> = { 
      leaveStartDate, 
      leaveEndDate, 
      progrInicio: vacation?.PROGR_INICIO, 
      progrFim: vacation?.PROGR_FIM 
    };

    if (!vacation?.PROGR_INICIO || !vacation?.PROGR_FIM) {
      warnings.push(POLICY_RULES.FER_003);
      return {
        result: PolicyResult.MANUAL_VALIDATION,
        violations,
        warnings,
        evidence,
        summary: 'Programação de férias não disponível no Protheus.',
      };
    }

    // Normalização das datas de programação (YYYYMMDD -> YYYY-MM-DD para comparação string)
    const format = (d: string) => `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
    const progrInicio = format(vacation.PROGR_INICIO);
    const progrFim = format(vacation.PROGR_FIM);

    // Regra: Período solicitado deve estar dentro da janela programada
    if (leaveStartDate < progrInicio || leaveEndDate > progrFim) {
      violations.push(POLICY_RULES.FER_001);
    }

    // Regras de abono
    if (vacation.PROGR_ABONO) {
      const progrAbono = format(vacation.PROGR_ABONO);
      if (leaveStartDate <= progrAbono && leaveEndDate >= progrAbono) {
        warnings.push(POLICY_RULES.FER_004);
      }
    }

    const result = violations.length > 0 ? PolicyResult.REJECTED : PolicyResult.APPROVED;

    return {
      result,
      violations,
      warnings,
      evidence,
      summary: result === PolicyResult.APPROVED
        ? 'A solicitação coincide com a janela oficial de férias.'
        : 'O período solicitado está fora da programação oficial.',
    };
  }
};
