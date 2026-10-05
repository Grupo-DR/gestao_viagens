import { TravelSegment, TravelInfo, TravelDirection, TripType } from './types';

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
    priceQuote: 0,
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

// ──────────────────────────────────────────────
// Montagem do itinerário (blocos de Ida e Volta)
// ──────────────────────────────────────────────

/** Trechos sem direção (legados) são tratados como ida. */
function directionOf(segment: TravelSegment): TravelDirection {
  return segment.direction === 'volta' ? 'volta' : 'ida';
}

/**
 * Normaliza um nome de cidade para comparação.
 * Remove acentos, conteúdo entre parênteses e o sufixo de UF.
 * Ex: "São Paulo - SP", "Sao Paulo/SP" e "São Paulo (GRU)" → "SAO PAULO"
 */
export function normalizeCityName(value?: string | null): string {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\s*[-/]\s*[A-Za-z]{2}\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

/**
 * Ordena o itinerário na sequência de viagem:
 * todos os trechos de ida (por `order`) seguidos dos trechos de volta.
 */
export function sortItinerary(segments: TravelSegment[]): TravelSegment[] {
  const byOrder = (a: TravelSegment, b: TravelSegment) => (a.order ?? 0) - (b.order ?? 0);
  const ida = segments.filter(s => directionOf(s) === 'ida').sort(byOrder);
  const volta = segments.filter(s => directionOf(s) === 'volta').sort(byOrder);
  return [...ida, ...volta];
}

/** Ordena (ida → volta) e reindexa `order` de 1 a N. */
export function normalizeItineraryOrder(segments: TravelSegment[]): TravelSegment[] {
  return reindexSegments(sortItinerary(segments));
}

/** Deduz o tipo de viagem de registros que não o gravaram. */
export function inferTripType(segments: TravelSegment[]): TripType {
  return segments.some(s => directionOf(s) === 'volta') ? 'ida_volta' : 'somente_ida';
}

/**
 * Adiciona um trecho ao final do bloco indicado, já encadeado:
 * a origem é o destino do trecho anterior do bloco (ou, no primeiro trecho
 * de volta, o destino final da ida).
 */
export function addSegmentToItinerary(segments: TravelSegment[], direction: TravelDirection): TravelSegment[] {
  const ordered = sortItinerary(segments);
  const ida = ordered.filter(s => directionOf(s) === 'ida');
  const volta = ordered.filter(s => directionOf(s) === 'volta');
  const block = direction === 'ida' ? ida : volta;
  const previous = block[block.length - 1] ?? (direction === 'volta' ? ida[ida.length - 1] : undefined);

  const segment = createEmptySegment(0, direction);
  if (previous) {
    segment.origin = previous.destination;
    segment.originTerminal = previous.destinationTerminal ?? '';
  }

  const next = direction === 'ida' ? [...ida, segment, ...volta] : [...ida, ...volta, segment];
  return reindexSegments(next);
}

/** Remove um trecho e reindexa o itinerário. */
export function removeSegmentFromItinerary(segments: TravelSegment[], id: string): TravelSegment[] {
  return normalizeItineraryOrder(segments.filter(s => s.id !== id));
}

/** Campo do trecho seguinte que acompanha a alteração de um campo do trecho atual. */
const CHAINED_FIELDS: Partial<Record<keyof TravelSegment, keyof TravelSegment>> = {
  destination: 'origin',
  destinationTerminal: 'originTerminal',
};

/** Só propaga enquanto o campo alvo ainda estiver encadeado (vazio ou igual ao valor anterior). */
function isStillChained(target: unknown, previousValue: unknown): boolean {
  const targetStr = String(target ?? '');
  return !targetStr.trim() || targetStr === String(previousValue ?? '');
}

/**
 * Atualiza um campo de um trecho mantendo o itinerário encadeado:
 * - destino de um trecho → origem do trecho seguinte (inclusive da última ida para a primeira volta);
 * - origem do primeiro trecho de ida → destino do último trecho de volta.
 * Alterações manuais no trecho seguinte quebram o encadeamento e são preservadas.
 */
export function updateItinerarySegment<K extends keyof TravelSegment>(
  segments: TravelSegment[],
  id: string,
  field: K,
  value: TravelSegment[K]
): TravelSegment[] {
  const ordered = sortItinerary(segments);
  const index = ordered.findIndex(s => s.id === id);
  if (index < 0) return segments;

  const current = ordered[index];
  const updated = ordered.map(s => (s.id === id ? { ...s, [field]: value } : s));

  const chainedField = CHAINED_FIELDS[field];
  const next = updated[index + 1];
  if (chainedField && next && isStillChained(next[chainedField], current[field])) {
    updated[index + 1] = { ...next, [chainedField]: value };
  }

  const isFirstIda = index === 0 && directionOf(current) === 'ida';
  const lastIndex = updated.length - 1;
  const last = updated[lastIndex];
  if (
    field === 'origin' && isFirstIda && lastIndex > 0 &&
    directionOf(last) === 'volta' && isStillChained(last.destination, current.origin)
  ) {
    updated[lastIndex] = { ...last, destination: value as string };
  }

  return reindexSegments(updated);
}

/**
 * Gera os trechos de volta espelhando a ida (ordem inversa, origem/destino trocados).
 * Datas e cotações ficam em branco para o solicitante preencher.
 * Substitui trechos de volta existentes.
 */
export function buildReturnFromOutbound(segments: TravelSegment[]): TravelSegment[] {
  const ida = sortItinerary(segments).filter(s => directionOf(s) === 'ida');
  const volta = [...ida].reverse().map((s): TravelSegment => ({
    ...createEmptySegment(0, 'volta'),
    transportMode: s.transportMode,
    origin: s.destination,
    originTerminal: s.destinationTerminal ?? '',
    destination: s.origin,
    destinationTerminal: s.originTerminal ?? '',
    baggageRequired: s.baggageRequired,
  }));
  return reindexSegments([...ida, ...volta]);
}

/** Diferença em dias de calendário entre duas datas (YYYY-MM-DD[THH:mm]), ignorando o horário. */
function calendarDaysBetween(from: string, to: string): number | null {
  const toUtc = (value: string) => {
    const [year, month, day] = value.split('T')[0].split('-').map(Number);
    return year && month && day ? Date.UTC(year, month - 1, day) : null;
  };
  const start = toUtc(from);
  const end = toUtc(to);
  if (start === null || end === null) return null;
  return Math.round((end - start) / 86_400_000);
}

export interface StayInfo {
  /** Cidade onde o passageiro permanece (destino final da ida) */
  city: string;
  /** Dias de calendário entre a chegada da ida e a partida da volta (negativo = datas inconsistentes) */
  days: number;
}

/**
 * Estadia no destino: da chegada (ou partida, se não informada) do último trecho de ida
 * até a partida do primeiro trecho de volta.
 * Retorna null quando o itinerário não tem ida e volta com datas.
 */
export function getStayInfo(segments: TravelSegment[]): StayInfo | null {
  const ordered = sortItinerary(segments);
  const lastIda = ordered.filter(s => directionOf(s) === 'ida').pop();
  const firstVolta = ordered.find(s => directionOf(s) === 'volta');
  if (!lastIda || !firstVolta) return null;

  const start = lastIda.arrivalDateTime || lastIda.departureDateTime;
  const end = firstVolta.departureDateTime;
  if (!start || !end) return null;

  const days = calendarDaysBetween(start, end);
  return days === null ? null : { city: lastIda.destination, days };
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

  // Garante a sequência ida → volta e filtra segmentos com dados mínimos
  const validSegments = sortItinerary(segments).filter(s => s.origin || s.destination);

  if (validSegments.length === 0) {
    return {
      origin: '',
      destination: '',
      departureDateTime: '',
      baggageRequired: false,
    };
  }

  const first = validSegments[0];
  const ida = validSegments.filter(s => directionOf(s) === 'ida');
  const firstVolta = validSegments.find(s => directionOf(s) === 'volta');
  // Destino principal = fim da ida (numa ida e volta, o último trecho termina na origem)
  const mainDestination = ida[ida.length - 1] ?? validSegments[validSegments.length - 1];

  return {
    origin: first.origin,
    destination: mainDestination.destination,
    departureDateTime: first.departureDateTime,
    // Conexões na ida não são retorno: a volta começa no primeiro trecho de volta
    returnDateTime: firstVolta ? firstVolta.departureDateTime : null,
    baggageRequired: validSegments.some(s => s.baggageRequired),
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
