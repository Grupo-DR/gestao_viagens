import React from 'react';
import { Plane, Bus, Trash2, MapPin, Calendar, Luggage, AlertCircle } from 'lucide-react';
import { TravelSegment } from '../../../domain/types.ts';
import { cn } from '../../../lib/utils.ts';
import { getDirectionTheme } from '../directionTheme.ts';
import { SegmentBadge } from '../ItineraryVisuals.tsx';

interface TravelSegmentCardProps {
  key?: string | number;
  segment: TravelSegment;
  /** Posição do trecho dentro do seu bloco (Ida ou Volta), a partir de 1 */
  position: number;
  canRemove: boolean;
  errors?: string[]; // Erros de validação deste trecho
  onUpdate: <K extends keyof TravelSegment>(id: string, field: K, value: TravelSegment[K]) => void;
  onRemove: (id: string) => void;
}

const INPUT_CLASS = 
  'w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm font-bold text-slate-700 shadow-sm placeholder:text-slate-300';

const ERROR_INPUT_CLASS = 'border-red-300 bg-red-50/10 focus:ring-red-500 focus:border-red-500';

/**
 * TravelSegmentCard (Sprint Final - Multimodal Hardened)
 * Exibe os campos de um trecho individual, incluindo agora a cotação obrigatória por trecho.
 * O sentido (Ida/Volta) é definido pelo bloco em que o card está, não por seleção no card.
 */
export function TravelSegmentCard({
  segment,
  position,
  canRemove,
  errors = [],
  onUpdate,
  onRemove
}: TravelSegmentCardProps) {
  const isAir = segment.transportMode === 'aereo';
  const theme = getDirectionTheme(segment.direction);
  const hasErrors = errors.length > 0;

  return (
    <div className={cn(
      "relative bg-white rounded-[32px] border-2 border-l-[6px] p-8 shadow-sm transition-all animate-in zoom-in-95 duration-300",
      theme.cardAccentClass,
      hasErrors ? "border-red-200 ring-2 ring-red-100" : "border-slate-100 hover:shadow-md"
    )}>

      {/* Header do Trecho */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <SegmentBadge
            direction={segment.direction}
            position={position}
            className={cn("w-11 h-11 text-sm rounded-full shadow-lg", hasErrors && "bg-red-500 shadow-red-200")}
          />
          <div>
            <h4 className={cn("font-black text-xs uppercase tracking-widest", theme.accentTextClass)}>
              Trecho de {theme.label}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
               {isAir ? <Plane className="w-4 h-4 text-slate-500" /> : <Bus className="w-4 h-4 text-slate-500" />}
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
                isAir ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Plane className="w-3 h-3" /> Aéreo
            </button>
            <button 
              type="button"
              onClick={() => onUpdate(segment.id, 'transportMode', 'rodoviario')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase flex items-center gap-2",
                !isAir ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Bus className="w-3 h-3" /> Ônibus
            </button>
          </div>

          {canRemove && (
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

      {/* Grid de Campos Integrado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        
        {/* Cidade de Origem */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
            <MapPin className="w-3 h-3" /> Cidade de Origem
          </label>
          <input 
            className={cn(INPUT_CLASS, hasErrors && !segment.origin.trim() && ERROR_INPUT_CLASS)} 
            placeholder="Ex: São Paulo"
            value={segment.origin || ''}
            onChange={(e) => onUpdate(segment.id, 'origin', e.target.value)}
          />
        </div>

        {/* Terminal de Origem */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            {isAir ? 'Aeroporto de Partida' : 'Rodoviária de Partida'}
          </label>
          <input 
            className={cn(INPUT_CLASS, "bg-slate-50/30 border-dashed")} 
            placeholder={isAir ? "Ex: Congonhas (CGH)" : "Ex: Terminal Tietê"}
            value={segment.originTerminal || ''}
            onChange={(e) => onUpdate(segment.id, 'originTerminal', e.target.value)}
          />
        </div>

        {/* Cidade de Destino */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
             <MapPin className="w-3 h-3" /> Cidade de Destino
          </label>
          <input 
            className={cn(INPUT_CLASS, hasErrors && !segment.destination.trim() && ERROR_INPUT_CLASS)} 
            placeholder="Ex: Belo Horizonte - MG"
            value={segment.destination || ''}
            onChange={(e) => onUpdate(segment.id, 'destination', e.target.value)}
          />
          <p className="text-[9px] text-slate-400 font-medium pl-1">Use o formato: Cidade - UF (ex: São Paulo - SP)</p>
        </div>

        {/* Terminal de Destino */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            {isAir ? 'Aeroporto de Chegada' : 'Rodoviária de Chegada'}
          </label>
          <input 
            className={cn(INPUT_CLASS, "bg-slate-50/30 border-dashed")} 
            placeholder={isAir ? "Ex: Salvador (SSA)" : "Ex: Rodoviária de Salvador"}
            value={segment.destinationTerminal || ''}
            onChange={(e) => onUpdate(segment.id, 'destinationTerminal', e.target.value)}
          />
        </div>

        {/* Data e Hora de Partida */}
        <div className="space-y-2.5">
          <label className={cn("text-[10px] font-black uppercase tracking-widest pl-1 flex items-center gap-2", theme.titleClass)}>
            <Calendar className={cn("w-3 h-3", theme.accentTextClass)} /> {theme.dateLabel}
          </label>
          <input
            type="datetime-local"
            className={cn(INPUT_CLASS, theme.inputAccentClass, hasErrors && !segment.departureDateTime && ERROR_INPUT_CLASS)}
            value={segment.departureDateTime || ''}
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
                value={segment.arrivalDateTime || ''}
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

        {/* COTAÇÃO DO TRECHO (Mandatório DR Construtora) */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100/50 mt-4">
           <div className="space-y-2.5">
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest pl-1">
                Companhia Cotada <span className="text-red-500">*</span>
              </label>
              <input 
                className={cn(INPUT_CLASS, hasErrors && !segment.airlineQuote?.trim() && ERROR_INPUT_CLASS)} 
                placeholder="Ex: LATAM, GOL, Catedral (Ônibus)..."
                value={segment.airlineQuote || ''}
                onChange={(e) => onUpdate(segment.id, 'airlineQuote', e.target.value)}
              />
           </div>
           <div className="space-y-2.5">
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest pl-1">
                Preço Cotado (BRL) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                <input 
                  type="number"
                  step="0.01"
                  className={cn(INPUT_CLASS, "pl-10 font-mono", hasErrors && (!segment.priceQuote || segment.priceQuote <= 0) && ERROR_INPUT_CLASS)} 
                  placeholder="0.00"
                  value={segment.priceQuote || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    onUpdate(segment.id, 'priceQuote', val);
                  }}
                />
              </div>
           </div>
        </div>
      </div>

      {/* Exibição de Erros do Trecho */}
      {hasErrors && (
        <div className="mt-8 p-5 bg-red-50 rounded-2xl border border-red-100 flex flex-col gap-2 animate-in slide-in-from-top-2">
          {errors.map((msg, i) => (
            <div key={i} className="flex items-center gap-2.5 text-red-600 font-bold text-[11px] uppercase tracking-wide">
               <AlertCircle className="w-3.5 h-3.5" /> {msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
