import React from 'react';
import { Save, Send, Loader2 } from 'lucide-react';
import { PolicyDecision } from '../../../domain/policy/types.ts';

interface TravelFormFooterActionsProps {
  onSaveDraft: (decision?: PolicyDecision) => void;
  onSubmit: (decision?: PolicyDecision) => void;
  policyDecision: PolicyDecision | null;
  formLoading?: boolean;
}

/**
 * TravelFormFooterActions (Sprint Final)
 * Barra de ações fixa/inferior do formulário.
 */
export function TravelFormFooterActions({
  onSaveDraft,
  onSubmit,
  policyDecision,
  formLoading
}: TravelFormFooterActionsProps) {
  return (
    <div className="mt-8 pt-10 border-t border-slate-200 flex items-center justify-end gap-6">
       <button 
         type="button"
         onClick={() => onSaveDraft(policyDecision || undefined)}
         disabled={formLoading}
         className="px-8 py-3.5 rounded-2xl text-[11px] font-black text-slate-500 hover:bg-white hover:shadow-sm transition-all flex items-center gap-2.5 uppercase tracking-widest disabled:opacity-50"
       >
         <Save className="w-5 h-5 opacity-70" />
         Salvar como Rascunho
       </button>
       
       <button 
         type="button"
         onClick={() => onSubmit(policyDecision || undefined)}
         disabled={formLoading}
         className="px-10 py-4 bg-blue-600 text-white rounded-[22px] text-xs font-black uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 flex items-center gap-3 disabled:opacity-50 group"
       >
         {formLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
         ) : (
            <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
         )}
         Emitir Solicitação
       </button>
    </div>
  );
}
