import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Info, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { TravelRequest } from '../../domain/types.ts';
import { 
  getStatusColor, 
  canEditRequest, 
  canDeleteRequest, 
  getPassengerDisplayName, 
  formatRoute 
} from '../../domain/travelRequest.rules.ts';
import { cn } from '../../lib/utils.ts';
import { UserRole } from '../../domain/enums.ts';

interface TravelRequestRowProps {
  request: TravelRequest;
  currentUserRole: UserRole;
  onViewDetails: (req: TravelRequest) => void;
  onEdit?: (req: TravelRequest) => void;
  onDelete: (id: string) => void;
}

/**
 * TravelRequestRow (Sprint Final)
 * Componente de linha individual para a tabela de solicitações.
 */
export function TravelRequestRow({
  request,
  currentUserRole,
  onViewDetails,
  onEdit,
  onDelete
}: TravelRequestRowProps) {
  const canEdit = canEditRequest(request.status, currentUserRole);
  const canDel = canDeleteRequest(request.status, currentUserRole);
  
  const departureRaw = request.travel.departureDateTime || request.audit.createdAt;
  const dateObj = new Date(departureRaw);

  return (
    <tr className="hover:bg-slate-50/50 transition-colors group">
      <td className="px-6 py-4">
        <div className="font-semibold text-slate-900 leading-tight">{getPassengerDisplayName(request)}</div>
        <div className="text-[11px] text-slate-400 font-bold flex items-center gap-1 mt-1 transition-colors group-hover:text-slate-500">
          <ArrowRight className="w-3 h-3" />
          {formatRoute(request)}
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm font-medium text-slate-600">{request.travel.reason}</span>
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
          getStatusColor(request.status)
        )}>
          {request.status}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1 font-semibold">
          <button
            onClick={() => onViewDetails(request)}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            title="Ver ficha completa"
          >
            <Info className="w-5 h-5 transition-transform group-hover:scale-110" />
          </button>
          {canEdit && (
            <button
              onClick={() => onEdit?.(request)}
              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
              title="Editar"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          )}
          {canDel && (
            <button
              onClick={() => onDelete(request.requestId)}
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
}
