import React from 'react';
import { PipelineStage } from '../../application/use-cases/buildOperationalDashboard';
import { cn } from '../../lib/utils';
import { ArrowRight, AlertCircle, Clock } from 'lucide-react';

interface Props {
  stages: PipelineStage[];
  loading?: boolean;
}

export const SlaPipeline: React.FC<Props> = ({ stages, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-pulse">
        <div className="h-4 w-48 bg-slate-100 rounded mb-6" />
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex-1 h-24 bg-slate-50 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Pipeline de Processo & SLA</h3>
        <span className="text-[10px] font-bold text-slate-400">Distribuição por Status</span>
      </div>

      <div className="flex flex-col lg:flex-row items-stretch gap-4">
        {stages.map((stage, i) => (
          <React.Fragment key={stage.status}>
            <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100/50 flex flex-col justify-between group hover:border-indigo-100 transition-all">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">{stage.label}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-black text-slate-900">{stage.count}</span>
                  <span className="text-[10px] font-bold text-slate-400">{stage.percentage.toFixed(0)}%</span>
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                {stage.overdueCount > 0 && (
                  <div className="flex items-center gap-1.5 text-red-600">
                    <AlertCircle className="w-3 h-3" />
                    <span className="text-[10px] font-black">{stage.overdueCount} Atrasados</span>
                  </div>
                )}
                {stage.dueTodayCount > 0 && (
                  <div className="flex items-center gap-1.5 text-amber-500">
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px] font-black">{stage.dueTodayCount} Hoje</span>
                  </div>
                )}
                {stage.overdue === 0 && stage.today === 0 && stage.count > 0 && (
                  <div className="text-[10px] font-bold text-emerald-500">Regular</div>
                )}
                {stage.count === 0 && (
                  <div className="text-[10px] font-bold text-slate-300 italic">Vazio</div>
                )}
              </div>
            </div>
            
            {i < stages.length - 1 && (
              <div className="hidden lg:flex items-center justify-center text-slate-200">
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
