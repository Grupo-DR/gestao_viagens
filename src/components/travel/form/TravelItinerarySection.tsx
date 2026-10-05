import React from 'react';
import { Plane, Plus, Repeat, ArrowRight } from 'lucide-react';
import { TravelSegment, TravelDirection, TripType } from '../../../domain/types';
import { TravelSegmentCard } from './TravelSegmentCard';
import {
  addSegmentToItinerary,
  buildReturnFromOutbound,
  removeSegmentFromItinerary,
  sortItinerary,
  updateItinerarySegment,
} from '../../../domain/travelSegment.helpers';
import { cn } from '../../../lib/utils';
import { dateService } from '../../../application/services/dateService';
import { getDirectionTheme } from '../directionTheme';
import { RouteSummary, StaySeparator } from '../ItineraryVisuals';

interface TravelItinerarySectionProps {
  segments: TravelSegment[];
  tripType: TripType;
  justification: string;
  /** Erros bloqueantes por trecho (exibidos após tentativa de envio) */
  segmentErrors?: Record<string, string[]>;
  onSegmentsChange: (segments: TravelSegment[]) => void;
  onTripTypeChange: (tripType: TripType) => void;
  onFieldChange: (field: string, value: any) => void;
}

const INPUT_CLASS =
  'w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm font-bold text-slate-700 shadow-sm placeholder:text-slate-300';

const TRIP_TYPE_OPTIONS: { value: TripType; label: string }[] = [
  { value: 'ida_volta', label: 'Ida e volta' },
  { value: 'somente_ida', label: 'Somente ida' },
];

/**
 * TravelItinerarySection (Multisegmento — Blocos de Ida e Volta)
 * O sentido de cada trecho é definido pelo bloco em que ele é cadastrado.
 * Novos trechos já nascem encadeados (origem = destino do trecho anterior).
 */
export function TravelItinerarySection({
  segments,
  tripType,
  justification,
  segmentErrors = {},
  onSegmentsChange,
  onTripTypeChange,
  onFieldChange,
}: TravelItinerarySectionProps) {
  const ordered = sortItinerary(segments);
  const idaSegments = ordered.filter(s => s.direction !== 'volta');
  const voltaSegments = ordered.filter(s => s.direction === 'volta');
  const canBuildReturn = idaSegments.some(s => s.origin.trim() && s.destination.trim());

  const handleAddSegment = (direction: TravelDirection) => {
    onSegmentsChange(addSegmentToItinerary(segments, direction));
  };

  const handleRemoveSegment = (id: string) => {
    onSegmentsChange(removeSegmentFromItinerary(segments, id));
  };

  const handleUpdateSegment = <K extends keyof TravelSegment>(id: string, field: K, value: TravelSegment[K]) => {
    onSegmentsChange(updateItinerarySegment(segments, id, field, value));
  };

  const handleTripTypeChange = (next: TripType) => {
    if (next === tripType) return;
    if (next === 'somente_ida' && voltaSegments.length > 0) {
      const confirmed = window.confirm(
        `Os ${voltaSegments.length} trecho(s) de volta serão removidos. Deseja continuar?`
      );
      if (!confirmed) return;
      onSegmentsChange(idaSegments);
    }
    onTripTypeChange(next);
  };

  const renderCards = (blockSegments: TravelSegment[], canRemove: boolean) =>
    blockSegments.map((segment, index) => (
      <TravelSegmentCard
        key={segment.id}
        segment={segment}
        position={index + 1}
        canRemove={canRemove}
        errors={segmentErrors[segment.id]}
        onUpdate={handleUpdateSegment}
        onRemove={handleRemoveSegment}
      />
    ));

  const renderAddButton = (direction: TravelDirection) => (
    <button
      type="button"
      onClick={() => handleAddSegment(direction)}
      className={cn(
        "w-full flex items-center justify-center gap-2 px-6 py-4 border-2 border-dashed bg-white/60 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all",
        getDirectionTheme(direction).outlineButtonClass
      )}
    >
      <Plus className="w-4 h-4" /> Adicionar trecho na {direction === 'ida' ? 'ida' : 'volta'}
    </button>
  );

  /** Painel do bloco: cabeçalho grande com ícone do sentido, resumo da rota e data. */
  const renderBlock = (direction: TravelDirection, blockSegments: TravelSegment[], content: React.ReactNode) => {
    const theme = getDirectionTheme(direction);
    const Icon = theme.icon;
    const firstDeparture = blockSegments[0]?.departureDateTime;

    return (
      <div className={cn("rounded-[36px] border-2 p-5 md:p-8 space-y-6", theme.panelClass)}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0", theme.badgeClass)}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="min-w-0 space-y-1">
              <h4 className={cn("text-lg font-black uppercase tracking-[0.2em] leading-none", theme.titleClass)}>
                {theme.label}
              </h4>
              <RouteSummary segments={blockSegments} />
            </div>
          </div>
          <div className="md:text-right shrink-0 pl-16 md:pl-0">
            <p className={cn("text-[10px] font-black uppercase tracking-widest", theme.accentTextClass)}>
              {blockSegments.length} {blockSegments.length === 1 ? 'trecho' : 'trechos'}
            </p>
            {firstDeparture && (
              <p className="text-xs font-bold text-slate-600">
                {theme.blockDateLabel} {dateService.formatDateTimeSafe(firstDeparture, 'dd/MM')}
              </p>
            )}
          </div>
        </div>
        {content}
      </div>
    );
  };

  return (
    <section className="space-y-10 animate-in fade-in duration-500 delay-100">

      {/* Cabeçalho da Seção */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
             <Plane className="w-5 h-5 text-slate-400" />
          </div>
          <h3 className="font-black text-[10px] uppercase tracking-[0.3em]">Itinerário e Logística</h3>
          <div className="h-px w-24 bg-slate-100 ml-2" />
        </div>

        {/* Tipo de viagem */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner w-fit">
          {TRIP_TYPE_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleTripTypeChange(option.value)}
              className={cn(
                "px-5 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase",
                tripType === option.value ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-slate-500 font-medium -mt-4 pl-1">
        Cadastre os trechos na ordem em que o passageiro vai viajar. Cada novo trecho começa onde o anterior terminou.
      </p>

      {/* Bloco de Ida */}
      {renderBlock('ida', idaSegments, (
        <>
          <div className="space-y-6">
            {renderCards(idaSegments, idaSegments.length > 1)}
          </div>
          {renderAddButton('ida')}
        </>
      ))}

      {tripType === 'ida_volta' && <StaySeparator segments={segments} />}

      {/* Bloco de Volta */}
      {tripType === 'ida_volta' && renderBlock('volta', voltaSegments, (
        <>
          {voltaSegments.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-orange-200 bg-white/60 rounded-[32px] flex flex-col items-center gap-4 text-center">
              <p className="text-xs font-bold text-slate-500">
                Nenhum trecho de volta cadastrado.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => onSegmentsChange(buildReturnFromOutbound(segments))}
                  disabled={!canBuildReturn}
                  title={!canBuildReturn ? 'Preencha origem e destino da ida primeiro' : ''}
                  className={cn(
                    "flex items-center justify-center gap-2 px-6 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed",
                    getDirectionTheme('volta').solidButtonClass
                  )}
                >
                  <Repeat className="w-4 h-4" /> Gerar volta invertendo a ida
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSegment('volta')}
                  className={cn(
                    "flex items-center justify-center gap-2 px-6 py-3 border bg-white rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all",
                    getDirectionTheme('volta').outlineButtonClass
                  )}
                >
                  <Plus className="w-4 h-4" /> Cadastrar manualmente
                </button>
              </div>
              {canBuildReturn && (
                <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 flex-wrap justify-center">
                  {[...idaSegments].reverse().map((s, i) => (
                    <React.Fragment key={s.id}>
                      {i === 0 && <span>{s.destination}</span>}
                      <ArrowRight className="w-3 h-3" />
                      <span>{s.origin}</span>
                    </React.Fragment>
                  ))}
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {renderCards(voltaSegments, true)}
              </div>
              {renderAddButton('volta')}
            </>
          )}
        </>
      ))}

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
