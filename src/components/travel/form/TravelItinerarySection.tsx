import React from 'react';
import { Plane, Plus, Luggage } from 'lucide-react';
import { TravelSegment } from '../../../domain/types';
import { TravelSegmentCard } from './TravelSegmentCard.tsx';
import { cn } from '../../../lib/utils.ts';

interface TravelItinerarySectionProps {
  segments: TravelSegment[];
  justification: string;
  onAddSegment: () => void;
  onRemoveSegment: (id: string) => void;
  onUpdateSegment: (id: string, field: keyof TravelSegment, value: any) => void;
  onFieldChange: (field: string, value: any) => void;
}

const INPUT_CLASS = 
  'w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm font-bold text-slate-700 shadow-sm placeholder:text-slate-300';

/**
 * TravelItinerarySection (Sprint Final - Multisegmento)
 * Orquestra a exibição de múltiplos trechos e campos globais de itinerário.
 */
export function TravelItinerarySection({
  segments,
  justification,
  onAddSegment,
  onRemoveSegment,
  onUpdateSegment,
  onFieldChange
}: TravelItinerarySectionProps) {
  return (
    <section className="space-y-10 animate-in fade-in duration-500 delay-100">
      
      {/* Cabeçalho da Seção */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
             <Plane className="w-5 h-5 text-slate-400" />
          </div>
          <h3 className="font-black text-[10px] uppercase tracking-[0.3em]">Itinerário e Logística</h3>
          <div className="h-px w-24 bg-slate-100 ml-2" />
        </div>

        <button 
          type="button"
          onClick={onAddSegment}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Adicionar Trecho
        </button>
      </div>

      {/* Lista de Trechos */}
      <div className="space-y-8">
        {segments.map((segment, index) => (
          <TravelSegmentCard 
            key={segment.id}
            segment={segment}
            index={index}
            totalSegments={segments.length}
            onUpdate={onUpdateSegment}
            onRemove={onRemoveSegment}
          />
        ))}
      </div>

      {/* Justificativa Operacional (Global p/ Solicitação) */}
      <div className="space-y-2.5 pt-4">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Justificativa Operacional do Itinerário</label>
        <textarea 
          className={cn(INPUT_CLASS, "min-h-[140px] resize-none py-4 leading-relaxed italic placeholder:italic font-medium")}
          placeholder="Descreva brevemente o propósito da mobilização ou viagem, mencionando particularidades do itinerário se necessário..."
          value={justification}
          onChange={(e) => onFieldChange('justification', e.target.value)}
        />
      </div>
    </section>
  );
}
