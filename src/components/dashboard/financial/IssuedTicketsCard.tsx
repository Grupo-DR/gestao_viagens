// ============================================================
// PRESENTATION — IssuedTicketsCard
// Exibe quantidades de passagens emitidas por modal.
// ============================================================

import React from 'react';
import { Plane, Bus, Ticket, FileWarning, CheckCircle2 } from 'lucide-react';
import { formatPercentBR } from '../../../domain/financial/financialMetrics';
import type { FinancialOverviewSummary } from '../../../application/use-cases/buildFinancialOverview';
import { cn } from '../../../lib/utils';

interface Props {
  summary: FinancialOverviewSummary;
}

export const IssuedTicketsCard: React.FC<Props> = ({ summary }) => {
  const { issuedTotalCount, issuedAirCount, issuedGroundCount, missingPriceCount } = summary;
  const airPct = issuedTotalCount > 0 ? issuedAirCount / issuedTotalCount : 0;
  const groundPct = issuedTotalCount > 0 ? issuedGroundCount / issuedTotalCount : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col h-full xl:h-[410px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-indigo-50 rounded-xl">
          <Ticket className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
            Trechos Emitidos
          </p>
          <p className="text-xl font-black text-slate-900 leading-none mt-0.5">
            {issuedTotalCount}
          </p>
        </div>
      </div>

      {/* Mini Barra de Proporção horizontal */}
      <div className="space-y-2 mb-6">
        <div className="h-1.5 w-full flex rounded-full overflow-hidden bg-slate-100">
          <div 
            className="h-full bg-sky-500 transition-all duration-500" 
            style={{ width: `${airPct * 100}%` }} 
          />
          <div 
            className="h-full bg-amber-500 transition-all duration-500" 
            style={{ width: `${groundPct * 100}%` }} 
          />
        </div>
        <div className="flex justify-between text-[7px] font-black uppercase tracking-tighter">
           <span className="text-sky-500">Aéreo {formatPercentBR(airPct)}</span>
           <span className="text-amber-500">Rodoviário {formatPercentBR(groundPct)}</span>
        </div>
      </div>

      {/* Blocos de Detalhamento */}
      <div className="grid grid-cols-2 gap-3 mb-auto">
        <div className="flex items-center gap-3 bg-sky-50/50 rounded-2xl p-4 border border-sky-100/50">
          <div className="p-1.5 bg-white rounded-xl shadow-sm">
            <Plane className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div>
            <p className="text-[7px] font-bold text-sky-500 uppercase tracking-wider leading-none mb-1">Aéreo</p>
            <p className="text-lg font-black text-sky-700 leading-none">{issuedAirCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-amber-50/50 rounded-2xl p-4 border border-amber-100/50">
          <div className="p-1.5 bg-white rounded-xl shadow-sm">
            <Bus className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div>
            <p className="text-[7px] font-bold text-amber-500 uppercase tracking-wider leading-none mb-1">Rodov.</p>
            <p className="text-lg font-black text-amber-700 leading-none">{issuedGroundCount}</p>
          </div>
        </div>
      </div>

      {/* Alerta de Pendências (Integrado) */}
      <div className="mt-6">
        {missingPriceCount > 0 ? (
          <div className="flex items-start gap-3 bg-rose-50 border border-rose-100 rounded-2xl p-4 animate-pulse">
            <FileWarning className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[9px] font-black text-rose-700 leading-tight">
                {missingPriceCount} trecho{missingPriceCount > 1 ? 'os' : ''} sem cotação
              </p>
              <p className="text-[7px] text-rose-500 font-medium mt-0.5 leading-tight">
                Impactam a confiabilidade do executado
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <p className="text-[9px] font-black text-emerald-700">
              Cotações 100% informadas
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
