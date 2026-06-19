import React, { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  FileSpreadsheet,
  Info,
  Loader2,
  Calendar,
  ArrowRight,
  ShieldCheck,
  ShoppingCart,
  UserCheck,
  Ticket,
  Clock,
  ChevronRight,
  XCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useTravelRequests } from '../../application/hooks/useTravelRequests';
import { useIdentity } from '../../application/identity/IdentityContext';
import { RequestStatus, UserRole, TravelReason } from '../../domain/enums';
import type { TravelRequest } from '../../domain/types';
import {
  getPassengerDisplayName,
  formatRoute,
  getStatusLabel,
  getStatusColor
} from '../../domain/travelRequest.rules';
import {
  getSubmissionDate,
  getHrValidationDetails,
  getPurchaseQueueDate,
  getPurchaseReleasedDate,
  getTicketIssuedDate,
  getHrValidationDuration,
  getPurchaseDuration,
  getTotalDuration,
  getDurationInHours,
  formatDurationFromHours,
  HrValidationDetails,
  formatLeavePeriod,
  getPurchasePolicyStatus
} from '../../domain/travelRequest.audit';
import { TravelRequestDetailsModal } from './TravelRequestDetailsModal';
import { changeRequestStatus } from '../../application/services/travelRequestService';
import { cn } from '../../lib/utils';

// Helper de formatação de data
function formatAuditDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  } catch {
    return '—';
  }
}

export function AuditList() {
  const { currentUser } = useIdentity();
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
  
  // Modal de Detalhes
  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Hook de dados (busca todas as solicitações)
  const { requests, loading, error, isDemoMode } = useTravelRequests({
    view: 'all',
    userId: currentUser?.uid,
    user: currentUser,
  });

  // 1. Filtrar apenas motivos de afastamento (leaveRequests)
  const leaveRequests = useMemo(() => {
    return requests.filter((r) => {
      const reason = r.travel?.reason;
      return (
        reason === TravelReason.FOLGA ||
        reason === TravelReason.FERIAS ||
        reason === TravelReason.FOLGA_FERIAS
      );
    });
  }, [requests]);

  // 2. Pré-filtrar por status e motivo para a contagem de políticas
  const preFilteredRequests = useMemo(() => {
    return leaveRequests.filter((r) => {
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchesReason = reasonFilter === 'all' || r.travel.reason === reasonFilter;
      return matchesStatus && matchesReason;
    });
  }, [leaveRequests, statusFilter, reasonFilter]);

  // 3. Contagem de políticas baseada no conjunto pré-filtrado
  const policyCounts = useMemo(() => {
    const counts = {
      VENCIDA: 0,
      NAO_RECOMENDAVEL: 0,
      ALTA: 0,
      MEDIA: 0,
      IDEAL: 0,
      REGULAR: 0,
    };
    preFilteredRequests.forEach((r) => {
      const policy = getPurchasePolicyStatus(r).category;
      if (policy in counts) {
        counts[policy]++;
      }
    });
    return counts;
  }, [preFilteredRequests]);

  // Lógica de cálculo do Card de Eficiência
  const efficiencyMetrics = useMemo(() => {
    const total = preFilteredRequests.length;
    if (total === 0) {
      return { pctIdeal: 0, pctMedia: 0, pctAlta: 0, pctNaoRec: 0, pctVencida: 0, score: 0 };
    }
    const pctIdeal = Math.round((policyCounts.IDEAL / total) * 100);
    const pctMedia = Math.round((policyCounts.MEDIA / total) * 100);
    const pctAlta = Math.round((policyCounts.ALTA / total) * 100);
    const pctNaoRec = Math.round((policyCounts.NAO_RECOMENDAVEL / total) * 100);
    const pctVencida = Math.round((policyCounts.VENCIDA / total) * 100);
    
    // Score de Eficiência: Ideal + Média
    const score = Math.round(((policyCounts.IDEAL + policyCounts.MEDIA) / total) * 100);
    
    return { pctIdeal, pctMedia, pctAlta, pctNaoRec, pctVencida, score };
  }, [preFilteredRequests, policyCounts]);

  // 4. Filtrar finalmente por política para a tabela/excel
  const filteredRequests = useMemo(() => {
    return preFilteredRequests.filter((r) => {
      if (!selectedPolicy) return true;
      return getPurchasePolicyStatus(r).category === selectedPolicy;
    });
  }, [preFilteredRequests, selectedPolicy]);

  // Handler de atualização de status (caso precise agir por dentro da ficha a partir da auditoria)
  const handleStatusUpdate = useCallback(
    async (
      request: TravelRequest,
      newStatus: RequestStatus,
      comment: string,
      purchaseInfo?: any,
      updatedSegments?: any
    ) => {
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
          request.travel.segments
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

  // Exportação Excel específica de Auditoria
  const handleExportExcel = () => {
    const rows = filteredRequests.map((r) => {
      const hrDetails = getHrValidationDetails(r);
      const queueDate = getPurchaseQueueDate(r);
      const releaseDate = getPurchaseReleasedDate(r);
      const issuedDate = getTicketIssuedDate(r);

      return {
        'Protocolo': r.requestId.slice(0, 8).toUpperCase(),
        'Passageiro': getPassengerDisplayName(r),
        'Solicitante': r.requester.requesterName || r.requester.requesterEmail,
        'Tipo': r.employee.passengerType === 'internal' ? 'Interno' : 'Externo',
        'Centro de Custo': r.travel.costCenter,
        'Motivo': r.travel.reason,
        'Itinerário': formatRoute(r),
        'Afastamento / Férias': formatLeavePeriod(r),
        'Política de Compra': `${getPurchasePolicyStatus(r).label} (${getPurchasePolicyStatus(r).sub})`,
        'Data Solicitação': formatAuditDate(getSubmissionDate(r)),
        'Passou pelo CH?': r.validation.validationRequired ? 'Sim' : 'Não',
        'Status CH': hrDetails.label,
        'Data Decisão CH': hrDetails.date ? formatAuditDate(hrDetails.date) : '—',
        'Tempo Validação CH': getHrValidationDuration(r),
        'Entrou Fila Compras': queueDate ? formatAuditDate(queueDate) : '—',
        'Liberado para Compra': releaseDate ? formatAuditDate(releaseDate) : '—',
        'Tempo Emissão': getPurchaseDuration(r),
        'Passagem Emitida': issuedDate ? formatAuditDate(issuedDate) : '—',
        'Tempo Total': getTotalDuration(r),
        'Status Atual': getStatusLabel(r.status)
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    
    // Larguras de coluna
    worksheet['!cols'] = [
      { wch: 12 }, // Protocolo
      { wch: 25 }, // Passageiro
      { wch: 25 }, // Solicitante
      { wch: 10 }, // Tipo
      { wch: 30 }, // Centro de Custo
      { wch: 18 }, // Motivo
      { wch: 35 }, // Itinerário
      { wch: 25 }, // Afastamento / Férias
      { wch: 25 }, // Política de Compra
      { wch: 20 }, // Data Solicitação
      { wch: 16 }, // Passou pelo CH?
      { wch: 15 }, // Status CH
      { wch: 20 }, // Data Decisão CH
      { wch: 20 }, // Tempo Validação CH
      { wch: 20 }, // Entrou Fila Compras
      { wch: 20 }, // Liberado para Compra
      { wch: 20 }, // Tempo Emissão
      { wch: 20 }, // Passagem Emitida
      { wch: 20 }, // Tempo Total
      { wch: 22 }  // Status Atual
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Auditoria de Viagens');
    
    const today = format(new Date(), 'yyyy-MM-dd_HH-mm');
    XLSX.writeFile(workbook, `auditoria_passagens_${today}.xlsx`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[1.5rem] bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-200">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Auditoria de Prazos e Transições</h1>
            <p className="text-slate-500 text-sm">Acompanhe a timeline completa de solicitações, pareceres de CH e emissão de bilhetes.</p>
          </div>
          {isDemoMode && (
            <div className="px-2 py-1 bg-amber-50 text-amber-600 rounded border border-amber-200 text-[10px] font-bold uppercase tracking-widest">
              Modo Demo
            </div>
          )}
        </div>
        
        <button
          onClick={handleExportExcel}
          disabled={filteredRequests.length === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-100 disabled:opacity-40 disabled:pointer-events-none"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Exportar Relatório Auditoria
        </button>
      </div>

      {/* Grid de Bento Boxes (Monitoramento de Políticas de Compra) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Card 1: Eficiência de Compra (Substitui o Vencida/Atrasado) */}
        <div className="relative flex flex-col justify-between h-32 p-5 rounded-[28px] border-2 bg-white/80 backdrop-blur-sm border-slate-100 hover:border-purple-200 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 overflow-hidden">
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-3xl -mr-12 -mt-12" />
          
          <div className="flex justify-between items-start relative z-10 w-full">
             <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-black uppercase tracking-[0.15em] leading-tight text-slate-900">
                  Eficiência de Compra
                </span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-slate-900">
                  Ideal + Média Atenção
                </span>
             </div>
             <div className="text-right">
               <span className={cn(
                 "text-2xl font-black leading-none",
                 efficiencyMetrics.score >= 70
                   ? "text-emerald-600"
                   : efficiencyMetrics.score >= 40
                     ? "text-orange-500"
                     : "text-red-500"
               )}>
                 {efficiencyMetrics.score}%
               </span>
             </div>
          </div>

          {/* Stacked Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex relative z-10 my-2">
            <div style={{ width: `${efficiencyMetrics.pctIdeal}%` }} className="bg-blue-500 h-full" title={`Ideal: ${efficiencyMetrics.pctIdeal}%`} />
            <div style={{ width: `${efficiencyMetrics.pctMedia}%` }} className="bg-orange-500 h-full" title={`Média: ${efficiencyMetrics.pctMedia}%`} />
            <div style={{ width: `${efficiencyMetrics.pctAlta}%` }} className="bg-red-500 h-full" title={`Alta: ${efficiencyMetrics.pctAlta}%`} />
            <div style={{ width: `${efficiencyMetrics.pctNaoRec}%` }} className="bg-purple-500 h-full" title={`Não Recomendável: ${efficiencyMetrics.pctNaoRec}%`} />
            <div style={{ width: `${efficiencyMetrics.pctVencida}%` }} className="bg-red-900 h-full" title={`Vencida: ${efficiencyMetrics.pctVencida}%`} />
          </div>
          
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 relative z-10 text-xs font-bold text-slate-900">
            <div className="flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              <span>Ideal: {efficiencyMetrics.pctIdeal}%</span>
            </div>
            <div className="flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
              <span>Média: {efficiencyMetrics.pctMedia}%</span>
            </div>
            <div className="flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <span>Alta: {efficiencyMetrics.pctAlta}%</span>
            </div>
            <div className="flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
              <span>Não Rec: {efficiencyMetrics.pctNaoRec}%</span>
            </div>
          </div>
        </div>

        {/* Demais 4 Cards de Políticas de Risco */}
        {[
          { id: 'NAO_RECOMENDAVEL', label: 'Não Recomendável', color: 'bg-purple-600', sub: 'Urgência Máxima' },
          { id: 'ALTA', label: 'Alta Atenção', color: 'bg-red-500', sub: '30-45 dias' },
          { id: 'MEDIA', label: 'Média Atenção', color: 'bg-orange-500', sub: '45-60 dias' },
          { id: 'IDEAL', label: 'Ideal para Compra', color: 'bg-blue-600', sub: '60-90 dias' },
        ].map((cat) => {
          const count = policyCounts[cat.id as keyof typeof policyCounts] || 0;
          const isActive = selectedPolicy === cat.id;
          const isDisabled = count === 0 && !isActive;

          return (
            <button
              key={cat.id}
              disabled={isDisabled}
              onClick={() => setSelectedPolicy(isActive ? null : cat.id)}
              className={cn(
                "relative group flex flex-col justify-between h-32 p-5 rounded-[28px] border-2 transition-all duration-500 text-left overflow-hidden",
                isActive 
                  ? `${cat.color} border-transparent shadow-[0_20px_40px_rgba(0,0,0,0.1)] ring-8 ring-slate-100/50 scale-[1.03] z-10` 
                  : isDisabled 
                    ? "bg-slate-50/50 border-slate-100 opacity-40 grayscale cursor-not-allowed"
                    : "bg-white/80 backdrop-blur-sm border-slate-100 hover:border-purple-200 hover:shadow-2xl hover:shadow-slate-200/50"
              )}
            >
              {/* Decorative Background Glow */}
              {isActive && <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 blur-3xl -mr-12 -mt-12" />}
              
              <div className="flex justify-between items-start relative z-10 w-full">
                 <div className="flex flex-col gap-0.5">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-[0.15em] leading-tight",
                      isActive ? "text-white/80" : "text-slate-400"
                    )}>
                      {cat.label}
                    </span>
                    <span className={cn(
                      "text-[8px] font-bold uppercase tracking-widest",
                      isActive ? "text-white/50" : "text-slate-300"
                    )}>
                      {cat.sub}
                    </span>
                 </div>
                 {isActive && <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_12px_rgba(255,255,255,1)]" />}
              </div>
              
              <div className="flex items-baseline gap-1.5 mt-auto relative z-10">
                <span className={cn(
                  "text-4xl font-black tracking-tighter leading-none",
                  isActive ? "text-white" : "text-slate-900"
                )}>
                  {count}
                </span>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-wider",
                  isActive ? "text-white/60" : "text-slate-400"
                )}>
                  Emissões
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="bg-white/60 backdrop-blur-xl p-2.5 rounded-[32px] border border-slate-200 shadow-[0_8px_32px_rgba(15,23,42,0.04)] flex flex-col md:flex-row items-center gap-3">
        {/* Filtro por Motivo */}
        <div className="flex-1 min-w-0 w-full bg-white/40 rounded-[24px] border border-slate-100 px-5 py-2.5 hover:border-purple-200 transition-colors">
          <label className="block mb-1 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Motivo da Viagem</label>
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-xs font-black text-slate-700 appearance-none cursor-pointer"
          >
            <option value="all">Todos os Motivos</option>
            <option value={TravelReason.FOLGA}>Folga</option>
            <option value={TravelReason.FERIAS}>Férias</option>
            <option value={TravelReason.FOLGA_FERIAS}>Folga + Férias</option>
          </select>
        </div>

        <div className="hidden md:flex items-center text-slate-300">
          <ChevronRight className="w-5 h-5 opacity-40" />
        </div>

        {/* Filtro por Status */}
        <div className="flex-1 min-w-0 w-full bg-white/40 rounded-[24px] border border-slate-100 px-5 py-2.5 hover:border-purple-200 transition-colors">
          <label className="block mb-1 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Status da Solicitação</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-xs font-black text-slate-700 appearance-none cursor-pointer"
          >
            <option value="all">Todos os Status</option>
            <option value={RequestStatus.RASCUNHO}>Rascunho</option>
            <option value={RequestStatus.ENVIADA}>Enviada</option>
            <option value={RequestStatus.EM_VALIDACAO_CH}>Em Validação CH</option>
            <option value={RequestStatus.AGUARDANDO_APROVACAO_COMPRA}>Aguardando Aprovação Compra</option>
            <option value={RequestStatus.DISPONIVEL_PARA_COMPRA}>Disponível para Compra</option>
            <option value={RequestStatus.EM_PROCESSO_DE_COMPRA}>Em Processo de Compra</option>
            <option value={RequestStatus.EMITIDA}>Emitida</option>
            <option value={RequestStatus.CANCELADA}>Cancelada</option>
            <option value={RequestStatus.REPROVADA}>Reprovada</option>
          </select>
        </div>

        {/* Limpar Filtros */}
        {(selectedPolicy !== null || reasonFilter !== 'all' || statusFilter !== 'all') && (
          <button
            onClick={() => {
              setSelectedPolicy(null);
              setReasonFilter('all');
              setStatusFilter('all');
            }}
            className="w-full md:w-auto px-6 py-4 bg-slate-900 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-purple-600 hover:shadow-2xl hover:shadow-purple-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0"
          >
            <XCircle className="w-4 h-4" /> Limpar Filtros
          </button>
        )}
      </div>

      {/* Tabela de Auditoria */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-slate-400 italic text-sm font-medium">Carregando painel de auditoria...</p>
        </div>
      ) : error ? (
        <div className="p-12 bg-red-50 border border-red-100 rounded-3xl text-center space-y-4">
          <p className="text-sm text-red-700 font-medium">Erro ao carregar auditoria: {error}</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Passageiro / Rota / CC</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo / Afastamento</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Política de Compra</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Solicitado em
                    </div>
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                      Parecer CH
                    </div>
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <ShoppingCart className="w-3.5 h-3.5 text-slate-400" />
                      Fila de Compras
                    </div>
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5 text-slate-400" />
                      Emissão Bilhete
                    </div>
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                {filteredRequests.map((r) => {
                  const hrDetails = getHrValidationDetails(r);
                  const submissionDate = getSubmissionDate(r);
                  const queueDate = getPurchaseQueueDate(r);
                  const releaseDate = getPurchaseReleasedDate(r);
                  const issuedDate = getTicketIssuedDate(r);

                  return (
                    <tr key={r.requestId} className="hover:bg-slate-50/40 transition-colors group">
                      {/* Passageiro / Rota / CC */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 truncate max-w-[200px]">
                          {getPassengerDisplayName(r)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                          Solicitante: <span className="text-slate-800 font-bold">{r.requester.requesterName || r.requester.requesterEmail}</span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5 uppercase">
                          {r.requestId.slice(0, 8)} • {r.employee.passengerType === 'internal' ? 'Colaborador' : 'Terceiro'}
                        </div>
                        
                        {/* Divisor sutil */}
                        <div className="h-px bg-slate-100 my-2" />

                        <div className="text-xs text-slate-800 font-bold truncate max-w-[250px]" title={r.travel.costCenter}>
                          {r.travel.costCenter}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <ArrowRight className="w-3 h-3 text-slate-300" />
                          {formatRoute(r)}
                        </div>
                      </td>

                      {/* Motivo / Afastamento */}
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-700 font-bold">{r.travel.reason}</div>
                        {formatLeavePeriod(r) !== '—' ? (
                          <div className="mt-1.5 text-[10px] text-slate-500 font-medium flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg w-fit">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{formatLeavePeriod(r)}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-300 mt-1.5 italic">—</div>
                        )}
                      </td>

                      {/* Política de Compra */}
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex flex-col items-center justify-center px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border w-[130px] text-center leading-none shadow-sm",
                          getPurchasePolicyStatus(r).colorClass
                        )}>
                          <span>{getPurchasePolicyStatus(r).label}</span>
                          <span className="text-[7px] opacity-80 mt-0.5 font-bold tracking-normal uppercase">{getPurchasePolicyStatus(r).sub}</span>
                        </span>
                      </td>

                      {/* Solicitado em */}
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-900 font-bold">
                          {formatAuditDate(submissionDate).split(' ')[0]}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatAuditDate(submissionDate).split(' ')[1] || ''}
                        </div>
                      </td>

                      {/* Parecer CH */}
                      <td className="px-6 py-4">
                        {hrDetails.status === 'na' ? (
                          <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100/50 px-2 py-0.5 rounded-md border border-slate-200/40">
                            Não aplicável
                          </span>
                        ) : hrDetails.status === 'pending' ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50 w-fit">
                              <Clock className="w-2.5 h-2.5" />
                              Pendente
                            </span>
                          </div>
                        ) : hrDetails.status === 'approved' ? (
                          <div className="space-y-0.5">
                            <span className="inline-block text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
                              Aprovada
                            </span>
                            <div className="text-[10px] text-slate-700 font-semibold">{formatAuditDate(hrDetails.date).split(' ')[0]}</div>
                            <div className="text-[9px] text-slate-400">{formatAuditDate(hrDetails.date).split(' ')[1] || ''}</div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-block text-[9px] font-black uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200/50">
                              Reprovada
                            </span>
                            <div className="text-[10px] text-slate-700 font-semibold">{formatAuditDate(hrDetails.date).split(' ')[0]}</div>
                            <div className="text-[9px] text-slate-400">{formatAuditDate(hrDetails.date).split(' ')[1] || ''}</div>
                          </div>
                        )}
                      </td>

                      {/* Fila de Compras */}
                      <td className="px-6 py-4">
                        {queueDate ? (
                          <div className="space-y-1">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] font-bold text-slate-400 uppercase">Entrada na fila:</span>
                              <span className="text-xs text-slate-800 font-bold">{formatAuditDate(queueDate).split(' ')[0]} {formatAuditDate(queueDate).split(' ')[1] || ''}</span>
                            </div>
                            {releaseDate && (
                              <div className="flex flex-col gap-0.5 border-t border-slate-100 pt-1">
                                <span className="text-[9px] font-bold text-emerald-600 uppercase">Liberado para compra:</span>
                                <span className="text-xs text-slate-800 font-bold">{formatAuditDate(releaseDate).split(' ')[0]} {formatAuditDate(releaseDate).split(' ')[1] || ''}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic font-medium">Aguardando etapas</span>
                        )}
                      </td>

                      {/* Emissão Bilhete */}
                      <td className="px-6 py-4">
                        {issuedDate ? (
                          <div className="space-y-0.5">
                            <span className="inline-block text-[9px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/50">
                              Emitido
                            </span>
                            <div className="text-xs text-slate-800 font-bold">{formatAuditDate(issuedDate).split(' ')[0]}</div>
                            <div className="text-[9px] text-slate-400">{formatAuditDate(issuedDate).split(' ')[1] || ''}</div>
                          </div>
                        ) : r.status === RequestStatus.CANCELADA ? (
                          <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-red-500 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                            Cancelado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100/50 px-2 py-0.5 rounded-md border border-slate-200/40">
                            Pendente
                          </span>
                        )}
                      </td>

                      {/* Ficha */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedRequest(r)}
                          className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all shadow-sm bg-white border border-slate-100"
                          title="Visualizar Workflow Completo"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-slate-400">
                      <p className="italic text-sm">Nenhuma solicitação encontrada para auditoria com os filtros ativos.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Detalhes integrado */}
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
