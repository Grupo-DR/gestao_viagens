import React from 'react';
import { 
  AlertCircle, Clock, ChevronRight, User, 
  AlertTriangle, Zap
} from 'lucide-react';
import { TravelRequest } from '../../domain/types';
import { SlaInfo } from '../../domain/travelRequest.sla';
import { cn } from '../../lib/utils';
import { RequestStatus } from '../../domain/enums';

interface Props {
  items: {
    request: TravelRequest;
    sla: SlaInfo;
  }[];
  loading?: boolean;
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const AttentionQueueTable: React.FC<Props> = ({ items, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-pulse space-y-4">
        <div className="h-4 w-48 bg-slate-100 rounded" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-slate-50 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Fila Limpa!</h4>
          <p className="text-xs text-slate-400 mt-1">Nenhuma solicitação exige atenção prioritária no momento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col w-full">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Fila de Atenção Prioritária</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Ordenado por criticidade de SLA e Urgência</p>
          </div>
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-1.5 rounded-full border border-slate-100 shadow-sm">
          {items.length} Pendências
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocolo / Passageiro</th>
              <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Centro de Custo</th>
              <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Etapa Atual</th>
              <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Tempo / SLA</th>
              <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Urgente</th>
              <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map(({ request, sla }) => (
              <tr 
                key={request.requestId} 
                className={cn(
                  "hover:bg-slate-50/50 transition-colors group",
                  sla.isOverdue ? "bg-red-50/10" : sla.isDueToday ? "bg-amber-50/10" : ""
                )}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                      sla.isOverdue ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                    )}>
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-900 font-mono uppercase tracking-tight">#{request.requestId.slice(-6)}</p>
                      <p className="text-xs font-bold text-slate-600 truncate max-w-[200px]">
                        {request.employee.passengerType === 'internal' ? request.employee.employeeName : request.employee.fullName}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{request.travel.costCenter}</p>
                </td>
                
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-1">
                    <span className={cn(
                      "text-[9px] font-black px-2 py-0.5 rounded-md border w-fit uppercase",
                      request.status === RequestStatus.EM_VALIDACAO_CH ? "bg-blue-50 text-blue-600 border-blue-100" :
                      request.status === RequestStatus.AGUARDANDO_APROVACAO_COMPRA ? "bg-purple-50 text-purple-600 border-purple-100" :
                      "bg-slate-50 text-slate-600 border-slate-200"
                    )}>
                      {request.status}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 italic">
                      Resp: {request.status === RequestStatus.EM_VALIDACAO_CH ? 'Capital Humano' : 
                             request.status === RequestStatus.AGUARDANDO_APROVACAO_COMPRA ? 'Gestor / Diretor' : 'Compras'}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "text-xs font-black",
                        sla.isOverdue ? "text-red-600" : "text-slate-900"
                      )}>{sla.elapsedHours}h</span>
                      <span className="text-[9px] font-bold text-slate-300">/ {sla.limitHours}h</span>
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full",
                      sla.isOverdue ? "bg-red-100 text-red-600" : sla.isDueToday ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                    )}>
                      {sla.isOverdue ? 'Atrasado' : sla.isDueToday ? 'Vence Hoje' : 'No Prazo'}
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4 text-center">
                  {request.travel.isUrgent ? (
                    <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-600 shadow-sm shadow-amber-100">
                      <Zap className="w-3.5 h-3.5 fill-amber-600" />
                    </div>
                  ) : (
                    <span className="text-slate-200">—</span>
                  )}
                </td>

                <td className="px-6 py-4 text-right">
                  <button className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
