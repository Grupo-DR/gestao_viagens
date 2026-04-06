import { describe, it, expect } from 'vitest';
import { 
  createEmptySegment, 
  normalizeSegmentsFromTravel, 
  deriveTravelSummaryFromSegments,
  validateSegment 
} from '../travelSegment.helpers';
import { TravelInfo } from '../types';
import { TravelReason } from '../enums';

describe('Travel Segment Helpers', () => {

  it('deve criar um segmento vazio válido', () => {
    const seg = createEmptySegment('test-id');
    expect(seg.id).toBe('test-id');
    expect(seg.transportMode).toBe('aereo');
    expect(seg.origin).toBe('');
  });

  it('deve normalizar dados legados para um array de segmentos (ida e volta)', () => {
    const legacyTravel: TravelInfo = {
      reason: TravelReason.VISITA_TECNICA,
      origin: 'São Paulo',
      destination: 'Salvador',
      departureDateTime: '2026-10-10T10:00:00',
      returnDateTime: '2026-10-15T10:00:00',
      baggageRequired: true,
      costCenter: 'CC-01'
    };

    const segments = normalizeSegmentsFromTravel(legacyTravel);
    expect(segments).toHaveLength(2);
    expect(segments[0].origin).toBe('São Paulo');
    expect(segments[0].destination).toBe('Salvador');
    expect(segments[1].origin).toBe('Salvador');
    expect(segments[1].destination).toBe('São Paulo');
    expect(segments[1].departureDateTime).toBe('2026-10-15T10:00:00');
  });

  it('deve derivar campos de compatibilidade a partir de múltiplos segmentos', () => {
    const segments = [
      { ...createEmptySegment('1'), origin: 'A', destination: 'B', departureDateTime: 'D1', baggageRequired: false },
      { ...createEmptySegment('2'), origin: 'B', destination: 'C', departureDateTime: 'D2', baggageRequired: true }
    ];

    const summary = deriveTravelSummaryFromSegments(segments);
    expect(summary.origin).toBe('A');
    expect(summary.destination).toBe('C');
    expect(summary.departureDateTime).toBe('D1');
    expect(summary.returnDateTime).toBe('D2');
    expect(summary.baggageRequired).toBe(true);
  });

  it('deve validar um segmento corretamente', () => {
    const validSeg = { ...createEmptySegment('1'), origin: 'A', destination: 'B', departureDateTime: '2026-01-01T10:00:00' };
    expect(validateSegment(validSeg)).toHaveLength(0);

    const invalidSeg = { ...createEmptySegment('1'), origin: '', destination: 'B', departureDateTime: '' };
    const errors = validateSegment(invalidSeg);
    expect(errors).toContain('Origem obrigatória.');
    expect(errors).toContain('Data de partida obrigatória.');
  });

});
