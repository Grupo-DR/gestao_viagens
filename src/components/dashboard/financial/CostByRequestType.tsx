import React from 'react';
import { Tag, ArrowRight, BarChart3 } from 'lucide-react';
import { CostByRequestTypeItem } from '../../../application/use-cases/buildFinancialDashboard';
import { cn } from '../../../lib/utils';

interface Props {
  data: CostByRequestTypeItem[];
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const CostByRequestType: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm shadow-indigo-100">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Custo por Tipo de Solicitação</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Distribuição de gastos previstos por motivo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((item, i) => (
          <div 
            key={item.reason} 
            className="p-5 rounded-3xl bg-slate-50/50 border border-slate-50 hover:bg-white hover:border-indigo-100 hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.reason}</span>
                <p className="text-lg font-black text-slate-900">{BRL.format(item.totalPredictedCost)}</p>
              </div>
              <div className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-1 rounded-lg">
                {item.percentOfTotal.toFixed(0)}%
              </div>
            </div>

            <div className="space-y-4">
              {/* Barra de progresso discreta */}
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-1000 group-hover:bg-indigo-600" 
                  style={{ width: `${item.percentOfTotal}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-400 flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" /> {item.requestCount} solicitações
                </span>
                <span className="text-slate-500">
                  Ticket: {item.averagePredictedCost ? BRL.format(item.averagePredictedCost) : '—'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.length === 0 && (
        <div className="py-12 text-center space-y-3">
          <p className="text-sm font-black text-slate-300 uppercase tracking-widest">Nenhum dado para o período</p>
          <p className="text-xs text-slate-400 italic">Tente ajustar os filtros de competência ou centro de custo.</p>
        </div>
      )}
    </div>
  );
};
