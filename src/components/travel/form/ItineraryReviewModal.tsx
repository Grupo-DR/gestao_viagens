import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle, Loader2, X } from 'lucide-react';
import { TravelDirection, TravelSegment, TripType } from '../../../domain/types';
import { sortItinerary } from '../../../domain/travelSegment.helpers';
import { ItineraryIssue, MIN_ITINERARY_JUSTIFICATION_LENGTH } from '../../../domain/itinerary.validation';
import { dateService } from '../../../application/services/dateService';
import { cn } from '../../../lib/utils';
import { getDirectionTheme } from '../directionTheme';
import { SegmentBadge, StaySeparator, TransportModeIcon } from '../ItineraryVisuals';

interface ItineraryReviewModalProps {
  passengerName: string;
  segments: TravelSegment[];
  tripType: TripType;
  warnings: ItineraryIssue[];
  justification: string;
  onJustificationChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitError?: string | null;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

/**
 * ItineraryReviewModal
 * Última conferência do itinerário antes do envio: linha do tempo de ida e volta,
 * alertas que exigem justificativa e confirmação explícita do solicitante.
 */
export function ItineraryReviewModal({
  passengerName,
  segments,
  tripType,
  warnings,
  justification,
  onJustificationChange,
  onConfirm,
  onCancel,
  isSubmitting,
  submitError,
}: ItineraryReviewModalProps) {
  const [confirmed, setConfirmed] = useState(false);

  const ordered = sortItinerary(segments);
  const blocks: { direction: TravelDirection; items: TravelSegment[] }[] = [
    { direction: 'ida', items: ordered.filter(s => s.direction !== 'volta') },
    { direction: 'volta', items: ordered.filter(s => s.direction === 'volta') },
  ];

  const renderBlock = ({ direction, items }: { direction: TravelDirection; items: TravelSegment[] }) => {
    const theme = getDirectionTheme(direction);
    const Icon = theme.icon;
    return (
      <section className={cn('rounded-[28px] border-2 p-5 space-y-3', theme.panelClass)}>
        <div className="flex items-center gap-3">
          <span className={cn('w-8 h-8 rounded-xl flex items-center justify-center shadow-md', theme.badgeClass)}>
            <Icon className="w-4 h-4" />
          </span>
          <h4 className={cn('text-sm font-black uppercase tracking-[0.2em]', theme.titleClass)}>{theme.label}</h4>
        </div>
        <ol className="space-y-2">
          {items.map((segment, index) => (
            <li
              key={segment.id}
              className={cn(
                'flex flex-col md:flex-row md:items-center justify-between gap-2 bg-white border border-slate-100 border-l-4 rounded-2xl px-4 py-3',
                theme.cardAccentClass
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <SegmentBadge direction={direction} position={index + 1} className="w-7 h-7 text-[10px] rounded-lg" />
                <TransportModeIcon mode={segment.transportMode} className="w-4 h-4" />
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                  {segment.origin} <ArrowRight className="w-3 h-3 text-slate-400" /> {segment.destination}
                </span>
              </div>
              <div className="flex items-center gap-6 text-right pl-10 md:pl-0">
                <span className="text-[11px] font-black text-slate-700">
                  {dateService.formatDateTimeSafe(segment.departureDateTime)}
                </span>
                <span className="text-[11px] font-bold text-slate-500 w-36 truncate">
                  {segment.airlineQuote} • {formatCurrency(segment.priceQuote || 0)}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </section>
    );
  };
  const totalQuoted = ordered.reduce((sum, s) => sum + (s.priceQuote || 0), 0);

  const hasWarnings = warnings.length > 0;
  const justificationOk = !hasWarnings || justification.trim().length >= MIN_ITINERARY_JUSTIFICATION_LENGTH;
  const canSubmit = confirmed && justificationOk && !isSubmitting;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Confira o itinerário</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              {passengerName || 'Passageiro'} • {tripType === 'ida_volta' ? 'Ida e volta' : 'Somente ida'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-8">
          {/* Linha do tempo: Ida · Estadia · Volta */}
          <div className="space-y-4">
            {blocks[0].items.length > 0 && renderBlock(blocks[0])}
            {blocks[1].items.length > 0 && <StaySeparator segments={segments} />}
            {blocks[1].items.length > 0 && renderBlock(blocks[1])}
          </div>

          <div className="flex justify-end">
            <span className="text-xs font-black text-slate-700">
              Total cotado: <span className="text-blue-600">{formatCurrency(totalQuoted)}</span>
            </span>
          </div>

          {/* Alertas */}
          {hasWarnings && (
            <section className="p-6 bg-amber-50 border border-amber-200 rounded-[24px] space-y-4">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">Pontos de atenção no itinerário</span>
              </div>
              <ul className="space-y-1.5 pl-6 list-disc text-xs font-semibold text-amber-900">
                {warnings.map((warning, index) => <li key={index}>{warning.message}</li>)}
              </ul>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-amber-800 uppercase tracking-widest">
                  Justificativa obrigatória
                </label>
                <textarea
                  value={justification}
                  onChange={(e) => onJustificationChange(e.target.value)}
                  placeholder="Explique por que o itinerário está assim (ex.: trecho entre as cidades será feito com veículo da obra)."
                  className="w-full p-4 rounded-2xl border border-amber-200 bg-white focus:ring-2 focus:ring-amber-500 outline-none text-sm font-medium h-24 resize-none"
                />
                {!justificationOk && (
                  <p className="text-[10px] font-bold text-amber-700">
                    Mínimo de {MIN_ITINERARY_JUSTIFICATION_LENGTH} caracteres.
                  </p>
                )}
              </div>
            </section>
          )}

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-bold text-slate-700">
              Conferi o itinerário: os trechos de ida e de volta, as datas e as cotações estão corretos.
            </span>
          </label>

          {submitError && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-700 whitespace-pre-line">
              {submitError}
            </div>
          )}
        </div>

        <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-white">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
          >
            Voltar e corrigir
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canSubmit}
            className="px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white bg-slate-900 hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Confirmar e enviar
          </button>
        </div>
      </div>
    </div>
  );
}
