// ============================================================
// DOMAIN — Regras de Negócio (funções puras)
// Sem efeitos colaterais, sem imports de infraestrutura.
// Testável com Vitest/Jest sem mocking.
// ============================================================

import {
  TravelReason,
  RequestStatus,
  UserRole,
  ValidationStatus,
  PurchaseStatus,
  REASONS_REQUIRING_CH_VALIDATION,
} from './enums';
import type {
  TravelRequest,
  LegacyTravelRequest,
  ValidationInfo,
  PurchaseInfo,
  LeavePeriod,
  HistoryEntry,
  PassengerType,
} from './types';

// ──────────────────────────────────────────────
// Regras de validação CH
// ──────────────────────────────────────────────

/**
 * Determina se o motivo da viagem exige validação pelo Capital Humano.
 * Regra de negócio: Folga, Férias e Folga+Férias passam pela fila CH.
 */
export function needsValidation(reason: TravelReason): boolean {
  return REASONS_REQUIRING_CH_VALIDATION.has(reason);
}

/**
 * Determina se o motivo da viagem caracteriza SLA curto e urgência.
 * Regra de negócio pura: Admissão e Demissão possuem prioridade máxima.
 */
export function isUrgentReason(reason: TravelReason): boolean {
  return reason === TravelReason.ADMISSAO || reason === TravelReason.DEMISSAO;
}

/**
 * Determina se a solicitação completa é urgente.
 * Valida a flag manual isUrgent primeiramente. Se não existir, 
 * usa o fallback de SLA baseados apenas no motivo da viagem.
 */
export function isRequestUrgent(request: TravelRequest): boolean {
  const isUrgentFlag = request.travel?.isUrgent;
  if (isUrgentFlag === true) return true;
  return isUrgentReason(request.travel.reason);
}

// ──────────────────────────────────────────────
// Transições de status
// ──────────────────────────────────────────────

/**
 * Calcula o status inicial de uma nova solicitação ao ser enviada.
 * Regras:
 * - Rascunho → sempre RASCUNHO
 * - Passageiro EXTERNO → sempre EM_VALIDACAO_CH (governança obrigatória)
 * - Motivos CH (Folga/Férias) → EM_VALIDACAO_CH
 * - Demais → EM_VALIDACAO_CH (alinhado ao workflow padrão)
 */
export function getInitialStatus(
  reason: TravelReason,
  asDraft: boolean,
  passengerType?: PassengerType
): RequestStatus {
  if (asDraft) return RequestStatus.RASCUNHO;
  // Externos SEMPRE passam pela fila CH para governança do apadrinhamento
  if (passengerType === 'external') return RequestStatus.EM_VALIDACAO_CH;
  return RequestStatus.EM_VALIDACAO_CH;
}

/**
 * Retorna as transições de status permitidas com base no status atual e no papel do usuário.
 * Esta é a única fonte de verdade para botões de ação e validações de serviço.
 */
export function getAvailableTransitions(
  currentStatus: RequestStatus,
  role: UserRole
): RequestStatus[] {
  const transitions: Partial<Record<RequestStatus, { allowed: RequestStatus[]; roles: UserRole[] }>> = {
    [RequestStatus.RASCUNHO]: {
      allowed: [RequestStatus.EM_VALIDACAO_CH, RequestStatus.DISPONIVEL_PARA_COMPRA],
      roles: [UserRole.MASTER, UserRole.ADMINISTRATIVO, UserRole.GESTOR],
    },
    [RequestStatus.PENDENTE_CORRECAO]: {
      allowed: [RequestStatus.EM_VALIDACAO_CH, RequestStatus.DISPONIVEL_PARA_COMPRA],
      roles: [UserRole.MASTER, UserRole.ADMINISTRATIVO, UserRole.GESTOR],
    },
    [RequestStatus.EM_VALIDACAO_CH]: {
      allowed: [RequestStatus.DISPONIVEL_PARA_COMPRA, RequestStatus.REPROVADA, RequestStatus.PENDENTE_CORRECAO],
      roles: [UserRole.MASTER, UserRole.CAPITAL_HUMANO, UserRole.GESTOR, UserRole.COMPRADOR],
    },
    [RequestStatus.DISPONIVEL_PARA_COMPRA]: {
      allowed: [RequestStatus.EMITIDA, RequestStatus.CANCELADA, RequestStatus.PENDENTE_CORRECAO, RequestStatus.AGUARDANDO_APROVACAO_COMPRA, RequestStatus.EM_PROCESSO_DE_COMPRA],
      roles: [UserRole.MASTER, UserRole.COMPRADOR, UserRole.GESTOR],
    },
    [RequestStatus.AGUARDANDO_APROVACAO_COMPRA]: {
      allowed: [RequestStatus.EM_PROCESSO_DE_COMPRA, RequestStatus.COMPRA_RECUSADA, RequestStatus.CANCELADA],
      roles: [UserRole.MASTER, UserRole.GESTOR, UserRole.COMPRADOR],
    },
    [RequestStatus.EM_PROCESSO_DE_COMPRA]: {
      allowed: [RequestStatus.EMITIDA, RequestStatus.CANCELADA],
      roles: [UserRole.MASTER, UserRole.COMPRADOR, UserRole.GESTOR],
    },
    [RequestStatus.COMPRA_RECUSADA]: {
      allowed: [RequestStatus.CANCELADA],
      roles: [UserRole.MASTER, UserRole.COMPRADOR, UserRole.GESTOR],
    },
  };

  const rule = transitions[currentStatus];
  if (!rule || !rule.roles.includes(role)) return [];
  return rule.allowed;
}

/**
 * Verifica se uma transição específica é permitida.
 */
export function canTransitionStatus(
  currentStatus: RequestStatus,
  targetStatus: RequestStatus,
  role: UserRole
): boolean {
  const allowed = getAvailableTransitions(currentStatus, role);
  return allowed.includes(targetStatus);
}

// ──────────────────────────────────────────────
// Permissões de edição
// ──────────────────────────────────────────────

/**
 * Verifica se o usuário pode editar o conteúdo da solicitação.
 * Apenas ADMINISTRATIVO/GESTOR pode editar, e somente em status editáveis.
 */
export function canEditRequest(
  status: RequestStatus,
  role: UserRole
): boolean {
  const editableStatuses: RequestStatus[] = [
    RequestStatus.RASCUNHO,
    RequestStatus.PENDENTE_CORRECAO,
    RequestStatus.REPROVADA, // Permite editar para reenviar após reprova (opcional)
  ];
  const editableRoles: UserRole[] = [UserRole.ADMINISTRATIVO, UserRole.GESTOR];
  return editableStatuses.includes(status) && editableRoles.includes(role);
}

/**
 * Verifica se o usuário pode excluir a solicitação.
 * Só é possível excluir rascunhos.
 */
export function canDeleteRequest(
  status: RequestStatus,
  role: UserRole
): boolean {
  return (
    status === RequestStatus.RASCUNHO &&
    (role === UserRole.ADMINISTRATIVO || role === UserRole.GESTOR)
  );
}

// ──────────────────────────────────────────────
// Utilitários de apresentação (derivados de regras)
// ──────────────────────────────────────────────

/**
 * Retorna as classes CSS de cor para o badge de status.
 * Mantido no domínio pois é derivado diretamente das regras de status.
 */
export function getStatusColor(status: RequestStatus | string): string {
  switch (status) {
    case RequestStatus.RASCUNHO:         return 'bg-slate-100 text-slate-600';
    case RequestStatus.ENVIADA:          return 'bg-blue-100 text-blue-600';
    case RequestStatus.EM_VALIDACAO_CH:  return 'bg-amber-100 text-amber-600';
    case RequestStatus.PENDENTE_CORRECAO: return 'bg-orange-100 text-orange-600';
    case RequestStatus.APROVADA:
    case RequestStatus.DISPONIVEL_PARA_COMPRA: return 'bg-emerald-100 text-emerald-600';
    case RequestStatus.AGUARDANDO_APROVACAO_COMPRA: return 'bg-purple-100 text-purple-600';
    case RequestStatus.EM_PROCESSO_DE_COMPRA: return 'bg-blue-100 text-blue-600';
    case RequestStatus.COMPRA_RECUSADA:
    case RequestStatus.REPROVADA:
    case RequestStatus.CANCELADA:        return 'bg-red-100 text-red-600';
    case RequestStatus.EMITIDA:
    case RequestStatus.CONCLUIDA:        return 'bg-indigo-100 text-indigo-600';
    default:                             return 'bg-slate-100 text-slate-600';
  }
}

/**
 * Retorna o rótulo amigável para o status.
 */
export function getStatusLabel(status: RequestStatus): string {
  switch (status) {
    case RequestStatus.RASCUNHO:               return 'Rascunho';
    case RequestStatus.ENVIADA:                return 'Enviada';
    case RequestStatus.EM_VALIDACAO_CH:        return 'Em Validação CH';
    case RequestStatus.PENDENTE_CORRECAO:      return 'Pendente de Correção';
    case RequestStatus.DISPONIVEL_PARA_COMPRA: return 'Disponível para Compra';
    case RequestStatus.AGUARDANDO_APROVACAO_COMPRA: return 'Aguardando Aprovação de Variação';
    case RequestStatus.EM_PROCESSO_DE_COMPRA:     return 'Em Processo de Compra';
    case RequestStatus.COMPRA_RECUSADA:           return 'Compra Recusada';
    case RequestStatus.REPROVADA:              return 'Reprovada';
    case RequestStatus.CANCELADA:              return 'Cancelada';
    case RequestStatus.EMITIDA:                return 'Bilhete Emitido';
    case RequestStatus.CONCLUIDA:              return 'Concluída';
    default:                                   return status;
  }
}

/**
 * Retorna o rótulo do botão de ação baseado no status de destino.
 */
export function getActionLabel(targetStatus: RequestStatus): string {
  switch (targetStatus) {
    case RequestStatus.EM_VALIDACAO_CH:        return 'Enviar para CH';
    case RequestStatus.DISPONIVEL_PARA_COMPRA: return 'Aprovar / Liberar';
    case RequestStatus.REPROVADA:              return 'Reprovar';
    case RequestStatus.PENDENTE_CORRECAO:      return 'Solicitar Correção';
    case RequestStatus.AGUARDANDO_APROVACAO_COMPRA: return 'Solicitar Aprovação';
    case RequestStatus.EM_PROCESSO_DE_COMPRA:     return 'Liberar para Compra';
    case RequestStatus.COMPRA_RECUSADA:           return 'Recusar Variação';
    case RequestStatus.EMITIDA:                return 'Confirmar Emissão';
    case RequestStatus.CANCELADA:              return 'Cancelar';
    default:                                   return 'Avançar';
  }
}

// ──────────────────────────────────────────────
// Mapeador de compatibilidade (Legado → v2)
// ──────────────────────────────────────────────

/**
 * Converte um documento legado do Firestore para o modelo v2.
 * Garante que solicitações antigas continuem funcionando sem migração de dados.
 * Campos ausentes recebem valores seguros (strings vazias, booleans false, etc.).
 */
export function mapLegacyToTravelRequest(legacy: LegacyTravelRequest): TravelRequest {
  // Normaliza o reason: se vier string, faz cast seguro para enum
  const rawReason = legacy.reason as TravelReason;
  const safeReason = Object.values(TravelReason).includes(rawReason)
    ? rawReason
    : TravelReason.VISITA_TECNICA;

  // Normaliza o status
  const rawStatus = legacy.status as RequestStatus;
  const safeStatus = Object.values(RequestStatus).includes(rawStatus)
    ? rawStatus
    : RequestStatus.RASCUNHO;

  // Monta ValidationInfo baseada no motivo e status legado
  const requiresValidation = needsValidation(safeReason);
  const validationInfo: ValidationInfo = {
    validationRequired: requiresValidation,
    validationStatus: requiresValidation
      ? ValidationStatus.PENDENTE
      : ValidationStatus.NAO_APLICAVEL,
  };

  // Monta PurchaseInfo a partir de purchaseDetails legado
  const purchaseInfo: PurchaseInfo = {
    airline: legacy.purchaseDetails?.airline,
    ticketNumber: legacy.purchaseDetails?.ticketNumber,
    price: legacy.purchaseDetails?.price,
    notes: legacy.purchaseDetails?.notes,
    purchaseStatus: safeStatus === RequestStatus.EMITIDA
      ? PurchaseStatus.EMITIDA
      : PurchaseStatus.AGUARDANDO,
  };

  // Normaliza histórico
  const history: HistoryEntry[] = (legacy.history ?? []).map((h) => ({
    status: (Object.values(RequestStatus).includes(h.status as RequestStatus)
      ? h.status
      : RequestStatus.RASCUNHO) as RequestStatus,
    updatedBy: h.updatedBy ?? 'sistema',
    updatedByRole: UserRole.ADMINISTRATIVO, // Role padrão para legados
    updatedAt: h.updatedAt ?? legacy.createdAt,
    comment: h.comment,
  }));

  // Separa origin/destination do campo legado "route" (Ex: "SP → RJ")
  const routeParts = (legacy.route ?? '').split(/[-→>]/);
  const origin = routeParts[0]?.trim() ?? '';
  const destination = routeParts[1]?.trim() ?? legacy.route ?? '';

  const leavePeriod: LeavePeriod = {};

  return {
    requestId: legacy.id,
    status: safeStatus,
    requester: {
      requesterId: legacy.requesterUid ?? '',
      requesterName: legacy.passengerName ?? '',
      requesterEmail: legacy.requesterEmail ?? '',
      requesterRole: UserRole.ADMINISTRATIVO,
    },
    employee: {
      passengerType: 'internal',
      chapa: '',
      employeeName: legacy.passengerName ?? '',
    },
    travel: {
      reason: safeReason,
      origin,
      destination,
      departureDateTime: legacy.departureDate ?? '',
      returnDateTime: legacy.returnDate,
      baggageRequired: false,
      costCenter: legacy.costCenter ?? '',
      justification: legacy.justification,
    },
    leavePeriod,
    validation: validationInfo,
    purchase: purchaseInfo,
    audit: {
      createdAt: legacy.createdAt ?? new Date().toISOString(),
      updatedAt: legacy.updatedAt ?? new Date().toISOString(),
      createdBy: legacy.requesterEmail ?? '',
      history,
    },
  };
}

/**
 * Retorna o nome de exibição do passageiro.
 * Suporta o union type Passenger (interno ou externo).
 * Cai para requesterName como fallback (dados legados).
 */
export function getPassengerDisplayName(request: TravelRequest): string {
  const { employee } = request;
  if (employee.passengerType === 'external') {
    return employee.fullName || '—';
  }
  return employee.employeeName || request.requester.requesterName || '—';
}

/**
 * Retorna a rota formatada para exibição.
 * Prioriza a lista de segmentos (v3). Se não houver, usa os campos legados (v2).
 */
export function formatRoute(request: TravelRequest): string {
  const { segments, origin, destination } = request.travel;

  // Versão Multitrecho (v3) - Extrai a sequência lógica de cidades
  if (segments && segments.length > 0) {
    const points: string[] = [];
    segments.forEach((seg, index) => {
      // Tenta remover o estado (Ex: "São Paulo - SP" -> "São Paulo") para encurtar a rota na ficha
      const cleanOrigin = seg.origin.split(' - ')[0].split(' / ')[0].trim();
      const cleanDest = seg.destination.split(' - ')[0].split(' / ')[0].trim();
      
      if (index === 0) points.push(cleanOrigin);
      points.push(cleanDest);
    });
    return points.join(' → ');
  }

  // Versão Legada (v2)
  if (origin && destination) return `${origin} → ${destination}`;
  if (destination) return destination;
  return '—';
}
