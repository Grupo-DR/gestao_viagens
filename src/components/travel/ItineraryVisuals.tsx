import React from 'react';
import { Bus, Hotel, Plane } from 'lucide-react';
import { TravelDirection, TravelSegment } from '../../domain/types';
import { getStayInfo } from '../../domain/travelSegment.helpers';
import { getDirectionTheme, shortCityName } from './directionTheme';
import { cn } from '../../lib/utils';

// ============================================================
// Elementos visuais de itinerário compartilhados entre
// formulário, revisão de envio e Ficha de Viagem.
// ============================================================

interface SegmentBadgeProps {
  direction?: TravelDirection;
  position: number;
  className?: string;
}

/** Círculo numerado com prefixo do sentido (I1, I2, V1...). */
export function SegmentBadge({ direction, position, className }: SegmentBadgeProps) {
  const theme = getDirectionTheme(direction);
  return (
    <span
      className={cn(
        'rounded-xl flex items-center justify-center font-black shrink-0 shadow-sm',
        theme.badgeClass,
        className ?? 'w-8 h-8 text-[10px]'
      )}
    >
      {theme.prefix}{position}
    </span>
  );
}

/** Ícone neutro do modal de transporte — a cor fica reservada ao sentido. */
export function TransportModeIcon({ mode, className }: { mode: TravelSegment['transportMode']; className?: string }) {
  const Icon = mode === 'aereo' ? Plane : Bus;
  return <Icon className={cn('w-3.5 h-3.5 text-slate-400 shrink-0', className)} />;
}

/** Resumo da rota do bloco: "Belo Horizonte ✈ São Paulo 🚌 Registro". */
export function RouteSummary({ segments }: { segments: TravelSegment[] }) {
  const filled = segments.filter(s => s.origin.trim() || s.destination.trim());
  if (filled.length === 0) {
    return <span className="text-[11px] font-medium italic text-slate-400">Preencha os trechos abaixo</span>;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-slate-700">
      <span>{shortCityName(filled[0].origin) || '?'}</span>
      {filled.map(segment => (
        <React.Fragment key={segment.id}>
          <TransportModeIcon mode={segment.transportMode} />
          <span>{shortCityName(segment.destination) || '?'}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

/** Separador entre Ida e Volta com o tempo de estadia no destino. */
export function StaySeparator({ segments }: { segments: TravelSegment[] }) {
  const stay = getStayInfo(segments);
  if (!stay) return null;

  const city = shortCityName(stay.city) || 'no destino';
  const isInconsistent = stay.days < 0;
  const text = isInconsistent
    ? 'Datas inconsistentes: a volta está antes da chegada da ida'
    : stay.days === 0
      ? `Retorno no mesmo dia em ${city}`
      : `Estadia em ${city}: ${stay.days} ${stay.days === 1 ? 'dia' : 'dias'}`;

  return (
    <div className="flex items-center gap-3" role="separator">
      <div className="flex-1 border-t-2 border-dotted border-slate-200" />
      <span
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest text-center',
          isInconsistent ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-slate-500 border-slate-200'
        )}
      >
        <Hotel className="w-3.5 h-3.5 shrink-0" /> {text}
      </span>
      <div className="flex-1 border-t-2 border-dotted border-slate-200" />
    </div>
  );
}
