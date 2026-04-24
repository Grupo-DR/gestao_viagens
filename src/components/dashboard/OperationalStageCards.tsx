import React from 'react';
import { Clock, AlertCircle, CheckCircle, Users, ShoppingCart, ShieldCheck } from 'lucide-react';
import { OperationalStageMetric } from '../../domain/travelRequest.operationalMetrics';
import { cn } from '../../lib/utils';

interface Props {
  metrics: OperationalStageMetric[];
}

const ICONS = {
  human_capital: Users,
  approval: ShieldCheck,
  available_for_purchase: ShoppingCart,
  purchase_in_progress: Clock
};

export const OperationalStageCards: React.FC<Props> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metrics.map(stage => {
        const Icon = ICONS[stage.key] || Clock;
        const avgHours = stage.averageHoursInCurrentStage ? stage.averageHoursInCurrentStage.toFixed(1) : '0';
        
        return (
          <div key={stage.key} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-5 group hover:border-indigo-200 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                <Icon className="w-6 h-6" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{stage.label}</span>
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-3xl font-black text-slate-900">{stage.total}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Solicitações</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-6 border-t border-slate-50 pt-5">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Permanência Média</span>
                <p className="text-sm font-black text-slate-900">{avgHours}h</p>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">SLA Configurado</span>
                <p className="text-sm font-black text-slate-900">{stage.slaHours / 24} dia útil</p>
              </div>
              
              <div className="space-y-1">
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block">Dentro do SLA</span>
                <p className="text-sm font-black text-emerald-600">{stage.withinSla}</p>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-[9px] font-black text-red-500 uppercase tracking-widest block">Fora do SLA</span>
                <p className="text-sm font-black text-red-600">{stage.overdue}</p>
              </div>
            </div>

            {stage.dueToday > 0 && (
              <div className="bg-amber-50 px-3 py-2 rounded-xl flex items-center justify-between">
                <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Vencem Hoje
                </span>
                <span className="text-xs font-black text-amber-700">{stage.dueToday}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
