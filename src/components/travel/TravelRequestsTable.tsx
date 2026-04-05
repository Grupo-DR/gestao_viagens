import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Info, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { TravelRequest } from '../../domain/types.ts';
import { RequestStatus, UserRole } from '../../domain/enums.ts';
import { 
  getStatusColor, 
  canEditRequest, 
  canDeleteRequest, 
  getPassengerDisplayName, 
  formatRoute 
} from '../../domain/travelRequest.rules.ts';
import { cn } from '../../lib/utils.ts';

import { TravelRequestRow } from './TravelRequestRow.tsx';

/**
 * TravelRequestsTable (Sprint Final)
 * Componente focado na renderização da lista e ações de linha.
 */

interface TravelRequestsTableProps {
  requests: TravelRequest[];
  currentUserRole: UserRole;
  onViewDetails: (req: TravelRequest) => void;
  onEdit?: (req: TravelRequest) => void;
  onDelete: (id: string) => void;
  isDemoMode?: boolean;
}

export function TravelRequestsTable({ 
  requests, 
  currentUserRole, 
  onViewDetails, 
  onEdit, 
  onDelete,
  isDemoMode
}: TravelRequestsTableProps) {
  
  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center text-slate-400 animate-in zoom-in duration-300">
        <div className="flex flex-col items-center gap-3">
          <p className="italic text-sm font-medium tracking-tight text-slate-500">Nenhuma solicitação localizada para este filtro.</p>
          {isDemoMode && <p className="text-[10px] uppercase font-mono font-bold text-amber-500 tracking-widest bg-amber-50 px-2 py-1 rounded">Modo Demo Ativo</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Passageiro / Rota</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Motivo</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Data Ida</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {requests.map((req) => (
              <TravelRequestRow
                key={req.requestId}
                request={req}
                currentUserRole={currentUserRole}
                onViewDetails={onViewDetails}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
