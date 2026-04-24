import React from 'react';
import { 
  ChevronRight, AlertCircle, CheckCircle, Info, 
  MapPin, TableProperties, TrendingUp, TrendingDown,
  User, Briefcase, DollarSign
} from 'lucide-react';
import { FinancialRequestDetail } from '../../../application/use-cases/buildFinancialDashboard';
import { RequestStatus } from '../../../domain/enums';
import { cn } from '../../../lib/utils';

interface Props {
  items: FinancialRequestDetail[];
  loading?: boolean;
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const FinancialDetailsTable: React.FC<Props> = ({ items, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm animate-pulse space-y-6">
        <div className="h-6 w-64 bg-slate-100 rounded-full" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-slate-50 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col w-full">
      <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
            <TableProperties className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Detalhamento Financeiro</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Análise granular de custos por solicitação</p>
          </div>
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-1.5 rounded-full border border-slate-100 shadow-sm">
          {items.length} Lançamentos
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocolo / Passageiro</th>
              <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Centro de Custo</th>
              <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
              <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Custo Previsto</th>
              <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Orçamento CC</th>
              <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Variação</th>
              <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status Fin.</th>
              <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((item) => (
              <tr 
                key={item.requestId} 
                className={cn(
                  "hover:bg-slate-50/50 transition-colors group",
                  item.financialStatus === 'critical' ? "bg-red-50/10" : ""
                )}
              >
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-indigo-600 font-mono">#{item.protocol}</p>
                      <p className="text-xs font-bold text-slate-900 truncate max-w-[180px]">{item.passengerName}</p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.costCenter}</p>
                </td>

                <td className="px-4 py-5">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-slate-300" />
                    <span className="text-[10px] font-bold text-slate-500">{item.reason}</span>
                  </div>
                </td>

                <td className="px-4 py-5 text-right">
                  <p className={cn(
                    "text-xs font-black",
                    item.predictedCost === null ? "text-slate-300 italic" : "text-slate-900"
                  )}>
                    {item.predictedCost !== null ? BRL.format(item.predictedCost) : 'Não informado'}
                  </p>
                </td>

                <td className="px-4 py-5 text-right">
                  <p className="text-[10px] font-bold text-slate-400">
                    {item.plannedBudget !== null ? BRL.format(item.plannedBudget) : '—'}
                  </p>
                </td>

                <td className="px-4 py-5">
                  <div className="flex flex-col items-center gap-1">
                    <div className={cn(
                      "flex items-center gap-1 text-[10px] font-black",
                      (item.variationAmount || 0) > 0 ? "text-red-500" : (item.variationAmount || 0) < 0 ? "text-emerald-600" : "text-slate-300"
                    )}>
                      {(item.variationAmount || 0) > 0 ? <TrendingUp className="w-3 h-3" /> : (item.variationAmount || 0) < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                      {item.variationAmount !== null ? BRL.format(Math.abs(item.variationAmount)) : '—'}
                    </div>
                  </div>
                </td>

                <td className="px-4 py-5">
                  <div className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                    item.financialStatus === 'healthy' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                    item.financialStatus === 'attention' ? "bg-amber-50 text-amber-600 border-amber-100" :
                    item.financialStatus === 'critical' ? "bg-red-50 text-red-600 border-red-100" :
                    "bg-slate-50 text-slate-400 border-slate-100"
                  )}>
                    {item.financialStatus === 'healthy' && <CheckCircle className="w-3 h-3" />}
                    {item.financialStatus === 'attention' && <AlertCircle className="w-3 h-3" />}
                    {item.financialStatus === 'critical' && <AlertCircle className="w-3 h-3" />}
                    {item.financialStatus === 'no_budget' ? 'S/ Orçamento' : 
                     item.financialStatus === 'no_cost_data' ? 'S/ Custo' : 
                     item.financialStatus.toUpperCase()}
                  </div>
                </td>

                <td className="px-8 py-5 text-right">
                  <button className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {items.length === 0 && (
        <div className="p-20 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
            <DollarSign className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Nenhum registro encontrado</h4>
            <p className="text-xs text-slate-400 mt-1">Ajuste os filtros para visualizar outras competências ou centros de custo.</p>
          </div>
        </div>
      )}
    </div>
  );
};
