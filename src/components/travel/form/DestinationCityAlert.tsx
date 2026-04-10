import React from 'react';
import { AlertTriangle, CheckCircle2, MapPin, Search } from 'lucide-react';
import { TravelReason } from '../../../domain/enums.ts';
import { PolicyResult } from '../../../domain/policy/enums.ts';
import { PolicyDecision } from '../../../domain/policy/types.ts';
import { TravelSegment } from '../../../domain/types.ts';
import { cn } from '../../../lib/utils.ts';

const REASONS_REQUIRING_CITY_CHECK = new Set<TravelReason>([
  TravelReason.FOLGA,
  TravelReason.FERIAS,
  TravelReason.FOLGA_FERIAS,
  TravelReason.DEMISSAO,
]);

interface DestinationCityAlertProps {
  homeCity: string;
  segments: TravelSegment[];
  reason: TravelReason;
  visible: boolean;
  geoDecision?: PolicyDecision | null;
}

function normalizeCity(city: string): string {
  return city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9\s\-]/gi, '')
    .toUpperCase()
    .trim();
}

function extractCityName(cityStr: string): string {
  return cityStr.split('-')[0].trim();
}

type MatchStatus = 'match' | 'mismatch' | 'no_destination' | 'no_home_city';

function evaluateDestinations(
  homeCity: string,
  segments: TravelSegment[]
): { status: MatchStatus; finalDestination: string } {
  if (!homeCity) return { status: 'no_home_city', finalDestination: '' };

  const idaSegments = segments
    .filter((segment) => segment.direction === 'ida' && segment.destination?.trim())
    .sort((a, b) => a.order - b.order);

  if (idaSegments.length === 0) {
    return { status: 'no_destination', finalDestination: '' };
  }

  const lastSegment = idaSegments[idaSegments.length - 1];
  const normalizedHomeCity = normalizeCity(extractCityName(homeCity));
  const normalizedFinalDest = normalizeCity(extractCityName(lastSegment.destination));

  return {
    status: normalizedFinalDest === normalizedHomeCity ? 'match' : 'mismatch',
    finalDestination: lastSegment.destination,
  };
}

export function DestinationCityAlert({
  homeCity,
  segments,
  reason,
  visible,
  geoDecision,
}: DestinationCityAlertProps) {
  if (!visible) return null;

  const isApplicable = REASONS_REQUIRING_CITY_CHECK.has(reason);
  
  // Se temos a decisão do motor, usamos ela como fonte da verdade
  const { status: internalStatus, finalDestination: internalDest } = evaluateDestinations(homeCity, segments);
  
  let status: MatchStatus = internalStatus;
  let finalDestination = internalDest;

  if (geoDecision) {
    // Só sobrepomos o status se houver um destino real para validar
    if (geoDecision.evidence?.destinationCity) {
      if (geoDecision.result === PolicyResult.APPROVED) status = 'match';
      else if (geoDecision.result === PolicyResult.MANUAL_VALIDATION) status = 'mismatch';
    } else {
      status = 'no_destination';
    }
    finalDestination = geoDecision.evidence?.destinationCity || internalDest;
  }

  const isMatch = status === 'match';
  const isPending = status === 'no_home_city' || status === 'no_destination' || !finalDestination;
  const isNeutral = !isApplicable || isPending;

  return (
    <div
      className={cn(
        'h-full rounded-[28px] border-2 p-6 transition-all duration-500 animate-in slide-in-from-top-4',
        isNeutral
          ? 'bg-slate-50 border-slate-100'
          : isMatch
            ? 'bg-emerald-50/50 border-emerald-100/50'
            : 'bg-amber-50/50 border-amber-100/80'
      )}
    >
      <div className="space-y-4 min-w-0 flex-1">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/50 shrink-0',
              isNeutral
                ? 'bg-white text-slate-300'
                : isMatch
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-amber-100 text-amber-600'
            )}
          >
            {isNeutral ? (
              <Search className="w-6 h-6 animate-pulse" />
            ) : isMatch ? (
              <CheckCircle2 className="w-7 h-7" />
            ) : (
              <AlertTriangle className="w-7 h-7" />
            )}
          </div>

          <div className="space-y-1.5 min-w-0">
            <h4 className="font-black text-slate-900 text-xs tracking-widest italic uppercase flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" /> Política de Destino
            </h4>

            {!isApplicable ? (
              <p className="text-sm font-bold text-slate-700 leading-tight italic">
                Validação de destino não aplicável para o motivo da viagem selecionado.
              </p>
            ) : isPending ? (
              <p className="text-sm font-bold text-slate-700 leading-tight italic">
                Aguardando integração do colaborador e preenchimento do destino final para validar a política.
              </p>
            ) : isMatch ? (
              <p className="text-sm font-bold text-slate-700 leading-tight italic">
                Destino confirmado. A cidade final da viagem coincide com o cadastro do colaborador.
              </p>
            ) : (
              <p className="text-sm font-bold text-amber-700 leading-tight italic">
                Destino divergente do cadastro. A viagem precisa de atenção do Capital Humano.
              </p>
            )}

            <p className="text-[10px] font-medium text-slate-400 leading-relaxed max-w-lg">
              {!isApplicable
                ? 'A conferência automática de cidade só é aplicada para motivos com exigência de validação geográfica.'
                : isPending
                  ? 'Assim que o destino final do itinerário estiver preenchido, a comparação com o RM será recalculada automaticamente.'
                  : isMatch
                    ? 'Confirmação automática via cruzamento com a base de colaboradores do RM TOTVS.'
                    : 'O destino informado não corresponde à cidade de residência cadastrada no RM. A solicitação pode seguir, mas tende à revisão manual.'}
            </p>
          </div>
        </div>

        {isApplicable && !isPending && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3">
              <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400">
                Cidade no RM
              </span>
              <span className="mt-1 block text-sm font-bold text-slate-700">{homeCity}</span>
            </div>
            <div
              className={cn(
                'rounded-2xl border px-4 py-3',
                isMatch
                  ? 'border-emerald-200 bg-emerald-50/80'
                  : 'border-amber-200 bg-amber-50/80'
              )}
            >
              <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400">
                Destino Final
              </span>
              <span
                className={cn(
                  'mt-1 block text-sm font-bold',
                  isMatch ? 'text-emerald-700' : 'text-amber-700'
                )}
              >
                {finalDestination}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
