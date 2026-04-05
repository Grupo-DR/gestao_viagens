import React from 'react';
import { ShieldAlert, CheckCircle, ShieldInfo } from 'lucide-react';
import { PolicyResult } from '../../domain/policy/enums.ts';
import { PolicyDecision } from '../../domain/policy/types.ts';
import { cn } from '../../lib/utils.ts';

/**
 * PolicyDecisionCard (Sprint 3)
 * Exibe o resultado e as evidências do Motor de Regras.
 */

interface PolicyDecisionCardProps {
  decision: PolicyDecision;
  className?: string;
}

export function PolicyDecisionCard({ decision, className }: PolicyDecisionCardProps) {
  const isRejected = decision.result === PolicyResult.REJECTED;
  const isPending = decision.result === PolicyResult.MANUAL_VALIDATION;

  return (
    <div className={cn(
      "p-6 rounded-[24px] border border-black/5 shadow-sm transition-all duration-500 animate-in fade-in zoom-in-95",
      isRejected ? "bg-red-50/50 border-red-100" :
      isPending ? "bg-amber-50/50 border-amber-100" :
      "bg-emerald-50/50 border-emerald-100",
      className
    )}>
      <div className="flex items-center gap-4 mb-4">
        <div className={cn(
          "p-2.5 rounded-xl flex items-center justify-center shadow-sm",
          isRejected ? "bg-red-100 text-red-600" :
          isPending ? "bg-amber-100 text-amber-600" :
          "bg-emerald-100 text-emerald-600"
        )}>
          {decision.result === PolicyResult.APPROVED ? <CheckCircle className="w-5 h-5" /> : 
           isRejected ? <ShieldAlert className="w-5 h-5" /> : <ShieldInfo className="w-5 h-5" />}
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-sm tracking-tight italic uppercase text-[10px]">Policy Engine — Decisão</h4>
          <p className="text-xs font-medium text-slate-600 mt-0.5 leading-relaxed">{decision.summary}</p>
        </div>
      </div>

      {/* Detalhes Técnicos da Evidência */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
        {Object.entries(decision.evidence).map(([key, value]) => (
          <div key={key} className="bg-white/60 p-2.5 rounded-xl border border-black/5">
            <label className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter block mb-0.5">{key}</label>
            <span className="text-[11px] font-mono font-bold text-slate-700 truncate block">
              {typeof value === 'object' ? 'Ver detalhes' : String(value || 'N/A')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * AuditTimeline (Sprint 3)
 * Exibe o histórico de alterações de status e ações do workflow.
 */

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { HistoryEntry } from '../../domain/types.ts';

interface AuditTimelineProps {
  history: HistoryEntry[];
  className?: string;
}

export function AuditTimeline({ history, className }: AuditTimelineProps) {
  if (!history || history.length === 0) {
    return <p className="text-xs text-slate-400 italic">Nenhum histórico registrado.</p>;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {history.map((entry, index) => (
        <div key={index} className="flex gap-4 items-start group">
          <div className="flex flex-col items-center">
            <div className={cn(
              "w-2.5 h-2.5 rounded-full border-2",
              index === 0 ? "bg-blue-500 border-blue-200" : "bg-slate-200 border-slate-100"
            )} />
            {index < history.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 my-1 min-h-[20px]" />}
          </div>
          
          <div className="flex-1 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">{entry.status}</span>
              <span className="text-[10px] text-slate-400 font-medium italic">
                {format(new Date(entry.updatedAt), "dd 'de' MMM, HH:mm", { locale: ptBR })}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Atuado por: <span className="font-semibold">{entry.updatedBy}</span>
            </p>
            {entry.comment && (
              <div className="mt-2 text-[10px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 font-medium">
                “{entry.comment}”
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
