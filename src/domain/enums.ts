// ============================================================
// DOMAIN — Enums
// Única fonte de verdade para strings de status, papéis e motivos.
// Garante segurança de tipos em compile-time e elimina strings mágicas.
// ============================================================

/** Papéis de usuário no sistema */
export enum UserRole {
  MASTER = 'MASTER',             // Super Admin — acesso total + gestão de usuários
  ADMINISTRATIVO = 'ADMINISTRATIVO',
  CAPITAL_HUMANO = 'CAPITAL_HUMANO',
  COMPRADOR = 'COMPRADOR',
  GESTOR = 'GESTOR',
  /** Usuário autenticado mas aguardando ativação pelo MASTER */
  PENDENTE = 'PENDENTE',
}

/** Ciclo de vida de uma solicitação de viagem */
export enum RequestStatus {
  RASCUNHO = 'Rascunho',
  ENVIADA = 'Enviada',
  EM_VALIDACAO_CH = 'Em validação CH',
  PENDENTE_CORRECAO = 'Pendente de correção',
  APROVADA = 'Aprovada',
  REPROVADA = 'Reprovada',
  DISPONIVEL_PARA_COMPRA = 'Disponível para compra',
  EMITIDA = 'Emitida',
  ALTERADA = 'Alterada',
  CANCELADA = 'Cancelada',
  CONCLUIDA = 'Concluída',
}

/** Motivo da viagem — determina se precisa de validação CH */
export enum TravelReason {
  FOLGA = 'Folga',
  FERIAS = 'Férias',
  FOLGA_FERIAS = 'Folga + férias',
  ADMISSAO = 'Admissão',
  DEMISSAO = 'Demissão',
  TREINAMENTO = 'Treinamento',
  VISITA_TECNICA = 'Visita técnica',
  VISITA_OBRA = 'Visita à obra',
}

/** Motivos que exigem validação do Capital Humano */
export const REASONS_REQUIRING_CH_VALIDATION = new Set<TravelReason>([
  TravelReason.FOLGA,
  TravelReason.FERIAS,
  TravelReason.FOLGA_FERIAS,
]);

/** Status do processo de validação CH */
export enum ValidationStatus {
  NAO_APLICAVEL = 'Não aplicável',
  PENDENTE = 'Pendente',
  APROVADA = 'Aprovada',
  REPROVADA = 'Reprovada',
  PENDENTE_CORRECAO = 'Pendente de correção',
}

/** Status do processo de compra */
export enum PurchaseStatus {
  AGUARDANDO = 'Aguardando',
  EM_ANDAMENTO = 'Em andamento',
  EMITIDA = 'Emitida',
  CANCELADA = 'Cancelada',
}

/** Tipo de vínculo empregatício do colaborador (campo Protheus) */
export enum EmploymentStatus {
  ATIVO = 'Ativo',
  DEMITIDO = 'Demitido',
  FERIAS = 'Férias',
  AFASTADO = 'Afastado',
}

/** Classificação do colaborador */
export enum DirectOrIndirect {
  DIRETO = 'Direto',
  INDIRETO = 'Indireto',
}
