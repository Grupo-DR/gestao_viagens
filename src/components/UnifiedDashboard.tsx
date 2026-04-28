import React, { useMemo, useState } from 'react';
import { useTravelRequests } from '../application/hooks/useTravelRequests';
import { useTravelBudgets } from '../application/hooks/useTravelBudgets';
import { useIdentity } from '../application/identity/IdentityContext';
import { RequestStatus, UserRole } from '../domain/enums';
import { 
  computeBudgetComparison, 
  consolidateByCostCenter,
  type BudgetComparisonRow 
} from '../application/services/budgetAnalysis';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Clock, Plane, Loader2, 
  ShieldCheck, XCircle, Filter, DollarSign,
  InfoIcon, Minus, ShoppingCart, BarChart3, TableProperties,
  LayoutDashboard, Activity
} from 'lucide-react';
import { cn } from '../lib/utils';
import { OperationalDashboard } from './dashboard/OperationalDashboard';

// ──────────────────────────────────────────────
// Constantes e Tipagem
// ──────────────────────────────────────────────

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const PCT = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });

const MONTHS_ORDER = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1',
];

interface ChartDataPoint {
  name: string;
  value: number;
}

// ──────────────────────────────────────────────
// Helpers de UI
// ──────────────────────────────────────────────

function getVarianceColor(real: number, budget: number): string {
  if (budget === 0) return real > 0 ? 'text-red-600' : 'text-slate-400';
  const pct = real / budget;
  if (pct > 1)    return 'text-red-600 font-black';
  if (pct > 0.85) return 'text-amber-500 font-bold';
  return 'text-emerald-600 font-bold';
}

function varianceBadge(real: number, budget: number): string {
  if (budget === 0) return real > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100';
  const pct = real / budget;
  if (pct > 1)    return 'bg-red-50 border-red-100';
  if (pct > 0.85) return 'bg-amber-50 border-amber-100';
  return 'bg-emerald-50 border-emerald-100';
}

function VarianceIcon({ real, budget }: { real: number; budget: number }) {
  if (budget === 0 || real === 0) return <Minus className="w-3.5 h-3.5 text-slate-300" />;
  return real > budget
    ? <TrendingUp  className="w-3.5 h-3.5 text-red-500" />
    : <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />;
}

function pctOfBudget(real: number, budget: number): string {
  if (budget === 0) return '—';
  return PCT.format(real / budget);
}

function groupByField(items: { value: string }[]): ChartDataPoint[] {
  const map = new Map<string, number>();
  for (const item of items) {
    map.set(item.value, (map.get(item.value) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

// ──────────────────────────────────────────────
// Sub-componentes
// ──────────────────────────────────────────────

interface RichKPIItem {
  label: string;
  value: string | number;
  subValue?: string;
  colorClass?: string;
}

function RichKPICard({ title, icon: Icon, items, bgClass, accentColor }: {
  title: string;
  icon: React.ElementType;
  items: RichKPIItem[];
  bgClass: string;
  accentColor: string;
}) {
  return (
    <div className={cn("p-6 rounded-[2.5rem] border border-black/5 flex flex-col gap-5 shadow-sm transition-all hover:shadow-md hover:border-black/10", bgClass)}>
      <div className="flex items-center justify-between">
        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center bg-white shadow-sm", accentColor)}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {items.map((item, i) => (
          <div key={i} className={cn("min-w-0", items.length === 1 && "sm:col-span-2")}>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 opacity-70">{item.label}</p>
            <p className={cn("text-xl font-black leading-tight truncate", item.colorClass || "text-slate-900")}>
              {item.value}
            </p>
            {item.subValue && (
              <p className="text-[10px] mt-1 font-bold text-slate-400/80 italic">{item.subValue}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const AnalysisRow: React.FC<{ row: BudgetComparisonRow }> = ({ row }) => {
  const totalColor = getVarianceColor(row.totalReal, row.totalBudget);
  const badgeClass = varianceBadge(row.totalReal, row.totalBudget);

  return (
    <tr className={cn('hover:bg-slate-50/60 transition-colors border-b border-slate-50', badgeClass)}>
      <td className="px-4 py-2 font-mono text-[10px] font-bold text-slate-800 whitespace-nowrap">
        {row.costCenter}
      </td>
      <td className="px-3 py-2 text-right text-[10px] text-slate-500">{BRL.format(row.totalBudget)}</td>
      <td className="px-3 py-2 text-right text-[10px] font-black text-slate-900">{BRL.format(row.totalReal)}</td>
      <td className="px-3 py-2 text-right">
        <span className={cn('text-[10px] inline-flex items-center gap-1', totalColor)}>
          <VarianceIcon real={row.totalReal} budget={row.totalBudget} />
          {row.totalBudget > 0 ? pctOfBudget(row.totalReal, row.totalBudget) : '—'}
        </span>
      </td>
    </tr>
  );
};

import { FinancialDashboard } from './dashboard/FinancialDashboard';

// ──────────────────────────────────────────────
// Componente Principal
// ──────────────────────────────────────────────

export function UnifiedDashboard() {
  const { currentUser } = useIdentity();
  const userRole = currentUser?.role;

  const canSeeOperational = 
    userRole === UserRole.MASTER || 
    userRole === UserRole.CAPITAL_HUMANO;

  const [activeTab, setActiveTab] = useState<'operacional' | 'financeiro'>(
    canSeeOperational ? 'operacional' : 'financeiro'
  );

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Portal Gerencial</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">Gestão Integrada de Obras</p>
            </div>
          </div>
        </div>

        {/* Tab Switcher - Apenas exibido se o usuário puder ver ambas as abas */}
        {canSeeOperational && (
          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm w-fit">
            <button
              onClick={() => setActiveTab('operacional')}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                activeTab === 'operacional' 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Activity className="w-4 h-4" />
              Visão Operacional
            </button>
            <button
              onClick={() => setActiveTab('financeiro')}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                activeTab === 'financeiro' 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <DollarSign className="w-4 h-4" />
              Visão Financeira
            </button>
          </div>
        )}
      </div>

      {/* Conteúdo das Abas */}
      <div className="min-h-[600px]">
        {activeTab === 'operacional' ? (
          <OperationalDashboard />
        ) : (
          <FinancialDashboard />
        )}
      </div>
    </div>
  );
}
