import { TravelRequest } from '../types';
import { Budget } from '../budget/types';
import { RequestStatus } from '../enums';
import { classifyLogisticsType } from './logisticsClassifier';

export type FinancialHealthStatus = 'healthy' | 'attention' | 'critical' | 'empty' | 'no_budget';

/**
 * Calcula o custo efetivo/realizado de uma solicitação.
 * Só considera solicitações Emitidas ou Concluídas.
 */
export function calculateRealizedAmount(request: TravelRequest): number | null {
  const isRealized = request.status === RequestStatus.EMITIDA || request.status === RequestStatus.CONCLUIDA;
  if (!isRealized) return null;

  return request.purchase?.price || null;
}

/**
 * Calcula a economia de compra (Cotação - Preço Efetivo).
 * Retorna null se não houver cotação ou preço de compra.
 */
export function calculatePurchaseSaving(request: TravelRequest): number | null {
  const quoted = getQuotedAmount(request);
  const effective = request.purchase?.price;

  if (quoted === null || effective === undefined || effective === null) return null;

  // Pode ser negativo se a compra foi mais cara que a cotação
  return quoted - effective;
}

/**
 * Soma as cotações iniciais dos trechos.
 */
export function getQuotedAmount(request: TravelRequest): number | null {
  const segments = request.travel.segments || [];
  if (segments.length === 0) return null;

  const sum = segments.reduce((acc, s) => acc + (s.priceQuote || 0), 0);
  return sum > 0 ? sum : null;
}

/**
 * Classifica e soma por tipo de logística.
 */
export function calculateRealizedByLogistics(requests: TravelRequest[]) {
  return requests.reduce((acc, r) => {
    const amount = calculateRealizedAmount(r);
    if (amount === null) return acc;

    const type = classifyLogisticsType(r);
    if (type === 'aereo') acc.air += amount;
    else acc.ground += amount;

    return acc;
  }, { air: 0, ground: 0 });
}

/**
 * Determina o status financeiro com base no consumo.
 */
export function classifyFinancialStatus(realized: number, budget: number | null): FinancialHealthStatus {
  if (budget === null || budget === 0) return 'no_budget';
  if (realized === 0) return 'healthy';

  const percent = realized / budget;
  if (percent > 1) return 'critical';
  if (percent > 0.8) return 'attention';
  return 'healthy';
}

/**
 * Formatação básica para Moeda BRL.
 */
export const formatCurrencyBRL = (value: number | null) => {
  if (value === null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

/**
 * Formatação básica para Percentual.
 */
export const formatPercentBR = (value: number | null) => {
  if (value === null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1 }).format(value);
};
