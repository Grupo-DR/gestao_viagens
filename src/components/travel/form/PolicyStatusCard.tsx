import React from 'react';
import { Search, CheckCircle2, ShieldAlert } from 'lucide-react';
import { PolicyDecision } from '../../../domain/policy/types.ts';
import { PolicyResult } from '../../../domain/policy/enums.ts';
import { cn } from '../../../lib/utils.ts';

interface PolicyStatusCardProps {
  decision: PolicyDecision | null;
  visible: boolean;
}

/**
 * PolicyStatusCard (Sprint Final)
 * Card de feedback imediato no formulário durante o preenchimento.
 */
export function PolicyStatusCard({ decision, visible }: PolicyStatusCardProps) {
  if (!visible) return null;

  return (
    <div className={cn(
      "p-8 rounded-[32px] border-2 transition-all duration-500 flex gap-6 animate-in slide-in-from-top-4",
      !decision 
        ? "bg-slate-50 border-slate-100" 
        : decision.result === PolicyResult.REJECTED ? "bg-red-50/50 border-red-100/50 shadow-sm shadow-red-50" :
          decision.result === PolicyResult.MANUAL_VALIDATION ? "bg-amber-50/50 border-amber-100/50 shadow-sm shadow-amber-50" :
          "bg-emerald-50/50 border-emerald-100/50 shadow-sm shadow-emerald-50"
    )}>
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/50 shrink-0",
        !decision ? "bg-white text-slate-300" :
        decision.result === PolicyResult.REJECTED ? "bg-red-100 text-red-600" :
        decision.result === PolicyResult.MANUAL_VALIDATION ? "bg-amber-100 text-amber-600" :
        "bg-emerald-100 text-emerald-600"
      )}>
        {!decision ? <Search className="w-6 h-6 animate-pulse" /> :
         decision.result === PolicyResult.APPROVED ? <CheckCircle2 className="w-7 h-7" /> : 
         <ShieldAlert className="w-7 h-7" />}
      </div>
      <div className="space-y-1.5 min-w-0">
        <h4 className="font-black text-slate-900 text-xs tracking-widest italic uppercase">Status da Política Corporativa</h4>
        <p className="text-sm font-bold text-slate-700 leading-tight italic truncate">
          {decision ? decision.summary : "Pendente: Aguardando datas de voo para cruzamento com sistema RM."}
        </p>
        <p className="text-[10px] font-medium text-slate-500 leading-relaxed max-w-lg">
          {decision?.result === PolicyResult.APPROVED 
            ? "O período selecionado respeita as janelas de folgas e férias corporativas."
            : "A conformidade final será validada pela equipe de Capital Humano após o envio."}
        </p>
      </div>
    </div>
  );
}
