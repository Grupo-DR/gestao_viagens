// ============================================================
// PRESENTATION — TravelList (Sprint Final)
// View modularizada: orquestra subcomponentes de src/components/travel/
// Lógica delegada aos hooks useTravelRequests e useTravelRequestActions.
// ============================================================

import React, { useState, useMemo } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { TravelRequest } from '../domain/types.ts';
import { useIdentity } from '../application/identity/IdentityContext.tsx';
import { useTravelRequests, TravelListView } from '../application/hooks/useTravelRequests.ts';
import { useTravelRequestActions } from '../application/hooks/useTravelRequestActions.ts';
import { getPassengerDisplayName, formatRoute } from '../domain/travelRequest.rules.ts';

// Subcomponentes Modulares
import { TravelListFilters } from './travel/TravelListFilters.tsx';
import { TravelRequestsTable } from './travel/TravelRequestsTable.tsx';
import { TravelRequestDetailsModal } from './travel/TravelRequestDetailsModal.tsx';
import { UserRole } from '../domain/enums.ts';

interface TravelListProps {
  view: TravelListView;
  onEdit?: (request: TravelRequest) => void;
  onCreate?: () => void;
}

export function TravelList({ view, onEdit, onCreate }: TravelListProps) {
  const { currentUser } = useIdentity();
  
  // 1. Hook de Dados (Sincronização)
  const { requests, loading, error, isDemoMode } = useTravelRequests({
    view,
    userId: currentUser?.uid ?? '',
  });

  // 2. Hook de Ações Operacionais (Garante feedback via Toast e tratamento unknown)
  const { handleStatusUpdate, handleDelete, isUpdating } = useTravelRequestActions();

  // 3. Estado Local de UI
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null);

  // 4. Filtragem Local (Otimizada com useMemo)
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

  // 5. Título Dinâmico
  const tabTitle = useMemo(() => {
    switch (view) {
      case 'requester': return 'Minhas Solicitações';
      case 'hr': return 'Fila de Validação CH';
      case 'buyer': return 'Fila de Compras';
      default: return 'Todas as Solicitações';
    }
  }, [view]);

  // Renderização
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
           </div>
           <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{tabTitle}</h1>
              <p className="text-slate-500 font-medium text-sm">Gerencie o fluxo operacional de viagens corporativas.</p>
           </div>
           {isDemoMode && (
              <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg border border-amber-200 text-[10px] font-black uppercase tracking-widest self-start mt-1">
                Modo Demo
              </span>
           )}
        </div>
        
        {view === 'requester' && (
          <button
            onClick={onCreate}
            className="group bg-blue-600 text-white px-8 py-3.5 rounded-[20px] font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center gap-3 active:scale-95"
          >
            <span>Nova Solicitação</span>
            <div className="w-6 h-6 bg-blue-500 text-white rounded-lg flex items-center justify-center group-hover:rotate-90 transition-transform">
               <span className="font-bold">+</span>
            </div>
          </button>
        )}

      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6 bg-white/50 rounded-[40px] border-2 border-dashed border-slate-100">
          <div className="relative">
             <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
             <div className="absolute inset-0 bg-blue-600/10 blur-xl rounded-full" />
          </div>
          <p className="text-slate-400 italic text-sm font-bold tracking-tight uppercase">Sincronizando fila de voos...</p>
        </div>
      ) : error && !isDemoMode ? (
        <div className="p-16 bg-red-50/50 border-2 border-red-100 rounded-[40px] text-center space-y-5 animate-in slide-in-from-top-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
             <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black text-red-900 tracking-tight">Acesso Interrompido</h3>
            <p className="text-sm text-red-700/70 font-medium max-w-sm mx-auto mt-2 leading-relaxed">
              Não conseguimos conectar à base de dados oficial. Por favor, verifique sua conexão ou permissões no Firestore.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filtros e Busca */}
          <TravelListFilters 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />

          {/* Tabela de Dados */}
          <TravelRequestsTable 
            requests={filteredRequests}
            currentUserRole={currentUser.role}
            onViewDetails={setSelectedRequest}
            onEdit={onEdit}
            onDelete={handleDelete}
            isDemoMode={isDemoMode}
          />
        </div>
      )}

      {/* Modal de Detalhes e Ações (Renderizado apenas quando selecionado) */}
      {selectedRequest && (
        <TravelRequestDetailsModal 
          request={selectedRequest}
          currentUserRole={currentUser.role}
          onClose={() => setSelectedRequest(null)}
          onUpdateStatus={handleStatusUpdate}
          isUpdating={isUpdating}
        />
      )}

    </div>
  );
}
