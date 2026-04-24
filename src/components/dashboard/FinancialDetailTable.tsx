import React from 'react';
import { TravelRequest } from '../../domain/types';
import { formatBRL } from '../../domain/financial/financial.rules';
import { cn } from '../../lib/utils';
import { ExternalLink, ShoppingCart, User, Plane } from 'lucide-react';

interface FinancialDetailTableProps {
  transactions: TravelRequest[];
}

export const FinancialDetailTable: React.FC<FinancialDetailTableProps> = ({ transactions }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-indigo-600" />
          Detalhamento de Transações
        </h3>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{transactions.length} registros no período</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocolo / Passageiro</th>
              <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Motivo / CC</th>
              <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Valor Cotado</th>
              <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Valor Real</th>
              <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Variação</th>
              <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Detalhes Compra</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">Nenhuma transação encontrada para os filtros aplicados.</td>
              </tr>
            ) : (
              transactions.map((r) => {
                const quoted = (r.travel.segments || []).reduce((sum, s) => sum + (s.priceQuote || 0), 0);
                const realized = r.purchase?.price;
                const diff = realized ? quoted - realized : null;

                return (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{r.id?.slice(-8) || 'N/A'}</p>
                          <p className="text-[11px] font-bold text-slate-500 truncate max-w-[150px]">{r.travel.passenger?.name || 'Não identificado'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-[10px] font-bold text-slate-900">{r.travel.reason || '—'}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{r.travel.costCenter || 'N/A'}</p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="text-[10px] font-bold text-slate-500">{formatBRL(quoted)}</p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="text-[11px] font-black text-slate-900">{formatBRL(realized)}</p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {diff !== null ? (
                        <p className={cn(
                          "text-[10px] font-black uppercase tracking-tighter",
                          diff >= 0 ? "text-emerald-600" : "text-red-600"
                        )}>
                          {diff >= 0 ? "+" : ""}{formatBRL(diff)}
                        </p>
                      ) : (
                        <p className="text-[9px] font-bold text-slate-300 uppercase">N/A</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-1">
                            <Plane className="w-3 h-3 text-slate-400" />
                            <span className="text-[9px] font-black text-slate-500 uppercase">{r.purchase?.airline || '—'}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 font-bold">{r.purchase?.purchasedAt ? new Date(r.purchase.purchasedAt).toLocaleDateString() : 'Não emitida'}</p>
                        </div>
                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
