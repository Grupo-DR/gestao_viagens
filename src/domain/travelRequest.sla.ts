import { RequestStatus } from './enums';
import { TravelRequest } from './types';

export type SlaStatus = 'within' | 'due_today' | 'overdue' | 'not_applicable';

export interface SlaInfo {
  status: SlaStatus;
  elapsedHours: number;
  limitHours: number;
  remainingHours: number;
  enteredAt: string;
  dueAt: string;
  isOverdue: boolean;
  isDueToday: boolean;
}

const SLA_LIMITS_DAYS: Partial<Record<RequestStatus, number>> = {
  [RequestStatus.EM_VALIDACAO_CH]: 1,
  [RequestStatus.DISPONIVEL_PARA_COMPRA]: 1,
  [RequestStatus.EM_PROCESSO_DE_COMPRA]: 1,
  [RequestStatus.AGUARDANDO_APROVACAO_COMPRA]: 1,
  [RequestStatus.PENDENTE_CORRECAO]: 2,
};

// Horas úteis por dia (assumindo 8h padrão para o cálculo de urgência)
const BUSINESS_HOURS_PER_DAY = 24; // Por enquanto simplificado para dias corridos de 24h conforme solicitado (1 dia útil = 24h de prazo)

/**
 * Calcula o SLA de uma solicitação de viagem.
 */
export function calculateSla(request: TravelRequest, now: Date = new Date()): SlaInfo {
  const currentStatus = request.status;
  const limitDays = SLA_LIMITS_DAYS[currentStatus];

  if (!limitDays) {
    return {
      status: 'not_applicable',
      elapsedHours: 0,
      limitHours: 0,
      remainingHours: 0,
      enteredAt: request.audit.updatedAt,
      dueAt: request.audit.updatedAt,
      isOverdue: false,
      isDueToday: false,
    };
  }

  // Identificar quando entrou no status atual
  const enteredAtStr = getEnteredAt(request);
  const enteredAt = new Date(enteredAtStr);

  // Ajuste de Urgência (50% do prazo)
  let actualLimitDays = limitDays;
  if (request.travel.isUrgent) {
    actualLimitDays = Math.ceil(limitDays / 2);
  }

  const limitHours = actualLimitDays * 24;
  const elapsedMs = now.getTime() - enteredAt.getTime();
  const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));
  
  const dueAt = new Date(enteredAt.getTime() + limitHours * 60 * 60 * 1000);
  const remainingHours = limitHours - elapsedHours;

  const isOverdue = now > dueAt;
  const isDueToday = isSameDay(now, dueAt);

  let status: SlaStatus = 'within';
  if (isOverdue) status = 'overdue';
  else if (isDueToday) status = 'due_today';

  return {
    status,
    elapsedHours,
    limitHours,
    remainingHours,
    enteredAt: enteredAtStr,
    dueAt: dueAt.toISOString(),
    isOverdue,
    isDueToday,
  };
}

function getEnteredAt(request: TravelRequest): string {
  if (request.audit.history && request.audit.history.length > 0) {
    // Pegar a última entrada que define o status atual
    const history = [...request.audit.history].reverse();
    const entry = history.find(h => h.status === request.status);
    if (entry) return entry.updatedAt;
  }
  return request.audit.updatedAt || request.audit.createdAt;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}
