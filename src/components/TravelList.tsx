// ============================================================
// PRESENTATION — TravelList
// Usa useTravelRequests hook (sem acesso direto ao Firestore).
// Suporta dados v2 nativos e legados (via mapeador do hook).
// Ações delegadas ao travelRequestService.
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Search, Info, Edit2, Trash2, CheckCircle2, XCircle,
  AlertTriangle, ShoppingCart, Loader2, ArrowRight, ShieldAlert,
  CheckCircle, ClipboardCheck
} from 'lucide-react';
import { PolicyResult } from '../domain/policy/enums';
import { RequestStatus, PurchaseStatus, ValidationStatus, TravelReason } from '../domain/enums';
import {
  getStatusColor,
  canEditRequest,
  canDeleteRequest,
  getPassengerDisplayName,
  formatRoute,
} from '../domain/travelRequest.rules';
import type { TravelRequest, HistoryEntry, PurchaseInfo } from '../domain/types';
import { useIdentity } from '../application/identity/IdentityContext.tsx';
import { useTravelRequests, TravelListView } from '../application/hooks/useTravelRequests.ts';
import { changeRequestStatus, deleteTravelRequest } from '../application/services/travelRequestService.ts';
import { cn } from '../lib/utils.ts';
import { UserRole } from '../domain/enums.ts';

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface TravelListProps {
  view: TravelListView;
  onEdit?: (request: TravelRequest) => void;
  onCreate?: () => void;
}

// ──────────────────────────────────────────────
// Formulário de emissão (comprador)
// ──────────────────────────────────────────────

interface PurchaseFormState {
  ticketNumber: string;
  airline: string;
  price: string;
  notes: string;
}

const EMPTY_PURCHASE_FORM: PurchaseFormState = {
  ticketNumber: '',
  airline: '',
  price: '',
  notes: '',
};

// ──────────────────────────────────────────────
// Componente Principal
// ──────────────────────────────────────────────

export function TravelList({ view, onEdit, onCreate }: TravelListProps) {
  const { currentUser } = useIdentity();
  
  // Hooks de Dados e Estado (Sempre chamados no topo)
  const { requests, loading, error, isDemoMode } = useTravelRequests({
    view,
    userId: currentUser.uid,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null);
  const [purchaseForm, setPurchaseForm] = useState<PurchaseFormState>(EMPTY_PURCHASE_FORM);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Filtragem local (estável) ──
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const name = getPassengerDisplayName(r).toLowerCase();
      const route = formatRoute(r).toLowerCase();
      const matchesSearch =
        name.includes(searchTerm.toLowerCase()) ||
        route.includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, statusFilter]);

  // ── Ações ──
  const handleStatusUpdate = useCallback(
    async (
      request: TravelRequest,
      newStatus: RequestStatus,
      comment: string,
      purchaseInfo?: Partial<PurchaseInfo>
    ) => {
      if (!comment && (newStatus === RequestStatus.PENDENTE_CORRECAO || newStatus === RequestStatus.REPROVADA)) {
        alert('Por favor, insira um comentário justificando a ação.');
        return;
      }

      setActionLoading(true);
      try {
        await changeRequestStatus(
          request.requestId,
          request.status,
          newStatus,
          request.audit.history,
          currentUser,
          comment,
          purchaseInfo
        );
        setSelectedRequest(null);
        setPurchaseForm(EMPTY_PURCHASE_FORM);
      } catch (err: any) {
        alert(err.message || 'Erro ao atualizar status');
      } finally {
        setActionLoading(false);
      }
    },
    [currentUser]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm('Excluir esta solicitação?')) return;
      await deleteTravelRequest(id);
    },
    []
  );

  const openDetails = useCallback((req: TravelRequest) => {
    setSelectedRequest(req);
    setPurchaseForm(EMPTY_PURCHASE_FORM);
  }, []);

  // ── Título da aba ──
  const tabTitle = useMemo(() => {
    if (view === 'requester') return 'Minhas Solicitações';
    if (view === 'hr') return 'Fila de Validação CH';
    if (view === 'buyer') return 'Fila de Compras';
    return 'Todas as Solicitações';
  }, [view]);

  // ── Renderização ──
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{tabTitle}</h1>
            <p className="text-slate-500 text-sm">Gerencie o fluxo de viagens corporativas.</p>
          </div>
          {isDemoMode && (
             <div className="px-2 py-1 bg-amber-50 text-amber-600 rounded border border-amber-200 text-[10px] font-bold uppercase tracking-widest">
               Modo Demo
             </div>
          )}
        </div>
        {view === 'requester' && (
          <button
            onClick={onCreate}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
          >
            Nova Solicitação
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-slate-400 italic text-sm font-medium">Sincronizando fila...</p>
        </div>
      ) : error && !isDemoMode ? (
        <div className="p-12 bg-red-50 border border-red-100 rounded-3xl text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-300 mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-red-900 tracking-tight">Acesso Interrompido</h3>
            <p className="text-sm text-red-700 opacity-70 max-w-sm mx-auto mt-1">
              Não conseguimos conectar à base de dados oficial. Por favor, verifique suas permissões no Firestore.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Filtros */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar passageiro ou destino..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white min-w-[180px] text-sm font-medium text-slate-600"
            >
              <option value="all">Todos os Status</option>
              {Object.values(RequestStatus).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Lista/Tabela */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
                  {filteredRequests.map((req) => {
                    const canEdit = canEditRequest(req.status, currentUser.role);
                    const canDel = canDeleteRequest(req.status, currentUser.role);
                    const departureRaw = req.travel.departureDateTime || req.audit.createdAt;
                    const dateObj = new Date(departureRaw);

                    return (
                      <tr key={req.requestId} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{getPassengerDisplayName(req)}</div>
                          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                            <ArrowRight className="w-3 h-3" />
                            {formatRoute(req)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600">{req.travel.reason}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-900 font-medium">
                            {format(dateObj, 'dd MMM yyyy', { locale: ptBR })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {format(dateObj, 'HH:mm')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn('px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm', getStatusColor(req.status))}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 font-semibold">
                            <button
                              onClick={() => openDetails(req)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Ver detalhes"
                            >
                              <Info className="w-5 h-5" />
                            </button>
                            {canEdit && (
                              <button
                                onClick={() => onEdit?.(req)}
                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                title="Editar"
                              >
                                <Edit2 className="w-5 h-5" />
                              </button>
                            )}
                            {canDel && (
                              <button
                                onClick={() => handleDelete(req.requestId)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
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
                  {filteredRequests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-3">
                          <p className="italic text-sm">Nenhuma solicitação encontrada para este filtro.</p>
                          {isDemoMode && <p className="text-[10px] uppercase font-bold text-amber-500">Modo Demo Ativo</p>}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal de Detalhes - Renderizado condicionalmente abaixo dos hooks */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden motion-safe:animate-in motion-safe:zoom-in-95 duration-200">
            {/* Header modal */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Ficha da Solicitação</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">ID: {selectedRequest.requestId.slice(0, 12)}</p>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)} 
                className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Corpo do modal */}
            <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-slate-200">
              {/* Informações Base */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                {[
                  { label: 'Passageiro', value: getPassengerDisplayName(selectedRequest) },
                  { label: 'CHAPA', value: selectedRequest.employee.chapa || '—' },
                  { label: 'Motivo', value: selectedRequest.travel.reason },
                  { label: 'Rota', value: formatRoute(selectedRequest) },
                  { label: 'Centro de Custo', value: selectedRequest.travel.costCenter },
                  { label: 'Projeto', value: selectedRequest.travel.projectCode || 'Consumo Interno' },
                  {
                    label: 'Partida',
                    value: selectedRequest.travel.departureDateTime
                      ? format(new Date(selectedRequest.travel.departureDateTime), 'dd/MM/yyyy HH:mm')
                      : 'Não informada',
                  },
                  {
                    label: 'Retorno',
                    value: selectedRequest.travel.returnDateTime
                      ? format(new Date(selectedRequest.travel.returnDateTime), 'dd/MM/yyyy HH:mm')
                      : 'Só Ida',
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{item.label}</label>
                    <p className="text-slate-800 font-semibold text-sm leading-tight">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Análise de Política */}
              {selectedRequest.validation.policyDecision && (
                <div className={cn(
                  "p-6 rounded-[24px] border border-black/5 shadow-sm transition-all duration-500",
                  selectedRequest.validation.policyDecision.result === PolicyResult.REJECTED ? "bg-red-50/50" :
                  selectedRequest.validation.policyDecision.result === PolicyResult.MANUAL_VALIDATION ? "bg-amber-50/50" :
                  "bg-emerald-50/50"
                )}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={cn(
                      "p-2.5 rounded-xl flex items-center justify-center shadow-sm",
                      selectedRequest.validation.policyDecision.result === PolicyResult.REJECTED ? "bg-red-100 text-red-600" :
                      selectedRequest.validation.policyDecision.result === PolicyResult.MANUAL_VALIDATION ? "bg-amber-100 text-amber-600" :
                      "bg-emerald-100 text-emerald-600"
                    )}>
                      {selectedRequest.validation.policyDecision.result === PolicyResult.APPROVED ? <CheckCircle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm tracking-tight italic">Policy Engine — Decisão</h4>
                      <p className="text-xs font-medium text-slate-600 mt-0.5 leading-relaxed">{selectedRequest.validation.policyDecision.summary}</p>
                    </div>
                  </div>

                  {/* Detalhes Técnicos */}
                   <div className="grid grid-cols-2 gap-3 mt-4">
                    {Object.entries(selectedRequest.validation.policyDecision.evidence).map(([k, v]) => (
                       <div key={k} className="bg-white/60 p-2.5 rounded-xl border border-black/5">
                         <label className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter block mb-0.5">{k}</label>
                         <span className="text-[11px] font-mono font-bold text-slate-700">{String(v || 'N/A')}</span>
                       </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botão de Histórico (Simples) */}
               <div className="pt-4 border-t border-slate-100">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Trilha de Auditoria</label>
                <div className="space-y-4">
                  {selectedRequest.audit.history.map((h, i) => (
                    <div key={i} className="flex gap-4 items-start group">
                      <div className="w-1 h-8 bg-slate-100 rounded-full group-last:bg-transparent -mb-4 mt-2" />
                      <div className="flex-1">
                         <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">{h.status}</span>
                            <span className="text-[10px] text-slate-400 font-medium italic">{format(new Date(h.updatedAt), 'dd MMM HH:mm')}</span>
                         </div>
                         <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                           <Loader2 className="w-2.5 h-2.5 animate-spin opacity-0 group-hover:opacity-100 transition-opacity" />
                           Atuado por: {h.updatedBy}
                         </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3 font-bold">
               <button 
                 onClick={() => setSelectedRequest(null)}
                 className="px-6 py-2.5 rounded-xl text-xs text-slate-500 hover:bg-slate-200 transition-all uppercase tracking-widest"
               >
                 Fechar
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
