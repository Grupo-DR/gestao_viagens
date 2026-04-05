import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { HistoryEntry } from '../../domain/types.ts';
import { cn } from '../../lib/utils.ts';

interface AuditTimelineProps {
  history: HistoryEntry[];
  className?: string;
}

/**
 * AuditTimeline (Sprint Final)
 * Exibe o histórico de alterações de status e ações do workflow.
 */
export function AuditTimeline({ history, className }: AuditTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl text-center">
        <p className="text-xs text-slate-400 font-medium italic">Nenhum histórico registrado para esta solicitação.</p>
      </div>
    );
  }

  // Ordenar historioco por data descrescente (mais recente primeiro)
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className={cn("space-y-6 relative before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100", className)}>
      {sortedHistory.map((entry, index) => (
        <div key={index} className="flex gap-5 items-start group relative">
          <div className={cn(
            "w-2.5 h-2.5 rounded-full border-2 z-10 shrink-0 mt-1.5 transition-all duration-300",
            index === 0 
              ? "bg-blue-600 border-blue-100 scale-125 shadow-[0_0_0_4px_rgba(37,99,235,0.1)]" 
              : "bg-white border-slate-300 group-hover:border-slate-400"
          )} />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className={cn(
                "text-xs font-bold tracking-tight uppercase",
                index === 0 ? "text-blue-600" : "text-slate-700"
              )}>
                {entry.status}
              </span>
              <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-full">
                {format(new Date(entry.updatedAt), "dd MMM, HH:mm", { locale: ptBR })}
              </span>
            </div>
            
            <p className="text-[11px] text-slate-500 mt-1 font-medium italic">
              Atuado por: <span className="text-slate-900 font-bold not-italic">{entry.updatedBy}</span>
            </p>
            
            {entry.comment && (
              <div className="mt-2.5 text-[11px] text-slate-600 bg-slate-50/80 p-3 rounded-2xl border border-slate-100 leading-relaxed font-medium shadow-sm">
                “{entry.comment}”
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
