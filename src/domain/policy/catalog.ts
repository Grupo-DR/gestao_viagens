import { PolicySeverity } from './enums.ts';
import { PolicyRule } from './types.ts';

/**
 * Catálogo de regras de política para padronização de mensagens e códigos.
 */
export const POLICY_RULES: Record<string, PolicyRule> = {
  // Regras de Folga
  'FOL_001': {
    code: 'FOL_001',
    severity: PolicySeverity.BLOCK,
    message: 'Data de início é anterior à data prevista elegível.',
  },
  'FOL_002': {
    code: 'FOL_002',
    severity: PolicySeverity.WARNING,
    message: 'Data prevista de folga não foi localizada no Chronos. Requer validação CH.',
  },

  // Regras de Férias
  'FER_001': {
    code: 'FER_001',
    severity: PolicySeverity.BLOCK,
    message: 'O período solicitado não coincide com a janela de programação oficial (PROGR_INICIO/FIM).',
  },
  'FER_002': {
    code: 'FER_002',
    severity: PolicySeverity.BLOCK,
    message: 'Solicitação fora do limite permitido pelo RM (Confira FIMPERAQUIS).',
  },
  'FER_003': {
    code: 'FER_003',
    severity: PolicySeverity.WARNING,
    message: 'Dados de programação de férias ausentes no Protheus. Requer validação CH.',
  },
  'FER_004': {
    code: 'FER_004',
    severity: PolicySeverity.WARNING,
    message: 'O período solicitado sobrepõe o período de abono (PROGR_ABONO).',
  },
  'FER_005': {
    code: 'FER_005',
    severity: PolicySeverity.BLOCK,
    message: 'Viagem solicitada após o PRAZO limite de gozo de férias.',
  },
  'FER_006': {
    code: 'FER_006',
    severity: PolicySeverity.WARNING,
    message: 'Quantidade de dias solicitada diverge do PROGR_DIAS planejado no RM.',
  },

  // Regras Híbridas (Combined)
  'COM_001': {
    code: 'COM_001',
    severity: PolicySeverity.BLOCK,
    message: 'Inconformidade crítica detectada no cruzamento de Folga + Férias.',
  },

  // Regras Gerais
  'GEN_001': {
    code: 'GEN_001',
    severity: PolicySeverity.INFO,
    message: 'Dados sincronizados com sucesso dos sistemas oficiais.',
  },
};
