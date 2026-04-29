// ============================================================
// PRESENTATION — ExecutedAmountCard
// Exibe valor executado total com split por modal.
// ============================================================

import React from 'react';
import { DollarSign, Plane, Bus, Info } from 'lucide-react';
import type { FinancialOverviewSummary } from '../../../application/use-cases/buildFinancialOverview';
import { formatCurrencyBRL, formatPercentBR } from '../../../domain/financial/financialMetrics';

interface Props {
  summary: FinancialOverviewSummary;
}

export const ExecutedAmountCard: React.FC<Props> = ({ summary }) => {
  const { totalExecuted, airAmount, groundAmount, averageTicketTotal, averageTicketAir, averageTicketGround } = summary;
  const airPct = totalExecuted > 0 ? airAmount / totalExecuted : 0;
  const groundPct = totalExecuted > 0 ? groundAmount / totalExecuted : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col h-full xl:h-[410px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-emerald-50 rounded-xl">
          <DollarSign className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
            Valor Executado
          </p>
          <p className="text-xl font-black text-slate-900 leading-none mt-0.5 tabular-nums">
            {formatCurrencyBRL(totalExecuted)}
          </p>
        </div>
      </div>

      {/* Ticket Médio Geral - Faixa Discreta */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-xl mb-6">
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Ticket Médio Geral</span>
        <span className="text-base font-black text-slate-700 tabular-nums">
          {formatCurrencyBRL(averageTicketTotal)}
        </span>
      </div>

      {/* Split por modal - Blocos internos */}
      <div className="grid grid-cols-1 gap-4 mb-auto">
        <div className="bg-sky-50/50 rounded-2xl p-4 border border-sky-100/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5 text-sky-500" />
              <p className="text-[8px] font-black text-sky-600 uppercase tracking-wider">Aéreo {formatPercentBR(airPct)}</p>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-lg font-black text-sky-700 tabular-nums leading-none">
              {formatCurrencyBRL(airAmount)}
            </p>
            <div className="text-right">
              <p className="text-[7px] font-bold text-sky-400 uppercase">Ticket Médio</p>
              <p className="text-[9px] font-black text-sky-600 tabular-nums leading-none">
                {formatCurrencyBRL(averageTicketAir)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Bus className="w-3.5 h-3.5 text-amber-500" />
              <p className="text-[8px] font-black text-amber-600 uppercase tracking-wider">Rodoviário {formatPercentBR(groundPct)}</p>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-lg font-black text-amber-700 tabular-nums leading-none">
              {formatCurrencyBRL(groundAmount)}
            </p>
            <div className="text-right">
              <p className="text-[7px] font-bold text-amber-400 uppercase">Ticket Médio</p>
              <p className="text-[9px] font-black text-amber-600 tabular-nums leading-none">
                {formatCurrencyBRL(averageTicketGround)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé do Card */}
      <div className="mt-4 flex items-center gap-2 text-[7px] text-slate-400 font-medium italic">
        <Info className="w-3 h-3" />
        Leitura rápida: aéreo concentra a maior parte do gasto.
      </div>
    </div>
  );
};
