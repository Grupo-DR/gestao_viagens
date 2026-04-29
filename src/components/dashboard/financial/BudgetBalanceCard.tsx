// ============================================================
// PRESENTATION — BudgetBalanceCard
// Exibe budget total, saldo disponível e barra de consumo.
// ============================================================

import React from 'react';
import { Wallet, Plane, Bus, ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { FinancialOverviewSummary, FinancialStatus } from '../../../application/use-cases/buildFinancialOverview';
import { formatCurrencyBRL, formatPercentBR } from '../../../domain/financial/financialMetrics';

interface Props {
  summary: FinancialOverviewSummary;
}

const STATUS_CONFIG: Record<FinancialStatus, { label: string; text: string; bg: string; border: string }> = {
  healthy: { label: 'Saudável', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  attention: { label: 'Atenção', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  critical: { label: 'Crítico', text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
  no_budget: { label: 'Sem Budget', text: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' },
};

export const BudgetBalanceCard: React.FC<Props> = ({ summary }) => {
  const { 
    totalBudget, 
    totalAvailable, 
    consumptionPercent,
    airBudgetAmount,
    airAmount,
    airAvailableAmount,
    airConsumptionPercent,
    airStatus,
    groundBudgetAmount,
    groundAmount,
    groundAvailableAmount,
    groundConsumptionPercent,
    groundStatus
  } = summary;

  const pct = consumptionPercent ?? 0;
  const isOver = pct > 1;
  const isAttention = pct >= 0.8 && !isOver;
  const barWidth = `${Math.min(pct * 100, 100)}%`;

  const barColor = isOver ? 'bg-red-500' : isAttention ? 'bg-amber-500' : 'bg-emerald-500';
  const balanceColor = totalAvailable < 0 ? 'text-red-600' : 'text-emerald-600';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col h-full xl:h-[410px]">
      {/* Header & Global Info - Empilhados para caber na largura reduzida */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-50 rounded-xl">
            <CreditCard className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Orçamento Global</p>
            <p className="text-lg font-black text-slate-900 leading-none mt-0.5 tabular-nums">
              {formatCurrencyBRL(totalBudget)}
            </p>
          </div>
        </div>
        
        <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Saldo Disponível</p>
              <p className={cn("text-sm font-black tabular-nums leading-none", balanceColor)}>
                {formatCurrencyBRL(totalAvailable)}
              </p>
            </div>
            <div className={cn("px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase", totalAvailable < 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600')}>
               {totalAvailable < 0 ? 'Excedido' : 'Em Dia'}
            </div>
        </div>
      </div>

      {/* Barra de consumo global */}
      <div className="space-y-1.5 mb-8">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Consumo Geral</span>
          <span className={cn('text-[10px] font-black tabular-nums', isOver ? 'text-red-600' : isAttention ? 'text-amber-600' : 'text-slate-700')}>
            {consumptionPercent !== null ? formatPercentBR(consumptionPercent) : '—'}
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full transition-all duration-500', barColor)} style={{ width: barWidth }} />
        </div>
      </div>

      {/* Grid de Análise por Modal - Empilhados na mesma coluna */}
      <div className="grid grid-cols-1 gap-3 mb-auto">
        {/* Aéreo */}
        <div className={cn("p-3.5 rounded-2xl border flex flex-col gap-2.5", STATUS_CONFIG[airStatus].bg, STATUS_CONFIG[airStatus].border)}>
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="p-1 bg-white rounded-lg shadow-sm">
                    <Plane className="w-3 h-3 text-sky-500" />
                 </div>
                 <span className="text-[7px] font-black text-slate-700 uppercase tracking-wider">Aéreo</span>
              </div>
              <span className={cn("text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter", STATUS_CONFIG[airStatus].text, "bg-white/50 border border-current/10")}>
                {STATUS_CONFIG[airStatus].label}
              </span>
           </div>

           <div className="grid grid-cols-3 gap-2">
              <div>
                 <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">Budget</p>
                 <p className="text-[7px] font-black text-slate-700 tabular-nums break-all">{formatCurrencyBRL(airBudgetAmount)}</p>
              </div>
              <div className="text-center">
                 <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">Exec.</p>
                 <p className="text-[7px] font-black text-slate-700 tabular-nums break-all">{formatCurrencyBRL(airAmount)}</p>
              </div>
              <div className="text-right">
                 <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">Saldo</p>
                 <div className={cn("flex items-center justify-end gap-0.5 text-[7px] font-black tabular-nums", airAvailableAmount < 0 ? 'text-red-600' : 'text-emerald-600')}>
                    {formatCurrencyBRL(airAvailableAmount)}
                 </div>
              </div>
           </div>
        </div>

        {/* Rodoviário */}
        <div className={cn("p-3.5 rounded-2xl border flex flex-col gap-2.5", STATUS_CONFIG[groundStatus].bg, STATUS_CONFIG[groundStatus].border)}>
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="p-1 bg-white rounded-lg shadow-sm">
                    <Bus className="w-3 h-3 text-amber-500" />
                 </div>
                 <span className="text-[7px] font-black text-slate-700 uppercase tracking-wider">Rodoviário</span>
              </div>
              <span className={cn("text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter", STATUS_CONFIG[groundStatus].text, "bg-white/50 border border-current/10")}>
                {STATUS_CONFIG[groundStatus].label}
              </span>
           </div>

           <div className="grid grid-cols-3 gap-2">
              <div>
                 <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">Budget</p>
                 <p className="text-[7px] font-black text-slate-700 tabular-nums break-all">{formatCurrencyBRL(groundBudgetAmount)}</p>
              </div>
              <div className="text-center">
                 <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">Exec.</p>
                 <p className="text-[7px] font-black text-slate-700 tabular-nums break-all">{formatCurrencyBRL(groundAmount)}</p>
              </div>
              <div className="text-right">
                 <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">Saldo</p>
                 <div className={cn("flex items-center justify-end gap-0.5 text-[7px] font-black tabular-nums", groundAvailableAmount < 0 ? 'text-red-600' : 'text-emerald-600')}>
                    {formatCurrencyBRL(groundAvailableAmount)}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
