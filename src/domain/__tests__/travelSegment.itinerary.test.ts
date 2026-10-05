import { describe, it, expect } from 'vitest';
import {
  addSegmentToItinerary,
  buildReturnFromOutbound,
  createEmptySegment,
  deriveTravelSummaryFromSegments,
  getStayInfo,
  inferTripType,
  normalizeCityName,
  normalizeItineraryOrder,
  removeSegmentFromItinerary,
  updateItinerarySegment,
} from '../travelSegment.helpers';
import type { TravelSegment, TravelDirection } from '../types';

function seg(id: string, order: number, direction: TravelDirection, origin: string, destination: string, extra: Partial<TravelSegment> = {}): TravelSegment {
  return { ...createEmptySegment(order, direction), id, origin, destination, ...extra };
}

describe('normalizeCityName', () => {
  it('ignora acento, UF, aeroporto e caixa', () => {
    expect(normalizeCityName('São Paulo - SP')).toBe('SAO PAULO');
    expect(normalizeCityName('sao paulo/sp')).toBe('SAO PAULO');
    expect(normalizeCityName('São Paulo (GRU)')).toBe('SAO PAULO');
  });

  it('preserva cidades com hífen no nome', () => {
    expect(normalizeCityName('Embu-Guaçu - SP')).toBe('EMBU-GUACU');
  });
});

describe('montagem do itinerário', () => {
  it('ordena ida antes de volta e reindexa a partir de 1', () => {
    const result = normalizeItineraryOrder([
      seg('v1', 0, 'volta', 'B', 'A'),
      seg('i1', 5, 'ida', 'A', 'B'),
    ]);
    expect(result.map(s => [s.id, s.order])).toEqual([['i1', 1], ['v1', 2]]);
  });

  it('novo trecho de ida nasce encadeado ao anterior e antes da volta', () => {
    const base = [seg('i1', 1, 'ida', 'Belo Horizonte', 'São Paulo', { destinationTerminal: 'GRU' }), seg('v1', 2, 'volta', 'São Paulo', 'Belo Horizonte')];
    const result = addSegmentToItinerary(base, 'ida');
    expect(result[1].direction).toBe('ida');
    expect(result[1].origin).toBe('São Paulo');
    expect(result[1].originTerminal).toBe('GRU');
    expect(result[2].id).toBe('v1');
    expect(result.map(s => s.order)).toEqual([1, 2, 3]);
  });

  it('primeiro trecho de volta começa no destino final da ida', () => {
    const result = addSegmentToItinerary([seg('i1', 1, 'ida', 'Belo Horizonte', 'Registro')], 'volta');
    expect(result[1]).toMatchObject({ direction: 'volta', origin: 'Registro' });
  });

  it('propaga o destino para a origem do trecho seguinte enquanto encadeado', () => {
    let segments = [seg('i1', 1, 'ida', 'BH', 'São'), seg('i2', 2, 'ida', 'São', '')];
    segments = updateItinerarySegment(segments, 'i1', 'destination', 'São Paulo');
    expect(segments[1].origin).toBe('São Paulo');
  });

  it('não sobrescreve origem alterada manualmente no trecho seguinte', () => {
    const segments = [seg('i1', 1, 'ida', 'BH', 'São Paulo'), seg('i2', 2, 'ida', 'Campinas', 'Registro')];
    const result = updateItinerarySegment(segments, 'i1', 'destination', 'Rio de Janeiro');
    expect(result[1].origin).toBe('Campinas');
  });

  it('origem da ida acompanha o destino final da volta', () => {
    const segments = [seg('i1', 1, 'ida', 'Belo', 'Registro'), seg('v1', 2, 'volta', 'Registro', 'Belo')];
    const result = updateItinerarySegment(segments, 'i1', 'origin', 'Belo Horizonte');
    expect(result[1].destination).toBe('Belo Horizonte');
  });

  it('gera a volta espelhando a ida, sem datas nem cotações', () => {
    const ida = [
      seg('i1', 1, 'ida', 'Belo Horizonte', 'São Paulo', { originTerminal: 'CNF', destinationTerminal: 'GRU', departureDateTime: '2026-11-10T08:00', priceQuote: 700, airlineQuote: 'GOL' }),
      seg('i2', 2, 'ida', 'São Paulo', 'Registro', { transportMode: 'rodoviario', destinationTerminal: 'Rodoviária' }),
    ];
    const result = buildReturnFromOutbound(ida);
    const volta = result.filter(s => s.direction === 'volta');
    expect(volta.map(s => `${s.origin}>${s.destination}:${s.transportMode}`)).toEqual([
      'Registro>São Paulo:rodoviario',
      'São Paulo>Belo Horizonte:aereo',
    ]);
    expect(volta[1]).toMatchObject({ originTerminal: 'GRU', destinationTerminal: 'CNF', departureDateTime: '', priceQuote: 0, airlineQuote: '' });
    expect(result.map(s => s.order)).toEqual([1, 2, 3, 4]);
  });

  it('remove trecho e reindexa', () => {
    const result = removeSegmentFromItinerary(
      [seg('i1', 1, 'ida', 'A', 'B'), seg('i2', 2, 'ida', 'B', 'C'), seg('v1', 3, 'volta', 'C', 'A')],
      'i2'
    );
    expect(result.map(s => [s.id, s.order])).toEqual([['i1', 1], ['v1', 2]]);
  });

  it('deduz o tipo de viagem pelos trechos', () => {
    expect(inferTripType([seg('i1', 1, 'ida', 'A', 'B')])).toBe('somente_ida');
    expect(inferTripType([seg('i1', 1, 'ida', 'A', 'B'), seg('v1', 2, 'volta', 'B', 'A')])).toBe('ida_volta');
  });
});

describe('getStayInfo', () => {
  it('conta os dias entre a chegada da ida e a partida da volta', () => {
    const stay = getStayInfo([
      seg('i1', 1, 'ida', 'BH', 'Registro', { departureDateTime: '2026-11-09T22:00', arrivalDateTime: '2026-11-10T06:00' }),
      seg('v1', 2, 'volta', 'Registro', 'BH', { departureDateTime: '2026-11-20T08:00' }),
    ]);
    expect(stay).toEqual({ city: 'Registro', days: 10 });
  });

  it('usa a partida da ida quando não há chegada e aceita retorno no mesmo dia', () => {
    const stay = getStayInfo([
      seg('i1', 1, 'ida', 'BH', 'SP', { departureDateTime: '2026-11-10T07:00' }),
      seg('v1', 2, 'volta', 'SP', 'BH', { departureDateTime: '2026-11-10T19:00' }),
    ]);
    expect(stay?.days).toBe(0);
  });

  it('retorna dias negativos quando a volta está antes da ida', () => {
    const stay = getStayInfo([
      seg('i1', 1, 'ida', 'BH', 'SP', { departureDateTime: '2026-11-10T07:00' }),
      seg('v1', 2, 'volta', 'SP', 'BH', { departureDateTime: '2026-11-08T19:00' }),
    ]);
    expect(stay?.days).toBe(-2);
  });

  it('retorna null sem volta ou sem datas', () => {
    expect(getStayInfo([seg('i1', 1, 'ida', 'BH', 'SP', { departureDateTime: '2026-11-10T07:00' })])).toBeNull();
    expect(getStayInfo([seg('i1', 1, 'ida', 'BH', 'SP'), seg('v1', 2, 'volta', 'SP', 'BH')])).toBeNull();
  });
});

describe('deriveTravelSummaryFromSegments', () => {
  it('conexões na ida não contam como retorno', () => {
    const summary = deriveTravelSummaryFromSegments([
      seg('i1', 1, 'ida', 'BH', 'SP', { departureDateTime: '2026-11-10T08:00' }),
      seg('i2', 2, 'ida', 'SP', 'Registro', { departureDateTime: '2026-11-10T13:00' }),
    ]);
    expect(summary).toMatchObject({ origin: 'BH', destination: 'Registro', departureDateTime: '2026-11-10T08:00', returnDateTime: null });
  });

  it('destino principal é o fim da ida e o retorno é o primeiro trecho de volta', () => {
    const summary = deriveTravelSummaryFromSegments([
      seg('v2', 4, 'volta', 'SP', 'BH', { departureDateTime: '2026-11-20T14:00' }),
      seg('i1', 1, 'ida', 'BH', 'Registro', { departureDateTime: '2026-11-10T08:00' }),
      seg('v1', 3, 'volta', 'Registro', 'SP', { departureDateTime: '2026-11-20T06:00' }),
    ]);
    expect(summary).toMatchObject({ origin: 'BH', destination: 'Registro', returnDateTime: '2026-11-20T06:00' });
  });
});
