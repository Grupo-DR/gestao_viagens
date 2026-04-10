import React from 'react';
import { MapPin, CheckCircle2, AlertTriangle } from 'lucide-react';
import { TravelSegment } from '../../../domain/types.ts';
import { TravelReason } from '../../../domain/enums.ts';
import { cn } from '../../../lib/utils.ts';

/** Motivos de viagem que exigem validação de cidade de destino */
const REASONS_REQUIRING_CITY_CHECK = new Set<TravelReason>([
  TravelReason.FOLGA,
  TravelReason.FERIAS,
  TravelReason.FOLGA_FERIAS,
  TravelReason.DEMISSAO,
]);

interface DestinationCityAlertProps {
  /** Cidade cadastrada no RM no formato "CIDADE - UF" */
  homeCity: string;
  /** Trechos do itinerário preenchidos pelo usuário */
  segments: TravelSegment[];
  /** Motivo da viagem — validação só ocorre em contextos específicos */
  reason: TravelReason;
  visible: boolean;
}

/**
 * Normaliza uma string de cidade para comparação:
 * remove acentos, converte para maiúsculas e elimina caracteres especiais.
 */
function normalizeCity(city: string): string {
  return city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')       // remove diacríticos
    .replace(/[^A-Z0-9\s\-]/gi, '')         // remove caracteres especiais
    .toUpperCase()
    .trim();
}

/**
 * Extrai apenas o nome da cidade de uma string no formato "CIDADE - UF" ou "Cidade".
 */
function extractCityName(cityStr: string): string {
  return cityStr.split('-')[0].trim();
}

type MatchStatus = 'match' | 'mismatch' | 'no_destination' | 'no_home_city';

function evaluateDestinations(homeCity: string, segments: TravelSegment[]): {
  status: MatchStatus;
  finalDestination: string;
} {
  if (!homeCity) return { status: 'no_home_city', finalDestination: '' };

  // Considera apenas trechos de IDA com destino preenchido
  const idaSegments = segments
    .filter(s => s.direction === 'ida' && s.destination?.trim())
    .sort((a, b) => a.order - b.order);

  if (idaSegments.length === 0) {
    return { status: 'no_destination', finalDestination: '' };
  }

  // Em viagens multi-trecho, compara apenas o DESTINO FINAL (last IDA segment)
  const lastSegment = idaSegments[idaSegments.length - 1];
  const normalizedHomeCity = normalizeCity(extractCityName(homeCity));
  const normalizedFinalDest = normalizeCity(extractCityName(lastSegment.destination));

  const status: MatchStatus = normalizedFinalDest === normalizedHomeCity ? 'match' : 'mismatch';
  return { status, finalDestination: lastSegment.destination };
}

export function DestinationCityAlert({ homeCity, segments, reason, visible }: DestinationCityAlertProps) {
  // Só valida para motivos de viagem relevantes (Folga, Férias, Férias+Folga, Demissão)
  if (!visible || !REASONS_REQUIRING_CITY_CHECK.has(reason)) return null;

  const { status, finalDestination } = evaluateDestinations(homeCity, segments);

  if (status === 'no_home_city' || status === 'no_destination') {
    return null; // Nada a exibir enquanto incompleto
  }

  const isMatch = status === 'match';

  return (
    <div className={cn(
      "p-6 rounded-2xl border-2 transition-all duration-500 flex gap-5 animate-in slide-in-from-top-4",
      isMatch
        ? "bg-emerald-50/50 border-emerald-100/50"
        : "bg-amber-50/50 border-amber-100/80"
    )}>
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/50 shrink-0",
        isMatch ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
      )}>
        {isMatch
          ? <CheckCircle2 className="w-7 h-7" />
          : <AlertTriangle className="w-7 h-7" />
        }
      </div>

      <div className="space-y-1.5 min-w-0 flex-1">
        <h4 className="font-black text-slate-900 text-xs tracking-widest italic uppercase flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5" /> Validação de Cidade de Destino
        </h4>

        {isMatch ? (
          <p className="text-sm font-bold text-slate-700 leading-tight italic">
            Destino confirmado. A cidade da viagem corresponde à cidade cadastrada do colaborador.
          </p>
        ) : (
          <>
            <p className="text-sm font-bold text-amber-700 leading-tight italic">
              Destino divergente do cadastro. Verifique se a viagem está correta.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Cidade cadastrada no RM:
              </span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-black rounded-full border border-slate-200 uppercase">
                {homeCity}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Destino final na solicitação:
              </span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full border border-amber-200 uppercase">
                {finalDestination}
              </span>
            </div>
          </>
        )}

        <p className="text-[10px] font-medium text-slate-400 leading-relaxed max-w-lg pt-1">
          {isMatch
            ? "Confirmação automática via cruzamento com o banco de colaboradores do RM TOTVS."
            : "O destino inserido não corresponde à cidade de residência do colaborador. A solicitação pode ser válida (obras, viagens a trabalho), mas será revisada pelo Capital Humano."}
        </p>
      </div>
    </div>
  );
}
