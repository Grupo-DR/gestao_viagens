import React from 'react';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { BudgetManagementMetric } from '../../../application/use-cases/buildFinancialDashboard';
import { formatCurrencyBRL, formatPercentBR } from '../../../domain/financial/financialMetrics';
import { cn } from '../../../lib/utils';

interface Props {
  data: BudgetManagementMetric;
}

export const BudgetManagementCard: React.FC<Props> = ({ data }) => {
  const isOverBudget = (data.deltaAmount || 0) < 0;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Wallet className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Gestão Orçamentária</h3>
            <p className="text-[10px] text-slate-400 font-medium">Competência Mensal</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Orçado</p>
            <p className="text-lg font-black text-slate-900">
              {data.budgetAmount !== null ? formatCurrencyBRL(data.budgetAmount) : 'Não informado'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Realizado</p>
            <p className="text-lg font-black text-slate-900">
              {data.realizedAmount !== null ? formatCurrencyBRL(data.realizedAmount) : 'Sem realizado'}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Delta</p>
            <div className={cn(
              "flex items-center gap-1 font-black text-sm",
              isOverBudget ? "text-red-500" : "text-emerald-500"
            )}>
              {isOverBudget ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              {formatCurrencyBRL(data.deltaAmount)}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Uso</p>
            <p className="text-sm font-black text-slate-700">
              {data.usagePercent !== null ? formatPercentBR(data.usagePercent) : '—'}
            </p>
          </div>
        </div>

        {data.budgetAmount && (
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-1000",
                  isOverBudget ? "bg-red-500" : "bg-emerald-500"
                )}
                style={{ width: `${Math.min((data.usagePercent || 0) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
