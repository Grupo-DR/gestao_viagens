// ============================================================
// PRESENTATION — UnifiedDashboard
// O "Dashboard do Administrativo de Obras".
// Une o fluxo operacional (pedidos, status, governança) com
// a análise financeira (orçado vs realizado por CC).
// ============================================================

import React, { useMemo, useState } from 'react';
import { useTravelRequests } from '../application/hooks/useTravelRequests';
import { useTravelBudgets } from '../application/hooks/useTravelBudgets';
import { useIdentity } from '../application/identity/IdentityContext';
import { RequestStatus } from '../domain/enums';
import { PolicyResult } from '../domain/policy/enums';
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
  TrendingUp, TrendingDown, Users, Clock, Plane, Bus, Loader2, 
  AlertCircle, ShieldCheck, ShieldAlert, XCircle, Filter, DollarSign,
  ArrowRight, InfoIcon, Minus, ShoppingCart
} from 'lucide-react';
import { cn } from '../lib/utils';

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
// Helpers de UI (extraídos para manter o componente limpo)
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

// ──────────────────────────────────────────────
// Componente Principal
// ──────────────────────────────────────────────

export function UnifiedDashboard() {
  const { currentUser } = useIdentity();
  const { requests, loading: loadingRequests, error: errorRequests, isDemoMode } = useTravelRequests({ 
    view: 'all',
    user: currentUser 
  });
  const { budgets, loading: loadingBudgets } = useTravelBudgets();

  const [filterYear,  setFilterYear]  = useState<number | 'all'>(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState<string>('all');

  // ── Derivações Operacionais (Geral) ──
  
  const filteredRequests = useMemo(() =>
    requests.filter(r => {
      const depDate = r.travel?.segments?.[0]?.departureDateTime || r.travel?.departureDateTime;
      if (!depDate) return true;
      const date = new Date(depDate);
      if (filterYear !== 'all' && date.getFullYear() !== filterYear) return false;
      if (filterMonth !== 'all' && MONTHS_ORDER[date.getMonth()] !== filterMonth) return false;
      return true;
    }),
    [requests, filterYear, filterMonth]
  );

  const filteredBudgets = useMemo(() =>
    budgets
      .filter(b => filterYear  === 'all' || b.year  === filterYear)
      .filter(b => filterMonth === 'all' || b.month === filterMonth),
    [budgets, filterYear, filterMonth]
  );

  // ── Dados Financeiros ──

  const allRows: BudgetComparisonRow[] = useMemo(
    () => computeBudgetComparison(filteredBudgets, filteredRequests),
    [filteredBudgets, filteredRequests]
  );

  const displayRows = useMemo(() => consolidateByCostCenter(allRows), [allRows]);

  const totalBudget = displayRows.reduce((s, r) => s + r.totalBudget, 0);
  const totalReal   = displayRows.reduce((s, r) => s + r.totalReal, 0);
  const totalVar    = totalReal - totalBudget;

  // ── Totais Detalhados ──

  const totalRealAereo = useMemo(() => 
    allRows.reduce((s, r) => s + r.realAereo, 0),
    [allRows]
  );

  const totalRealTerrestre = useMemo(() => 
    allRows.reduce((s, r) => s + r.realTerrestre, 0),
    [allRows]
  );

  // ── Cálculo Cotação vs Compra ──
  // Apenas para pedidos emitidos que tenham preço de compra registrado
  const purchaseComparison = useMemo(() => {
    let quoted = 0;
    let purchased = 0;
    let count = 0;

    filteredRequests.forEach(r => {
      if (r.status === RequestStatus.EMITIDA && r.purchase?.price) {
        const reqQuoted = (r.travel.segments || []).reduce((sum, s) => sum + (s.priceQuote || 0), 0);
        quoted += reqQuoted;
        purchased += r.purchase.price;
        count++;
      }
    });

    const economy = quoted - purchased;
    return { quoted, purchased, economy, count };
  }, [filteredRequests]);

  // ── Dados para Gráficos e Status ──

  const reasonData: ChartDataPoint[] = useMemo(() => 
    groupByField(filteredRequests.map((r) => ({ value: r.travel.reason }))),
    [filteredRequests]
  );

  const statusData: ChartDataPoint[] = useMemo(() => 
    groupByField(filteredRequests.map((r) => ({ value: r.status }))),
    [filteredRequests]
  );

  const stats = [
    { label: 'Total Pedidos', value: filteredRequests.length, icon: Plane, color: 'bg-blue-500', status: null },
    { label: 'Pendentes CH', value: filteredRequests.filter(r => r.status === RequestStatus.EM_VALIDACAO_CH).length, icon: Clock, color: 'bg-amber-500', status: RequestStatus.EM_VALIDACAO_CH },
    { label: 'Prontas p/ Compra', value: filteredRequests.filter(r => r.status === RequestStatus.DISPONIVEL_PARA_COMPRA).length, icon: ShieldCheck, color: 'bg-emerald-500', status: RequestStatus.DISPONIVEL_PARA_COMPRA },
    { label: 'Emitidas', value: filteredRequests.filter(r => r.status === RequestStatus.EMITIDA).length, icon: TrendingUp, color: 'bg-indigo-500', status: RequestStatus.EMITIDA },
    { label: 'Reprovadas', value: filteredRequests.filter(r => r.status === RequestStatus.REPROVADA).length, icon: XCircle, color: 'bg-red-500', status: RequestStatus.REPROVADA },
  ];

  // ── Dados Financeiros ──

  const availableYears = useMemo(
    () => [...new Set([...budgets.map(b => b.year), ...requests.map(r => new Date(r.travel.departureDateTime).getFullYear())])].sort((a, b) => b - a),
    [budgets, requests]
  );

  // ── Renderização ──

  if (loadingRequests || loadingBudgets) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium italic">Consolidando dados operacionais e financeiros...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* ── Cabeçalho e Filtros ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Dashboard Operacional
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-bold uppercase tracking-widest">Obras</span>
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Visão consolidada de viagens, governança e custos.</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <Filter className="w-4 h-4 text-slate-400 ml-2" />
          <select
            value={String(filterYear)}
            onChange={e => setFilterYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl border-none text-xs font-black text-slate-700 focus:ring-0 outline-none bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <option value="all">Anos</option>
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <select
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="px-3 py-1.5 rounded-xl border-none text-xs font-black text-slate-700 focus:ring-0 outline-none bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <option value="all">Meses</option>
            {MONTHS_ORDER.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* ── KPIs Unificados (Mix Operacional/Financeiro) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <RichKPICard 
          title="Gestão Orçamentária"
          icon={DollarSign}
          bgClass="bg-slate-50/50"
          accentColor="text-slate-600"
          items={[
            { label: 'Orçado no Período', value: BRL.format(totalBudget) },
            { 
              label: 'Realizado (Emitidas)', 
              value: BRL.format(totalReal),
              subValue: totalBudget > 0 ? `${PCT.format(totalReal / totalBudget)} do orçado` : 'sem orçamento',
              colorClass: 'text-indigo-600'
            },
          ]}
        />

        <RichKPICard 
          title="Mix de Logística"
          icon={Plane}
          bgClass="bg-blue-50/30"
          accentColor="text-blue-600"
          items={[
            { 
              label: 'Real Aéreo', 
              value: BRL.format(totalRealAereo),
              subValue: `${PCT.format(totalRealAereo / (totalReal || 1))} do total`,
              colorClass: 'text-blue-600'
            },
            { 
              label: 'Real Terrestre', 
              value: BRL.format(totalRealTerrestre),
              subValue: `${PCT.format(totalRealTerrestre / (totalReal || 1))} do total`,
              colorClass: 'text-emerald-600'
            },
          ]}
        />

        <RichKPICard 
          title="Controle & Eficiência"
          icon={ShieldCheck}
          bgClass="bg-emerald-50/30"
          accentColor="text-emerald-600"
          items={[
            { 
              label: 'Economia Compra', 
              value: BRL.format(purchaseComparison.economy),
              subValue: purchaseComparison.economy > 0 ? "Abaixo da cotação" : "Acima da cotação",
              colorClass: purchaseComparison.economy >= 0 ? 'text-emerald-600' : 'text-red-600'
            },
            { 
              label: 'Pendências CH/Adm', 
              value: filteredRequests.filter(r => [RequestStatus.EM_VALIDACAO_CH, RequestStatus.DISPONIVEL_PARA_COMPRA].includes(r.status)).length,
              subValue: "Aguardando ação",
              colorClass: 'text-amber-600'
            },
          ]}
        />
      </div>

      {/* ── Seção de Eficiência de Compra e Saúde do Orçamento ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comparativo Cotação vs Compra */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between group hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">
                  Eficiência de Compra
                </span>
                <p className="text-xs text-slate-500 font-medium">Cotação Obras vs Preço Real</p>
              </div>
            </div>
            <div className="text-right">
              <span className={cn('text-xl font-black block', purchaseComparison.economy >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                {purchaseComparison.economy >= 0 ? 'Economia de ' : 'Acréscimo de '}{BRL.format(Math.abs(purchaseComparison.economy))}
              </span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">no período selecionado</p>
            </div>
          </div>
          
          <div className="space-y-4">
             <div className="flex items-center gap-4">
               <div className="flex-1 space-y-2">
                 <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   <span>Cotação Estimada</span>
                   <span className="text-slate-900">{BRL.format(purchaseComparison.quoted)}</span>
                 </div>
                 <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-400/30 transition-all duration-1000"
                      style={{ width: '100%' }}
                    />
                 </div>
               </div>
               <div className="w-px h-10 bg-slate-100 hidden sm:block" />
               <div className="flex-1 space-y-2">
                 <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   <span>Compra Efetiva</span>
                   <span className={cn(purchaseComparison.economy >= 0 ? "text-emerald-600" : "text-red-600")}>
                    {BRL.format(purchaseComparison.purchased)}
                   </span>
                 </div>
                 <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-1000", purchaseComparison.economy >= 0 ? "bg-emerald-500" : "bg-red-500")}
                      style={{ width: `${(purchaseComparison.purchased / (purchaseComparison.quoted || 1)) * 100}%` }}
                    />
                 </div>
               </div>
             </div>
             <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
               <InfoIcon className="w-3.5 h-3.5 text-slate-400" />
               <p className="text-[10px] text-slate-500 font-medium">
                 Métrica calculada sobre <strong>{purchaseComparison.count} passagens</strong> com dados de compra completos.
               </p>
             </div>
          </div>
        </div>

        {/* Barra de Saúde Financeira */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between group hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">
                  Consumo do Orçamento
                </span>
                <p className="text-xs text-slate-500 font-medium">Orçado Total vs Gasto Real</p>
              </div>
            </div>
            <div className="text-right">
              <span className={cn('text-xl font-black block', totalVar > 0 ? 'text-red-600' : 'text-emerald-600')}>
                {totalVar > 0 ? '+' : ''}{BRL.format(totalVar)}
              </span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                {totalVar > 0 ? 'acima do limite' : 'disponível no budget'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Percentual de Consumo</span>
                <span className={cn(totalReal / (totalBudget || 1) > 0.85 ? "text-amber-600" : "text-emerald-600")}>
                  {PCT.format(totalReal / (totalBudget || 1))}
                </span>
              </div>
              <div className="h-4 bg-slate-100 rounded-full p-1 border border-slate-200/50 relative overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-1000 flex items-center justify-end px-2',
                    totalReal / (totalBudget || 1) > 1 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]' :
                    totalReal / (totalBudget || 1) > 0.85 ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.4)]' : 
                    'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                  )}
                  style={{ width: `${Math.min((totalReal / (totalBudget || 1)) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between px-1">
               <span className="text-[9px] font-black text-slate-300 uppercase">R$ 0</span>
               <div className="flex items-center gap-4">
                  <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest italic animate-pulse">Aviso: 85%</span>
                  <span className="text-[10px] font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">{BRL.format(totalBudget)}</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Status do Fluxo Operacional ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-2 group hover:border-blue-200 transition-all">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform', stat.color)}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-black text-slate-900 leading-none mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Grid Principal de Análise ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Lado Esquerdo: Tabela Financeira (7 colunas) */}
        <div className="xl:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <TableProperties className="w-4 h-4 text-indigo-500" />
                Orçado vs Realizado por CC
              </h3>
              <span className="text-[10px] font-bold text-slate-400">{displayRows.length} centros de custo</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Centro de Custo</th>
                    <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Orçado</th>
                    <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Realizado</th>
                    <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">% Uso</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400 italic">Nenhum dado financeiro no período.</td>
                    </tr>
                  ) : (
                    displayRows.map((row, i) => <AnalysisRow key={row.costCenter + i} row={row} />)
                  )}
                </tbody>
                {displayRows.length > 0 && (
                  <tfoot className="bg-slate-50/80 font-black">
                    <tr className="border-t-2 border-slate-100">
                      <td className="px-4 py-3 text-[9px] uppercase tracking-widest text-slate-500">Total Acumulado</td>
                      <td className="px-3 py-3 text-right text-[10px] text-slate-500">{BRL.format(totalBudget)}</td>
                      <td className="px-3 py-3 text-right text-[10px] text-indigo-700">{BRL.format(totalReal)}</td>
                      <td className={cn('px-3 py-3 text-right text-[10px]', totalReal > totalBudget ? 'text-red-600' : 'text-emerald-600')}>
                        {pctOfBudget(totalReal, totalBudget)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* Lado Direito: Gráficos e Governança (5 colunas) */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* Gráfico de Motivos */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              Volume por Motivo
            </h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reasonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" fontSize={9} width={80} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de Status */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
             <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2">Distribuição de Status</h3>
             <div className="h-[180px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={70}
                      paddingAngle={5} dataKey="value"
                    >
                      {statusData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <span className="text-2xl font-black text-slate-900">{filteredRequests.length}</span>
                   <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Total</span>
                </div>
             </div>
             <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
                {statusData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-[9px] font-bold text-slate-500 uppercase">{entry.name}</span>
                  </div>
                ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Ícones que faltaram no import do lucide original
import { BarChart3, TableProperties } from 'lucide-react';
