import React from 'react';
import { Zap, Clock, TrendingDown, TrendingUp } from 'lucide-react';
import { CycleTimeComparison as CycleTimeType } from '../../domain/travelRequest.operationalMetrics';
import { cn } from '../../lib/utils';

interface Props {
  data: CycleTimeType;
}

const StageDetail = ({ label, urgentValue, nonUrgentValue }: { label: string; urgentValue: number | null; nonUrgentValue: number | null }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{label}</span>
    <div className="flex items-center gap-4">
      <span className="text-[10px] font-black text-indigo-600">{urgentValue?.toFixed(1) || '0'}h</span>
      <span className="text-[10px] font-black text-slate-400">{nonUrgentValue?.toFixed(1) || '0'}h</span>
    </div>
  </div>
);

export const CycleTimeComparison: React.FC<Props> = ({ data }) => {
  const GroupCard = ({ title, metrics, variant }: { title: string; metrics: any; variant: 'amber' | 'slate' }) => (
    <div className={cn(
      "flex-1 p-6 rounded-3xl border flex flex-col gap-6",
      variant === 'amber' ? "bg-amber-50/30 border-amber-100" : "bg-slate-50/30 border-slate-100"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            variant === 'amber' ? "bg-amber-100 text-amber-600" : "bg-slate-200 text-slate-600"
          )}>
            {variant === 'amber' ? <Zap className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">{title}</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase">{metrics.total} solicitações</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Ciclo Total Médio</span>
          <p className="text-2xl font-black text-slate-900">{metrics.averageCycleHours?.toFixed(1) || '0'}h</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Cap. Humano</span>
          <p className="text-xs font-black text-slate-700">{metrics.averageHumanCapitalHours?.toFixed(1) || '0'}h</p>
        </div>
        <div className="space-y-1 text-center">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Disp. Compra</span>
          <p className="text-xs font-black text-slate-700">{metrics.averageAvailableForPurchaseHours?.toFixed(1) || '0'}h</p>
        </div>
        <div className="space-y-1 text-right">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Em Processo</span>
          <p className="text-xs font-black text-slate-700">{metrics.averagePurchaseInProgressHours?.toFixed(1) || '0'}h</p>
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-black/5">
        <div className="flex justify-between items-end">
          <div className="space-y-0.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Saúde do SLA</span>
            <p className="text-xs font-black text-slate-900">{metrics.withinSlaPercent.toFixed(0)}% dentro do prazo</p>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase">
            {metrics.overdue} fora / {metrics.withinSla} dentro
          </p>
        </div>
        <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-1000",
              variant === 'amber' ? "bg-amber-500" : "bg-indigo-600"
            )}
            style={{ width: `${metrics.withinSlaPercent}%` }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Ciclo de Atendimento</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Comparativo Urgentes vs Normais</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <GroupCard title="Solicitações Urgentes" metrics={data.urgent} variant="amber" />
        <GroupCard title="Solicitações Normais" metrics={data.nonUrgent} variant="slate" />
      </div>
    </div>
  );
};
