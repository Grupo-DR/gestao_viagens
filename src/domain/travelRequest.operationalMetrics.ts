import { RequestStatus } from './enums';
import { TravelRequest } from './types';

export type OperationalStageKey =
  | 'human_capital'
  | 'approval'
  | 'available_for_purchase'
  | 'purchase_in_progress';

export type UrgencyFilter = 'all' | 'urgent' | 'non_urgent';

export type OperationalStageMetric = {
  key: OperationalStageKey;
  label: string;
  status: RequestStatus;
  total: number;
  averageHoursInCurrentStage: number | null;
  slaHours: number;
  withinSla: number;
  dueToday: number;
  overdue: number;
  withinSlaPercent: number;
};

export type CycleTimeComparison = {
  urgent: {
    total: number;
    averageCycleHours: number | null;
    averageHumanCapitalHours: number | null;
    averageApprovalHours: number | null;
    averageAvailableForPurchaseHours: number | null;
    averagePurchaseInProgressHours: number | null;
    withinSla: number;
    overdue: number;
    withinSlaPercent: number;
  };
  nonUrgent: {
    total: number;
    averageCycleHours: number | null;
    averageHumanCapitalHours: number | null;
    averageApprovalHours: number | null;
    averageAvailableForPurchaseHours: number | null;
    averagePurchaseInProgressHours: number | null;
    withinSla: number;
    overdue: number;
    withinSlaPercent: number;
  };
};

/**
 * Retorna a data em que a solicitação entrou em um determinado status.
 */
export function getStageEnteredAt(request: TravelRequest, status: RequestStatus): string | null {
  const history = request.audit.history || [];
  const entry = history.find(h => h.status === status);
  return entry ? entry.updatedAt : (request.status === status ? request.audit.createdAt : null);
}

/**
 * Retorna a data em que a solicitação saiu de um determinado status.
 */
export function getStageExitedAt(request: TravelRequest, status: RequestStatus): string | null {
  const history = request.audit.history || [];
  const index = history.findIndex(h => h.status === status);
  if (index === -1 || index === history.length - 1) return null;
  return history[index + 1].updatedAt;
}

/**
 * Calcula as horas que uma solicitação está no status atual.
 */
export function calculateCurrentStageHours(request: TravelRequest, status: RequestStatus, now: Date): number | null {
  if (request.status !== status) return null;
  const enteredAtStr = getStageEnteredAt(request, status);
  if (!enteredAtStr) return null;
  const diffMs = now.getTime() - new Date(enteredAtStr).getTime();
  return Math.max(0, diffMs / (1000 * 60 * 60));
}

/**
 * Calcula as horas que uma solicitação permaneceu em um status já concluído.
 */
export function calculateCompletedStageHours(request: TravelRequest, status: RequestStatus): number | null {
  const enteredAtStr = getStageEnteredAt(request, status);
  const exitedAtStr = getStageExitedAt(request, status);
  if (!enteredAtStr || !exitedAtStr) return null;
  const diffMs = new Date(exitedAtStr).getTime() - new Date(enteredAtStr).getTime();
  return Math.max(0, diffMs / (1000 * 60 * 60));
}

/**
 * Filtra solicitações por competência mensal (mês/ano de criação).
 */
export function filterByOperationalMonth(requests: TravelRequest[], year: number, month: number): TravelRequest[] {
  return requests.filter(r => {
    const date = new Date(r.audit.createdAt);
    return date.getFullYear() === year && (date.getMonth() + 1) === month;
  });
}

/**
 * Filtra solicitações por urgência.
 */
export function filterByUrgency(requests: TravelRequest[], filter: UrgencyFilter): TravelRequest[] {
  if (filter === 'all') return requests;
  return requests.filter(r => filter === 'urgent' ? r.travel.isUrgent : !r.travel.isUrgent);
}

/**
 * Agregador de métricas por etapa.
 */
export function buildOperationalStageMetrics(
  requests: TravelRequest[], 
  now: Date,
  stageConfigs: { key: OperationalStageKey; label: string; status: RequestStatus; slaDays: number }[]
): OperationalStageMetric[] {
  return stageConfigs.map(config => {
    const stageRequests = requests.filter(r => r.status === config.status);
    
    let totalHours = 0;
    let countWithHours = 0;
    let withinSla = 0;
    let dueToday = 0;
    let overdue = 0;

    const slaHours = config.slaDays * 24;

    stageRequests.forEach(r => {
      const hours = calculateCurrentStageHours(r, config.status, now);
      if (hours !== null) {
        totalHours += hours;
        countWithHours++;

        // Cálculo de SLA simplificado para a métrica
        const actualSlaHours = r.travel.isUrgent ? slaHours / 2 : slaHours;
        if (hours > actualSlaHours) {
          overdue++;
        } else if (hours > actualSlaHours - 24) {
          dueToday++;
          withinSla++;
        } else {
          withinSla++;
        }
      }
    });

    return {
      key: config.key,
      label: config.label,
      status: config.status,
      total: stageRequests.length,
      averageHoursInCurrentStage: countWithHours > 0 ? totalHours / countWithHours : null,
      slaHours,
      withinSla,
      dueToday,
      overdue,
      withinSlaPercent: stageRequests.length > 0 ? (withinSla / stageRequests.length) * 100 : 100
    };
  });
}

/**
 * Agregador de comparação de tempo de ciclo.
 */
export function buildCycleTimeComparison(requests: TravelRequest[], now: Date): CycleTimeComparison {
  const getMetrics = (subset: TravelRequest[]) => {
    let cycleTotal = 0;
    let cycleCount = 0;
    let withinSla = 0;
    let overdue = 0;
    
    const stageSum = {
      hc: 0, hcCount: 0,
      app: 0, appCount: 0,
      avail: 0, availCount: 0,
      proc: 0, procCount: 0
    };

    subset.forEach(r => {
      // Ciclo Total
      const endAt = [RequestStatus.EMITIDA, RequestStatus.CONCLUIDA].includes(r.status) 
        ? new Date(r.audit.updatedAt) 
        : now;
      const cycleHours = (endAt.getTime() - new Date(r.audit.createdAt).getTime()) / (1000 * 60 * 60);
      cycleTotal += cycleHours;
      cycleCount++;

      // SLA Global (Simplificado: 4 dias úteis total, 2 se urgente)
      const globalSlaLimit = r.travel.isUrgent ? 48 : 96; 
      if (cycleHours > globalSlaLimit) overdue++;
      else withinSla++;

      // Médias por etapa (considera tanto concluídas quanto atuais)
      const hc = calculateCompletedStageHours(r, RequestStatus.EM_VALIDACAO_CH) || calculateCurrentStageHours(r, RequestStatus.EM_VALIDACAO_CH, now);
      if (hc !== null) { stageSum.hc += hc; stageSum.hcCount++; }

      const app = calculateCompletedStageHours(r, RequestStatus.AGUARDANDO_APROVACAO_COMPRA) || calculateCurrentStageHours(r, RequestStatus.AGUARDANDO_APROVACAO_COMPRA, now);
      if (app !== null) { stageSum.app += app; stageSum.appCount++; }

      const avail = calculateCompletedStageHours(r, RequestStatus.DISPONIVEL_PARA_COMPRA) || calculateCurrentStageHours(r, RequestStatus.DISPONIVEL_PARA_COMPRA, now);
      if (avail !== null) { stageSum.avail += avail; stageSum.availCount++; }

      const proc = calculateCompletedStageHours(r, RequestStatus.EM_PROCESSO_DE_COMPRA) || calculateCurrentStageHours(r, RequestStatus.EM_PROCESSO_DE_COMPRA, now);
      if (proc !== null) { stageSum.proc += proc; stageSum.procCount++; }
    });

    return {
      total: subset.length,
      averageCycleHours: cycleCount > 0 ? cycleTotal / cycleCount : null,
      averageHumanCapitalHours: stageSum.hcCount > 0 ? stageSum.hc / stageSum.hcCount : null,
      averageApprovalHours: stageSum.appCount > 0 ? stageSum.app / stageSum.appCount : null,
      averageAvailableForPurchaseHours: stageSum.availCount > 0 ? stageSum.avail / stageSum.availCount : null,
      averagePurchaseInProgressHours: stageSum.procCount > 0 ? stageSum.proc / stageSum.procCount : null,
      withinSla,
      overdue,
      withinSlaPercent: subset.length > 0 ? (withinSla / subset.length) * 100 : 100
    };
  };

  return {
    urgent: getMetrics(requests.filter(r => r.travel.isUrgent)),
    nonUrgent: getMetrics(requests.filter(r => !r.travel.isUrgent))
  };
}
