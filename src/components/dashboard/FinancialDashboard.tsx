// ============================================================
// PRESENTATION — FinancialDashboard
// Visão Financeira da Gestão Integrada de Obras.
// Consome buildFinancialOverview para cálculos corretos por CC.
// ============================================================

import React, { useMemo, useState } from 'react';
import { useTravelRequests } from '../../application/hooks/useTravelRequests';
import { useTravelBudgets } from '../../application/hooks/useTravelBudgets';
import { useIdentity } from '../../application/identity/IdentityContext';
import {
  buildFinancialOverview,
  FinancialOverviewFilters,
} from '../../application/use-cases/buildFinancialOverview';
import { buildFinancialInsights } from '../../application/use-cases/buildFinancialInsights';
import { getCostCenterKey } from '../../domain/financial/financialOverviewRules';
import { getAllCostCenters, CostCenterItem } from '../../application/services/costCenterService';
import { UserRole } from '../../domain/enums';
import { IssuedTicketsCard } from './financial/IssuedTicketsCard';
import { ExecutedAmountCard } from './financial/ExecutedAmountCard';
import { BudgetBalanceCard } from './financial/BudgetBalanceCard';
import { ExecutiveInsightsCard } from './financial/ExecutiveInsightsCard';
import { FinancialCostCenterTable } from './financial/FinancialCostCenterTable';
import { Filter, X, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

// ──────────────────────────────────────────────
// Tipos locais de filtro UI
// ──────────────────────────────────────────────

type TransportModeFilter = 'all' | 'aereo' | 'rodoviario';
type FinancialStatusFilter = 'all' | 'healthy' | 'attention' | 'critical' | 'no_budget';

const TRANSPORT_OPTIONS: { value: TransportModeFilter; label: string }[] = [
  { value: 'all', label: 'Todos os Modais' },
  { value: 'aereo', label: 'Aéreo' },
  { value: 'rodoviario', label: 'Rodoviário' },
];

const STATUS_OPTIONS: { value: FinancialStatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'healthy', label: 'Saudável' },
  { value: 'attention', label: 'Atenção' },
  { value: 'critical', label: 'Crítico' },
  { value: 'no_budget', label: 'Sem Orçamento' },
];

// ──────────────────────────────────────────────
// Componente
// ──────────────────────────────────────────────

export const FinancialDashboard: React.FC = () => {
  const { currentUser } = useIdentity();

  const { requests, loading: loadingRequests } = useTravelRequests({
    view: 'all',
    user: currentUser,
  });
  const { budgets, loading: loadingBudgets } = useTravelBudgets();

  const [masterCostCenters, setMasterCostCenters] = useState<CostCenterItem[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(true);

  React.useEffect(() => {
    getAllCostCenters()
      .then(setMasterCostCenters)
      .finally(() => setLoadingMaster(false));
  }, []);

  const now = new Date();
  const [filters, setFilters] = useState<FinancialOverviewFilters>({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    costCenter: undefined,
    transportMode: 'all',
    financialStatus: 'all',
  });

  // ── Construção da lista de CCs disponíveis para filtro ──
  const availableCostCenters = useMemo(() => {
    const map = new Map<string, string>();

    // Preferência: label mais completo entre requests e budgets
    requests.forEach((r) => {
      const key = getCostCenterKey(r.travel.costCenter);
      if (!key) return;
      const existing = map.get(key) ?? '';
      if (r.travel.costCenter.length > existing.length) {
        map.set(key, r.travel.costCenter);
      }
    });

    budgets.forEach((b) => {
      const key = getCostCenterKey(b.costCenter);
      if (!key) return;
      const existing = map.get(key) ?? '';
      if (b.costCenter.length > existing.length) {
        map.set(key, b.costCenter);
      }
    });

    return Array.from(map.values()).sort();
  }, [requests, budgets]);

  // ── Dados calculados ──
  const overviewData = useMemo(
    () =>
      buildFinancialOverview(
        requests,
        budgets,
        filters,
        currentUser?.allowedCostCenters ?? [],
        currentUser?.role ?? UserRole.PENDENTE,
        masterCostCenters
      ),
    [requests, budgets, filters, currentUser, masterCostCenters]
  );

  const insights = useMemo(() => 
    buildFinancialInsights({
      summary: overviewData.summary,
      rows: overviewData.rows,
      filters
    }),
    [overviewData, filters]
  );

  // ── Reset de filtros ──
  const resetFilters = () =>
    setFilters({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      costCenter: undefined,
      transportMode: 'all',
      financialStatus: 'all',
    });

  const isFiltered =
    filters.costCenter !== undefined ||
    filters.transportMode !== 'all' ||
    filters.financialStatus !== 'all';

  if (loadingRequests || loadingBudgets) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
          Consolidando Indicadores Financeiros...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* ── Filtros ─────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2 pr-4 border-r border-slate-100 flex-shrink-0">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
              Filtros
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Ano */}
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: Number(e.target.value) })}
              className="bg-slate-50 border-none rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {/* Mês */}
            <select
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: Number(e.target.value) })}
              className="bg-slate-50 border-none rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(2024, i))}
                </option>
              ))}
            </select>

            {/* Centro de Custo */}
            <select
              value={filters.costCenter ?? ''}
              onChange={(e) =>
                setFilters({ ...filters, costCenter: e.target.value || undefined })
              }
              className="bg-slate-50 border-none rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 min-w-[200px]"
            >
              <option value="">Todos os Centros de Custo</option>
              {availableCostCenters.map((cc) => (
                <option key={cc} value={cc}>{cc}</option>
              ))}
            </select>

            {/* Modal */}
            <select
              value={filters.transportMode ?? 'all'}
              onChange={(e) =>
                setFilters({ ...filters, transportMode: e.target.value as TransportModeFilter })
              }
              className="bg-slate-50 border-none rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              {TRANSPORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Status Financeiro */}
            <select
              value={filters.financialStatus ?? 'all'}
              onChange={(e) =>
                setFilters({ ...filters, financialStatus: e.target.value as FinancialStatusFilter })
              }
              className="bg-slate-50 border-none rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Limpar filtros */}
          <button
            onClick={resetFilters}
            className={cn(
              'text-[10px] font-bold flex items-center gap-1 transition-colors flex-shrink-0',
              isFiltered ? 'text-red-400 hover:text-red-600' : 'text-slate-300 cursor-default'
            )}
            disabled={!isFiltered}
          >
            <X className="w-3 h-3" />
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* ── Cards Executivos (linha 1) ───────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
        <IssuedTicketsCard summary={overviewData.summary} />
        <ExecutedAmountCard summary={overviewData.summary} />
        <BudgetBalanceCard summary={overviewData.summary} />
        <ExecutiveInsightsCard insights={insights} />
      </div>

      {/* ── Tabela principal ────────────────────────────────── */}
      <FinancialCostCenterTable rows={overviewData.rows} />

    </div>
  );
};
