import React from 'react';
import { ShieldCheck, ArrowDownRight, Clock, Info } from 'lucide-react';
import { ControlEfficiencyMetric } from '../../../application/use-cases/buildFinancialDashboard';
import { formatCurrencyBRL } from '../../../domain/financial/financialMetrics';
import { cn } from '../../../lib/utils';

interface Props {
  data: ControlEfficiencyMetric;
}

export const ControlEfficiencyCard: React.FC<Props> = ({ data }) => {
  const isSaving = (data.purchaseSavings || 0) >= 0;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Controle & Eficiência</h3>
            <p className="text-[10px] text-slate-400 font-medium">Performance Operacional</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-slate-50 p-4 rounded-xl">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Economia de Compra</p>
          <div className="flex items-center gap-2">
            <p className={cn(
              "text-lg font-black",
              isSaving ? "text-emerald-600" : "text-red-500"
            )}>
              {formatCurrencyBRL(data.purchaseSavings)}
            </p>
            {isSaving && <ArrowDownRight className="w-4 h-4 text-emerald-400" />}
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Pendências CH/ADM</span>
          </div>
          <span className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-black",
            data.pendingAdministrativeCount > 5 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-500"
          )}>
            {data.pendingAdministrativeCount} {data.pendingAdministrativeCount === 1 ? 'fila' : 'filas'}
          </span>
        </div>

        <div className="pt-2">
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border",
            data.status === 'healthy' ? "bg-emerald-50/30 border-emerald-100 text-emerald-700" :
            data.status === 'attention' ? "bg-amber-50/30 border-amber-100 text-amber-700" :
            data.status === 'critical' ? "bg-red-50/30 border-red-100 text-red-700" :
            "bg-slate-50 border-slate-100 text-slate-500"
          )}>
            <Info className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase">
              Status: {
                data.status === 'healthy' ? 'Operação Saudável' :
                data.status === 'attention' ? 'Atenção Necessária' :
                data.status === 'critical' ? 'Risco Financeiro' :
                'Sem orçamento'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
