import { describe, it, expect } from 'vitest';
import {
  validateItinerary,
  validateItineraryForForm,
  isItineraryJustificationValid,
  getSegmentLabel,
  ItineraryIssueCode,
} from '../itinerary.validation';
import { TravelReason } from '../enums';
import type { TravelSegment, TravelDirection } from '../types';

const NOW = new Date('2026-10-01T12:00');

let seq = 0;
function seg(
  direction: TravelDirection,
  origin: string,
  destination: string,
  departureDateTime: string,
  extra: Partial<TravelSegment> = {}
): TravelSegment {
  seq += 1;
  return {
    id: `s${seq}`,
    order: seq,
    transportMode: 'aereo',
    direction,
    origin,
    destination,
    departureDateTime,
    baggageRequired: false,
    airlineQuote: 'LATAM',
    priceQuote: 500,
    ...extra,
  };
}

const codes = (issues: { code: ItineraryIssueCode }[]) => issues.map(i => i.code);

/** Viagem válida: BH ✈ SP 🚌 Registro / Registro 🚌 SP ✈ BH */
function validRoundTrip(): TravelSegment[] {
  return [
    seg('ida', 'Belo Horizonte - MG', 'São Paulo - SP', '2026-11-10T08:00', { arrivalDateTime: '2026-11-10T09:30' }),
    seg('ida', 'São Paulo - SP', 'Registro - SP', '2026-11-10T13:00', { transportMode: 'rodoviario' }),
    seg('volta', 'Registro - SP', 'São Paulo - SP', '2026-11-20T06:00', { transportMode: 'rodoviario', arrivalDateTime: '2026-11-20T10:00' }),
    seg('volta', 'São Paulo - SP', 'Belo Horizonte - MG', '2026-11-20T14:00'),
  ];
}

describe('validateItinerary', () => {
  it('aceita uma viagem de ida e volta multimodal coerente', () => {
    const result = validateItinerary(validRoundTrip(), { tripType: 'ida_volta', now: NOW });
    expect(result.blocking).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.isValid).toBe(true);
  });

  it('bloqueia trecho de volta lançado no bloco de ida (caso relatado)', () => {
    const segments = [
      seg('ida', 'Belo Horizonte - MG', 'Registro - SP', '2026-11-10T08:00'),
      seg('ida', 'Registro - SP', 'Belo Horizonte', '2026-11-20T08:00'),
    ];
    const result = validateItinerary(segments, { tripType: 'somente_ida', now: NOW });
    expect(codes(result.blocking)).toContain('IDA_RETURNS_TO_ORIGIN');
    expect(result.segmentErrors[segments[1].id]).toHaveLength(1);
  });

  it('exige trechos de volta quando a viagem é de ida e volta', () => {
    const segments = [seg('ida', 'Belo Horizonte', 'Registro', '2026-11-10T08:00')];
    expect(codes(validateItinerary(segments, { tripType: 'ida_volta', now: NOW }).blocking)).toContain('MISSING_VOLTA');
    expect(validateItinerary(segments, { tripType: 'somente_ida', now: NOW }).isValid).toBe(true);
  });

  it('bloqueia volta em viagem marcada como somente ida e itinerário sem ida', () => {
    const volta = [seg('volta', 'Registro', 'Belo Horizonte', '2026-11-20T08:00')];
    const result = validateItinerary(volta, { tripType: 'somente_ida', now: NOW });
    expect(codes(result.blocking)).toEqual(expect.arrayContaining(['MISSING_IDA', 'UNEXPECTED_VOLTA']));
  });

  it('bloqueia partida no passado', () => {
    const segments = [seg('ida', 'Belo Horizonte', 'Registro', '2026-09-30T08:00')];
    expect(codes(validateItinerary(segments, { tripType: 'somente_ida', now: NOW }).blocking)).toContain('PAST_DEPARTURE');
  });

  it('bloqueia origem e destino na mesma cidade, ignorando acento, UF e aeroporto', () => {
    const segments = [seg('ida', 'São Paulo (GRU)', 'Sao Paulo/SP', '2026-11-10T08:00')];
    expect(codes(validateItinerary(segments, { tripType: 'somente_ida', now: NOW }).blocking)).toContain('SAME_ORIGIN_DESTINATION');
  });

  it('bloqueia trecho que parte antes da chegada do anterior', () => {
    const segments = [
      seg('ida', 'Belo Horizonte', 'São Paulo', '2026-11-10T08:00', { arrivalDateTime: '2026-11-10T09:30' }),
      seg('ida', 'São Paulo', 'Registro', '2026-11-10T09:00'),
    ];
    const result = validateItinerary(segments, { tripType: 'somente_ida', now: NOW });
    expect(codes(result.blocking)).toContain('OUT_OF_ORDER');
  });

  it('bloqueia volta com data anterior à ida', () => {
    const segments = [
      seg('ida', 'Belo Horizonte', 'Registro', '2026-11-20T08:00'),
      seg('volta', 'Registro', 'Belo Horizonte', '2026-11-10T08:00'),
    ];
    expect(codes(validateItinerary(segments, { tripType: 'ida_volta', now: NOW }).blocking)).toContain('OUT_OF_ORDER');
  });

  it('inclui as regras de preenchimento de cada trecho', () => {
    const segments = [seg('ida', '', 'Registro', '2026-11-10T08:00', { airlineQuote: '', priceQuote: 0 })];
    const result = validateItinerary(segments, { tripType: 'somente_ida', now: NOW });
    expect(result.blocking.filter(i => i.code === 'SEGMENT_FIELDS')).toHaveLength(3);
    expect(result.blocking[0].message).toMatch(/^Ida • Trecho 1: /);
  });

  it('alerta (sem bloquear) quebra de continuidade entre trechos', () => {
    const segments = [
      seg('ida', 'Belo Horizonte', 'São Paulo', '2026-11-10T08:00'),
      seg('ida', 'Campinas', 'Registro', '2026-11-10T15:00'),
    ];
    const result = validateItinerary(segments, { tripType: 'somente_ida', now: NOW });
    expect(result.isValid).toBe(true);
    expect(codes(result.warnings)).toEqual(['CONTINUITY_BREAK']);
  });

  it('alerta quando a volta não termina na cidade de partida', () => {
    const segments = [
      seg('ida', 'Belo Horizonte', 'Registro', '2026-11-10T08:00'),
      seg('volta', 'Registro', 'Salvador', '2026-11-20T08:00'),
    ];
    expect(codes(validateItinerary(segments, { tripType: 'ida_volta', now: NOW }).warnings)).toContain('VOLTA_NOT_TO_ORIGIN');
  });

  it('alerta datas fora do período de afastamento', () => {
    const segments = [
      seg('ida', 'Registro', 'Belo Horizonte', '2026-11-09T18:00'),
      seg('volta', 'Belo Horizonte', 'Registro', '2026-11-21T08:00'),
    ];
    const result = validateItinerary(segments, {
      tripType: 'ida_volta',
      now: NOW,
      leavePeriod: { leaveStartDate: '2026-11-10', leaveEndDate: '2026-11-20' },
    });
    expect(codes(result.warnings)).toEqual(['IDA_BEFORE_LEAVE', 'VOLTA_AFTER_LEAVE']);
    expect(result.warnings[0].message).toContain('09/11/2026');
  });

  it('considera a sequência ida → volta mesmo com `order` fora de ordem', () => {
    const segments = validRoundTrip().reverse();
    expect(validateItinerary(segments, { tripType: 'ida_volta', now: NOW }).isValid).toBe(true);
  });
});

describe('validateItineraryForForm', () => {
  const segments = [
    seg('ida', 'Registro', 'Belo Horizonte', '2026-11-09T18:00'),
    seg('volta', 'Belo Horizonte', 'Registro', '2026-11-20T08:00'),
  ];
  const base = { segments, tripType: 'ida_volta' as const, leaveStartDate: '2026-11-10', leaveEndDate: '2026-11-20' };

  it('aplica o período de afastamento apenas para Folga/Férias', () => {
    expect(validateItineraryForForm({ ...base, reason: TravelReason.FOLGA }, NOW).warnings).toHaveLength(1);
    expect(validateItineraryForForm({ ...base, reason: TravelReason.VISITA_TECNICA }, NOW).warnings).toHaveLength(0);
  });
});

describe('isItineraryJustificationValid', () => {
  const withWarning = validateItinerary(
    [
      seg('ida', 'Belo Horizonte', 'São Paulo', '2026-11-10T08:00'),
      seg('ida', 'Campinas', 'Registro', '2026-11-10T15:00'),
    ],
    { tripType: 'somente_ida', now: NOW }
  );

  it('exige justificativa com tamanho mínimo quando há alertas', () => {
    expect(isItineraryJustificationValid(withWarning, '')).toBe(false);
    expect(isItineraryJustificationValid(withWarning, 'ok')).toBe(false);
    expect(isItineraryJustificationValid(withWarning, 'Veículo da obra leva de SP a Campinas')).toBe(true);
  });

  it('dispensa justificativa sem alertas', () => {
    const clean = validateItinerary(validRoundTrip(), { tripType: 'ida_volta', now: NOW });
    expect(isItineraryJustificationValid(clean, '')).toBe(true);
  });
});

describe('getSegmentLabel', () => {
  it('numera os trechos dentro do próprio bloco', () => {
    const segments = validRoundTrip();
    expect(getSegmentLabel(segments[1], segments)).toBe('Ida • Trecho 2');
    expect(getSegmentLabel(segments[3], segments)).toBe('Volta • Trecho 2');
  });
});
