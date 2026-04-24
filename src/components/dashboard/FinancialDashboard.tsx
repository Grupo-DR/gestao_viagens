import React, { useMemo, useState } from 'react';
import { useTravelRequests } from '../../application/hooks/useTravelRequests';
import { useTravelBudgets } from '../../application/hooks/useTravelBudgets';
import { useIdentity } from '../../application/identity/IdentityContext';
import { buildFinancialDashboard, FinancialFilters } from '../../application/use-cases/buildFinancialDashboard';
import { BudgetManagementCard } from './financial/BudgetManagementCard';
import { LogisticsMixCard } from './financial/LogisticsMixCard';
import { ControlEfficiencyCard } from './financial/ControlEfficiencyCard';
import { PurchaseEfficiencyCard } from './financial/PurchaseEfficiencyCard';
import { BudgetConsumptionCard } from './financial/BudgetConsumptionCard';
import { BudgetVsRealizedByCostCenterTable } from './financial/BudgetVsRealizedByCostCenterTable';
import { Filter, X, Loader2 } from 'lucide-react';

export const FinancialDashboard: React.FC = () => {
  const { currentUser } = useIdentity();
  const { requests, loading: loadingRequests } = useTravelRequests({ 
    view: 'all', 
    user: currentUser 
  });
  
  const { budgets, loading: loadingBudgets } = useTravelBudgets();

  const now = new Date();
  const [filters, setFilters] = useState<FinancialFilters>({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    costCenter: undefined
  });

  const dashboardData = useMemo(() => 
    buildFinancialDashboard(requests, budgets, filters, currentUser?.allowedCostCenters || []),
    [requests, budgets, filters, currentUser]
  );

  const availableCostCenters = useMemo(() => {
    const ccs = new Set(requests.map(r => r.travel.costCenter));
    return Array.from(ccs).sort();
  }, [requests]);

  if (loadingRequests || loadingBudgets) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Consolidando Indicadores Financeiros...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Filtros Financeiros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2 pr-4 border-r border-slate-100">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Filtros</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 flex-1">
          <select 
            value={filters.year}
            onChange={e => setFilters({ ...filters, year: Number(e.target.value) })}
            className="bg-slate-50 border-none rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <select 
            value={filters.month}
            onChange={e => setFilters({ ...filters, month: Number(e.target.value) })}
            className="bg-slate-50 border-none rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(2024, i))}
              </option>
            ))}
          </select>

          <select 
            value={filters.costCenter || ''}
            onChange={e => setFilters({ ...filters, costCenter: e.target.value || undefined })}
            className="bg-slate-50 border-none rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 min-w-[200px]"
          >
            <option value="">Todos Centros de Custo</option>
            {availableCostCenters.map(cc => <option key={cc} value={cc}>{cc}</option>)}
          </select>
        </div>

        <button 
          onClick={() => setFilters({ year: now.getFullYear(), month: now.getMonth() + 1, costCenter: undefined })}
          className="text-[10px] font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
        >
          <X className="w-3 h-3" />
          Limpar Filtros
        </button>
      </div>

      {/* Linha 1: Cards Executivos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BudgetManagementCard data={dashboardData.budgetManagement} />
        <LogisticsMixCard data={dashboardData.logisticsMix} />
        <ControlEfficiencyCard data={dashboardData.controlEfficiency} />
      </div>

      {/* Linha 2: Cards Analíticos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PurchaseEfficiencyCard data={dashboardData.purchaseEfficiency} />
        <BudgetConsumptionCard data={dashboardData.budgetConsumption} />
      </div>

      {/* Tabela Ampla */}
      <BudgetVsRealizedByCostCenterTable rows={dashboardData.budgetVsRealizedByCostCenter} />

    </div>
  );
};
