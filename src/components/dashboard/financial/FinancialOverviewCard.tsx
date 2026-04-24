import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { FinancialOverview } from '../../../application/use-cases/buildFinancialDashboard';
import { cn } from '../../../lib/utils';

interface Props {
  data: FinancialOverview;
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const PCT = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });

export const FinancialOverviewCard: React.FC<Props> = ({ data }) => {
  const isOverBudget = (data.variationPercent || 0) > 1;
  const showWarning = (data.variationPercent || 0) > 0.8 && (data.variationPercent || 0) <= 1;
  
  const statusConfig = {
    healthy: { label: 'Saudável', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    attention: { label: 'Atenção', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    critical: { label: 'Crítico', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
    no_budget: { label: 'Sem Orçamento', icon: Info, color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-100' },
    no_cost_data: { label: 'Sem Dados de Custo', icon: Info, color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-100' },
  };

  const status = statusConfig[data.status];
  const StatusIcon = status.icon;

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-500">
      {/* Decoração de fundo */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-indigo-100/40 transition-colors" />

      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-12">
        {/* Lado Esquerdo: Identificação e Custo Principal */}
        <div className="flex-1 space-y-6">
          <div className="space-y-1">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Visão Financeira</h3>
            <p className="text-xl font-black text-slate-900 leading-none">Custo vs Orçamento</p>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Custo Previsto</span>
            <div className="flex items-baseline gap-3">
              <span className={cn(
                "text-5xl font-black tracking-tighter leading-none",
                isOverBudget ? "text-red-600" : "text-slate-900"
              )}>
                {data.predictedCost !== null ? BRL.format(data.predictedCost) : '—'}
              </span>
              {data.variationPercent !== null && (
                <div className={cn(
                  "flex items-center gap-1 text-sm font-black px-2 py-1 rounded-xl",
                  isOverBudget ? "text-red-600 bg-red-50" : "text-emerald-600 bg-emerald-50"
                )}>
                  {isOverBudget ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {PCT.format(data.variationPercent)}
                </div>
              )}
            </div>
            {data.requestsWithoutCost > 0 && (
              <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 pt-1">
                <Info className="w-3.5 h-3.5" /> {data.requestsWithoutCost} solicitações sem cotação informada
              </p>
            )}
          </div>
        </div>

        {/* Centro: Orçamento e Variação */}
        <div className="flex flex-col sm:flex-row items-stretch gap-8 lg:px-12 lg:border-x lg:border-slate-100">
          <div className="space-y-2 min-w-[180px]">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Orçamento Previsto</span>
            <p className="text-2xl font-black text-slate-700 leading-none">
              {data.plannedBudget !== null ? BRL.format(data.plannedBudget) : 'Não informado'}
            </p>
            <div className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
              status.bg, status.color, status.border
            )}>
              <StatusIcon className="w-3.5 h-3.5" />
              {status.label}
            </div>
          </div>

          <div className="space-y-2 min-w-[150px]">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Variação (R$)</span>
            <p className={cn(
              "text-2xl font-black leading-none",
              (data.variationAmount || 0) > 0 ? "text-red-500" : (data.variationAmount || 0) < 0 ? "text-emerald-500" : "text-slate-400"
            )}>
              {data.variationAmount !== null ? BRL.format(data.variationAmount) : '—'}
            </p>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter block pt-1">Diferença sobre o teto</span>
          </div>
        </div>

        {/* Lado Direito: Barra de Consumo */}
        <div className="lg:w-64 space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consumo Total</span>
            <span className={cn(
              "text-lg font-black",
              isOverBudget ? "text-red-600" : "text-slate-900"
            )}>
              {data.variationPercent !== null ? PCT.format(data.variationPercent) : '0%'}
            </span>
          </div>
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
            <div 
              className={cn(
                "h-full transition-all duration-1000",
                isOverBudget ? "bg-red-500" : showWarning ? "bg-amber-500" : "bg-emerald-500"
              )}
              style={{ width: `${Math.min((data.variationPercent || 0) * 100, 100)}%` }}
            />
          </div>
          <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-tight italic">
            Consumo relativo ao orçamento do período
          </p>
        </div>
      </div>
    </div>
  );
};
