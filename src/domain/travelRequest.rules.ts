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

// ──────────────────────────────────────────────
// Transições de status
// ──────────────────────────────────────────────

/**
 * Calcula o status inicial de uma nova solicitação ao ser enviada.
 * - Rascunho → sempre RASCUNHO
 * - Motivos CH → direto para EM_VALIDACAO_CH
 * - Demais → DISPONIVEL_PARA_COMPRA
 */
export function getInitialStatus(
  reason: TravelReason,
  asDraft: boolean
): RequestStatus {
  if (asDraft) return RequestStatus.RASCUNHO;
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
      roles: [UserRole.MASTER, UserRole.CAPITAL_HUMANO, UserRole.GESTOR],
    },
    [RequestStatus.DISPONIVEL_PARA_COMPRA]: {
      allowed: [RequestStatus.EMITIDA, RequestStatus.CANCELADA, RequestStatus.PENDENTE_CORRECAO],
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
 * Retorna o nome de exibição do colaborador: prioriza employeeName,
 * cai para requesterName como fallback (dados legados).
 */
export function getPassengerDisplayName(request: TravelRequest): string {
  return request.employee.employeeName || request.requester.requesterName || '—';
}

/**
 * Retorna a rota formatada para exibição.
 * Prioriza a lista de segmentos (v3). Se não houver, usa os campos legados (v2).
 */
export function formatRoute(request: TravelRequest): string {
  const { segments, origin, destination } = request.travel;

  // Versão Multitrecho (v3)
  if (segments && segments.length > 0) {
    const points: string[] = [];
    segments.forEach((seg, index) => {
      if (index === 0) points.push(seg.origin);
      points.push(seg.destination);
    });
    return points.join(' → ');
  }

  // Versão Legada (v2)
  if (origin && destination) return `${origin} → ${destination}`;
  if (destination) return destination;
  return '—';
}
