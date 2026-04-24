import React from 'react';
import { Target, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { BudgetConsumptionMetric } from '../../../application/use-cases/buildFinancialDashboard';
import { formatCurrencyBRL, formatPercentBR } from '../../../domain/financial/financialMetrics';
import { cn } from '../../../lib/utils';

interface Props {
  data: BudgetConsumptionMetric;
}

export const BudgetConsumptionCard: React.FC<Props> = ({ data }) => {
  const percent = (data.consumptionPercent || 0) * 100;
  const isHealthy = data.status === 'healthy';
  const isAttention = data.status === 'attention';
  const isCritical = data.status === 'critical';

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Target className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Consumo do Orçamento</h3>
            <p className="text-[10px] text-slate-400 font-medium">Capacidade vs Realizado</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-8">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <p className="text-4xl font-black text-slate-900">
              {data.consumptionPercent !== null ? formatPercentBR(data.consumptionPercent) : '—'}
            </p>
            <p className={cn(
              "text-[10px] font-black uppercase tracking-widest",
              isHealthy ? "text-emerald-500" : isAttention ? "text-amber-500" : isCritical ? "text-red-500" : "text-slate-400"
            )}>
              {data.status === 'no_budget' ? 'Orçamento não definido' : 
               isHealthy ? 'Consumo dentro do esperado' : 
               isAttention ? 'Limite de alerta atingido' : 
               'Orçamento excedido'}
            </p>
          </div>
          <div className="text-right pb-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Disponível</p>
            <p className={cn(
              "text-lg font-black",
              (data.availableBudget || 0) < 0 ? "text-red-500" : "text-slate-700"
            )}>
              {formatCurrencyBRL(data.availableBudget)}
            </p>
          </div>
        </div>

        <div className="relative pt-6 pb-2">
          {/* Progress Bar */}
          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div 
              className={cn(
                "h-full transition-all duration-1000",
                isHealthy ? "bg-emerald-500" : isAttention ? "bg-amber-500" : "bg-red-500"
              )}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>

          {/* Alert Markers */}
          <div className="absolute top-0 w-full flex justify-between px-1">
            <div className="text-[8px] font-bold text-slate-400 uppercase">0%</div>
            <div className="absolute left-[80%] border-l-2 border-slate-200 h-10 -top-2 flex flex-col items-center">
              <span className="text-[8px] font-black text-slate-400 bg-white px-1">80%</span>
            </div>
            <div className="text-[8px] font-bold text-slate-400 uppercase">100%</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className={cn(
            "p-2 rounded-lg border text-center transition-all",
            isHealthy ? "bg-emerald-50 border-emerald-100 ring-1 ring-emerald-500" : "bg-white border-slate-50 opacity-40"
          )}>
            <CheckCircle2 className="w-3 h-3 mx-auto mb-1 text-emerald-600" />
            <p className="text-[8px] font-black uppercase text-slate-600">Saudável</p>
          </div>
          <div className={cn(
            "p-2 rounded-lg border text-center transition-all",
            isAttention ? "bg-amber-50 border-amber-100 ring-1 ring-amber-500" : "bg-white border-slate-50 opacity-40"
          )}>
            <AlertTriangle className="w-3 h-3 mx-auto mb-1 text-amber-600" />
            <p className="text-[8px] font-black uppercase text-slate-600">Atenção</p>
          </div>
          <div className={cn(
            "p-2 rounded-lg border text-center transition-all",
            isCritical ? "bg-red-50 border-red-100 ring-1 ring-red-500" : "bg-white border-slate-50 opacity-40"
          )}>
            <ShieldAlert className="w-3 h-3 mx-auto mb-1 text-red-600" />
            <p className="text-[8px] font-black uppercase text-slate-600">Crítico</p>
          </div>
        </div>
      </div>
    </div>
  );
};
