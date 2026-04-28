// ============================================================
// APPLICATION — Use Case — buildFinancialOverview
// Agrega budget e executado por centro de custo normalizado.
// Consome TravelBudget e TravelRequest — sem acesso ao Firestore.
// ============================================================

import type { TravelRequest, TravelBudget } from '../../domain/types';
import {
  getCostCenterKey,
  getCostCenterDisplayLabel,
  getBudgetMonthNumber,
  getFinancialCompetencyDate,
  getRequestTransportMode,
  isFinanciallyExecuted,
  getExecutedAmount,
  getFinancialStatus,
  FinancialStatus,
} from '../../domain/financial/financialOverviewRules';
import { getStaticCostCenterLabel } from '../../domain/financial/costCenterDictionary';
import { UserRole } from '../../domain/enums';

// ──────────────────────────────────────────────
// Tipos Públicos
// ──────────────────────────────────────────────

export type { FinancialStatus };

export type FinancialOverviewFilters = {
  year: number;
  month: number;
  costCenter?: string;
  transportMode?: 'all' | 'aereo' | 'rodoviario';
  financialStatus?: 'all' | 'healthy' | 'attention' | 'critical' | 'no_budget';
};

export type FinancialCostCenterRow = {
  /** Chave técnica normalizada — usada como ID da linha */
  costCenterKey: string;
  /** Código exibível (ex: "3019.03") */
  costCenterCode: string;
  /** Label descritivo completo (ex: "3019.03 MANUT. INFRA NORTE ZAR – TMI") */
  costCenterLabel: string;

  /** Orçamento mensal total consolidado para o CC */
  budgetAmount: number;

  issuedAirCount: number;
  issuedGroundCount: number;
  issuedTotalCount: number;

  airAmount: number;
  groundAmount: number;
  /** Soma dos valores com preço válido */
  executedAmount: number;

  availableAmount: number;
  consumptionPercent: number | null;

  status: FinancialStatus;

  /** Passagens emitidas sem purchase.price válido */
  missingPriceCount: number;
};

export type FinancialOverviewSummary = {
  totalBudget: number;
  totalExecuted: number;
  totalAvailable: number;
  consumptionPercent: number | null;

  issuedAirCount: number;
  issuedGroundCount: number;
  issuedTotalCount: number;

  airAmount: number;
  groundAmount: number;

  healthyCostCenters: number;
  attentionCostCenters: number;
  criticalCostCenters: number;
  noBudgetCostCenters: number;

  missingPriceCount: number;
};

export type FinancialOverviewData = {
  summary: FinancialOverviewSummary;
  rows: FinancialCostCenterRow[];
};

// ──────────────────────────────────────────────
// Helpers internos
// ──────────────────────────────────────────────

/** Cria uma linha vazia para um CC que aparece apenas no budget */
function createEmptyRow(
  ccKey: string,
  ccRawLabel: string,
  budgetAmount: number
): FinancialCostCenterRow {
  return {
    costCenterKey: ccKey,
    costCenterCode: ccRawLabel.split(/[\s-]/)[0] || ccRawLabel,
    costCenterLabel: ccRawLabel,
    budgetAmount,
    issuedAirCount: 0,
    issuedGroundCount: 0,
    issuedTotalCount: 0,
    airAmount: 0,
    groundAmount: 0,
    executedAmount: 0,
    availableAmount: budgetAmount,
    consumptionPercent: budgetAmount > 0 ? 0 : null,
    status: 'healthy',
    missingPriceCount: 0,
  };
}

/** Finaliza o cálculo de uma linha após todas as agregações */
function finalizeRow(row: FinancialCostCenterRow): void {
  row.issuedTotalCount = row.issuedAirCount + row.issuedGroundCount;
  row.executedAmount = row.airAmount + row.groundAmount;
  row.availableAmount = row.budgetAmount - row.executedAmount;
  row.consumptionPercent =
    row.budgetAmount > 0 ? row.executedAmount / row.budgetAmount : null;
  row.status = getFinancialStatus(row.budgetAmount, row.executedAmount);
}

// ──────────────────────────────────────────────
// Use Case Principal
// ──────────────────────────────────────────────

const STATUS_SORT_ORDER: Record<FinancialStatus, number> = {
  no_budget: 0,
  critical: 1,
  attention: 2,
  healthy: 3,
};

export function buildFinancialOverview(
  requests: TravelRequest[],
  budgets: TravelBudget[],
  filters: FinancialOverviewFilters,
  allowedCostCenters: string[],
  userRole: UserRole,
  masterCostCenters: { code: string; label: string }[] = []
): FinancialOverviewData {
  const allowedKeys = allowedCostCenters.map(getCostCenterKey);
  const filterCCKey = filters.costCenter ? getCostCenterKey(filters.costCenter) : undefined;

  // Cria um mapa da lista mestra para busca rápida (chave normalizada -> label completo)
  const masterMap = new Map<string, string>();
  masterCostCenters.forEach(m => {
    const key = getCostCenterKey(m.code);
    if (key) masterMap.set(key, m.label);
  });

  const isFullView = userRole === UserRole.MASTER || userRole === UserRole.CAPITAL_HUMANO;

  const isCCAllowed = (ccKey: string): boolean =>
    isFullView || allowedKeys.includes(ccKey);

  // Helper para obter o melhor label possível (Dicionário > Mestra > DisplayLabel > Raw)
  const getEnrichedLabel = (ccKey: string, currentLabel: string, candidate?: string): string => {
    // 1. Prioridade Máxima: Dicionário Estático (Imagem do Usuário)
    const staticLabel = getStaticCostCenterLabel(ccKey);
    if (staticLabel) return staticLabel;

    // 2. Prioridade Média: Lista Mestra da Integração (RM TOTVS)
    const masterLabel = masterMap.get(ccKey);
    if (masterLabel) return masterLabel;
    
    // 3. Fallback: Dados brutos das solicitações/budgets
    return getCostCenterDisplayLabel([currentLabel, candidate || '']);
  };

  // ── 1. Filtrar e agregar budgets por CC normalizado ──────────
  const ccMap = new Map<string, FinancialCostCenterRow>();

  budgets.forEach((b) => {
    if (b.year !== filters.year) return;
    if (getBudgetMonthNumber(b.month) !== filters.month) return;

    const ccKey = getCostCenterKey(b.costCenter);
    if (!isCCAllowed(ccKey)) return;
    if (filterCCKey && ccKey !== filterCCKey) return;

    const existing = ccMap.get(ccKey);
    if (existing) {
      existing.budgetAmount += Number(b.value) || 0;
      existing.costCenterLabel = getEnrichedLabel(ccKey, existing.costCenterLabel, b.costCenter);
    } else {
      const row = createEmptyRow(ccKey, b.costCenter, Number(b.value) || 0);
      row.costCenterLabel = getEnrichedLabel(ccKey, row.costCenterLabel);
      ccMap.set(ccKey, row);
    }
  });

  // ── 2. Filtrar e agregar requests executadas ─────────────────
  requests.forEach((r) => {
    if (!isFinanciallyExecuted(r)) return;

    const competencyDate = getFinancialCompetencyDate(r);
    if (competencyDate.getFullYear() !== filters.year) return;
    if (competencyDate.getMonth() + 1 !== filters.month) return;

    const ccKey = getCostCenterKey(r.travel.costCenter);
    if (!isCCAllowed(ccKey)) return;
    if (filterCCKey && ccKey !== filterCCKey) return;

    // Garante que a linha existe mesmo sem budget
    if (!ccMap.has(ccKey)) {
      const row = createEmptyRow(ccKey, r.travel.costCenter, 0);
      row.costCenterLabel = getEnrichedLabel(ccKey, row.costCenterLabel);
      ccMap.set(ccKey, row);
    }

    const row = ccMap.get(ccKey)!;

    // Atualiza label com a descrição mais completa
    row.costCenterLabel = getEnrichedLabel(ccKey, row.costCenterLabel, r.travel.costCenter);
    row.costCenterCode = row.costCenterLabel.match(/^[\d.]+/)?.[0] || row.costCenterLabel;

    const mode = getRequestTransportMode(r);
    const amount = getExecutedAmount(r);

    if (mode === 'aereo') {
      row.issuedAirCount += 1;
      if (amount !== null) row.airAmount += amount;
    } else {
      row.issuedGroundCount += 1;
      if (amount !== null) row.groundAmount += amount;
    }

    if (amount === null) {
      row.missingPriceCount += 1;
    }
  });

  // ── 3. Finalizar e calcular métricas de cada linha ───────────
  ccMap.forEach((row) => finalizeRow(row));

  // ── 4. Aplicar filtros de transportMode e financialStatus ────
  let rows = Array.from(ccMap.values());

  if (filters.transportMode && filters.transportMode !== 'all') {
    rows = rows.filter((row) => {
      if (filters.transportMode === 'aereo') return row.issuedAirCount > 0;
      if (filters.transportMode === 'rodoviario') return row.issuedGroundCount > 0;
      return true;
    });
  }

  if (filters.financialStatus && filters.financialStatus !== 'all') {
    rows = rows.filter((row) => row.status === filters.financialStatus);
  }

  // ── 5. Ordenar: no_budget → critical → attention → executado desc ──
  rows.sort((a, b) => {
    const statusDiff = STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status];
    if (statusDiff !== 0) return statusDiff;
    return b.executedAmount - a.executedAmount;
  });

  // ── 6. Calcular summary ──────────────────────────────────────
  const summary = rows.reduce<FinancialOverviewSummary>(
    (acc, row) => {
      acc.totalBudget += row.budgetAmount;
      acc.totalExecuted += row.executedAmount;
      acc.issuedAirCount += row.issuedAirCount;
      acc.issuedGroundCount += row.issuedGroundCount;
      acc.issuedTotalCount += row.issuedTotalCount;
      acc.airAmount += row.airAmount;
      acc.groundAmount += row.groundAmount;
      acc.missingPriceCount += row.missingPriceCount;

      if (row.status === 'healthy') acc.healthyCostCenters += 1;
      else if (row.status === 'attention') acc.attentionCostCenters += 1;
      else if (row.status === 'critical') acc.criticalCostCenters += 1;
      else if (row.status === 'no_budget') acc.noBudgetCostCenters += 1;

      return acc;
    },
    {
      totalBudget: 0,
      totalExecuted: 0,
      totalAvailable: 0,
      consumptionPercent: null,
      issuedAirCount: 0,
      issuedGroundCount: 0,
      issuedTotalCount: 0,
      airAmount: 0,
      groundAmount: 0,
      healthyCostCenters: 0,
      attentionCostCenters: 0,
      criticalCostCenters: 0,
      noBudgetCostCenters: 0,
      missingPriceCount: 0,
    }
  );

  summary.totalAvailable = summary.totalBudget - summary.totalExecuted;
  summary.consumptionPercent =
    summary.totalBudget > 0 ? summary.totalExecuted / summary.totalBudget : null;

  return { summary, rows };
}
