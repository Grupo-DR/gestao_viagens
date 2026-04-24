import React from 'react';
import { Plane, Truck, PieChart } from 'lucide-react';
import { LogisticsMixMetric } from '../../../application/use-cases/buildFinancialDashboard';
import { formatCurrencyBRL, formatPercentBR } from '../../../domain/financial/financialMetrics';

interface Props {
  data: LogisticsMixMetric;
}

export const LogisticsMixCard: React.FC<Props> = ({ data }) => {
  const hasData = data.airRealizedAmount !== null || data.groundRealizedAmount !== null;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <PieChart className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Mix de Logística</h3>
            <p className="text-[10px] text-slate-400 font-medium">Distribuição por Modal</p>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Sem dados no período</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Aéreo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-slate-50 rounded-lg">
                <Plane className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-700 uppercase">Aéreo</p>
                <p className="text-sm font-black text-slate-900">{formatCurrencyBRL(data.airRealizedAmount)}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-[10px] font-black">
                {formatPercentBR(data.airPercent)}
              </span>
            </div>
          </div>

          {/* Terrestre */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-slate-50 rounded-lg">
                <Truck className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-700 uppercase">Terrestre</p>
                <p className="text-sm font-black text-slate-900">{formatCurrencyBRL(data.groundRealizedAmount)}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="px-2 py-1 bg-slate-50 text-slate-500 rounded-md text-[10px] font-black">
                {formatPercentBR(data.groundPercent)}
              </span>
            </div>
          </div>

          {/* Barra Visual */}
          <div className="h-2 w-full bg-slate-100 rounded-full flex overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-1000"
              style={{ width: `${(data.airPercent || 0) * 100}%` }}
            />
            <div 
              className="h-full bg-slate-400 transition-all duration-1000"
              style={{ width: `${(data.groundPercent || 0) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
