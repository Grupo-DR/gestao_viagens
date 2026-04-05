import React, { useState } from 'react';
import { format } from 'date-fns';
import { XCircle, CheckCircle, ShieldAlert, ShoppingCart, Send, Loader2 } from 'lucide-react';
import { TravelRequest } from '../../domain/types.ts';
import { PolicyResult } from '../../domain/policy/enums.ts';
import { RequestStatus, UserRole } from '../../domain/enums.ts';
import { getPassengerDisplayName, formatRoute } from '../../domain/travelRequest.rules.ts';
import { PolicyDecisionCard, AuditTimeline } from './AuditTimeline.tsx'; // Importado do arquivo modular
import { PurchaseForm } from './PurchaseForm.tsx';
import { cn } from '../../lib/utils.ts';

/**
 * TravelRequestDetailsModal (Sprint 3)
 * Orquestrador da visualização detalhada e ações operacionais.
 */

interface TravelRequestDetailsModalProps {
  request: TravelRequest;
  currentUserRole: string;
  onClose: () => void;
  onUpdateStatus: (newStatus: RequestStatus, comment: string, purchaseInfo?: any) => Promise<boolean>;
  isUpdating?: boolean;
}

export function TravelRequestDetailsModal({ 
  request, 
  currentUserRole,
  onClose, 
  onUpdateStatus,
  isUpdating
}: TravelRequestDetailsModalProps) {
  const [comment, setComment] = useState('');
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);

  // Permissões de Ação baseadas na View/Role
  const isHR = currentUserRole === UserRole.RECURSOS_HUMANOS || currentUserRole === UserRole.ADMINISTRATIVO;
  const isBuyer = currentUserRole === UserRole.COMPRADOR || currentUserRole === UserRole.ADMINISTRATIVO;
  
  const canApproveHR = isHR && request.status === RequestStatus.EM_VALIDACAO_CH;
  const canBuy = isBuyer && [RequestStatus.DISPONIVEL_PARA_COMPRA, RequestStatus.APROVADA].includes(request.status);

  const handleAction = async (newStatus: RequestStatus) => {
    const success = await onUpdateStatus(newStatus, comment);
    if (success) {
      setComment('');
      onClose();
    }
  };

  const handlePurchase = async (info: any, purchaseComment: string) => {
    const success = await onUpdateStatus(RequestStatus.APROVADA, purchaseComment, info);
    if (success) onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden motion-safe:animate-in motion-safe:zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 shrink-0">
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Ficha da Solicitação</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono font-bold uppercase tracking-widest">ID: {request.requestId.slice(0, 12)}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 px-4 hover:bg-slate-200 rounded-full transition-colors text-slate-400 font-bold text-xs flex items-center gap-2"
          >
            FECHAR <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-slate-200 flex-1">
          {/* Grid de Informações Base */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            {[
              { label: 'Passageiro', value: getPassengerDisplayName(request) },
              { label: 'CHAPA', value: request.employee.chapa || '—' },
              { label: 'Motivo', value: request.travel.reason },
              { label: 'Rota', value: formatRoute(request) },
              { label: 'Centro de Custo', value: request.travel.costCenter },
              { label: 'Projeto', value: request.travel.projectCode || 'Consumo Interno' },
              {
                label: 'Partida',
                value: request.travel.departureDateTime
                  ? format(new Date(request.travel.departureDateTime), 'dd/MM/yyyy HH:mm')
                  : 'Não informada',
              },
              {
                label: 'Retorno',
                value: request.travel.returnDateTime
                  ? format(new Date(request.travel.returnDateTime), 'dd/MM/yyyy HH:mm')
                  : 'Só Ida',
              },
            ].map((item) => (
              <div key={item.label}>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{item.label}</label>
                <p className="text-slate-800 font-bold text-sm leading-tight italic tracking-tight">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Card de Política */}
          {request.validation.policyDecision && (
            <PolicyDecisionCard decision={request.validation.policyDecision} />
          )}

          {/* Purchase Form (Condicional) */}
          {showPurchaseForm && (
            <PurchaseForm 
              onSubmit={handlePurchase}
              onCancel={() => setShowPurchaseForm(false)}
              isLoading={isUpdating}
            />
          )}

          {/* Audit Timeline */}
          <div className="pt-6 border-t border-slate-100">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-6">Trilha de Auditoria</label>
            <AuditTimeline history={request.audit.history} />
          </div>
        </div>

        {/* Footer / Actions */}
        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col gap-4 shrink-0">
          
          {/* Seção de Comentários para Ação */}
          {(canApproveHR || canBuy) && !showPurchaseForm && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Justificativa / Comentário da Ação</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Insira observações relevantes para este estágio..."
                className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium h-20 transition-all"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 font-bold">
            {!showPurchaseForm && (
              <>
                {canApproveHR && (
                  <>
                    <button 
                      onClick={() => handleAction(RequestStatus.REPROVADA)}
                      disabled={isUpdating}
                      className="px-6 py-2.5 rounded-xl text-xs text-red-500 hover:bg-red-50 transition-all uppercase tracking-widest border border-red-100"
                    >
                      Reprovar
                    </button>
                    <button 
                      onClick={() => handleAction(RequestStatus.DISPONIVEL_PARA_COMPRA)}
                      disabled={isUpdating}
                      className="bg-emerald-600 text-white px-8 py-2.5 rounded-xl text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 flex items-center gap-2"
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Aprovar (CH)
                    </button>
                  </>
                )}

                {canBuy && (
                  <button 
                    onClick={() => setShowPurchaseForm(true)}
                    className="bg-blue-600 text-white px-8 py-2.5 rounded-xl text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center gap-2"
                  >
                     <ShoppingCart className="w-4 h-4" />
                     Processar Compra
                  </button>
                )}
              </>
            )}

            {!canApproveHR && !canBuy && (
               <button 
                 onClick={onClose}
                 className="px-6 py-2.5 rounded-xl text-xs text-slate-500 hover:bg-slate-200 transition-all uppercase tracking-widest"
               >
                 Fechar
               </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
