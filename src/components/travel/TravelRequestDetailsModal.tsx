import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  X, CheckCircle, ShieldAlert, ShoppingCart, Loader2, Mail, 
  Plane, Bus, MapPin, Luggage, XCircle 
} from 'lucide-react';
import { TravelRequest, PurchaseInfo, TravelSegment } from '../../domain/types.ts';
import { RequestStatus, UserRole } from '../../domain/enums.ts';
import { getPassengerDisplayName, formatRoute } from '../../domain/travelRequest.rules.ts';
import { PolicyDecisionPanel } from './PolicyDecisionPanel.tsx';
import { AuditTimeline } from './AuditTimeline.tsx';
import { PurchaseForm } from './PurchaseForm.tsx';
import { ApprovalEmailBox } from './ApprovalEmailBox.tsx';
import { cn } from '../../lib/utils.ts';
import { normalizeSegmentsFromTravel } from '../../domain/travelSegment.helpers';

interface TravelRequestDetailsModalProps {
  request: TravelRequest;
  currentUserRole: UserRole;
  onClose: () => void;
  onUpdateStatus: (
    request: TravelRequest, 
    newStatus: RequestStatus, 
    comment: string, 
    purchaseInfo?: Partial<PurchaseInfo>,
    updatedSegments?: TravelSegment[]
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
  const [showEmailBox, setShowEmailBox] = useState(false);

  // Permissões de Ação
  const isHR = currentUserRole === UserRole.CAPITAL_HUMANO || currentUserRole === UserRole.MASTER;
  const isBuyer = currentUserRole === UserRole.COMPRADOR || currentUserRole === UserRole.MASTER;
  
  // CH aprova solicitações em validação
  const canApproveHR = isHR && request.status === RequestStatus.EM_VALIDACAO_CH;
  // Comprador executa a compra somente quando liberada (DISPONIVEL_PARA_COMPRA)
  const canBuy = isBuyer && request.status === RequestStatus.DISPONIVEL_PARA_COMPRA;
  
  // Comprador (registrando aprovação externa) avalia solicitações aguardando aprovação
  const canApprovePurchase = (currentUserRole === UserRole.MASTER || currentUserRole === UserRole.COMPRADOR) && 
                              request.status === RequestStatus.AGUARDANDO_APROVACAO_COMPRA;
                              
  const canFinalizeEmission = isBuyer && request.status === RequestStatus.EM_PROCESSO_DE_COMPRA;
  
  const isRejectedPurchase = request.status === RequestStatus.COMPRA_RECUSADA;

  const handleAction = async (newStatus: RequestStatus) => {
    const success = await onUpdateStatus(request, newStatus, comment);
    if (success) {
      setComment('');
      onClose();
    }
  };

  const handlePurchase = async (info: Partial<PurchaseInfo>, purchaseComment: string, updatedSegments?: TravelSegment[], nextStatus?: RequestStatus) => {
    const success = await onUpdateStatus(
      request, 
      nextStatus || RequestStatus.EMITIDA, 
      purchaseComment, 
      info, 
      updatedSegments
    );
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
        <div className="p-8 overflow-y-auto space-y-12 scrollbar-thin scrollbar-thumb-slate-200 flex-1 bg-white">
          
          {/* 1. DADOS DO COLABORADOR */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest italic">Dados do Colaborador</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pl-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Centro de Custo</label>
                <p className="text-xs font-bold text-slate-700">{request.travel.costCenter}</p>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  {request.employee.passengerType === 'external' ? 'Vínculo' : 'Chapa'}
                </label>
                <p className="text-xs font-bold text-slate-700">
                  {request.employee.passengerType === 'external' ? 'Terceiro / Convidado' : (request.employee as any).chapa}
                </p>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nome Completo</label>
                <p className="text-xs font-bold text-slate-700">{getPassengerDisplayName(request)}</p>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  {request.employee.passengerType === 'external' && !/^\d+$/.test((request.employee as any).cpfOrPassport || '') ? 'Passaporte' : 'CPF'}
                </label>
                <p className="text-xs font-bold text-slate-700">
                  {request.employee.passengerType === 'external' 
                    ? (request.employee as any).cpfOrPassport 
                    : (request.employee as any).cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '—'}
                </p>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Data de Nascimento</label>
                <p className="text-xs font-bold text-slate-700">
                  {request.employee.birthDate ? format(new Date(request.employee.birthDate + 'T12:00:00'), 'dd/MM/yyyy') : '—'}
                </p>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Motivo da Viagem</label>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-slate-700">{request.travel.reason}</p>
                  {request.travel.isUrgent && (
                    <span className="bg-red-100 text-red-600 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Urgente</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 2. JUSTIFICATIVA DO SOLICITANTE */}
          {request.travel.justification && (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest italic">Observações do Solicitante</h4>
              </div>
              <div className="pl-4">
                <div className="bg-slate-50/50 p-5 rounded-[28px] border border-slate-100">
                  <p className="text-sm text-slate-600 font-semibold leading-relaxed whitespace-pre-wrap italic">
                    "{request.travel.justification}"
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* 3. TÓPICO: ITINERÁRIO DE IDA */}
          <section className="space-y-6">
             <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest italic">Itinerário de Ida</h4>
             </div>
             
             <div className="space-y-4 pl-4">
                {(request.travel.segments || (request as any).segments || [])
                  .filter((s: any) => s.direction === 'ida')
                  .map((seg: any, idx: number) => (
                    <div key={seg.id} className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex items-center justify-between gap-6 hover:border-emerald-100 transition-colors shadow-sm">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-slate-800">{seg.origin} → {seg.destination}</p>
                            <div className="flex items-center gap-3 mt-1">
                               <div className="flex items-center gap-1">
                                 {seg.transportMode === 'aereo' ? <Plane className="w-3 h-3 text-blue-500" /> : <Bus className="w-3 h-3 text-emerald-500" />}
                                 <span className="text-[9px] font-bold text-slate-400 uppercase">{seg.transportMode}</span>
                               </div>
                               <span className="text-[9px] font-bold text-slate-300">|</span>
                               <p className="text-[9px] text-slate-400 font-bold uppercase">{seg.originTerminal}</p>
                               {seg.baggageRequired && (
                                 <>
                                   <span className="text-[9px] font-bold text-slate-300">|</span>
                                   <div className="flex items-center gap-1 text-indigo-500">
                                      <Luggage className="w-3 h-3" />
                                      <span className="text-[9px] font-black uppercase tracking-tighter">C/ Bagagem</span>
                                   </div>
                                 </>
                               )}
                            </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-10">
                        <div className="text-right">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Partida</label>
                          <p className="text-[10px] font-black text-slate-700">{format(new Date(seg.departureDateTime), 'dd/MM/yyyy HH:mm')}</p>
                        </div>
                        <div className="text-right w-24">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Cia / Valor</label>
                          <p className="text-[10px] font-bold text-slate-600 truncate">{seg.airlineQuote}</p>
                          <p className="text-[10px] font-black text-blue-600">{seg.priceQuote ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(seg.priceQuote) : '—'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
             </div>
          </section>

          {/* 4. TÓPICO: ITINERÁRIO DE VOLTA */}
          <section className="space-y-6">
             <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest italic">Itinerário de Volta</h4>
             </div>
             
             <div className="space-y-4 pl-4">
                {(request.travel.segments || (request as any).segments || [])
                  .filter((s: any) => s.direction === 'volta')
                  .length > 0 ? (
                    (request.travel.segments || (request as any).segments || [])
                    .filter((s: any) => s.direction === 'volta')
                    .map((seg: any, idx: number) => (
                      <div key={seg.id} className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex items-center justify-between gap-6 hover:border-orange-100 transition-colors shadow-sm">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-slate-800">{seg.origin} → {seg.destination}</p>
                            <div className="flex items-center gap-3 mt-1">
                               <div className="flex items-center gap-1">
                                 {seg.transportMode === 'aereo' ? <Plane className="w-3 h-3 text-blue-500" /> : <Bus className="w-3 h-3 text-emerald-500" />}
                                 <span className="text-[9px] font-bold text-slate-400 uppercase">{seg.transportMode}</span>
                               </div>
                               <span className="text-[9px] font-bold text-slate-300">|</span>
                               <p className="text-[9px] text-slate-400 font-bold uppercase">{seg.originTerminal}</p>
                               {seg.baggageRequired && (
                                 <>
                                   <span className="text-[9px] font-bold text-slate-300">|</span>
                                   <div className="flex items-center gap-1 text-indigo-500">
                                      <Luggage className="w-3 h-3" />
                                      <span className="text-[9px] font-black uppercase tracking-tighter">C/ Bagagem</span>
                                   </div>
                                 </>
                               )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-10">
                          <div className="text-right">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Partida</label>
                            <p className="text-[10px] font-black text-slate-700">{format(new Date(seg.departureDateTime), 'dd/MM/yyyy HH:mm')}</p>
                          </div>
                          <div className="text-right w-24">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Cia / Valor</label>
                            <p className="text-[10px] font-bold text-slate-600 truncate">{seg.airlineQuote}</p>
                            <p className="text-[10px] font-black text-blue-600">{seg.priceQuote ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(seg.priceQuote) : '—'}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 border-2 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center gap-2 opacity-50">
                       <MapPin className="w-6 h-6 text-slate-300" />
                       <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Nenhum trecho de volta solicitado</p>
                    </div>
                  )}
             </div>
          </section>

          {/* 5. TÓPICO: POLÍTICAS APLICADAS */}
          {true && (
            <section className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-slate-400 rounded-full" />
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest italic">Políticas Aplicadas</h4>
               </div>
               <div className="space-y-4 pl-4">
                  {/* Suporte a múltiplas decisões (ex: Data e Geo) */}
                  {request.validation.policyDecisions && request.validation.policyDecisions.length > 0 ? (
                    request.validation.policyDecisions.map((decision, idx) => (
                      <PolicyDecisionPanel 
                        key={idx} 
                        decision={decision} 
                      />
                    ))
                  ) : request.validation.policyDecision ? (
                    <PolicyDecisionPanel decision={request.validation.policyDecision} />
                  ) : (
                    <p className="text-[10px] font-bold text-slate-400 uppercase italic">Nenhuma política aplicada</p>
                  )}
               </div>
            </section>
          )}

          {/* Formulário de Compra (Se aplicável) */}
          {showPurchaseForm && (
            <PurchaseForm 
              request={request}
              segments={request.travel.segments || []}
              onSubmit={handlePurchase}
              onCancel={() => setShowPurchaseForm(false)}
              isLoading={isUpdating}
            />
          )}

          {/* 7. TÓPICO: PARECERES E DEVOLUTIVAS */}
          {request.audit.history.some(h => h.comment && h.comment.length > 5 && h.status !== RequestStatus.ENVIADA) && (
            <section className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest italic">Pareceres e Devolutivas</h4>
               </div>
               <div className="pl-4 space-y-4">
                  {request.audit.history
                    .filter(h => h.comment && h.comment.length > 5 && h.status !== RequestStatus.ENVIADA)
                    .map((entry, idx) => (
                      <div key={idx} className={cn(
                        "p-5 rounded-[28px] border relative",
                        entry.updatedByRole === UserRole.CAPITAL_HUMANO ? "bg-blue-50/40 border-blue-100" : "bg-slate-50/50 border-slate-100"
                      )}>
                        <div className="flex items-center justify-between mb-2">
                           <span className={cn(
                             "text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest",
                             entry.updatedByRole === UserRole.CAPITAL_HUMANO ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                           )}>
                             {entry.updatedByRole === UserRole.CAPITAL_HUMANO ? 'Capital Humano' : 
                              entry.updatedByRole === UserRole.COMPRADOR ? 'Compras' : entry.updatedByRole}
                           </span>
                           <span className="text-[9px] font-bold text-slate-400 italic">
                             {format(new Date(entry.updatedAt), 'dd MMM HH:mm')}
                           </span>
                        </div>
                        <p className="text-sm text-slate-700 font-semibold leading-relaxed whitespace-pre-wrap">
                          {entry.comment}
                        </p>
                      </div>
                    ))
                  }
               </div>
            </section>
          )}

          {/* 8. Trilha de Auditoria */}
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
          
          {(canApproveHR || canBuy || canApprovePurchase) && !showPurchaseForm && (
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
                      disabled={isUpdating || !comment.trim()}
                      title={!comment.trim() ? 'Justificativa obrigatória para reprovar' : ''}
                      className="px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all border border-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Reprovar (Definitivo)
                    </button>
                    <button 
                      onClick={() => handleAction(RequestStatus.AGUARDANDO_APROVACAO_COMPRA)}
                      disabled={isUpdating}
                      className="bg-emerald-600 text-white px-10 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-100 flex items-center gap-2 group transition-all"
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                      Aprovar e Enviar para Compras
                    </button>
                  </>
                )}

                {canBuy && (
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setShowEmailBox(true)}
                      className="px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 transition-all border border-indigo-100 flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      E-mail Aprovação
                    </button>
                    <button 
                      onClick={() => setShowPurchaseForm(true)}
                      disabled={isUpdating}
                      className="bg-indigo-600 text-white px-10 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center gap-2 group transition-all"
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                      Processar Emissão
                    </button>
                    <button 
                      onClick={() => handleAction(RequestStatus.CANCELADA)}
                      disabled={isUpdating || !comment.trim()}
                      title={!comment.trim() ? 'Preencha a justificativa antes de cancelar' : ''}
                      className="px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all border border-red-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancelar
                    </button>
                  </div>
                )}

                {canApprovePurchase && (
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleAction(RequestStatus.COMPRA_RECUSADA)}
                      disabled={isUpdating || !comment.trim()}
                      title={!comment.trim() ? 'Justificativa obrigatória para recusar' : ''}
                      className="px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all border border-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Recusar Compra
                    </button>
                    <button 
                      onClick={() => handleAction(RequestStatus.DISPONIVEL_PARA_COMPRA)}
                      disabled={isUpdating}
                      className="bg-indigo-600 text-white px-10 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl flex items-center gap-2 group transition-all disabled:opacity-40"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Aprovar Compra
                    </button>
                  </div>
                )}

                {canFinalizeEmission && (
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setShowPurchaseForm(true)}
                      className="bg-indigo-600 text-white px-10 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl flex items-center gap-2 group transition-all"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Finalizar Emissão
                    </button>
                  </div>
                )}

                {isRejectedPurchase && (
                  <div className="flex items-center gap-4 bg-red-50 px-6 py-3 rounded-2xl border border-red-100">
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                    <span className="text-xs font-bold text-red-800 italic uppercase">Compra recusada. Solicitação encerrada.</span>
                    <button 
                      onClick={() => handleAction(RequestStatus.CANCELADA)}
                      className="text-[10px] font-black uppercase text-red-600 underline hover:no-underline ml-4"
                    >
                      Cancelar Solicitação
                    </button>
                  </div>
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

      {/* Box de E-mail de Aprovação */}
      {showEmailBox && (
        <ApprovalEmailBox 
          request={request}
          onClose={() => setShowEmailBox(false)}
        />
      )}
    </div>
  );
}
