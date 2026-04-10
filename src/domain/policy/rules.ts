import { TravelReason } from '../enums';
import { PolicySeverity, PolicyResult } from './enums';
import { 
  PolicyRule, 
  PolicyDecision, 
  TimeOffPolicyEvidence, 
  VacationPolicyEvidence, 
  CombinedPolicyEvidence 
} from './types';
import { POLICY_RULES } from './catalog';
import { ExternalVacationDTO, ExternalTimeOffDTO } from '../../application/dtos/ExternalEmployeeDTO';

/**
 * Utilitário interno para normalização de datas (ISO -> YYYY-MM-DD).
 */
const normalize = (d?: string) => d ? d.split('T')[0].replace(/\//g, '-') : '';

/**
 * Calcula a diferença em dias entre duas datas (inclusive).
 */
const calculateDays = (start: string, end: string): number => {
  if (!start || !end) return 0;
  const s = new Date(start + 'T12:00:00');
  const e = new Date(end + 'T12:00:00');
  const diff = e.getTime() - s.getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)) + 1);
};

/**
 * Conta a quantidade de dias úteis (Seg-Sex) entre duas datas.
 */
const countBusinessDays = (start: string, end: string): number => {
  if (!start || !end) return 0;
  const s = new Date(start + 'T12:00:00');
  const e = new Date(end + 'T12:00:00');
  let count = 0;
  let cur = new Date(s);
  while (cur <= e) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

/**
 * Tenta extrair o limite de dias da política da string de DESCRICAO.
 */
const extractTimeOffPolicy = (description: string) => {
  if (!description) return null;
  const d = description.toLowerCase();
  
  // Padrão: "X dias úteis"
  const matchDays = d.match(/(\d+)\s*dias\s*(úteis|utes)/i);
  if (matchDays) return { limit: parseInt(matchDays[1]), type: 'business' };

  // Padrão: "fim de semana"
  if (d.includes('fim de semana')) return { limit: 2, type: 'weekend' };

  return null;
};

/**
 * Motor de regras puro para política de viagens.
 */
export const PolicyEngine = {
  
  /**
   * Avalia uma solicitação de folga.
   */
  evaluateTimeOff(
    leaveStartDate: string, 
    leaveEndDate: string,
    timeOff: ExternalTimeOffDTO | null
  ): PolicyDecision<TimeOffPolicyEvidence> {
    const violations: PolicyRule[] = [];
    const warnings: PolicyRule[] = [];
    
    const prevista = normalize(timeOff?.DATA_PREVISTA);
    const policy = extractTimeOffPolicy(timeOff?.DESCRICAO || '');
    
    // Para folga, usamos a contagem de dias conforme o tipo da política
    const diasUteisSolicitados = countBusinessDays(leaveStartDate, leaveEndDate);
    const diasCorridosSolicitados = calculateDays(leaveStartDate, leaveEndDate);

    const evidence: TimeOffPolicyEvidence = { 
      leaveStartDate, 
      dataPrevista: prevista || null,
      ultimaFolga: normalize(timeOff?.ULTIMA_FOLGA) || null,
      diasUteisSolicitados,
      regraExtraida: timeOff?.DESCRICAO || null,
      limiteDetetado: policy?.limit || null
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

    // 1. Validação de Carência (90 dias ou conforme cronograma)
    if (leaveStartDate < prevista) {
      violations.push(POLICY_RULES.FOL_001);
    }

    // 2. Validação de Limite de Dias (Dinâmico)
    if (policy) {
      const isViolation = policy.type === 'business' 
        ? diasUteisSolicitados > policy.limit 
        : diasCorridosSolicitados > policy.limit;

      if (isViolation) {
        violations.push(POLICY_RULES.FOL_003);
      }
    }

    const result = violations.length > 0 ? PolicyResult.REJECTED : PolicyResult.APPROVED;

    return {
      result,
      violations,
      warnings,
      evidence,
      summary: result === PolicyResult.APPROVED 
        ? 'Solicitação em conformidade com o cronograma de folgas.' 
        : 'Inconformidade na solicitação de folga. Verifique datas ou limites.',
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
    const progrDias = vacation?.PROGR_DIAS || 0;

    const diasSolicitados = calculateDays(leaveStartDate, leaveEndDate);

    const evidence: VacationPolicyEvidence = { 
      leaveStartDate, 
      leaveEndDate, 
      inicioAquisitivo: aquaInicio || null, 
      fimAquisitivo: aquaFim || null,
      saldoDias: vacation?.SALDO || 0,
      prazoLivre: prazoGozo || null,
      abonoProgramado: vacation?.PROGR_ABONO === 'S' || (vacation as any)?.PROGR_ABONO > 0,
      diasProgramados: progrDias || null,
      diasSolicitados
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

    // 1. Validação de Programação Oficial
    if (progrInicio) {
      // Regra: Janela de Datas
      if (leaveStartDate < progrInicio || leaveEndDate > (progrFim || leaveEndDate)) {
        violations.push(POLICY_RULES.FER_001);
      }
      // Regra: Correspondência de Dias
      if (progrDias > 0 && diasSolicitados !== progrDias) {
        violations.push(POLICY_RULES.FER_007);
      }
    } else {
      // Regra: Ausência de Programação (Apenas Alerta)
      warnings.push(POLICY_RULES.FER_003);
      
      // Regra: Teto pelo Saldo
      if (diasSolicitados > (vacation?.SALDO || 0)) {
        violations.push(POLICY_RULES.FER_008);
      }
    }

    // 2. Período Aquisitivo
    if (aquaFim && leaveStartDate < aquaFim) {
       violations.push(POLICY_RULES.FER_002);
    }

    // 3. Saldo Crítico (Geral)
    if (evidence.saldoDias <= 0) {
       violations.push(POLICY_RULES.FER_006);
    }

    // 4. Prazo Limite RM
    if (prazoGozo && leaveStartDate > prazoGozo) {
      violations.push(POLICY_RULES.FER_005);
    }

    // 5. Abono Pecuniário (Alerta Informativo)
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
        : 'Requer validação CH: Verifique programação ou divergências.',
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
    const folgaRes = this.evaluateTimeOff(leaveStartDate, leaveEndDate, timeOff);
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
  },

  /**
   * Avalia a conformidade geográfica entre destino e residência.
   */
  evaluateGeographicMatch(homeCity: string, destinationCity: string): PolicyDecision<any> {
    const normalizeStr = (s: string) => s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .split('-')[0]
      .trim();

    const h = normalizeStr(homeCity || '');
    const d = normalizeStr(destinationCity || '');

    const isMatch = h === d;
    const violations: PolicyRule[] = [];
    const warnings: PolicyRule[] = [];

    if (!isMatch && h && d) {
       warnings.push(POLICY_RULES.GEO_001);
    }

    const result = warnings.length > 0 ? PolicyResult.MANUAL_VALIDATION : PolicyResult.APPROVED;

    return {
      result,
      violations,
      warnings,
      evidence: { homeCity, destinationCity },
      summary: isMatch 
        ? 'Destino da viagem coincide com a residência do colaborador.' 
        : 'Destino diverge da residência (RM). Requer atenção do CH.',
    };
  }
};
