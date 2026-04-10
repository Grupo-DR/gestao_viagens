import { Calendar, CheckCircle2, FileQuestion, Search, ShieldAlert } from 'lucide-react';
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

  const isRejected = decision?.result === PolicyResult.REJECTED;
  const isManual = decision?.result === PolicyResult.MANUAL_VALIDATION;

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
            <h4 className="font-black text-slate-900 text-xs tracking-widest italic uppercase flex items-center gap-2">
              <FileQuestion className="w-3.5 h-3.5" /> {isRejected ? 'Política Rejeitada' : isManual ? 'Requer Validação CH' : 'Política de Datas'}
            </h4>
            <p
              className={cn(
                'text-sm font-bold leading-tight italic',
                isRejected ? 'text-red-700' : isManual ? 'text-amber-700' : 'text-slate-700'
              )}
            >
              {decision?.summary || 'Nenhuma política aplicada para este motivo.'}
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
