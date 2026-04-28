// ============================================================
// PRESENTATION — BudgetBalanceCard
// Exibe budget total, saldo disponível e barra de consumo.
// ============================================================

import React from 'react';
import { Wallet } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { FinancialOverviewSummary } from '../../../application/use-cases/buildFinancialOverview';
import { formatCurrencyBRL, formatPercentBR } from '../../../domain/financial/financialMetrics';

interface Props {
  summary: FinancialOverviewSummary;
}

export const BudgetBalanceCard: React.FC<Props> = ({ summary }) => {
  const { totalBudget, totalAvailable, consumptionPercent } = summary;
  const pct = consumptionPercent ?? 0;
  const isOver = pct > 1;
  const isAttention = pct >= 0.8 && !isOver;
  const barWidth = `${Math.min(pct * 100, 100)}%`;

  const barColor = isOver
    ? 'bg-red-500'
    : isAttention
    ? 'bg-amber-500'
    : 'bg-emerald-500';

  const balanceColor = totalAvailable < 0 ? 'text-red-600' : 'text-emerald-600';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-violet-50 rounded-xl">
          <Wallet className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Budget & Saldo
          </p>
          <p className="text-2xl font-black text-slate-900 leading-none mt-0.5 tabular-nums">
            {formatCurrencyBRL(totalBudget)}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">orçamento total</p>
        </div>
      </div>

      {/* Barra de consumo */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Consumo
          </span>
          <span
            className={cn(
              'text-xs font-black tabular-nums',
              isOver ? 'text-red-600' : isAttention ? 'text-amber-600' : 'text-slate-700'
            )}
          >
            {consumptionPercent !== null ? formatPercentBR(consumptionPercent) : '—'}
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', barColor)}
            style={{ width: barWidth }}
          />
        </div>
      </div>

      {/* Saldo */}
      <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
          Saldo Disponível
        </span>
        <span className={cn('text-sm font-black tabular-nums', balanceColor)}>
          {formatCurrencyBRL(totalAvailable)}
        </span>
      </div>
    </div>
  );
};
