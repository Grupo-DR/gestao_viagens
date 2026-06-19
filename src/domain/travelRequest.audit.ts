import { RequestStatus, ValidationStatus, TravelReason } from './enums';
import { TravelRequest } from './types';

/**
 * Retorna a data de solicitação inicial (primeira submissão).
 * Se passou por rascunho, pega a data de envio. Caso contrário, pega a data de criação.
 */
export function getSubmissionDate(request: TravelRequest): string {
  const firstSubmission = request.audit.history?.find(
    (h) => h.status !== RequestStatus.RASCUNHO
  );
  return firstSubmission ? firstSubmission.updatedAt : request.audit.createdAt;
}

export type HrValidationStatus = 'na' | 'pending' | 'approved' | 'rejected';

export interface HrValidationDetails {
  status: HrValidationStatus;
  date?: string;
  label: string;
}

/**
 * Retorna os detalhes de validação do Capital Humano, incluindo status e data do parecer.
 */
export function getHrValidationDetails(request: TravelRequest): HrValidationDetails {
  if (!request.validation.validationRequired) {
    return { status: 'na', label: 'Não aplicável' };
  }

  // 1. Verificação de aprovação (migração para fila de compras)
  const approvalEntry = request.audit.history?.find(
    (h) => h.status === RequestStatus.AGUARDANDO_APROVACAO_COMPRA
  );
  if (approvalEntry) {
    return {
      status: 'approved',
      date: approvalEntry.updatedAt,
      label: 'Aprovada',
    };
  }

  // 2. Verificação de reprovação
  if (request.validation.validationStatus === ValidationStatus.REPROVADA) {
    const rejectionEntry = request.audit.history?.find(
      (h) => h.status === RequestStatus.REPROVADA
    );
    return {
      status: 'rejected',
      date: rejectionEntry?.updatedAt || request.audit.updatedAt,
      label: 'Reprovada',
    };
  }

  // 3. Status atual da solicitação determina se ainda está pendente no CH
  if (request.status === RequestStatus.EM_VALIDACAO_CH) {
    return { status: 'pending', label: 'Pendente' };
  }

  // Caso tenha sido cancelada ou alterada antes de passar pelo CH
  return { status: 'pending', label: 'Pendente' };
}

/**
 * Retorna a data em que a solicitação entrou na fila de compras (Aguardando Aprovação de Compra).
 */
export function getPurchaseQueueDate(request: TravelRequest): string | null {
  const entry = request.audit.history?.find(
    (h) => h.status === RequestStatus.AGUARDANDO_APROVACAO_COMPRA
  );
  if (entry) return entry.updatedAt;

  // Se não precisar de validação CH e já foi enviada, entrou direto na fila de compras na submissão
  if (!request.validation.validationRequired) {
    const isSubmitted = request.status !== RequestStatus.RASCUNHO;
    if (isSubmitted) {
      return getSubmissionDate(request);
    }
  }

  return null;
}

/**
 * Retorna a data em que a compra foi liberada (Disponível para Compra).
 */
export function getPurchaseReleasedDate(request: TravelRequest): string | null {
  const entry = request.audit.history?.find(
    (h) => h.status === RequestStatus.DISPONIVEL_PARA_COMPRA
  );
  if (entry) return entry.updatedAt;
  return null;
}

/**
 * Retorna a data em que a passagem foi emitida (Emitida).
 */
export function getTicketIssuedDate(request: TravelRequest): string | null {
  if (request.purchase?.purchasedAt) {
    return request.purchase.purchasedAt;
  }
  const entry = request.audit.history?.find(
    (h) => h.status === RequestStatus.EMITIDA
  );
  if (entry) return entry.updatedAt;
  return null;
}

/**
 * Calcula e formata o tempo decorrido entre duas datas em dias/horas/minutos.
 */
export function formatDuration(startStr: string, endStr: string): string {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffMs = end.getTime() - start.getTime();
  if (isNaN(diffMs) || diffMs < 0) return '—';

  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 60) {
    return `${diffMins}m`;
  }

  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHrs < 24) {
    const remainingMins = diffMins % 60;
    return `${diffHrs}h ${remainingMins}m`;
  }

  const days = Math.floor(diffHrs / 24);
  const remainingHrs = diffHrs % 24;
  return `${days}d ${remainingHrs}h`;
}

/**
 * Retorna o tempo que a solicitação levou em validação no CH.
 * Se ainda estiver pendente, retorna o tempo decorrido desde a solicitação até 'now'.
 */
export function getHrValidationDuration(
  request: TravelRequest,
  nowIso: string = new Date().toISOString()
): string {
  if (!request.validation.validationRequired) {
    return '—';
  }

  const submissionDate = getSubmissionDate(request);
  const hrDetails = getHrValidationDetails(request);

  if (hrDetails.status === 'approved' || hrDetails.status === 'rejected') {
    if (hrDetails.date) {
      return formatDuration(submissionDate, hrDetails.date);
    }
  }

  // Ainda pendente ou em andamento
  if (request.status === RequestStatus.EM_VALIDACAO_CH) {
    return formatDuration(submissionDate, nowIso);
  }

  return '—';
}

/**
 * Retorna o tempo decorrido da liberação/validação do CH (ou da submissão inicial se não teve CH)
 * até a emissão da passagem.
 * Se ainda estiver pendente de emissão, retorna o tempo desde a liberação até 'now'.
 */
export function getPurchaseDuration(
  request: TravelRequest,
  nowIso: string = new Date().toISOString()
): string {
  // Ponto de início: aprovação do CH se precisava de CH, ou data de submissão se não precisava.
  let startDate: string | null = null;

  if (request.validation.validationRequired) {
    const hrDetails = getHrValidationDetails(request);
    if (hrDetails.status === 'approved' && hrDetails.date) {
      startDate = hrDetails.date;
    }
  } else {
    startDate = getSubmissionDate(request);
  }

  if (!startDate) return '—';

  const issuedDate = getTicketIssuedDate(request);
  if (issuedDate) {
    return formatDuration(startDate, issuedDate);
  }

  // Se ainda estiver na fila de compras (não emitido nem cancelado)
  const activePurchaseStatuses = [
    RequestStatus.AGUARDANDO_APROVACAO_COMPRA,
    RequestStatus.DISPONIVEL_PARA_COMPRA,
    RequestStatus.EM_PROCESSO_DE_COMPRA,
  ];

  if (activePurchaseStatuses.includes(request.status)) {
    return formatDuration(startDate, nowIso);
  }

  return '—';
}

/**
 * Retorna o tempo total decorrido desde a submissão inicial até a emissão ou cancelamento/reprovação.
 * Se ainda estiver em andamento, retorna o tempo decorrido até 'now'.
 */
export function getTotalDuration(
  request: TravelRequest,
  nowIso: string = new Date().toISOString()
): string {
  const submissionDate = getSubmissionDate(request);
  const issuedDate = getTicketIssuedDate(request);
  
  if (issuedDate) {
    return formatDuration(submissionDate, issuedDate);
  }

  // Se foi cancelado ou reprovado definitivamente, o tempo total vai até a última atualização
  const terminalStatuses = [
    RequestStatus.CANCELADA,
    RequestStatus.REPROVADA
  ];

  if (terminalStatuses.includes(request.status)) {
    return formatDuration(submissionDate, request.audit.updatedAt);
  }

  // Se estiver em andamento
  if (request.status !== RequestStatus.RASCUNHO) {
    return formatDuration(submissionDate, nowIso);
  }

  return '—';
}

/**
 * Retorna a diferença em horas (como float) entre duas datas.
 */
export function getDurationInHours(startStr: string, endStr: string): number {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffMs = end.getTime() - start.getTime();
  if (isNaN(diffMs) || diffMs < 0) return 0;
  return diffMs / (1000 * 60 * 60);
}

/**
 * Formata um valor numérico em horas de volta para dias/horas/minutos.
 */
export function formatDurationFromHours(hours: number): string {
  if (hours <= 0 || isNaN(hours)) return '—';
  const totalMins = Math.round(hours * 60);
  if (totalMins < 60) {
    return `${totalMins}m`;
  }
  const hrs = Math.floor(totalMins / 60);
  if (hrs < 24) {
    const remainingMins = totalMins % 60;
    return `${hrs}h ${remainingMins}m`;
  }
  const days = Math.floor(hrs / 24);
  const remainingHrs = hrs % 24;
  return `${days}d ${remainingHrs}h`;
}

/**
 * Retorna as datas de afastamento formatadas se o motivo da viagem for de afastamento (Férias, Folga, Folga + Férias).
 * Caso contrário, retorna '—'.
 */
export function formatLeavePeriod(request: TravelRequest): string {
  const reason = request.travel?.reason;
  const isLeaveReason =
    reason === TravelReason.FERIAS ||
    reason === TravelReason.FOLGA ||
    reason === TravelReason.FOLGA_FERIAS;

  if (!isLeaveReason) return '—';

  const startDate = request.leavePeriod?.leaveStartDate;
  const endDate = request.leavePeriod?.leaveEndDate;

  if (!startDate) return '—';

  const formatDateStr = (str: string) => {
    const parts = str.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return str;
  };

  const startFormatted = formatDateStr(startDate);
  if (!endDate) return startFormatted;

  const endFormatted = formatDateStr(endDate);
  return `${startFormatted} a ${endFormatted}`;
}

export interface PurchasePolicyStatus {
  category: 'VENCIDA' | 'NAO_RECOMENDAVEL' | 'ALTA' | 'MEDIA' | 'IDEAL' | 'REGULAR';
  label: string;
  colorClass: string;
  sub: string;
}

/**
 * Retorna a política de antecedência de compra (Status de Risco) com base nos dias entre a submissão e o voo/partida.
 */
export function getPurchasePolicyStatus(request: TravelRequest): PurchasePolicyStatus {
  let departureStr = request.travel?.departureDateTime;
  if (request.travel?.segments && request.travel.segments.length > 0) {
    const dates = request.travel.segments
      .map(s => s.departureDateTime)
      .filter(Boolean)
      .sort();
    if (dates.length > 0) {
      departureStr = dates[0];
    }
  }

  const submissionStr = getSubmissionDate(request);

  if (!departureStr || !submissionStr) {
    return {
      category: 'REGULAR',
      label: 'Regular',
      colorClass: 'bg-slate-50 text-slate-500 border-slate-100/50',
      sub: '—'
    };
  }

  try {
    const departure = new Date(departureStr.split('T')[0] + 'T00:00:00');
    const submission = new Date(submissionStr.split('T')[0] + 'T00:00:00');
    const days = Math.round((departure.getTime() - submission.getTime()) / (1000 * 60 * 60 * 24));

    if (days < 0) {
      return {
        category: 'VENCIDA',
        label: 'Vencida',
        colorClass: 'bg-red-950 text-red-200 border-red-900/50',
        sub: 'Atrasado'
      };
    } else if (days < 30) {
      return {
        category: 'NAO_RECOMENDAVEL',
        label: 'Não Recomendável',
        colorClass: 'bg-purple-50 text-purple-600 border-purple-100/50',
        sub: 'Urgência Máxima'
      };
    } else if (days >= 30 && days < 45) {
      return {
        category: 'ALTA',
        label: 'Alta Atenção',
        colorClass: 'bg-red-50 text-red-600 border-red-100/50',
        sub: '30-45 dias'
      };
    } else if (days >= 45 && days < 60) {
      return {
        category: 'MEDIA',
        label: 'Média Atenção',
        colorClass: 'bg-orange-50 text-orange-600 border-orange-100/50',
        sub: '45-60 dias'
      };
    } else if (days >= 60 && days <= 90) {
      return {
        category: 'IDEAL',
        label: 'Ideal para Compra',
        colorClass: 'bg-blue-50 text-blue-600 border-blue-100/50',
        sub: '60-90 dias'
      };
    } else {
      return {
        category: 'REGULAR',
        label: 'Regular',
        colorClass: 'bg-slate-50 text-slate-500 border-slate-100/50',
        sub: '> 90 dias'
      };
    }
  } catch {
    return {
      category: 'REGULAR',
      label: 'Regular',
      colorClass: 'bg-slate-50 text-slate-500 border-slate-100/50',
      sub: '—'
    };
  }
}


