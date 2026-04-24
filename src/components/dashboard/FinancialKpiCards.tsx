import React from 'react';
import { 
  DollarSign, 
  Wallet, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  FileCheck, 
  AlertCircle,
  Tag
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { VariationInfo, formatBRL } from '../../domain/financial/financial.rules';

interface KpiCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  variant?: 'blue' | 'emerald' | 'amber' | 'red' | 'indigo' | 'slate';
  variation?: VariationInfo;
}

function KpiCard({ title, value, subValue, icon: Icon, variant = 'slate', variation }: KpiCardProps) {
  const variants = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100',
  };

  return (
    <div className={cn("p-5 rounded-3xl border bg-white shadow-sm flex flex-col gap-3 transition-all hover:shadow-md", variants[variant])}>
      <div className="flex items-center justify-between">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm", variants[variant])}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{title}</span>
      </div>
      
      <div>
        <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
        {subValue && (
          <p className="text-[10px] mt-2 font-bold text-slate-400 uppercase tracking-tight">{subValue}</p>
        )}
        {variation && (
          <div className={cn(
            "mt-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter",
            variation.status === 'economy' ? "text-emerald-600" : variation.status === 'over' ? "text-red-600" : "text-slate-400"
          )}>
            {variation.status === 'economy' ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
            {variation.pct.toFixed(1)}% {variation.status === 'economy' ? 'Economia' : 'Excedente'}
          </div>
        )}
      </div>
    </div>
  );
}

interface FinancialKpiCardsProps {
  data: {
    totalRealized: number;
    totalBudget: number;
    totalCommitted: number;
    availableBudget: number;
    ticketAverage: number;
    issuedCount: number;
    missingValueCount: number;
    highestExpense: number;
    variation: VariationInfo;
  };
}

export const FinancialKpiCards: React.FC<FinancialKpiCardsProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard 
        title="Gasto Realizado" 
        value={formatBRL(data.totalRealized)}
        subValue={`${data.issuedCount} passagens emitidas`}
        icon={DollarSign}
        variant="indigo"
        variation={data.variation}
      />
      
      <KpiCard 
        title="Comprometido" 
        value={formatBRL(data.totalCommitted)}
        subValue="Aguardando emissão"
        icon={Clock}
        variant="amber"
      />

      <KpiCard 
        title="Saldo Disponível" 
        value={formatBRL(data.availableBudget)}
        subValue={`Do orçamento de ${formatBRL(data.totalBudget)}`}
        icon={Wallet}
        variant={data.availableBudget < 0 ? 'red' : 'emerald'}
      />

      <KpiCard 
        title="Ticket Médio" 
        value={formatBRL(data.ticketAverage)}
        subValue="Por passagem emitida"
        icon={Tag}
        variant="blue"
      />

      <KpiCard 
        title="Sem Valor de Compra" 
        value={data.missingValueCount}
        subValue="Passagens emitidas sem preço"
        icon={AlertCircle}
        variant={data.missingValueCount > 0 ? 'red' : 'slate'}
      />

      <KpiCard 
        title="Maior Gasto Individual" 
        value={formatBRL(data.highestExpense)}
        subValue="No período selecionado"
        icon={TrendingUp}
        variant="slate"
      />

      <KpiCard 
        title="Emissão Total" 
        value={data.issuedCount}
        subValue="Solicitações concluídas"
        icon={FileCheck}
        variant="slate"
      />

      <KpiCard 
        title="Orçamento Total" 
        value={formatBRL(data.totalBudget)}
        subValue="Previsto no período"
        icon={DollarSign}
        variant="slate"
      />
    </div>
  );
};
