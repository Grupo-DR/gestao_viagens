import React from 'react';
import { TrendingUp, AlertCircle, AlertTriangle, CheckCircle2, Info, ArrowUpRight } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { FinancialInsight, FinancialInsightSeverity } from '../../../application/use-cases/buildFinancialInsights';

interface ExecutiveInsightsCardProps {
  insights: FinancialInsight[];
}

const SEVERITY_CONFIG: Record<FinancialInsightSeverity, { 
  bg: string; 
  border: string; 
  text: string; 
  label: string;
  icon: any;
}> = {
  critical: { 
    bg: 'bg-rose-50/50', 
    border: 'border-rose-100', 
    text: 'text-rose-700', 
    label: 'Crítico',
    icon: AlertCircle
  },
  attention: { 
    bg: 'bg-orange-50/50', 
    border: 'border-orange-100', 
    text: 'text-orange-700', 
    label: 'Atenção',
    icon: AlertTriangle
  },
  warning: { 
    bg: 'bg-amber-50/50', 
    border: 'border-amber-100', 
    text: 'text-amber-700', 
    label: 'Aviso',
    icon: Info
  },
  ok: { 
    bg: 'bg-emerald-50/50', 
    border: 'border-emerald-100', 
    text: 'text-emerald-700', 
    label: 'OK',
    icon: CheckCircle2
  },
  info: { 
    bg: 'bg-sky-50/50', 
    border: 'border-sky-100', 
    text: 'text-sky-700', 
    label: 'Info',
    icon: Info
  }
};

export const ExecutiveInsightsCard: React.FC<ExecutiveInsightsCardProps> = ({ insights }) => {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col h-full xl:h-[410px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-orange-50 rounded-xl">
          <TrendingUp className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Insights Executivos</p>
          <p className="text-lg font-black text-slate-900 leading-tight mt-1">Alertas da Operação</p>
        </div>
      </div>

      {/* Lista de Insights com Scrollbar customizada */}
      <div className="flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
        <div className="flex flex-col gap-3 pb-2">
          {insights.map((item) => {
            const config = SEVERITY_CONFIG[item.severity];
            const Icon = config.icon;
            return (
              <div 
                key={item.id}
                className={cn(
                  "p-4 rounded-xl border flex items-center gap-4 transition-all hover:bg-white/50",
                  config.bg,
                  config.border
                )}
              >
                <div className="flex-shrink-0">
                  <Icon className={cn("w-4 h-4", config.text)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded-full bg-white/60", config.text)}>
                      {config.label}
                    </span>
                    {item.metric && (
                      <span className="text-[9px] font-bold text-slate-500 tabular-nums">
                        {item.metric.label}: {item.metric.value}
                      </span>
                    )}
                  </div>
                  <p className={cn("text-xs font-black leading-tight mb-1", config.text)}>
                    {item.title}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed break-words">
                    {item.message}
                  </p>
                  {item.recommendation && (
                    <div className="mt-2 flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                        <ArrowUpRight className="w-2.5 h-2.5" />
                        <span>{item.recommendation}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};
