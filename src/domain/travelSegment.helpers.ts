import { TravelSegment, TravelInfo, TravelDirection } from './types';

/**
 * Gera um ID único para o trecho.
 * Usa crypto.randomUUID() com fallback seguro.
 */
export function generateSegmentId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `seg-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;
}

/**
 * Cria um trecho vazio com ID robusto e ordem definida.
 * Garante que todos os campos opcionais tenham valores iniciais de string vazia.
 */
export function createEmptySegment(order: number, direction: TravelDirection = 'ida'): TravelSegment {
  return {
    id: generateSegmentId(),
    order,
    transportMode: 'aereo',
    direction,
    origin: '',
    originTerminal: '',
    destination: '',
    destinationTerminal: '',
    departureDateTime: '',
    arrivalDateTime: '',
    baggageRequired: false,
    airlineQuote: '',
  };
}

export const createNewSegment = createEmptySegment;

/**
 * Reindexa a ordem dos trechos sequencialmente (1, 2, 3...).
 * Essencial após remoção de trechos intermediários.
 */
export function reindexSegments(segments: TravelSegment[]): TravelSegment[] {
  return segments.map((s, idx) => ({
    ...s,
    order: idx + 1
  }));
}

/**
 * Normaliza segmentos a partir de uma estrutura de viagem (lida dados legados).
 * Se já houver segmentos, retorna-os reindexados.
 * Caso contrário, cria a partir dos campos raiz v2 com shape completo.
 */
export function normalizeSegmentsFromTravel(travel: TravelInfo): TravelSegment[] {
  if (travel.segments && travel.segments.length > 0) {
    return reindexSegments(travel.segments);
  }

  const segments: TravelSegment[] = [];
  
  // Segmento 1: Ida
  segments.push({
    id: 'legacy-1',
    order: 1,
    transportMode: 'aereo',
    origin: travel.origin || '',
    originTerminal: '',
    destination: travel.destination || '',
    destinationTerminal: '',
    departureDateTime: travel.departureDateTime || '',
    arrivalDateTime: '',
    baggageRequired: travel.baggageRequired || false,
    direction: 'ida'
  });

  // Segmento 2: Volta (se existir returnDateTime)
  if (travel.returnDateTime) {
    segments.push({
      id: 'legacy-2',
      order: 2,
      transportMode: 'aereo',
      origin: travel.destination || '',
      originTerminal: '',
      destination: travel.origin || '',
      destinationTerminal: '',
      departureDateTime: travel.returnDateTime,
      arrivalDateTime: '',
      baggageRequired: travel.baggageRequired || false,
      direction: 'volta'
    });
  }

  return segments;
}

/**
 * Deriva campos sumários (compatibilidade) a partir da lista de trechos.
 * Útil para persistência duo-mode e relatórios legados.
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

  // Garante que usamos a ordem real
  const sorted = [...segments].sort((a, b) => a.order - b.order);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  return {
    origin: first.origin,
    destination: last.destination,
    departureDateTime: first.departureDateTime,
    returnDateTime: sorted.length > 1 ? last.departureDateTime : null,
    baggageRequired: sorted.some(s => s.baggageRequired),
  };
}

/**
 * Valida um trecho individual.
 */
export function validateSegment(segment: TravelSegment): string[] {
  const errors: string[] = [];

  if (!segment.origin.trim()) errors.push('Origem obrigatória.');
  if (!segment.destination.trim()) errors.push('Destino obrigatório.');
  if (!segment.departureDateTime) errors.push('Data de partida obrigatória.');

  if (segment.departureDateTime && segment.arrivalDateTime) {
    if (new Date(segment.arrivalDateTime) <= new Date(segment.departureDateTime)) {
      errors.push('Chegada deve ser posterior à partida.');
    }
  }

  // Validação de Cotação (Obrigatório DR Construtora)
  if (!segment.airlineQuote || !segment.airlineQuote.trim()) {
    errors.push('Companhia Cotada obrigatória.');
  }

  if (segment.priceQuote === undefined || segment.priceQuote === null || segment.priceQuote <= 0) {
    errors.push('Preço Cotado deve ser maior que zero.');
  }

  return errors;
}

/**
 * Validação em lote: retorna mapa de erros por ID de segmento.
 */
export function validateSegments(segments: TravelSegment[]): Record<string, string[]> {
  const errorMap: Record<string, string[]> = {};
  
  segments.forEach(seg => {
    const errors = validateSegment(seg);
    if (errors.length > 0) {
      errorMap[seg.id] = errors;
    }
  });

  return errorMap;
}
