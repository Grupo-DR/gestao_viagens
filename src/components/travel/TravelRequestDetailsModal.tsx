import React, { useState } from 'react';
import { format } from 'date-fns';
import { X, CheckCircle, ShieldAlert, ShoppingCart, Loader2 } from 'lucide-react';
import { TravelRequest, PurchaseInfo } from '../../domain/types.ts';
import { RequestStatus, UserRole } from '../../domain/enums.ts';
import { getPassengerDisplayName, formatRoute } from '../../domain/travelRequest.rules.ts';
import { PolicyDecisionPanel } from './PolicyDecisionPanel.tsx';
import { AuditTimeline } from './AuditTimeline.tsx';
import { PurchaseForm } from './PurchaseForm.tsx';
import { cn } from '../../lib/utils.ts';
import { Plane, Bus, MapPin, Luggage } from 'lucide-react';
import { normalizeSegmentsFromTravel } from '../../domain/travelSegment.helpers';

interface TravelRequestDetailsModalProps {
  request: TravelRequest;
  currentUserRole: UserRole;
  onClose: () => void;
  onUpdateStatus: (
    request: TravelRequest, 
    newStatus: RequestStatus, 
    comment: string, 
    purchaseInfo?: Partial<PurchaseInfo>
  ) => Promise<boolean>;
  isUpdating?: boolean;
}

/**
 * TravelRequestDetailsModal (Sprint Final)
 * Modal modularizado para visualização e ações operacionais.
 * Removeu alert() e padronizou o fluxo de ações.
 */
export function TravelRequestDetailsModal({ 
  request, 
  currentUserRole,
  onClose, 
  onUpdateStatus,
  isUpdating
}: TravelRequestDetailsModalProps) {
  const [comment, setComment] = useState('');
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);

  // Permissões de Ação
  const isHR = currentUserRole === UserRole.CAPITAL_HUMANO || currentUserRole === UserRole.ADMINISTRATIVO;
  const isBuyer = currentUserRole === UserRole.COMPRADOR || currentUserRole === UserRole.ADMINISTRATIVO;
  
  const canApproveHR = isHR && request.status === RequestStatus.EM_VALIDACAO_CH;
  const canBuy = isBuyer && [RequestStatus.DISPONIVEL_PARA_COMPRA, RequestStatus.APROVADA].includes(request.status);

  const handleAction = async (newStatus: RequestStatus) => {
    const success = await onUpdateStatus(request, newStatus, comment);
    if (success) {
      setComment('');
      onClose();
    }
  };

  const handlePurchase = async (info: Partial<PurchaseInfo>, purchaseComment: string) => {
    const success = await onUpdateStatus(request, RequestStatus.EMITIDA, purchaseComment, info);
    if (success) onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden motion-safe:animate-in motion-safe:zoom-in-95 duration-300 flex flex-col max-h-[95vh] border-4 border-white">
        
        {/* Header Personalizado */}
        <div className="px-8 py-7 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-slate-100">
               <Loader2 className={cn("w-6 h-6 text-blue-600", isUpdating && "animate-spin")} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">Ficha de Viagem</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-mono font-bold uppercase tracking-widest">
                Protocolo: <span className="text-slate-600">{request.requestId.slice(0, 16)}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 hover:bg-slate-200 rounded-2xl transition-all text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body com Scroll Suave */}
        <div className="p-8 overflow-y-auto space-y-10 scrollbar-thin scrollbar-thumb-slate-200 flex-1 bg-white">
          {/* Grid de Informações Base */}
          <div className="grid grid-cols-2 gap-x-10 gap-y-8">
            {[
              { label: 'Passageiro', value: getPassengerDisplayName(request) },
              { label: 'CHAPA', value: request.employee.chapa || '—' },
              { label: 'Motivo', value: request.travel.reason },
              { label: 'Centro de Custo', value: request.travel.costCenter },
              { label: 'Rota Resumida', value: formatRoute(request) },
              { label: 'Projeto', value: request.travel.projectCode || 'Consumo Interno' }
            ].map((item) => (
              <div key={item.label} className="group">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1.5 transition-colors group-hover:text-blue-500">{item.label}</label>
                <p className="text-slate-800 font-bold text-sm leading-tight italic">{item.value}</p>
              </div>
            ))}
          </div>

          {/* SEÇÃO: ITINERÁRIO DETALHADO (VERSÃO V3) */}
          <section className="space-y-4">
             <div className="flex items-center gap-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Itinerário Detalhado</h4>
                <div className="h-px flex-1 bg-slate-100" />
             </div>
             
             <div className="space-y-4">
                {normalizeSegmentsFromTravel(request.travel).map((seg, idx) => (
                  <div key={seg.id} className="relative pl-8 pb-4 border-l-2 border-dashed border-slate-100 last:border-0 last:pb-0">
                    <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-[8px] font-black text-slate-400">
                       {idx + 1}
                    </div>
                    
                    <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {seg.transportMode === 'aereo' ? <Plane className="w-3 h-3 text-blue-500" /> : <Bus className="w-3 h-3 text-emerald-500" />}
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{seg.transportMode}</span>
                        </div>
                        {seg.baggageRequired && (
                          <div className="flex items-center gap-1 text-slate-400">
                             <Luggage className="w-3 h-3" />
                             <span className="text-[9px] font-bold">C/ Bagagem</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                         <div className="flex-1">
                            <p className="text-xs font-bold text-slate-700">{seg.origin}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{seg.originTerminal || 'Terminal não ident.'}</p>
                         </div>
                         <div className="flex items-center gap-1 text-slate-300">
                            <div className="w-2 h-px bg-slate-200" />
                            <MapPin className="w-3 h-3" />
                            <div className="w-2 h-px bg-slate-200" />
                         </div>
                         <div className="flex-1 text-right">
                            <p className="text-xs font-bold text-slate-700">{seg.destination}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{seg.destinationTerminal || 'Terminal não ident.'}</p>
                         </div>
                      </div>

                      <div className="mt-3 flex items-center gap-6">
                         <div className="px-2.5 py-1.5 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center gap-2">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Partida:</span>
                            <span className="text-[10px] font-bold text-slate-600">{format(new Date(seg.departureDateTime), 'dd/MM/yyyy HH:mm')}</span>
                         </div>
                         
                         {/* Cotação Obra por Trecho */}
                         <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Cia Cotada</span>
                               <span className="text-[10px] font-bold text-slate-700 italic">{seg.airlineQuote || 'N/A'}</span>
                            </div>
                            <div className="w-px h-4 bg-slate-100" />
                            <div className="flex flex-col">
                               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Preço Cotado</span>
                               <span className="text-[10px] font-black text-blue-600 font-mono italic">
                                 {seg.priceQuote ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(seg.priceQuote) : 'R$ 0,00'}
                               </span>
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </section>

          {/* Seção de Status / Política */}
          <section className="space-y-4">
             <div className="flex items-center gap-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Validação de Política</h4>
                <div className="h-px flex-1 bg-slate-100" />
             </div>
             {request.validation.policyDecision && (
               <PolicyDecisionPanel decision={request.validation.policyDecision} />
             )}
          </section>

          {/* Formulário de Compra (Se aplicável) */}
          {showPurchaseForm && (
            <PurchaseForm 
              onSubmit={handlePurchase}
              onCancel={() => setShowPurchaseForm(false)}
              isLoading={isUpdating}
            />
          )}

          {/* Trilha de Auditoria */}
          <section className="space-y-6 pt-2">
             <div className="flex items-center gap-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Timeline do Workflow</h4>
                <div className="h-px flex-1 bg-slate-100" />
             </div>
             <AuditTimeline history={request.audit.history} />
          </section>
        </div>

        {/* Footer / Ações Contextuais */}
        <div className="p-8 bg-slate-50/80 border-t border-slate-100 flex flex-col gap-5 shrink-0">
          
          {(canApproveHR || canBuy) && !showPurchaseForm && (
            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Justificativa da Ação</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Insira notas explicativas ou pendências identificadas..."
                className="w-full p-4 rounded-[24px] border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none text-sm font-medium h-24 transition-all shadow-sm placeholder:italic"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            {!showPurchaseForm && (
              <>
                {canApproveHR && (
                  <>
                    <button 
                      onClick={() => handleAction(RequestStatus.REPROVADA)}
                      disabled={isUpdating}
                      className="px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all border border-red-100"
                    >
                      Reprovar
                    </button>
                    <button 
                      onClick={() => handleAction(RequestStatus.DISPONIVEL_PARA_COMPRA)}
                      disabled={isUpdating}
                      className="bg-emerald-600 text-white px-10 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-100 flex items-center gap-2 group transition-all"
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                      Aprovar para Compra
                    </button>
                  </>
                )}

                {canBuy && (
                  <button 
                    onClick={() => setShowPurchaseForm(true)}
                    className="bg-blue-600 text-white px-10 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center gap-2 group transition-all"
                  >
                     <ShoppingCart className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                     Processar Emissão
                  </button>
                )}
              </>
            )}

            {!canApproveHR && !canBuy && (
               <button 
                 onClick={onClose}
                 className="px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-all border border-slate-100"
               >
                 Fechar Ficha
               </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
