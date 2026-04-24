import React from 'react';
import { BudgetVsRealizedByCostCenterRow } from '../../../application/use-cases/buildFinancialDashboard';
import { formatCurrencyBRL } from '../../../domain/financial/financialMetrics';
import { cn } from '../../../lib/utils';
import { Building2, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';

interface Props {
  rows: BudgetVsRealizedByCostCenterRow[];
}

export const BudgetVsRealizedByCostCenterTable: React.FC<Props> = ({ rows }) => {
  const totals = rows.reduce((acc, row) => ({
    budget: acc.budget + (row.budgetAmount || 0),
    air: acc.air + (row.airRealizedAmount || 0),
    ground: acc.ground + (row.groundRealizedAmount || 0),
    total: acc.total + (row.totalRealizedAmount || 0),
    delta: acc.delta + (row.deltaAmount || 0)
  }), { budget: 0, air: 0, ground: 0, total: 0, delta: 0 });

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 rounded-lg">
            <Building2 className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Orçado vs Realizado por CC</h3>
            <p className="text-[10px] text-slate-400 font-medium">Análise Granular por Unidade</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-slate-50 rounded-full">
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            {rows.length} {rows.length === 1 ? 'Unidade' : 'Unidades'}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Centro de Custo</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Valor Orçado</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Real Aéreo</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Real Terrestre</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Total Realizado</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Delta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((row, idx) => {
              const isOver = (row.deltaAmount || 0) < 0;
              return (
                <tr key={idx} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-1 h-6 rounded-full transition-all group-hover:h-8",
                        isOver ? "bg-red-400" : row.hasRealizedWithoutBudget ? "bg-amber-400" : "bg-slate-200"
                      )} />
                      <div>
                        <p className="text-xs font-black text-slate-700 leading-none mb-1">{row.costCenter.split(' - ')[0]}</p>
                        <p className="text-[10px] font-medium text-slate-400">{row.costCenter.split(' - ')[1] || 'Unidade'}</p>
                      </div>
                      {row.hasRealizedWithoutBudget && (
                        <div className="group/tip relative">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 cursor-help" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[8px] font-bold rounded opacity-0 group-hover/tip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            REALIZADO SEM ORÇAMENTO
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className={cn(
                      "text-xs font-black",
                      row.budgetAmount === null ? "text-slate-300 italic" : "text-slate-600"
                    )}>
                      {row.budgetAmount !== null ? formatCurrencyBRL(row.budgetAmount) : 'Sem orçamento'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right text-[11px] font-bold text-slate-500">
                    {formatCurrencyBRL(row.airRealizedAmount)}
                  </td>
                  <td className="px-6 py-4 text-right text-[11px] font-bold text-slate-500">
                    {formatCurrencyBRL(row.groundRealizedAmount)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-xs font-black text-slate-900">{formatCurrencyBRL(row.totalRealizedAmount)}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className={cn(
                      "inline-flex items-center gap-1 text-xs font-black",
                      isOver ? "text-red-500" : "text-emerald-500"
                    )}>
                      {isOver ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                      {formatCurrencyBRL(row.deltaAmount)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t-2 border-slate-100">
              <td className="px-6 py-5 text-[10px] font-black text-slate-900 uppercase tracking-widest">Totais Acumulados</td>
              <td className="px-6 py-5 text-right text-xs font-black text-slate-900">{formatCurrencyBRL(totals.budget)}</td>
              <td className="px-6 py-5 text-right text-xs font-black text-slate-500">{formatCurrencyBRL(totals.air)}</td>
              <td className="px-6 py-5 text-right text-xs font-black text-slate-500">{formatCurrencyBRL(totals.ground)}</td>
              <td className="px-6 py-5 text-right text-xs font-black text-slate-900">{formatCurrencyBRL(totals.total)}</td>
              <td className="px-6 py-5 text-right">
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-black",
                  totals.delta < 0 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                )}>
                  {formatCurrencyBRL(totals.delta)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {rows.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-black text-slate-300 uppercase tracking-widest">Nenhum registro encontrado</p>
          <p className="text-xs text-slate-400 font-medium">Ajuste os filtros para visualizar outras competências ou centros de custo.</p>
        </div>
      )}
    </div>
  );
};
