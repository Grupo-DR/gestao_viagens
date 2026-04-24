// ============================================================
// PRESENTATION — BudgetAnalysisView
// Exibe o comparativo Orçado vs Realizado por Centro de Custo.
// Dados: cruzamento entre budgets importados e passagens emitidas.
// ============================================================

import React, { useMemo, useState } from 'react';
import {
  TrendingUp, TrendingDown, Minus, Filter, Loader2,
  Plane, Bus, DollarSign, InfoIcon,
} from 'lucide-react';
import {
  computeBudgetComparison,
  consolidateByCostCenter,
  type BudgetComparisonRow,
} from '../../application/services/budgetAnalysis';
import type { TravelBudget, TravelRequest } from '../../domain/types';
import { cn } from '../../lib/utils';

// ──────────────────────────────────────────────
// Constantes
// ──────────────────────────────────────────────

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const PCT = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });

const MONTHS_ORDER = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// ──────────────────────────────────────────────
// Helpers de UI
// ──────────────────────────────────────────────

/** 
 * Retorna classe de cor baseada em quanto do budget foi consumido. 
 * Aplicando princípios de Clean Code: nomes descritivos e lógica centralizada.
 */
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

// ──────────────────────────────────────────────
// Sub-componentes
// ──────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  sub?: string;
}

function SummaryCard({ label, value, icon: Icon, colorClass, bgClass, sub }: SummaryCardProps) {
  return (
    <div className={cn('p-5 rounded-2xl border flex items-center gap-4', bgClass)}>
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm shrink-0', colorClass)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-0.5">{label}</p>
        <p className={cn('text-xl font-black truncate', colorClass)}>{BRL.format(value)}</p>
        {sub && <p className="text-[10px] mt-0.5 opacity-60 font-medium">{sub}</p>}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Linha da tabela
// ──────────────────────────────────────────────

interface AnalysisRowProps {
  row: BudgetComparisonRow;
}

const AnalysisRow: React.FC<AnalysisRowProps> = ({ row }) => {
  const totalColor = getVarianceColor(row.totalReal, row.totalBudget);
  const badgeClass = varianceBadge(row.totalReal, row.totalBudget);

  return (
    <tr className={cn('hover:bg-slate-50/60 transition-colors border-b border-slate-50', badgeClass)}>
      {/* CC */}
      <td className="px-5 py-3 font-mono text-xs font-bold text-slate-800 whitespace-nowrap">
        {row.costCenter}
      </td>

      {/* Aéreo */}
      <td className="px-4 py-3 text-right text-xs text-slate-500">{BRL.format(row.budgetAereo)}</td>
      <td className="px-4 py-3 text-right text-xs font-bold text-slate-800">{BRL.format(row.realAereo)}</td>
      <td className="px-4 py-3 text-right">
        <span className={cn('text-[10px] inline-flex items-center gap-0.5', getVarianceColor(row.realAereo, row.budgetAereo))}>
          <VarianceIcon real={row.realAereo} budget={row.budgetAereo} />
          {row.budgetAereo > 0 ? pctOfBudget(row.realAereo, row.budgetAereo) : '—'}
        </span>
      </td>

      {/* Terrestre */}
      <td className="px-4 py-3 text-right text-xs text-slate-500">{BRL.format(row.budgetTerrestre)}</td>
      <td className="px-4 py-3 text-right text-xs font-bold text-slate-800">{BRL.format(row.realTerrestre)}</td>
      <td className="px-4 py-3 text-right">
        <span className={cn('text-[10px] inline-flex items-center gap-0.5', getVarianceColor(row.realTerrestre, row.budgetTerrestre))}>
          <VarianceIcon real={row.realTerrestre} budget={row.budgetTerrestre} />
          {row.budgetTerrestre > 0 ? pctOfBudget(row.realTerrestre, row.budgetTerrestre) : '—'}
        </span>
      </td>

      {/* Total */}
      <td className="px-4 py-3 text-right text-xs text-slate-500">{BRL.format(row.totalBudget)}</td>
      <td className="px-4 py-3 text-right text-xs font-black text-slate-900">{BRL.format(row.totalReal)}</td>
      <td className="px-4 py-3 text-right">
        <span className={cn('text-xs inline-flex items-center gap-1', totalColor)}>
          <VarianceIcon real={row.totalReal} budget={row.totalBudget} />
          {row.totalBudget > 0 ? pctOfBudget(row.totalReal, row.totalBudget) : '—'}
        </span>
      </td>
    </tr>
  );
};

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface BudgetAnalysisViewProps {
  budgets: TravelBudget[];
  requests: TravelRequest[];
  loadingRequests: boolean;
}

// ──────────────────────────────────────────────
// Componente Principal
// ──────────────────────────────────────────────

export function BudgetAnalysisView({ budgets, requests, loadingRequests }: BudgetAnalysisViewProps) {
  const [filterYear,  setFilterYear]  = useState<number | 'all'>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [groupBy,     setGroupBy]     = useState<'detail' | 'cc'>('cc');

  // ── Derivações ──

  const availableYears = useMemo(
    () => [...new Set(budgets.map(b => b.year))].sort((a, b) => b - a),
    [budgets]
  );

  const filteredBudgets = useMemo(() =>
    budgets
      .filter(b => filterYear  === 'all' || b.year  === filterYear)
      .filter(b => filterMonth === 'all' || b.month === filterMonth),
    [budgets, filterYear, filterMonth]
  );

  const filteredRequests = useMemo(() =>
    requests.filter(r => {
      const depDate = r.travel?.segments?.[0]?.departureDateTime || r.travel?.departureDateTime;
      if (!depDate) return true; // não filtra se não tiver data
      const date = new Date(depDate);
      if (filterYear !== 'all' && date.getFullYear() !== filterYear) return false;
      if (filterMonth !== 'all') {
        const monthNames = MONTHS_ORDER;
        if (monthNames[date.getMonth()] !== filterMonth) return false;
      }
      return true;
    }),
    [requests, filterYear, filterMonth]
  );

  const allRows: BudgetComparisonRow[] = useMemo(
    () => computeBudgetComparison(filteredBudgets, filteredRequests),
    [filteredBudgets, filteredRequests]
  );

  const displayRows: BudgetComparisonRow[] = useMemo(
    () => groupBy === 'cc' ? consolidateByCostCenter(allRows) : allRows,
    [allRows, groupBy]
  );

  // ── Totais para cards de resumo ──
  const totalBudget   = displayRows.reduce((s, r) => s + r.totalBudget, 0);
  const totalReal     = displayRows.reduce((s, r) => s + r.totalReal, 0);
  const totalVar      = totalReal - totalBudget;
  const totalBudgetAereo = displayRows.reduce((s, r) => s + r.budgetAereo, 0);
  const totalRealAereo   = displayRows.reduce((s, r) => s + r.realAereo, 0);
  const totalBudgetTerr  = displayRows.reduce((s, r) => s + r.budgetTerrestre, 0);
  const totalRealTerr    = displayRows.reduce((s, r) => s + r.realTerrestre, 0);

  if (loadingRequests) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
        <p className="text-sm text-slate-400 italic">Carregando passagens emitidas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Aviso se não há budget */}
      {budgets.length === 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-700">
          <InfoIcon className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">
            Nenhum orçamento importado. Acesse a aba <strong>Orçamento</strong> e faça o upload da planilha primeiro.
          </p>
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Orçado Total"
          value={totalBudget}
          icon={DollarSign}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50/60 border-indigo-100"
        />
        <SummaryCard
          label="Realizado Total"
          value={totalReal}
          icon={DollarSign}
          colorClass={totalReal > totalBudget ? 'text-red-600' : 'text-emerald-600'}
          bgClass={totalReal > totalBudget ? 'bg-red-50/60 border-red-100' : 'bg-emerald-50/60 border-emerald-100'}
          sub={totalBudget > 0 ? `${PCT.format(totalReal / totalBudget)} do orçado` : undefined}
        />
        <SummaryCard
          label="Real Aéreo"
          value={totalRealAereo}
          icon={Plane}
          colorClass={totalRealAereo > totalBudgetAereo ? 'text-red-600' : 'text-blue-600'}
          bgClass="bg-blue-50/60 border-blue-100"
          sub={totalBudgetAereo > 0 ? `orçado ${BRL.format(totalBudgetAereo)}` : 'sem orçamento'}
        />
        <SummaryCard
          label="Real Terrestre"
          value={totalRealTerr}
          icon={Bus}
          colorClass={totalRealTerr > totalBudgetTerr ? 'text-red-600' : 'text-emerald-600'}
          bgClass="bg-emerald-50/60 border-emerald-100"
          sub={totalBudgetTerr > 0 ? `orçado ${BRL.format(totalBudgetTerr)}` : 'sem orçamento'}
        />
      </div>

      {/* Barra visual de consumo do budget */}
      {totalBudget > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Consumo do Orçamento
            </span>
            <span className={cn('text-sm font-black', totalVar > 0 ? 'text-red-600' : 'text-emerald-600')}>
              {totalVar > 0 ? '+' : ''}{BRL.format(totalVar)}
              <span className="text-[10px] font-medium ml-1 opacity-70">
                ({totalVar > 0 ? 'acima' : 'abaixo'} do limite)
              </span>
            </span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                totalReal / totalBudget > 1 ? 'bg-red-500' :
                totalReal / totalBudget > 0.85 ? 'bg-amber-400' : 'bg-emerald-500'
              )}
              style={{ width: `${Math.min((totalReal / totalBudget) * 100, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[9px] text-slate-400">R$ 0</span>
            <span className="text-[9px] text-slate-400">{BRL.format(totalBudget)}</span>
          </div>
        </div>
      )}

      {/* Filtros e agrupamentos */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />

        <select
          value={String(filterYear)}
          onChange={e => setFilterYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
        >
          <option value="all">Todos os anos</option>
          {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <select
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
        >
          <option value="all">Todos os meses</option>
          {MONTHS_ORDER.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        {/* Toggle de agrupamento */}
        <div className="ml-auto flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setGroupBy('cc')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all',
              groupBy === 'cc' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            )}
          >
            Por CC
          </button>
          <button
            onClick={() => setGroupBy('detail')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all',
              groupBy === 'detail' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            )}
          >
            Mês a Mês
          </button>
        </div>
      </div>

      {/* Legenda de cores */}
      <div className="flex items-center gap-5 px-1">
        {[
          { color: 'bg-emerald-400', label: '< 85% do orçado' },
          { color: 'bg-amber-400',   label: '85–100%' },
          { color: 'bg-red-500',     label: 'Acima do orçamento' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={cn('w-2.5 h-2.5 rounded-full', l.color)} />
            <span className="text-[10px] text-slate-400 font-medium">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Tabela de análise */}
      {displayRows.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <p className="font-bold text-slate-500 mb-1">Nenhum dado para exibir</p>
          <p className="text-sm">Importe um budget e certifique-se de que há passagens emitidas no período selecionado.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th rowSpan={2} className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest align-bottom">CC</th>

                  {/* Colunas Aéreo */}
                  <th colSpan={3} className="px-4 py-2 text-[9px] font-black text-blue-400 uppercase tracking-widest text-center border-b border-blue-100">
                    ✈ Aéreo
                  </th>
                  {/* Colunas Terrestre */}
                  <th colSpan={3} className="px-4 py-2 text-[9px] font-black text-emerald-500 uppercase tracking-widest text-center border-b border-emerald-100">
                    🚌 Terrestre
                  </th>
                  {/* Colunas Total */}
                  <th colSpan={3} className="px-4 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center border-b border-slate-200">
                    Total
                  </th>
                </tr>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Orçado', 'Realizado', '% Uso'].map(h => (
                    <th key={`a-${h}`} className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">{h}</th>
                  ))}
                  {['Orçado', 'Realizado', '% Uso'].map(h => (
                    <th key={`t-${h}`} className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">{h}</th>
                  ))}
                  {['Orçado', 'Realizado', '% Uso'].map(h => (
                    <th key={`g-${h}`} className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row: BudgetComparisonRow, i: number) => (
                  <AnalysisRow key={`${row.costCenter}-${row.month}-${i}`} row={row} />
                ))}
              </tbody>

              {/* Linha de totais */}
              <tfoot>
                <tr className="bg-indigo-50/50 border-t-2 border-indigo-100 font-black">
                  <td className="px-5 py-3 text-[9px] font-black text-indigo-600 uppercase tracking-widest">TOTAL</td>
                  <td className="px-4 py-3 text-right text-xs text-slate-500">{BRL.format(totalBudgetAereo)}</td>
                  <td className="px-4 py-3 text-right text-xs text-slate-800">{BRL.format(totalRealAereo)}</td>
                  <td className="px-4 py-3 text-right text-[10px]">{pctOfBudget(totalRealAereo, totalBudgetAereo)}</td>
                  <td className="px-4 py-3 text-right text-xs text-slate-500">{BRL.format(totalBudgetTerr)}</td>
                  <td className="px-4 py-3 text-right text-xs text-slate-800">{BRL.format(totalRealTerr)}</td>
                  <td className="px-4 py-3 text-right text-[10px]">{pctOfBudget(totalRealTerr, totalBudgetTerr)}</td>
                  <td className="px-4 py-3 text-right text-xs text-slate-500">{BRL.format(totalBudget)}</td>
                  <td className="px-4 py-3 text-right text-sm font-black text-indigo-800">{BRL.format(totalReal)}</td>
                  <td className={cn('px-4 py-3 text-right text-xs font-black', totalVar > 0 ? 'text-red-600' : 'text-emerald-600')}>
                    {pctOfBudget(totalReal, totalBudget)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
