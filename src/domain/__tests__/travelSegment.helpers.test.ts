import { describe, it, expect } from 'vitest';
import { 
  createEmptySegment, 
  normalizeSegmentsFromTravel, 
  deriveTravelSummaryFromSegments,
  validateSegment,
  generateSegmentId,
  reindexSegments,
  validateSegments
} from '../travelSegment.helpers';
import { TravelInfo } from '../types';
import { TravelReason } from '../enums';

describe('Travel Segment Helpers (Hardened)', () => {

  it('deve gerar IDs robustos e únicos', () => {
    const id1 = generateSegmentId();
    const id2 = generateSegmentId();
    expect(id1).not.toBe(id2);
    expect(id1.length).toBeGreaterThan(5);
  });

  it('deve reindexar trechos corretamente', () => {
    const segments = [
      { ...createEmptySegment(10), id: 'A' },
      { ...createEmptySegment(5), id: 'B' }
    ];
    const reindexed = reindexSegments(segments);
    expect(reindexed[0].order).toBe(1);
    expect(reindexed[1].order).toBe(2);
  });

  it('deve normalizar dados legados com shape completo', () => {
    const legacy: TravelInfo = {
      reason: TravelReason.VISITA_TECNICA,
      origin: 'A',
      destination: 'B',
      departureDateTime: '2026-01-01',
      costCenter: 'CC',
      baggageRequired: true
    };
    const normalized = normalizeSegmentsFromTravel(legacy);
    expect(normalized[0].order).toBe(1);
    expect(normalized[0].originTerminal).toBe('');
    expect(normalized[0].baggageRequired).toBe(true);
  });

  it('deve validar múltiplos segmentos e retornar mapa de erros', () => {
    const segments = [
      { ...createEmptySegment(1), id: 'valid', origin: 'X', destination: 'Y', departureDateTime: '2026-01-01' },
      { ...createEmptySegment(2), id: 'invalid', origin: '', destination: '', departureDateTime: '' }
    ];
    const errorMap = validateSegments(segments);
    expect(errorMap['valid']).toBeUndefined();
    expect(errorMap['invalid']).toBeDefined();
    expect(errorMap['invalid']).toHaveLength(3);
  });

});
