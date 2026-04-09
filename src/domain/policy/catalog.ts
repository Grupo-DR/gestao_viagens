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
    message: 'Data prevista de folga não localizada no cronograma. Requer validação manual do Capital Humano.',
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
    message: 'Data solicitada está fora do limite permitido para o gozo destas férias.',
  },
  'FER_003': {
    code: 'FER_003',
    severity: PolicySeverity.WARNING,
    message: 'Programação de férias não localizada no sistema de RH. Requer validação manual do Capital Humano.',
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
    message: 'A quantidade de dias solicitada é diferente da que foi planejada para este período.',
  },
  'FER_007': {
    code: 'FER_007',
    severity: PolicySeverity.BLOCK,
    message: 'O colaborador ainda não completou o ciclo de 12 meses necessário para ter direito a férias.',
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
