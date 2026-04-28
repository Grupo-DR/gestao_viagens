// ============================================================
// PRESENTATION — ExecutedAmountCard
// Exibe valor executado total com split por modal.
// ============================================================

import React from 'react';
import { DollarSign, Plane, Bus } from 'lucide-react';
import type { FinancialOverviewSummary } from '../../../application/use-cases/buildFinancialOverview';
import { formatCurrencyBRL } from '../../../domain/financial/financialMetrics';

interface Props {
  summary: FinancialOverviewSummary;
}

export const ExecutedAmountCard: React.FC<Props> = ({ summary }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-emerald-50 rounded-xl">
          <DollarSign className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Valor Executado
          </p>
          <p className="text-2xl font-black text-slate-900 leading-none mt-0.5 tabular-nums">
            {formatCurrencyBRL(summary.totalExecuted)}
          </p>
        </div>
      </div>

      {/* Separador */}
      <div className="h-px bg-slate-50" />

      {/* Split por modal */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-sky-50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Plane className="w-3 h-3 text-sky-500" />
            <p className="text-[9px] font-bold text-sky-500 uppercase tracking-wider">Aéreo</p>
          </div>
          <p className="text-sm font-black text-sky-700 tabular-nums">
            {formatCurrencyBRL(summary.airAmount)}
          </p>
        </div>

        <div className="bg-amber-50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Bus className="w-3 h-3 text-amber-500" />
            <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Rodoviário</p>
          </div>
          <p className="text-sm font-black text-amber-700 tabular-nums">
            {formatCurrencyBRL(summary.groundAmount)}
          </p>
        </div>
      </div>
    </div>
  );
};
