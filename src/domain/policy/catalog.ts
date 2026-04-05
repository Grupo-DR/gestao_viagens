import { PolicySeverity } from './enums';
import { PolicyRule } from './types';

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
    message: 'Solicitação dentro do período aquisitivo não permitido.',
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

  // Regras Gerais
  'GEN_001': {
    code: 'GEN_001',
    severity: PolicySeverity.INFO,
    message: 'Dados sincronizados com sucesso dos sistemas oficiais.',
  },
};
