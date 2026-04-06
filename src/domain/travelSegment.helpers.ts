import { TravelSegment, TravelInfo, TransportMode } from './types';

/**
 * Cria um trecho vazio com ID único.
 */
export function createEmptySegment(id?: string): TravelSegment {
  return {
    id: id || Math.random().toString(36).substring(2, 9),
    transportMode: 'aereo',
    origin: '',
    originTerminal: '',
    destination: '',
    destinationTerminal: '',
    departureDateTime: '',
    arrivalDateTime: '',
    baggageRequired: false,
  };
}

/**
 * Normaliza segmentos a partir de uma estrutura de viagem (lida dados legados).
 * Se já houver segmentos, retorna-os. Caso contrário, cria a partir dos campos raiz.
 */
export function normalizeSegmentsFromTravel(travel: TravelInfo): TravelSegment[] {
  if (travel.segments && travel.segments.length > 0) {
    return travel.segments;
  }

  // Fallback para dados legados (origin/destination/returnDateTime)
  const segments: TravelSegment[] = [];
  
  // Segmento 1: Ida
  segments.push({
    id: 'legacy-1',
    transportMode: 'aereo',
    origin: travel.origin || '',
    destination: travel.destination || '',
    departureDateTime: travel.departureDateTime || '',
    baggageRequired: travel.baggageRequired || false,
  });

  // Segmento 2: Volta (se existir returnDateTime)
  if (travel.returnDateTime) {
    segments.push({
      id: 'legacy-2',
      transportMode: 'aereo',
      origin: travel.destination || '',
      destination: travel.origin || '',
      departureDateTime: travel.returnDateTime,
      baggageRequired: travel.baggageRequired || false,
    });
  }

  return segments;
}

/**
 * Deriva campos sumários (compatibilidade) a partir da lista de trechos.
 */
export function deriveTravelSummaryFromSegments(segments: TravelSegment[]): {
  origin: string;
  destination: string;
  departureDateTime: string;
  returnDateTime?: string;
  baggageRequired: boolean;
} {
  if (!segments || segments.length === 0) {
    return {
      origin: '',
      destination: '',
      departureDateTime: '',
      baggageRequired: false,
    };
  }

  const first = segments[0];
  const last = segments[segments.length - 1];

  return {
    origin: first.origin,
    destination: last.destination,
    departureDateTime: first.departureDateTime,
    // Se houver mais de um trecho, o "return" legado é a partida do último trecho
    returnDateTime: segments.length > 1 ? last.departureDateTime : undefined,
    // Se QUALQUER trecho exigir bagagem, o campo global de rascunho/legado marca como true
    baggageRequired: segments.some(s => s.baggageRequired),
  };
}

/**
 * Valida um trecho individual.
 * Retorna lista de erros (vazia se válido).
 */
export function validateSegment(segment: TravelSegment): string[] {
  const errors: string[] = [];

  if (!segment.origin) errors.push('Origem obrigatória.');
  if (!segment.destination) errors.push('Destino obrigatório.');
  if (!segment.departureDateTime) errors.push('Data de partida obrigatória.');

  if (segment.departureDateTime && segment.arrivalDateTime) {
    if (new Date(segment.arrivalDateTime) <= new Date(segment.departureDateTime)) {
      errors.push('Data de chegada deve ser posterior à partida.');
    }
  }

  return errors;
}
