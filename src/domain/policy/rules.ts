import { TravelReason } from '../enums.ts';
import { PolicySeverity, PolicyResult } from './enums.ts';
import { 
  PolicyRule, 
  PolicyDecision, 
  TimeOffPolicyEvidence, 
  VacationPolicyEvidence, 
  CombinedPolicyEvidence 
} from './types.ts';
import { POLICY_RULES } from './catalog.ts';
import { ExternalVacationDTO, ExternalTimeOffDTO } from '../../application/dtos/ExternalEmployeeDTO.ts';

/**
 * Utilitário interno para normalização de datas.
 */
const normalize = (d?: string) => d ? d.split('T')[0].replace(/\//g, '-') : '';

/**
 * Motor de regras puro para política de viagens.
 * Sprint 2: Core Domain Logic & Hybrid Policies.
 */
export const PolicyEngine = {
  
  /**
   * Avalia uma solicitação de folga.
   */
  evaluateTimeOff(
    leaveStartDate: string, 
    timeOff: ExternalTimeOffDTO | null
  ): PolicyDecision<TimeOffPolicyEvidence> {
    const violations: PolicyRule[] = [];
    const warnings: PolicyRule[] = [];
    
    const prevista = normalize(timeOff?.DATA_PREVISTA);

    const evidence: TimeOffPolicyEvidence = { 
      leaveStartDate, 
      dataPrevista: prevista || undefined,
      ultimaFolga: normalize(timeOff?.ULTIMA_FOLGA) || undefined
    };

    if (!prevista) {
      warnings.push(POLICY_RULES.FOL_002);
      return {
        result: PolicyResult.MANUAL_VALIDATION,
        violations,
        warnings,
        evidence,
        summary: 'Data prevista de folga não localizada no Chronos.',
      };
    }

    if (leaveStartDate < prevista) {
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
  evaluateVacation(
    leaveStartDate: string, 
    leaveEndDate: string, 
    vacation: ExternalVacationDTO | null
  ): PolicyDecision<VacationPolicyEvidence> {
    const violations: PolicyRule[] = [];
    const warnings: PolicyRule[] = [];
    
    const aquaInicio = normalize(vacation?.INICIOPERAQUIS);
    const aquaFim = normalize(vacation?.FIMPERAQUIS);
    const prazoGozo = normalize(vacation?.PRAZO);
    const progrInicio = normalize(vacation?.PROGR_INICIO);
    const progrFim = normalize(vacation?.PROGR_FIM);

    const evidence: VacationPolicyEvidence = { 
      leaveStartDate, 
      leaveEndDate, 
      inicioAquisitivo: aquaInicio || undefined, 
      fimAquisitivo: aquaFim || undefined,
      saldoDias: vacation?.SALDO || 0,
      prazoLivre: prazoGozo || undefined,
      abonoProgramado: vacation?.PROGR_ABONO === 'S',
      diasProgramados: vacation?.PROGR_DIAS
    };

    if (!aquaInicio || !aquaFim) {
      warnings.push(POLICY_RULES.FER_003);
      return {
        result: PolicyResult.MANUAL_VALIDATION,
        violations,
        warnings,
        evidence,
        summary: 'Dados de programação de férias insuficientes no RM.',
      };
    }

    // Regra 1: Janela Programada RM
    if (progrInicio && (leaveStartDate < progrInicio || leaveEndDate > (progrFim || leaveEndDate))) {
      violations.push(POLICY_RULES.FER_001);
    }

    // Regra 2: Saldo insuficiente
    if (evidence.saldoDias <= 0) {
       violations.push(POLICY_RULES.FER_002);
    }

    // Regra 3: Prazo Limite RM
    if (prazoGozo && leaveStartDate > prazoGozo) {
      violations.push(POLICY_RULES.FER_005);
    }

    // Regra 4: Abono Pecuniário
    if (evidence.abonoProgramado) {
       warnings.push(POLICY_RULES.FER_004);
    }

    const result = violations.length > 0 ? PolicyResult.REJECTED : 
                   warnings.length > 0 ? PolicyResult.MANUAL_VALIDATION : PolicyResult.APPROVED;

    return {
      result,
      violations,
      warnings,
      evidence,
      summary: result === PolicyResult.APPROVED
        ? 'Férias em conformidade com o saldo e janelas programadas.'
        : result === PolicyResult.REJECTED
        ? 'Inconformidade crítica: Verifique janelas, prazos ou saldo.'
        : 'Requer validação CH: Verifique abono ou divergências parciais.',
    };
  },

  /**
   * Avalia uma solicitação combinada (Híbrida).
   */
  evaluateCombinedLeave(
    leaveStartDate: string,
    leaveEndDate: string,
    timeOff: ExternalTimeOffDTO | null,
    vacation: ExternalVacationDTO | null
  ): PolicyDecision<CombinedPolicyEvidence> {
    const folgaRes = this.evaluateTimeOff(leaveStartDate, timeOff);
    const feriasRes = this.evaluateVacation(leaveStartDate, leaveEndDate, vacation);

    // Consolidação de Severidade: REJECTED > MANUAL_VALIDATION > APPROVED
    let result = PolicyResult.APPROVED;
    if (folgaRes.result === PolicyResult.REJECTED || feriasRes.result === PolicyResult.REJECTED) {
      result = PolicyResult.REJECTED;
    } else if (folgaRes.result === PolicyResult.MANUAL_VALIDATION || feriasRes.result === PolicyResult.MANUAL_VALIDATION) {
      result = PolicyResult.MANUAL_VALIDATION;
    }

    return {
      result,
      violations: [...folgaRes.violations, ...feriasRes.violations],
      warnings: [...folgaRes.warnings, ...feriasRes.warnings],
      evidence: {
        folga: folgaRes.evidence,
        ferias: feriasRes.evidence
      },
      summary: result === PolicyResult.REJECTED 
        ? 'Combinação Híbrida REJEITADA por inconformidade crítica.' 
        : 'Combinação Híbrida requer validação detalhada do cronograma.',
    };
  }
};
