import { describe, it, expect } from 'vitest';
import { dateService } from '../dateService';
import { TravelReason } from '../../../domain/enums';
import { TravelRequestFormData } from '../../../domain/types';

describe('DateService', () => {
  it('should extract date from datetime-local', () => {
    expect(dateService.formatToIsoDate('2024-03-20T14:30')).toBe('2024-03-20');
  });

  it('should keep simple ISO date', () => {
    expect(dateService.formatToIsoDate('2024-12-31')).toBe('2024-12-31');
  });

  it('should return empty for empty input', () => {
    expect(dateService.formatToIsoDate('')).toBe('');
  });

  describe('resolvePolicyDates', () => {
    it('should use itinerary for technical visit (reason = VISITA_TECNICA)', () => {
      const commonForm: Partial<TravelRequestFormData> = {
        reason: TravelReason.VISITA_TECNICA,
        departureDateTime: '2024-05-10T08:00',
        returnDateTime: '2024-05-15T18:00'
      };
      expect(dateService.resolvePolicyDates(commonForm as TravelRequestFormData))
        .toEqual({ startDate: '2024-05-10', endDate: '2024-05-15' });
    });

    it('should prioritize leave dates for vacation (reason = FERIAS)', () => {
      const hrForm: Partial<TravelRequestFormData> = {
        reason: TravelReason.FERIAS,
        leaveStartDate: '2024-07-01',
        leaveEndDate: '2024-07-30',
        departureDateTime: '2024-06-30T10:00'
      };
      expect(dateService.resolvePolicyDates(hrForm as TravelRequestFormData))
        .toEqual({ startDate: '2024-07-01', endDate: '2024-07-30' });
    });
  });
});
