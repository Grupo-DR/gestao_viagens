// ============================================================
// PRESENTATION — IssuedTicketsCard
// Exibe quantidades de passagens emitidas por modal.
// ============================================================

import React from 'react';
import { Plane, Bus, Ticket } from 'lucide-react';
import type { FinancialOverviewSummary } from '../../../application/use-cases/buildFinancialOverview';

interface Props {
  summary: FinancialOverviewSummary;
}

export const IssuedTicketsCard: React.FC<Props> = ({ summary }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-indigo-50 rounded-xl">
          <Ticket className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Passagens Emitidas
          </p>
          <p className="text-2xl font-black text-slate-900 leading-none mt-0.5">
            {summary.issuedTotalCount}
          </p>
        </div>
      </div>

      {/* Separador */}
      <div className="h-px bg-slate-50" />

      {/* Split por modal */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2.5 bg-sky-50 rounded-xl p-3">
          <div className="p-1.5 bg-sky-100 rounded-lg">
            <Plane className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-sky-500 uppercase tracking-wider">Aéreo</p>
            <p className="text-lg font-black text-sky-700 leading-none">{summary.issuedAirCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 bg-amber-50 rounded-xl p-3">
          <div className="p-1.5 bg-amber-100 rounded-lg">
            <Bus className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Rodoviário</p>
            <p className="text-lg font-black text-amber-700 leading-none">{summary.issuedGroundCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
