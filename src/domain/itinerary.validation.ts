// ============================================================
// DOMAIN — Validação de Itinerário (funções puras)
// Regras de coerência do itinerário como um todo (ida → volta).
// Usada pelo formulário (feedback ao usuário) e pelo serviço (barreira no envio).
// ============================================================

import { TravelReason } from './enums';
import type { TravelSegment, TravelRequestFormData, TripType } from './types';
import { sortItinerary, normalizeCityName, validateSegment } from './travelSegment.helpers';

/** Tamanho mínimo da justificativa exigida quando o itinerário tem alertas */
export const MIN_ITINERARY_JUSTIFICATION_LENGTH = 10;

/** Motivos em que as datas da viagem devem respeitar o período de afastamento */
const REASONS_WITH_LEAVE_PERIOD = new Set<TravelReason>([
  TravelReason.FOLGA,
  TravelReason.FERIAS,
  TravelReason.FOLGA_FERIAS,
]);

export type ItineraryIssueCode =
  // Bloqueantes
  | 'MISSING_IDA'
  | 'MISSING_VOLTA'
  | 'UNEXPECTED_VOLTA'
  | 'SEGMENT_FIELDS'
  | 'SAME_ORIGIN_DESTINATION'
  | 'PAST_DEPARTURE'
  | 'OUT_OF_ORDER'
  | 'IDA_RETURNS_TO_ORIGIN'
  // Alertas (exigem justificativa)
  | 'CONTINUITY_BREAK'
  | 'VOLTA_NOT_TO_ORIGIN'
  | 'IDA_BEFORE_LEAVE'
  | 'VOLTA_AFTER_LEAVE';

export interface ItineraryIssue {
  code: ItineraryIssueCode;
  /** Mensagem completa, com identificação do trecho */
  message: string;
  segmentId?: string;
  /** Mensagem sem o rótulo do trecho, para exibição dentro do card */
  segmentMessage?: string;
}

export interface ItineraryValidationOptions {
  tripType: TripType;
  /** Referência para "data no passado" — injetável para testes */
  now?: Date;
  /** Período de afastamento (Folga/Férias) no formato YYYY-MM-DD */
  leavePeriod?: { leaveStartDate?: string; leaveEndDate?: string };
}

export interface ItineraryValidationResult {
  isValid: boolean;
  blocking: ItineraryIssue[];
  warnings: ItineraryIssue[];
  /** Mensagens bloqueantes agrupadas por trecho */
  segmentErrors: Record<string, string[]>;
}

// ──────────────────────────────────────────────
// Helpers internos
// ──────────────────────────────────────────────

function toTime(value?: string | null): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function datePart(value?: string | null): string {
  return value ? value.split('T')[0] : '';
}

/** "2026-11-10" → "10/11/2026" */
function formatDateBR(value: string): string {
  const [year, month, day] = datePart(value).split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

/** Rótulo do trecho dentro do seu bloco. Ex: "Volta • Trecho 2" */
export function getSegmentLabel(segment: TravelSegment, segments: TravelSegment[]): string {
  const isVolta = segment.direction === 'volta';
  const block = sortItinerary(segments).filter(s => (s.direction === 'volta') === isVolta);
  const position = block.findIndex(s => s.id === segment.id) + 1;
  return `${isVolta ? 'Volta' : 'Ida'} • Trecho ${position}`;
}

// ──────────────────────────────────────────────
// Validação
// ──────────────────────────────────────────────

/**
 * Valida o itinerário completo.
 * - `blocking`: impede o envio.
 * - `warnings`: permite o envio mediante justificativa do solicitante.
 */
export function validateItinerary(
  segments: TravelSegment[],
  { tripType, now = new Date(), leavePeriod }: ItineraryValidationOptions
): ItineraryValidationResult {
  const blocking: ItineraryIssue[] = [];
  const warnings: ItineraryIssue[] = [];

  const ordered = sortItinerary(segments);
  const ida = ordered.filter(s => s.direction !== 'volta');
  const volta = ordered.filter(s => s.direction === 'volta');

  const segmentIssue = (code: ItineraryIssueCode, segment: TravelSegment, detail: string): ItineraryIssue => ({
    code,
    segmentId: segment.id,
    segmentMessage: detail,
    message: `${getSegmentLabel(segment, ordered)}: ${detail}`,
  });

  // 1. Estrutura da viagem
  if (ida.length === 0) {
    blocking.push({ code: 'MISSING_IDA', message: 'Inclua ao menos um trecho de ida.' });
  }
  if (tripType === 'ida_volta' && volta.length === 0) {
    blocking.push({
      code: 'MISSING_VOLTA',
      message: 'Inclua os trechos de volta ou marque a viagem como "Somente ida".',
    });
  }
  if (tripType === 'somente_ida' && volta.length > 0) {
    blocking.push({
      code: 'UNEXPECTED_VOLTA',
      message: 'A viagem está marcada como "Somente ida", mas possui trechos de volta.',
    });
  }

  // 2. Regras por trecho
  for (const segment of ordered) {
    for (const detail of validateSegment(segment)) {
      blocking.push(segmentIssue('SEGMENT_FIELDS', segment, detail));
    }

    const origin = normalizeCityName(segment.origin);
    if (origin && origin === normalizeCityName(segment.destination)) {
      blocking.push(segmentIssue('SAME_ORIGIN_DESTINATION', segment, 'Origem e destino são a mesma cidade.'));
    }

    const departure = toTime(segment.departureDateTime);
    if (departure !== null && departure < now.getTime()) {
      blocking.push(segmentIssue('PAST_DEPARTURE', segment, 'A data de partida já passou.'));
    }
  }

  // 3. Cronologia e continuidade na sequência ida → volta
  for (let i = 1; i < ordered.length; i++) {
    const previous = ordered[i - 1];
    const current = ordered[i];

    const departure = toTime(current.departureDateTime);
    const previousArrival = toTime(previous.arrivalDateTime);
    const previousReference = previousArrival ?? toTime(previous.departureDateTime);
    if (departure !== null && previousReference !== null && departure < previousReference) {
      const reference = previousArrival !== null ? 'da chegada' : 'da partida';
      blocking.push(segmentIssue(
        'OUT_OF_ORDER',
        current,
        `Parte antes ${reference} do trecho anterior (${getSegmentLabel(previous, ordered)}).`
      ));
    }

    const previousDestination = normalizeCityName(previous.destination);
    const currentOrigin = normalizeCityName(current.origin);
    if (previousDestination && currentOrigin && previousDestination !== currentOrigin) {
      warnings.push(segmentIssue(
        'CONTINUITY_BREAK',
        current,
        `Sai de ${current.origin.trim()}, mas o trecho anterior termina em ${previous.destination.trim()}.`
      ));
    }
  }

  // 4. Trecho de volta lançado como ida / volta que não retorna à origem
  const tripOriginLabel = ida[0]?.origin?.trim() ?? '';
  const tripOrigin = normalizeCityName(tripOriginLabel);
  if (tripOrigin) {
    for (const segment of ida.slice(1)) {
      if (normalizeCityName(segment.destination) === tripOrigin) {
        blocking.push(segmentIssue(
          'IDA_RETURNS_TO_ORIGIN',
          segment,
          `Retorna para ${tripOriginLabel}, cidade onde a viagem começa. Se este trecho faz parte do retorno, cadastre-o no bloco de Volta.`
        ));
      }
    }

    const lastVolta = volta[volta.length - 1];
    const lastVoltaDestination = normalizeCityName(lastVolta?.destination);
    if (tripType === 'ida_volta' && lastVoltaDestination && lastVoltaDestination !== tripOrigin) {
      warnings.push(segmentIssue(
        'VOLTA_NOT_TO_ORIGIN',
        lastVolta,
        `A volta termina em ${lastVolta.destination.trim()}, diferente da cidade de partida (${tripOriginLabel}).`
      ));
    }
  }

  // 5. Período de afastamento (Folga/Férias)
  const leaveStart = leavePeriod?.leaveStartDate;
  const firstIdaDate = datePart(ida[0]?.departureDateTime);
  if (leaveStart && firstIdaDate && firstIdaDate < leaveStart) {
    warnings.push(segmentIssue(
      'IDA_BEFORE_LEAVE',
      ida[0],
      `A ida (${formatDateBR(firstIdaDate)}) é antes do início do afastamento (${formatDateBR(leaveStart)}).`
    ));
  }
  const leaveEnd = leavePeriod?.leaveEndDate;
  const lastVoltaSegment = volta[volta.length - 1];
  const lastVoltaDate = datePart(lastVoltaSegment?.departureDateTime);
  if (leaveEnd && lastVoltaDate && lastVoltaDate > leaveEnd) {
    warnings.push(segmentIssue(
      'VOLTA_AFTER_LEAVE',
      lastVoltaSegment,
      `A volta (${formatDateBR(lastVoltaDate)}) é depois do fim do afastamento (${formatDateBR(leaveEnd)}).`
    ));
  }

  const segmentErrors: Record<string, string[]> = {};
  for (const issue of blocking) {
    if (!issue.segmentId) continue;
    (segmentErrors[issue.segmentId] ??= []).push(issue.segmentMessage ?? issue.message);
  }

  return { isValid: blocking.length === 0, blocking, warnings, segmentErrors };
}

/**
 * Valida o itinerário a partir dos dados do formulário.
 * Aplica o período de afastamento apenas aos motivos de Folga/Férias.
 */
export function validateItineraryForForm(
  formData: Pick<TravelRequestFormData, 'segments' | 'tripType' | 'reason' | 'leaveStartDate' | 'leaveEndDate'>,
  now: Date = new Date()
): ItineraryValidationResult {
  const leavePeriod = REASONS_WITH_LEAVE_PERIOD.has(formData.reason)
    ? { leaveStartDate: formData.leaveStartDate || undefined, leaveEndDate: formData.leaveEndDate || undefined }
    : undefined;

  return validateItinerary(formData.segments ?? [], {
    tripType: formData.tripType,
    now,
    leavePeriod,
  });
}

/** Verifica se a justificativa cobre os alertas do itinerário. */
export function isItineraryJustificationValid(
  result: ItineraryValidationResult,
  justification?: string | null
): boolean {
  if (result.warnings.length === 0) return true;
  return (justification ?? '').trim().length >= MIN_ITINERARY_JUSTIFICATION_LENGTH;
}
