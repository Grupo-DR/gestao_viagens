import React, { useMemo, useState } from 'react';
import { useTravelRequests } from '../../application/hooks/useTravelRequests';
import { useIdentity } from '../../application/identity/IdentityContext';
import { buildOperationalDashboard, DashboardFilters } from '../../application/use-cases/buildOperationalDashboard';
import { OperationalFilters } from './OperationalFilters';
import { OperationalStageCards } from './OperationalStageCards';
import { CycleTimeComparison } from './CycleTimeComparison';
import { AttentionQueueTable } from './AttentionQueueTable';
import { Loader2 } from 'lucide-react';

export const OperationalDashboard: React.FC = () => {
  const { currentUser } = useIdentity();
  const { requests, loading } = useTravelRequests({ 
    view: 'all', 
    user: currentUser 
  });

  const now = new Date();
  
  const [filters, setFilters] = useState<DashboardFilters>({
    year: now.getFullYear(),
    month: now.getMonth() + 1
  });

  const dashboardData = useMemo(() => 
    buildOperationalDashboard(requests, filters, now),
    [requests, filters]
  );

  const availableCostCenters = useMemo(() => {
    const ccs = new Set(requests.map(r => r.travel.costCenter));
    return Array.from(ccs).sort();
  }, [requests]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Calculando métricas operacionais...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* 1. Filtros Operacionais */}
      <OperationalFilters 
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters({ year: now.getFullYear(), month: now.getMonth() + 1 })}
        availableCostCenters={availableCostCenters}
      />

      {/* 2. Cards de Etapas Críticas (HC, Disp. Compra, Em Processo) */}
      <OperationalStageCards metrics={dashboardData.metrics} />

      {/* 3. Ciclo de Atendimento (Urgentes vs Normais) */}
      <CycleTimeComparison data={dashboardData.cycleTime} />

      {/* 4. Fila de Atenção (Largura Total) */}
      <div className="space-y-4">
        <AttentionQueueTable items={dashboardData.attentionQueue} />
      </div>
    </div>
  );
};
