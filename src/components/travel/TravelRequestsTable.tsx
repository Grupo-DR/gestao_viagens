import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Info, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { TravelRequest } from '../../domain/types.ts';
import { RequestStatus } from '../../domain/enums.ts';
import { 
  getStatusColor, 
  canEditRequest, 
  canDeleteRequest, 
  getPassengerDisplayName, 
  formatRoute 
} from '../../domain/travelRequest.rules.ts';
import { cn } from '../../lib/utils.ts';

/**
 * TravelRequestsTable (Sprint 3)
 * Componente focado na renderização da lista e ações de linha.
 */

interface TravelRequestsTableProps {
  requests: TravelRequest[];
  currentUserRole: string;
  currentUserId: string;
  onViewDetails: (req: TravelRequest) => void;
  onEdit?: (req: TravelRequest) => void;
  onDelete: (id: string) => void;
  isDemoMode?: boolean;
}

export function TravelRequestsTable({ 
  requests, 
  currentUserRole, 
  currentUserId,
  onViewDetails, 
  onEdit, 
  onDelete,
  isDemoMode
}: TravelRequestsTableProps) {
  
  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <p className="italic text-sm font-medium tracking-tight">Nenhuma solicitação localizada para este filtro.</p>
          {isDemoMode && <p className="text-[10px] uppercase font-bold text-amber-500 tracking-widest">Modo Demo Ativo</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-700">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Passageiro / Rota</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Motivo</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data Ida</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {requests.map((req) => {
              const canEdit = canEditRequest(req.status, currentUserRole);
              const canDel = canDeleteRequest(req.status, currentUserRole);
              
              const departureRaw = req.travel.departureDateTime || req.audit.createdAt;
              const dateObj = new Date(departureRaw);

              return (
                <tr key={req.requestId} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900 leading-tight">{getPassengerDisplayName(req)}</div>
                    <div className="text-[11px] text-slate-400 font-bold flex items-center gap-1 mt-1 transition-colors group-hover:text-slate-500">
                      <ArrowRight className="w-3 h-3" />
                      {formatRoute(req)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-600">{req.travel.reason}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-900 font-bold">
                      {format(dateObj, 'dd MMM yyyy', { locale: ptBR })}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {format(dateObj, 'HH:mm')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border',
                      getStatusColor(req.status)
                    )}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 font-semibold">
                      <button
                        onClick={() => onViewDetails(req)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Ver ficha completa"
                      >
                        <Info className="w-5 h-5 transition-transform group-hover:scale-110" />
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => onEdit?.(req)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                          title="Editar"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                      )}
                      {canDel && (
                        <button
                          onClick={() => onDelete(req.requestId)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
