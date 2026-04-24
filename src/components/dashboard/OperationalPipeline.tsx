import React from 'react';
import { ArrowRight, Clock, AlertCircle } from 'lucide-react';
import { OperationalStageMetric } from '../../domain/travelRequest.operationalMetrics';
import { cn } from '../../lib/utils';

interface Props {
  metrics: OperationalStageMetric[];
}

export const OperationalPipeline: React.FC<Props> = ({ metrics }) => {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
          1→4
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Pipeline Operacional</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Fluxo de solicitações por etapa crítica</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-stretch gap-2 lg:gap-4">
        {metrics.map((stage, i) => (
          <React.Fragment key={stage.key}>
            <div className="flex-1 flex flex-col gap-3 p-4 rounded-2xl bg-slate-50/50 border border-slate-50 hover:bg-slate-50 hover:border-slate-100 transition-all">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stage.label}</span>
                <span className={cn(
                  "text-lg font-black",
                  stage.overdue > 0 ? "text-red-600" : "text-slate-900"
                )}>
                  {stage.total}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full",
                      stage.withinSlaPercent > 90 ? "bg-emerald-500" : stage.withinSlaPercent > 70 ? "bg-amber-500" : "bg-red-500"
                    )}
                    style={{ width: `${stage.withinSlaPercent}%` }}
                  />
                </div>
                <span className="text-[10px] font-black text-slate-900">{stage.withinSlaPercent.toFixed(0)}%</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                  <Clock className="w-2.5 h-2.5" /> {stage.averageHoursInCurrentStage?.toFixed(1) || '0'}h
                </div>
                {stage.overdue > 0 && (
                  <div className="flex items-center gap-1 text-[9px] font-black text-red-600 animate-pulse">
                    <AlertCircle className="w-2.5 h-2.5" /> Gargalo
                  </div>
                )}
              </div>
            </div>

            {i < metrics.length - 1 && (
              <div className="flex items-center justify-center lg:py-0 py-2">
                <ArrowRight className="w-4 h-4 text-slate-200 hidden lg:block" />
                <div className="w-px h-4 bg-slate-100 lg:hidden" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
