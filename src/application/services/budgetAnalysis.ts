// ============================================================
// APPLICATION — Service — Budget Analysis
// Funções puras para cruzar orçamento importado com
// gastos reais das passagens emitidas.
// Sem dependências React — testável isoladamente.
// ============================================================

import { RequestStatus } from '../../domain/enums';
import type { TravelBudget, TravelRequest } from '../../domain/types';

// ──────────────────────────────────────────────
// Constantes
// ──────────────────────────────────────────────

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const;

// ──────────────────────────────────────────────
// Tipos públicos
// ──────────────────────────────────────────────

export interface BudgetComparisonRow {
  year: number;
  month: string;
  costCenter: string;
  /** Orçamento previsto na planilha */
  budgetAereo: number;
  budgetTerrestre: number;
  /** Gasto real das passagens emitidas */
  realAereo: number;
  realTerrestre: number;
  /** Variação: positivo = estourou orçamento */
  varAereo: number;
  varTerrestre: number;
  totalBudget: number;
  totalReal: number;
  totalVar: number;
}

// ──────────────────────────────────────────────
// Helpers privados
// ──────────────────────────────────────────────

/**
 * Extrai o código numérico do Centro de Custo para permitir
 * comparação flexível entre "3044.01" e "3044.01 - Manutenção".
 */
function normalizeCostCenter(cc: string): string {
  const match = cc.trim().match(/^[\d.]+/);
  return match ? match[0] : cc.trim();
}

/**
 * Converte uma string de data ISO para o nome do mês em português.
 * Usa o array fixo para evitar dependências de locale do ambiente.
 */
function getMonthName(dateStr: string): string {
  try {
    const month = new Date(dateStr).getMonth();
    return MONTH_NAMES[month] ?? '';
  } catch {
    return '';
  }
}

/** Extrai o ano de uma string de data ISO. */
function getYear(dateStr: string): number {
  try {
    return new Date(dateStr).getFullYear();
  } catch {
    return 0;
  }
}

type SpendEntry = { aereo: number; rodoviario: number };
type SpendMap = Map<string, SpendEntry>;

/**
 * Constrói um mapa de gastos reais por chave "Ano|Mês|CC".
 * Considera apenas solicitações com status EMITIDA.
 * Agrega por trecho (segment), usando transportMode para a categoria.
 * Usa a data de partida do trecho para determinar o mês do gasto.
 */
function buildSpendMap(requests: TravelRequest[]): SpendMap {
  const map: SpendMap = new Map();

  for (const req of requests) {
    if (req.status !== RequestStatus.EMITIDA) continue;

    const cc = normalizeCostCenter(req.travel.costCenter);
    const segments = req.travel.segments ?? [];

    for (const seg of segments) {
      const price = seg.priceQuote ?? 0;
      if (!price) continue;

      const depDate = seg.departureDateTime || req.travel.departureDateTime;
      const month = getMonthName(depDate);
      const year = getYear(depDate);
      if (!month || !year) continue;

      const key = `${year}|||${month}|||${cc}`;
      const entry = map.get(key) ?? { aereo: 0, rodoviario: 0 };

      if (seg.transportMode === 'aereo') {
        entry.aereo += price;
      } else {
        entry.rodoviario += price;
      }

      map.set(key, entry);
    }
  }

  return map;
}

/**
 * Constrói um mapa de orçamento por chave "Ano|Mês|CC".
 * Normaliza o costCenter para comparação homogênea.
 */
function buildBudgetMap(budgets: TravelBudget[]): SpendMap {
  const map: SpendMap = new Map();

  for (const b of budgets) {
    const cc = normalizeCostCenter(b.costCenter);
    const key = `${b.year}|||${b.month}|||${cc}`;
    const entry = map.get(key) ?? { aereo: 0, rodoviario: 0 };

    if (b.category === 'aereo') {
      entry.aereo += b.value;
    } else {
      entry.rodoviario += b.value;
    }

    map.set(key, entry);
  }

  return map;
}

// ──────────────────────────────────────────────
// API Pública
// ──────────────────────────────────────────────

/**
 * Cruza orçamento com gastos reais, retornando uma linha por
 * combinação de Ano × Mês × Centro de Custo presente em qualquer
 * uma das duas fontes.
 *
 * Ordenação: Ano DESC → Mês ASC → CC ASC.
 */
export function computeBudgetComparison(
  budgets: TravelBudget[],
  requests: TravelRequest[]
): BudgetComparisonRow[] {
  const budgetMap = buildBudgetMap(budgets);
  const spendMap  = buildSpendMap(requests);

  const allKeys = new Set([...budgetMap.keys(), ...spendMap.keys()]);
  const rows: BudgetComparisonRow[] = [];

  for (const key of allKeys) {
    const [year, month, costCenter] = key.split('|||');

    const budget = budgetMap.get(key) ?? { aereo: 0, rodoviario: 0 };
    const real   = spendMap.get(key)  ?? { aereo: 0, rodoviario: 0 };

    const totalBudget = budget.aereo + budget.rodoviario;
    const totalReal   = real.aereo   + real.rodoviario;

    rows.push({
      year:             Number(year),
      month:            month ?? '',
      costCenter:       costCenter ?? '',
      budgetAereo:      budget.aereo,
      budgetTerrestre:  budget.rodoviario,
      realAereo:        real.aereo,
      realTerrestre:    real.rodoviario,
      varAereo:         real.aereo      - budget.aereo,
      varTerrestre:     real.rodoviario - budget.rodoviario,
      totalBudget,
      totalReal,
      totalVar:         totalReal - totalBudget,
    });
  }

  return rows.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    const mA = MONTH_NAMES.indexOf(a.month as typeof MONTH_NAMES[number]);
    const mB = MONTH_NAMES.indexOf(b.month as typeof MONTH_NAMES[number]);
    if (mA !== mB) return mA - mB;
    return a.costCenter.localeCompare(b.costCenter);
  });
}

/**
 * Consolida as linhas por Centro de Custo (ignorando mês/ano),
 * útil para a visão anual de cada CC.
 */
export function consolidateByCostCenter(
  rows: BudgetComparisonRow[]
): BudgetComparisonRow[] {
  const map = new Map<string, BudgetComparisonRow>();

  for (const row of rows) {
    const existing = map.get(row.costCenter);
    if (!existing) {
      map.set(row.costCenter, { ...row, year: 0, month: 'Acumulado' });
      continue;
    }
    existing.budgetAereo     += row.budgetAereo;
    existing.budgetTerrestre += row.budgetTerrestre;
    existing.realAereo       += row.realAereo;
    existing.realTerrestre   += row.realTerrestre;
    existing.varAereo        += row.varAereo;
    existing.varTerrestre    += row.varTerrestre;
    existing.totalBudget     += row.totalBudget;
    existing.totalReal       += row.totalReal;
    existing.totalVar        += row.totalVar;
  }

  return [...map.values()].sort((a, b) =>
    a.costCenter.localeCompare(b.costCenter)
  );
}
