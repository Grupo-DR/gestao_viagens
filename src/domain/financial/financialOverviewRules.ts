// ============================================================
// DOMAIN — Financial Overview Rules
// Helpers puros para a Visão Financeira por Centro de Custo.
// Sem dependências de UI ou infraestrutura.
// ============================================================

import { TravelRequest } from '../types';
import { RequestStatus } from '../enums';

// ──────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────

export type FinancialStatus = 'healthy' | 'attention' | 'critical' | 'no_budget';

// ──────────────────────────────────────────────
// Centro de Custo
// ──────────────────────────────────────────────

/** 
 * Mapa de apelidos para códigos oficiais. 
 * Resolve casos onde a solicitação vem apenas com texto (ex: "COMERCIAL").
 */
const COST_CENTER_ALIASES: Record<string, string> = {
  'COMERCIAL': '103.01',
  'ATIVOS': '3000.01',
  'RH': '104.01',
  'TI': '101.04',
  'SUPRIMENTOS': '106.01',
};

/**
 * Extrai a chave técnica normalizada de um centro de custo.
 * Se houver números, extrai apenas os dígitos. 
 * Se for apenas texto, verifica o mapa de apelidos ou retorna o texto normalizado.
 */
export function getCostCenterKey(value?: string): string {
  if (!value) return '';
  
  const trimmed = value.trim();
  const upper = trimmed.toUpperCase();

  // 1. Verifica se é um apelido conhecido
  if (COST_CENTER_ALIASES[upper]) {
    return COST_CENTER_ALIASES[upper].replace(/[^0-9]/g, '');
  }

  // 2. Tenta extrair o padrão numérico (ex: "3019.03")
  const match = trimmed.match(/^[\d.]+/);
  if (match) {
    return match[0].replace(/[^0-9]/g, '');
  }

  // 3. Fallback para texto puro (ex: "OBRA NOVA")
  return upper.replace(/[\s-]/g, '');
}

/**
 * Seleciona o label mais descritivo dentre uma lista de candidatos.
 * Prefere a string mais longa e não-vazia.
 */
export function getCostCenterDisplayLabel(candidates: string[]): string {
  return candidates
    .filter(Boolean)
    .reduce((best, current) => (current.length > best.length ? current : best), '');
}

// ──────────────────────────────────────────────
// Mapeamento de Meses
// ──────────────────────────────────────────────

const MONTH_NAME_TO_NUMBER: Record<string, number> = {
  janeiro: 1,
  fevereiro: 2,
  marco: 3,
  março: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12,
};

/**
 * Normaliza uma string removendo acentos, espaços e colocando em minúsculas.
 */
function normalizeText(value?: string): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Converte o nome do mês em português para seu número ordinal (1–12).
 * Retorna 0 se não reconhecido.
 *
 * @example
 * getBudgetMonthNumber("Abril")   // 4
 * getBudgetMonthNumber("março")   // 3
 * getBudgetMonthNumber("unknown") // 0
 */
export function getBudgetMonthNumber(month: string): number {
  return MONTH_NAME_TO_NUMBER[normalizeText(month)] ?? 0;
}

// ──────────────────────────────────────────────
// Competência Financeira
// ──────────────────────────────────────────────

/**
 * Determina a data de competência financeira de uma solicitação.
 * Prioridade: purchasedAt → audit.updatedAt → audit.createdAt.
 */
export function getFinancialCompetencyDate(request: TravelRequest): Date {
  const raw =
    request.purchase?.purchasedAt ||
    request.audit?.updatedAt ||
    request.audit?.createdAt;

  return new Date(raw);
}

// ──────────────────────────────────────────────
// Modal de Transporte
// ──────────────────────────────────────────────

/**
 * Classifica a solicitação como aéreo ou rodoviário.
 * Se qualquer trecho for aéreo, a solicitação é classificada como aérea.
 */
export function getRequestTransportMode(request: TravelRequest): 'aereo' | 'rodoviario' {
  const segments = request.travel.segments ?? [];
  const hasAirSegment = segments.some((s) => s.transportMode === 'aereo');
  return hasAirSegment ? 'aereo' : 'rodoviario';
}

// ──────────────────────────────────────────────
// Execução Financeira
// ──────────────────────────────────────────────

/** Statuses que compõem o executado financeiro */
const EXECUTED_STATUSES = new Set<RequestStatus>([
  RequestStatus.EMITIDA,
  RequestStatus.CONCLUIDA,
]);

/**
 * Verifica se uma solicitação deve entrar no executado financeiro.
 */
export function isFinanciallyExecuted(request: TravelRequest): boolean {
  return EXECUTED_STATUSES.has(request.status);
}

/**
 * Retorna o valor executado de uma solicitação baseado na cotação inicial (priceQuote).
 * Retorna null se houver algum trecho sem preço definido (inconsistência).
 */
export function getExecutedAmount(request: TravelRequest): number | null {
  const segments = request.travel.segments ?? [];
  
  if (segments.length === 0) return null;

  let total = 0;
  for (const segment of segments) {
    const price = segment.priceQuote;
    if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
      return null; // Qualquer trecho sem preço invalida o total da solicitação
    }
    total += price;
  }

  return total;
}

// ──────────────────────────────────────────────
// Status Financeiro
// ──────────────────────────────────────────────

/**
 * Classifica o status financeiro de um centro de custo com base no consumo.
 *
 * Regras:
 * - Sem orçamento e com execução → 'no_budget'
 * - Consumo > 100%              → 'critical'
 * - Consumo entre 80% e 100%   → 'attention'
 * - Demais (incluindo 0%)       → 'healthy'
 */
export function getFinancialStatus(
  budgetAmount: number,
  executedAmount: number
): FinancialStatus {
  if (budgetAmount <= 0 && executedAmount > 0) return 'no_budget';

  if (budgetAmount <= 0) return 'healthy';

  const consumption = executedAmount / budgetAmount;

  if (consumption > 1) return 'critical';
  if (consumption >= 0.8) return 'attention';
  return 'healthy';
}
