import React from 'react';
import { CheckCircle, ShieldAlert } from 'lucide-react';
import { PolicyDecision } from '../../domain/policy/types.ts';
import { PolicyResult } from '../../domain/policy/enums.ts';
import { cn } from '../../lib/utils.ts';

interface PolicyDecisionPanelProps {
  decision: PolicyDecision;
  className?: string;
}

/** Mapeamento de labels técnicas para nomes amigáveis (DR Construtora) */
const LABEL_MAP: Record<string, string> = {
  // Datas e Períodos
  leaveStartDate: 'Início do Afastamento',
  leaveEndDate: 'Fim do Afastamento',
  inicioAquisitivo: 'Início Período Aquisitivo',
  fimAquisitivo: 'Fim Período Aquisitivo',
  prazoLivre: 'Prazo Limite para Gozo',
  ultimaFolga: 'Última Folga Registrada',
  dataPrevista: 'Data Prevista de Retorno',
  
  // Saldos e Quantidades
  saldoDias: 'Saldo de Dias',
  diasSolicitados: 'Total de Dias (Corridos)',
  diasUteisSolicitados: 'Dias Úteis (Solicitados)',
  diasProgramados: 'Quantidade de Dias',
  
  // Regras e Status
  abonoProgramado: 'Abono Pecuniário',
  regraExtraida: 'Política Detectada',
  limiteDetetado: 'Limite Permitido para o Perfil',
};

function formatLabel(key: string): string {
  // Busca exata
  if (LABEL_MAP[key]) return LABEL_MAP[key];

  // Busca insensível a maiúsculas/minúsculas
  const found = Object.entries(LABEL_MAP).find(
    ([k]) => k.toLowerCase() === key.toLowerCase()
  );
  if (found) return found[1];
  
  // Fallback: transforma camelCase em Title Case amigável
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * PolicyDecisionPanel (Sprint Final)
 * Exibe o veredito do motor de política de forma visual no modal de detalhes.
 */
export const PolicyDecisionPanel: React.FC<PolicyDecisionPanelProps> = ({ decision, className }) => {
  const isApproved = decision.result === PolicyResult.APPROVED;
  const isRejected = decision.result === PolicyResult.REJECTED;
  const isManual = decision.result === PolicyResult.MANUAL_VALIDATION;

  return (
    <div className={cn(
      "p-6 rounded-[24px] border border-black/5 shadow-sm transition-all duration-500",
      isRejected ? "bg-red-50/50" :
      isManual ? "bg-amber-50/50" :
      "bg-emerald-50/50",
      className
    )}>
      <div className="flex items-center gap-4 mb-4">
        <div className={cn(
          "p-2.5 rounded-xl flex items-center justify-center shadow-sm",
          isRejected ? "bg-red-100 text-red-600" :
          isManual ? "bg-amber-100 text-amber-600" :
          "bg-emerald-100 text-emerald-600"
        )}>
          {isApproved ? <CheckCircle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-sm tracking-tight italic">Parecer de Elegibilidade — Política Corporativa</h4>
          <p className="text-xs font-medium text-slate-600 mt-0.5 leading-relaxed">{decision.summary}</p>
        </div>
      </div>

      {/* Detalhes Técnicos / Evidências */}
      {decision.evidence && Object.keys(decision.evidence).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
          {Object.entries(decision.evidence).map(([key, value]) => (
            <div key={key} className="bg-white/60 p-2.5 rounded-xl border border-black/5 flex flex-col justify-center">
              <label className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block mb-0.5 truncate">{formatLabel(key)}</label>
              <span className="text-[11px] font-mono font-bold text-slate-700">
                {typeof value === 'boolean' ? (value ? 'SIM' : 'NÃO') : String(value || 'N/A')}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Violações */}
      {decision.violations.length > 0 && (
        <div className="mt-4 space-y-1">
          {decision.violations.map((v, i) => (
            <p key={i} className="text-[10px] text-red-600 font-bold flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> {v.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
