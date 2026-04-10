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
  'FOL_003': {
    code: 'FOL_003',
    severity: PolicySeverity.BLOCK,
    message: 'A duração solicitada excede o limite permitido pela política.',
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
    message: 'Solicitação de férias sem programação prévia no RM. Requer atenção do CH.',
  },
  'FER_004': {
    code: 'FER_004',
    severity: PolicySeverity.WARNING,
    message: 'O período solicitado sobrepõe o período de abono (PROGR_ABONO).',
  },
  'FER_005': {
    code: 'FER_005',
    severity: PolicySeverity.BLOCK,
    message: 'A data de início ultrapassa o limite legal para gozo (PRAZO).',
  },
  'FER_006': {
    code: 'FER_006',
    severity: PolicySeverity.BLOCK,
    message: 'Saldo de férias insuficiente para a solicitação.',
  },
  'FER_007': {
    code: 'FER_007',
    severity: PolicySeverity.BLOCK,
    message: 'A duração solicitada diverge da quantidade de dias programada no RM.',
  },
  'FER_008': {
    code: 'FER_008',
    severity: PolicySeverity.BLOCK,
    message: 'A duração solicitada ultrapassa o saldo de dias disponível.',
  },

  // Regras Geográficas
  'GEO_001': {
    code: 'GEO_001',
    severity: PolicySeverity.WARNING,
    message: 'O destino final da solicitação diverge da cidade de residência cadastrada (RM).',
  },

  // Regras Gerais
  'GEN_001': {
    code: 'GEN_001',
    severity: PolicySeverity.INFO,
    message: 'Dados sincronizados com sucesso dos sistemas oficiais.',
  },
};
