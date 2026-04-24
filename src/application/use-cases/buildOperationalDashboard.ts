import { RequestStatus } from '../../domain/enums';
import { TravelRequest } from '../../domain/types';
import { 
  OperationalStageKey, 
  UrgencyFilter, 
  OperationalStageMetric, 
  CycleTimeComparison,
  filterByOperationalMonth,
  filterByUrgency,
  buildOperationalStageMetrics,
  buildCycleTimeComparison
} from '../../domain/travelRequest.operationalMetrics';
import { calculateSla, SlaInfo } from '../../domain/travelRequest.sla';

export interface DashboardFilters {
  year: number;
  month: number;
  costCenter?: string;
}

export interface OperationalDashboardData {
  metrics: OperationalStageMetric[];
  cycleTime: CycleTimeComparison;
  attentionQueue: {
    request: TravelRequest;
    sla: SlaInfo;
  }[];
}

const STAGE_CONFIGS: { key: OperationalStageKey; label: string; status: RequestStatus; slaDays: number }[] = [
  { key: 'human_capital', label: 'Capital Humano', status: RequestStatus.EM_VALIDACAO_CH, slaDays: 1 },
  { key: 'available_for_purchase', label: 'Disponível p/ Compra', status: RequestStatus.DISPONIVEL_PARA_COMPRA, slaDays: 1 },
  { key: 'purchase_in_progress', label: 'Em Processo de Compra', status: RequestStatus.EM_PROCESSO_DE_COMPRA, slaDays: 1 },
];

/**
 * Agrega dados para o dashboard operacional refatorado.
 */
export function buildOperationalDashboard(
  requests: TravelRequest[],
  filters: DashboardFilters,
  now: Date = new Date()
): OperationalDashboardData {
  // 1. Filtrar por Competência (Ano/Mês)
  let filtered = filterByOperationalMonth(requests, filters.year, filters.month);
  
  if (filters.costCenter) {
    filtered = filtered.filter(r => r.travel.costCenter === filters.costCenter);
  }

  // 2. Calcular Métricas por Etapa Crítica (HC, Disponível, Em Processo)
  const metrics = buildOperationalStageMetrics(filtered, now, STAGE_CONFIGS);

  // 3. Calcular Comparação de Ciclo (Urgentes vs Não Urgentes - Processamento Interno)
  const cycleTime = buildCycleTimeComparison(filtered, now);

  // 4. Fila de Atenção (Considera todas as solicitações abertas, incluindo Aprovação)
  const openStatuses = [
    RequestStatus.EM_VALIDACAO_CH,
    RequestStatus.AGUARDANDO_APROVACAO_COMPRA,
    RequestStatus.DISPONIVEL_PARA_COMPRA,
    RequestStatus.EM_PROCESSO_DE_COMPRA,
    RequestStatus.PENDENTE_CORRECAO,
    RequestStatus.COMPRA_RECUSADA,
  ];
  const attentionQueue = filtered
    .filter(r => openStatuses.includes(r.status))
    .map(r => ({
      request: r,
      sla: calculateSla(r, now)
    }));

  // Ordenação da Fila de Atenção conforme regra
  attentionQueue.sort((a, b) => {
    if (a.sla.isOverdue && !b.sla.isOverdue) return -1;
    if (!a.sla.isOverdue && b.sla.isOverdue) return 1;

    if (a.sla.isDueToday && !b.sla.isDueToday) return -1;
    if (!a.sla.isDueToday && b.sla.isDueToday) return 1;

    if (a.request.travel.isUrgent && !b.request.travel.isUrgent) return -1;
    if (!a.request.travel.isUrgent && b.request.travel.isUrgent) return 1;

    return new Date(a.sla.enteredAt).getTime() - new Date(b.sla.enteredAt).getTime();
  });

  return {
    metrics,
    cycleTime,
    attentionQueue: attentionQueue.slice(0, 50)
  };
}
