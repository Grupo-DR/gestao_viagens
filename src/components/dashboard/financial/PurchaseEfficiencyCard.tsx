import React from 'react';
import { ShoppingCart, BarChart3, AlertCircle } from 'lucide-react';
import { PurchaseEfficiencyMetric } from '../../../application/use-cases/buildFinancialDashboard';
import { formatCurrencyBRL } from '../../../domain/financial/financialMetrics';
import { cn } from '../../../lib/utils';

interface Props {
  data: PurchaseEfficiencyMetric;
}

export const PurchaseEfficiencyCard: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 rounded-lg">
            <ShoppingCart className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Eficiência de Compra</h3>
            <p className="text-[10px] text-slate-400 font-medium">Economia Realizada no Processo</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded">
            {data.consideredTickets} {data.consideredTickets === 1 ? 'Passagem' : 'Passagens'}
          </span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Orçado</p>
              <p className="text-md font-black text-slate-700">{formatCurrencyBRL(data.quotedAmount)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Pago</p>
              <p className="text-md font-black text-slate-900">{formatCurrencyBRL(data.effectivePurchaseAmount)}</p>
            </div>
          </div>

          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
            <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Economia Gerada</p>
            <p className="text-2xl font-black text-emerald-600">{formatCurrencyBRL(data.savingsAmount)}</p>
          </div>
        </div>

        <div className="flex flex-col justify-end space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-start gap-2">
              <BarChart3 className="w-4 h-4 text-slate-400 mt-0.5" />
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Este indicador compara o preço médio orçado pelo solicitante contra o valor efetivo de emissão da agência.
              </p>
            </div>
          </div>

          {data.ignoredDueToMissingData > 0 && (
            <div className="flex items-center gap-2 text-amber-500 bg-amber-50/50 px-3 py-2 rounded-lg border border-amber-100/50">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-tight">
                {data.ignoredDueToMissingData} registros ignorados por dados incompletos
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
