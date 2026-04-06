import React from 'react';
import { Plane, Bus, Trash2, MapPin, Calendar, Luggage, AlertCircle } from 'lucide-react';
import { TravelSegment, TransportMode } from '../../../domain/types';
import { cn } from '../../../lib/utils.ts';

interface TravelSegmentCardProps {
  key?: string | number;
  segment: TravelSegment;
  index: number;
  totalSegments: number;
  errors?: string[]; // Erros de validação deste trecho
  onUpdate: <K extends keyof TravelSegment>(id: string, field: K, value: TravelSegment[K]) => void;
  onRemove: (id: string) => void;
}

const INPUT_CLASS = 
  'w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm font-bold text-slate-700 shadow-sm placeholder:text-slate-300';

const ERROR_INPUT_CLASS = 'border-red-300 bg-red-50/10 focus:ring-red-500 focus:border-red-500';

export function TravelSegmentCard({ 
  segment, 
  index, 
  totalSegments, 
  errors = [],
  onUpdate, 
  onRemove 
}: TravelSegmentCardProps) {
  const isAir = segment.transportMode === 'aereo';
  const hasErrors = errors.length > 0;

  return (
    <div className={cn(
      "relative bg-white rounded-[32px] border-2 p-8 shadow-sm transition-all animate-in zoom-in-95 duration-300",
      hasErrors ? "border-red-100 shadow-red-50/50" : "border-slate-100 hover:shadow-md"
    )}>
      
      {/* Header do Trecho */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-lg",
            hasErrors ? "bg-red-500 text-white" : "bg-slate-900 text-white"
          )}>
            {segment.order}
          </div>
          <div>
            <h4 className="font-black text-xs uppercase tracking-widest text-slate-400">Trecho da Viagem</h4>
            <div className="flex items-center gap-2 mt-0.5">
               {isAir ? <Plane className="w-4 h-4 text-blue-500" /> : <Bus className="w-4 h-4 text-emerald-500" />}
               <span className="text-sm font-bold text-slate-700">itinerário {isAir ? 'Aéreo' : 'Rodoviário'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Seletor de Modal */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
            <button 
              type="button"
              onClick={() => onUpdate(segment.id, 'transportMode', 'aereo')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase flex items-center gap-2",
                isAir ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Plane className="w-3 h-3" /> Aéreo
            </button>
            <button 
              type="button"
              onClick={() => onUpdate(segment.id, 'transportMode', 'rodoviario')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase flex items-center gap-2",
                !isAir ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Bus className="w-3 h-3" /> Ônibus
            </button>
          </div>

          {totalSegments > 1 && (
            <button 
              type="button"
              onClick={() => onRemove(segment.id)}
              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all ml-2"
              title="Remover trecho"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid de Campos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        
        {/* Origem */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
            <MapPin className="w-3 h-3" /> Cidade de Origem
          </label>
          <input 
            className={cn(INPUT_CLASS, !segment.origin.trim() && hasErrors && ERROR_INPUT_CLASS)} 
            placeholder="Ex: São Paulo"
            value={segment.origin}
            onChange={(e) => onUpdate(segment.id, 'origin', e.target.value)}
          />
        </div>

        {/* Terminal Origem */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            {isAir ? 'Aeroporto de Partida' : 'Rodoviária de Partida'}
          </label>
          <input 
            className={cn(INPUT_CLASS, "bg-slate-50/30 border-dashed")} 
            placeholder={isAir ? "Ex: Congonhas (CGH)" : "Ex: Terminal Tietê"}
            value={segment.originTerminal}
            onChange={(e) => onUpdate(segment.id, 'originTerminal', e.target.value)}
          />
        </div>

        {/* Destino */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
             <MapPin className="w-3 h-3" /> Cidade de Destino
          </label>
          <input 
            className={cn(INPUT_CLASS, !segment.destination.trim() && hasErrors && ERROR_INPUT_CLASS)} 
            placeholder="Ex: Salvador"
            value={segment.destination}
            onChange={(e) => onUpdate(segment.id, 'destination', e.target.value)}
          />
        </div>

        {/* Terminal Destino */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            {isAir ? 'Aeroporto de Chegada' : 'Rodoviária de Chegada'}
          </label>
          <input 
            className={cn(INPUT_CLASS, "bg-slate-50/30 border-dashed")} 
            placeholder={isAir ? "Ex: Salvador (SSA)" : "Ex: Rodoviária de Salvador"}
            value={segment.destinationTerminal}
            onChange={(e) => onUpdate(segment.id, 'destinationTerminal', e.target.value)}
          />
        </div>

        {/* Partida */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest pl-1 flex items-center gap-2">
            <Calendar className="w-3 h-3" /> Data e Hora de Partida
          </label>
          <input 
            type="datetime-local"
            className={cn(INPUT_CLASS, "bg-blue-50/20 border-blue-100", !segment.departureDateTime && hasErrors && ERROR_INPUT_CLASS)} 
            value={segment.departureDateTime}
            onChange={(e) => onUpdate(segment.id, 'departureDateTime', e.target.value)}
          />
        </div>

        {/* Chegada / Bagagem */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Chegada */}
           <div className="space-y-2.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Chegada (Opcional)
              </label>
              <input 
                type="datetime-local"
                className={INPUT_CLASS} 
                value={segment.arrivalDateTime}
                onChange={(e) => onUpdate(segment.id, 'arrivalDateTime', e.target.value)}
              />
           </div>

           {/* Bagagem (Apenas Aéreo) */}
           {isAir ? (
             <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                  <Luggage className="w-3 h-3" /> Despachar Bagagem?
                </label>
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                  <button 
                    type="button"
                    onClick={() => onUpdate(segment.id, 'baggageRequired', true)}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-[10px] font-black transition-all",
                      segment.baggageRequired ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"
                    )}
                  >SIM</button>
                  <button 
                    type="button"
                    onClick={() => onUpdate(segment.id, 'baggageRequired', false)}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-[10px] font-black transition-all",
                      !segment.baggageRequired ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"
                    )}
                  >NÃO</button>
                </div>
             </div>
           ) : (
             <div className="flex items-center justify-center p-4 bg-slate-50/50 rounded-2xl border-dashed border-2 border-slate-100">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Bagagem s/v p/ Ônibus</p>
             </div>
           )}
        </div>
      </div>

      {/* Erros do Trecho */}
      {hasErrors && (
        <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-100 flex flex-col gap-1.5 animate-in slide-in-from-top-2">
          {errors.map((msg, i) => (
            <div key={i} className="flex items-center gap-2 text-red-600 font-bold text-[11px] uppercase tracking-wide">
               <AlertCircle className="w-3 h-3" /> {msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
