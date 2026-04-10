import React from 'react';
import { Calendar, CheckCircle2, Search, ShieldAlert } from 'lucide-react';
import { PolicyResult } from '../../../domain/policy/enums.ts';
import { PolicyDecision } from '../../../domain/policy/types.ts';
import { cn } from '../../../lib/utils.ts';

interface PolicyStatusCardProps {
  decision: PolicyDecision | null;
  visible: boolean;
  showDateInputs?: boolean;
  leaveStartDate?: string;
  leaveEndDate?: string;
  onFieldChange?: (field: string, value: string) => void;
}

const DATE_INPUT_CLASS =
  'w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none';

export function PolicyStatusCard({
  decision,
  visible,
  showDateInputs = false,
  leaveStartDate = '',
  leaveEndDate = '',
  onFieldChange,
}: PolicyStatusCardProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        'h-full rounded-[28px] border-2 p-6 transition-all duration-500 animate-in slide-in-from-top-4',
        !decision
          ? 'bg-slate-50 border-slate-100'
          : decision.result === PolicyResult.REJECTED
            ? 'bg-red-50/50 border-red-100/50'
            : decision.result === PolicyResult.MANUAL_VALIDATION
              ? 'bg-amber-50/50 border-amber-100/50'
              : 'bg-emerald-50/50 border-emerald-100/50'
      )}
    >
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/50 shrink-0',
              !decision
                ? 'bg-white text-slate-300'
                : decision.result === PolicyResult.REJECTED
                  ? 'bg-red-100 text-red-600'
                  : decision.result === PolicyResult.MANUAL_VALIDATION
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-emerald-100 text-emerald-600'
            )}
          >
            {!decision ? (
              <Search className="w-6 h-6 animate-pulse" />
            ) : decision.result === PolicyResult.APPROVED ? (
              <CheckCircle2 className="w-7 h-7" />
            ) : (
              <ShieldAlert className="w-7 h-7" />
            )}
          </div>

          <div className="space-y-1.5 min-w-0">
            <h4 className="font-black text-slate-900 text-xs tracking-widest italic uppercase">
              Política de Data
            </h4>
            <p className="text-sm font-bold text-slate-700 leading-tight italic">
              {decision
                ? decision.summary
                : showDateInputs
                  ? 'Preencha o período de afastamento para validar a política de data.'
                  : 'Aguardando datas do itinerário para validar a política de data.'}
            </p>
            <p className="text-[10px] font-medium text-slate-500 leading-relaxed max-w-lg">
              {decision?.result === PolicyResult.APPROVED
                ? 'O período informado está aderente às regras corporativas identificadas para a solicitação.'
                : showDateInputs
                  ? 'As datas abaixo alimentam a validação do RM para folga, férias e combinações híbridas.'
                  : 'A análise é recalculada automaticamente conforme as datas do itinerário forem preenchidas.'}
            </p>
          </div>
        </div>

        {showDateInputs && onFieldChange && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Início do Afastamento
              </label>
              <input
                type="date"
                className={DATE_INPUT_CLASS}
                value={leaveStartDate}
                onChange={(e) => onFieldChange('leaveStartDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Fim do Afastamento
              </label>
              <input
                type="date"
                className={DATE_INPUT_CLASS}
                value={leaveEndDate}
                onChange={(e) => onFieldChange('leaveEndDate', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
