import { RequestStatus } from '../enums';
import { TravelRequest } from '../types';

/**
 * Formata valores para BRL com suporte a valores ausentes.
 * "Sem valor informado" para undefined/null.
 */
export function formatBRL(value: number | undefined | null): string {
  if (value === undefined || value === null) {
    return 'Sem valor informado';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Calcula o gasto realizado (apenas solicitações emitidas).
 */
export function calculateRealized(requests: TravelRequest[]): number {
  return requests
    .filter((r) => r.status === RequestStatus.EMITIDA)
    .reduce((sum, r) => sum + (r.purchase?.price || 0), 0);
}

/**
 * Calcula o gasto comprometido (solicitações em aberto com cotação).
 */
export function calculateCommitted(requests: TravelRequest[]): number {
  const openStatuses = [
    RequestStatus.EM_VALIDACAO_CH,
    RequestStatus.DISPONIVEL_PARA_COMPRA,
    RequestStatus.AGUARDANDO_APROVACAO_COMPRA,
    RequestStatus.EM_PROCESSO_DE_COMPRA,
    RequestStatus.PENDENTE_CORRECAO,
    RequestStatus.COMPRA_RECUSADA,
  ];

  return requests
    .filter((r) => openStatuses.includes(r.status))
    .reduce((sum, r) => {
      const quote = (r.travel.segments || []).reduce(
        (s, seg) => s + (seg.priceQuote || 0),
        0
      );
      return sum + quote;
    }, 0);
}

/**
 * Calcula a variação financeira.
 */
export interface VariationInfo {
  abs: number;
  pct: number;
  status: 'economy' | 'over' | 'neutral';
}

export function calculateVariation(budget: number, realized: number): VariationInfo {
  const abs = budget - realized;
  const pct = budget > 0 ? (realized / budget) - 1 : 0;
  
  let status: 'economy' | 'over' | 'neutral' = 'neutral';
  if (abs > 0) status = 'economy';
  if (abs < 0) status = 'over';

  return { abs: Math.abs(abs), pct: pct * 100, status };
}
