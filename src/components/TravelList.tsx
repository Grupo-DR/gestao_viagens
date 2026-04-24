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
  isUrgentReason,
  isRequestUrgent,
  getStatusLabel
} from '../domain/travelRequest.rules';
import type { TravelRequest, HistoryEntry, PurchaseInfo, TravelSegment } from '../domain/types';
import { useIdentity } from '../application/identity/IdentityContext';
import { useTravelRequests, TravelListView } from '../application/hooks/useTravelRequests';
import { changeRequestStatus, deleteTravelRequest } from '../application/services/travelRequestService';
import { cn } from '../lib/utils';
import { UserRole } from '../domain/enums';
import { TravelRequestDetailsModal } from './travel/TravelRequestDetailsModal';
import { TravelListFilters } from './travel/TravelListFilters';

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
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null);
  const [buyerTab, setBuyerTab] = useState<'pending' | 'completed'>('pending');

  // Hooks de Dados e Estado (Sempre chamados no topo)
  const { requests, loading, error, isDemoMode } = useTravelRequests({
    view,
    userId: currentUser?.uid,
    user: currentUser,
    urgentOnly,
  });
  const [purchaseForm, setPurchaseForm] = useState<PurchaseFormState>(EMPTY_PURCHASE_FORM);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Filtragem local (estável) ──
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // Filtro específico para o Comprador (Abas de Pendentes vs Histórico)
      if (view === 'buyer') {
        const isCompleted = r.status === RequestStatus.EMITIDA || r.status === RequestStatus.CANCELADA;
        if (buyerTab === 'pending' && isCompleted) return false;
        if (buyerTab === 'completed' && !isCompleted) return false;
      }

      const name = getPassengerDisplayName(r).toLowerCase();
      const route = formatRoute(r).toLowerCase();
      const matchesSearch =
        name.includes(searchTerm.toLowerCase()) ||
        route.includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, statusFilter, view, buyerTab]);

  // ── Ações ──
  const handleStatusUpdate = useCallback(
    async (
      request: TravelRequest,
      newStatus: RequestStatus,
      comment: string,
      purchaseInfo?: Partial<PurchaseInfo>,
      updatedSegments?: TravelSegment[]
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
          purchaseInfo,
          updatedSegments,
          request.travel.segments // Snapshot original
        );
        setSelectedRequest(null);
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
    if (view === 'all' && currentUser?.role === UserRole.GESTOR) return 'Fila do Centro de Custo';
    return 'Todas as Solicitações';
  }, [view, currentUser?.role]);
  

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
        {onCreate && (
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
          {/* Abas Especiais para o Comprador */}
          {view === 'buyer' && (
            <div className="flex items-center gap-1 p-1 bg-slate-100/50 rounded-2xl w-fit border border-slate-200/60 mb-2">
              <button
                onClick={() => setBuyerTab('pending')}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                  buyerTab === 'pending' 
                    ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                Para Comprar
              </button>
              <button
                onClick={() => setBuyerTab('completed')}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                  buyerTab === 'completed' 
                    ? "bg-white text-emerald-600 shadow-sm ring-1 ring-black/5" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                Histórico / Concluídas
              </button>
            </div>
          )}

          {/* Filtros Isolados */}
          <TravelListFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            urgentOnly={urgentOnly}
            onUrgentOnlyChange={setUrgentOnly}
          />

          {/* Lista/Tabela */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Passageiro / Rota</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Motivo</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data Solicitação</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredRequests.map((req) => {
                    const canEdit = canEditRequest(req.status, currentUser.role);
                    const canDel = canDeleteRequest(req.status, currentUser.role);
                    const dateObj = new Date(req.audit.createdAt);
                    const isUrgent = isRequestUrgent(req);

                    return (
                      <tr 
                        key={req.requestId} 
                        className={cn(
                          "transition-colors group", 
                          isUrgent ? "bg-red-50/50 hover:bg-red-100/50 ring-1 ring-inset ring-red-200" : "hover:bg-slate-50/50"
                        )}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            {isUrgent && (
                              <div className="relative flex h-2.5 w-2.5 flex-shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600 shadow-sm"></span>
                              </div>
                            )}
                            <div className="font-semibold text-slate-900">{getPassengerDisplayName(req)}</div>
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5 ml-[18px]">
                            <ArrowRight className="w-3 h-3" />
                            {formatRoute(req)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-start gap-1">
                            <span className={cn("text-sm whitespace-nowrap", isUrgent ? "text-red-900 font-bold" : "text-slate-600")}>
                              {req.travel.reason}
                            </span>
                            {isUrgent && (
                              <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[9px] font-black uppercase tracking-widest border border-red-200 flex items-center gap-1 shadow-sm whitespace-nowrap">
                                🚨 SLA CURTO
                              </span>
                            )}
                          </div>
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
                          <span className={cn('px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm whitespace-nowrap', getStatusColor(req.status))}>
                            {getStatusLabel(req.status)}
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

      {/* Modal de Detalhes - Componente Modularizado */}
      {selectedRequest && (
        <TravelRequestDetailsModal
          request={selectedRequest}
          currentUserRole={currentUser.role}
          onClose={() => setSelectedRequest(null)}
          onUpdateStatus={handleStatusUpdate}
          isUpdating={actionLoading}
        />
      )}
    </div>
  );
}
