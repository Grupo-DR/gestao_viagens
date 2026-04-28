// ============================================================
// PRESENTATION — FinancialStatusCard
// Exibe exclusivamente o alerta de passagens sem cotação.
// ============================================================

import React from 'react';
import { FileWarning, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { FinancialOverviewSummary } from '../../../application/use-cases/buildFinancialOverview';

interface Props {
  summary: FinancialOverviewSummary;
}

export const FinancialStatusCard: React.FC<Props> = ({ summary }) => {
  const { missingPriceCount } = summary;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-center min-h-[160px]">
      {/* Header simplificado */}
      <div className="mb-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Pendências de Cotação
        </p>
      </div>

      {missingPriceCount > 0 ? (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-2xl px-5 py-4 animate-pulse">
          <FileWarning className="w-6 h-6 text-rose-500 flex-shrink-0" />
          <p className="text-[12px] font-bold text-rose-700 leading-tight">
            <span className="text-xl font-black">{missingPriceCount}</span>
            {' '}passagem{missingPriceCount > 1 ? 's' : ''} emitida{missingPriceCount > 1 ? 's' : ''} sem cotação informada
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
          <p className="text-[12px] font-bold text-emerald-700 leading-tight">
            Todas as passagens possuem cotação informada.
          </p>
        </div>
      )}
      
      <p className="text-[9px] text-slate-400 mt-4 font-medium italic">
        * Apenas solicitações com preço impactam o saldo.
      </p>
    </div>
  );
};
