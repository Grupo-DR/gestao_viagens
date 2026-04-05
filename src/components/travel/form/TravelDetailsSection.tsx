import React from 'react';
import { Luggage } from 'lucide-react';
import { cn } from '../../../lib/utils.ts';

interface TravelDetailsSectionProps {
  baggageRequired: boolean;
  origin: string;
  destination: string;
  departureDateTime: string;
  returnDateTime: string;
  justification: string;
  onFieldChange: (field: string, value: any) => void;
}

const INPUT_CLASS =
  'w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm font-bold text-slate-700 shadow-sm placeholder:text-slate-300';

/**
 * TravelDetailsSection (Sprint Final - Refatorado)
 * Seção de itinerário e logística.
 * O campo 'Motivo' foi movido para o bloco de Sincronização RM.
 */
export function TravelDetailsSection({
  baggageRequired,
  origin,
  destination,
  departureDateTime,
  returnDateTime,
  justification,
  onFieldChange
}: TravelDetailsSectionProps) {
  return (
    <section className="space-y-8 animate-in fade-in duration-500 delay-100">
      <div className="flex items-center gap-3 text-slate-400">
        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
           <Luggage className="w-5 h-5 text-slate-400" />
        </div>
        <h3 className="font-black text-[10px] uppercase tracking-[0.3em]">Logística e Itinerário</h3>
        <div className="h-px flex-1 bg-slate-100 ml-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Bagagem Despachada */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Bagagem Despachada</label>
          <div className="flex gap-4 p-1.5 bg-slate-50 rounded-[22px] border border-slate-100 shadow-inner">
            <button 
              type="button"
              onClick={() => onFieldChange('baggageRequired', true)}
              className={cn(
                "flex-1 py-2.5 rounded-[18px] text-[10px] font-black tracking-widest transition-all", 
                baggageRequired ? "bg-white text-blue-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-500"
              )}
            >SIM</button>
            <button 
              type="button"
              onClick={() => onFieldChange('baggageRequired', false)}
              className={cn(
                "flex-1 py-2.5 rounded-[18px] text-[10px] font-black tracking-widest transition-all", 
                !baggageRequired ? "bg-white text-blue-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-500"
              )}
            >NÃO</button>
          </div>
        </div>

        {/* Filler para manter o grid alinhado caso necessário, ou apenas deixar fluir */}
        <div className="hidden md:block" />

        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Origem</label>
          <input 
            className={INPUT_CLASS} 
            placeholder="Ex: Curitiba (CWB) ou Unidade Operacional"
            value={origin}
            onChange={(e) => onFieldChange('origin', e.target.value)}
          />
        </div>
        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Destino</label>
          <input 
            className={INPUT_CLASS} 
            placeholder="Ex: Salvador (SSA) ou Nome da Obra"
            value={destination}
            onChange={(e) => onFieldChange('destination', e.target.value)}
          />
        </div>

        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 text-slate-900">Data de Partida — Indo</label>
          <input 
            type="datetime-local"
            className={cn(INPUT_CLASS, "bg-slate-50/50")} 
            value={departureDateTime}
            onChange={(e) => onFieldChange('departureDateTime', e.target.value)}
          />
        </div>
        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Data de Retorno — Voltando (Opcional)</label>
          <input 
            type="datetime-local"
            className={INPUT_CLASS} 
            value={returnDateTime}
            onChange={(e) => onFieldChange('returnDateTime', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Justificativa Operacional</label>
        <textarea 
          className={cn(INPUT_CLASS, "min-h-[120px] resize-none py-4 leading-relaxed italic placeholder:italic font-medium")}
          placeholder="Descreva brevemente o propósito da mobilização ou viagem..."
          value={justification}
          onChange={(e) => onFieldChange('justification', e.target.value)}
        />
      </div>
    </section>
  );
}
