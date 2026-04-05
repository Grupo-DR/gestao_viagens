import React from 'react';
import { Landmark, Loader2, Calendar, FileQuestion } from 'lucide-react';
import { cn } from '../../../lib/utils.ts';
import { TravelReason } from '../../../domain/enums.ts';

interface EmployeeSelectionSectionProps {
  costCenter: string;
  chapa: string;
  reason: TravelReason;
  leaveStartDate: string;
  leaveEndDate: string;
  costCenters: Array<{ code: string; label: string }>;
  employees: Array<{ chapa: string; name: string }>;
  loading: boolean;
  onCostCenterChange: (code: string) => void;
  onEmployeeChange: (chapa: string) => void;
  onFieldChange: (field: string, value: any) => void;
}

const SELECT_CLASS =
  'w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-white text-sm font-bold text-slate-700 shadow-sm disabled:opacity-50 disabled:bg-slate-50';

const INPUT_CLASS =
  'w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm font-bold text-slate-700 shadow-sm placeholder:text-slate-300';

/**
 * EmployeeSelectionSection (Sprint Final - Refatorado)
 * Seção unificada RM TOTVS: Centro de Custo, Passageiro, Motivo e Datas de Afastamento.
 */
export function EmployeeSelectionSection({
  costCenter,
  chapa,
  reason,
  leaveStartDate,
  leaveEndDate,
  costCenters,
  employees,
  loading,
  onCostCenterChange,
  onEmployeeChange,
  onFieldChange
}: EmployeeSelectionSectionProps) {
  
  const isHRReason = [
    TravelReason.FERIAS, 
    TravelReason.FOLGA, 
    TravelReason.FOLGA_FERIAS
  ].includes(reason);

  return (
    <section className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 text-blue-600">
        <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
           <Landmark className="w-5 h-5" />
        </div>
        <h3 className="font-black text-[10px] uppercase tracking-[0.3em]">Sincronização RM TOTVS</h3>
        <div className="h-px flex-1 bg-slate-100 ml-2" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 bg-blue-50/10 p-8 rounded-[32px] border-2 border-blue-50/50">
        
        {/* 1. Centro de Custo */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            1. Unidade / Centro de Custo
          </label>
          <select 
            className={SELECT_CLASS}
            value={costCenter}
            onChange={(e) => onCostCenterChange(e.target.value)}
          >
            <option value="">Selecione a unidade...</option>
            {costCenters.map(cc => (
              <option key={cc.code} value={cc.code}>{cc.label}</option>
            ))}
          </select>
        </div>

        {/* 2. Passageiro */}
        <div className={cn("space-y-2.5 transition-opacity duration-300", !costCenter && "opacity-40 grayscale pointer-events-none")}>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            2. Seleção do Passageiro
          </label>
          <div className="relative">
            <select 
              className={cn(SELECT_CLASS, loading && "pr-12")}
              value={chapa}
              onChange={(e) => onEmployeeChange(e.target.value)}
              disabled={!costCenter}
            >
              <option value="">Selecione o colaborador...</option>
              {employees.map(e => (
                <option key={e.chapa} value={e.chapa}>{e.name} ({e.chapa})</option>
              ))}
            </select>
            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              </div>
            )}
          </div>
        </div>

        {/* 3. Motivo da Viagem (Movido para cá) */}
        <div className={cn("space-y-2.5 transition-opacity duration-300", !chapa && "opacity-40 grayscale pointer-events-none")}>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
            <FileQuestion className="w-3 h-3" /> 3. Motivo da Viagem
          </label>
          <select 
            className={SELECT_CLASS}
            value={reason}
            onChange={(e) => onFieldChange('reason', e.target.value as TravelReason)}
            disabled={!chapa}
          >
            {Object.values(TravelReason).map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* 4. Datas de Afastamento (Integradas e Condicionais) */}
        {isHRReason && (
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Início Afastamento (RM)
              </label>
              <input 
                type="date"
                className={cn(INPUT_CLASS, "bg-white")} 
                value={leaveStartDate}
                onChange={(e) => onFieldChange('leaveStartDate', e.target.value)}
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Fim Afastamento (RM)
              </label>
              <input 
                type="date"
                className={cn(INPUT_CLASS, "bg-white")} 
                value={leaveEndDate}
                onChange={(e) => onFieldChange('leaveEndDate', e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="md:col-span-2 mt-2 px-1">
           <p className="text-[10px] text-slate-400 font-medium italic">
             Nota: Os campos acima determinam a validade da política em relação ao sistema de Recursos Humanos (RM).
           </p>
        </div>
      </div>
    </section>
  );
}
