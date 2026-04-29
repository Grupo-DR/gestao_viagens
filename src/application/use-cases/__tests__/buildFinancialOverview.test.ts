import { describe, it, expect } from 'vitest';
import { buildFinancialOverview, FinancialOverviewFilters } from '../buildFinancialOverview';
import { TravelRequest, TravelBudget } from '../../../domain/types';
import { RequestStatus, UserRole } from '../../../domain/enums';

describe('buildFinancialOverview - Mixed Mode Filtering', () => {
  const mockRequest: TravelRequest = {
    requestId: 'req-1',
    status: RequestStatus.EMITIDA,
    employee: { name: 'John Doe', id: 'emp-1', email: 'john@example.com' },
    travel: {
      reason: 'Work',
      costCenter: '100.01',
      segments: [
        {
          id: 'seg-1',
          transportMode: 'aereo',
          priceQuote: 1000,
          origin: 'A',
          destination: 'B',
          departureDateTime: '2024-01-10T10:00:00Z',
          order: 0,
        },
        {
          id: 'seg-2',
          transportMode: 'rodoviario',
          priceQuote: 200,
          origin: 'B',
          destination: 'C',
          departureDateTime: '2024-01-11T10:00:00Z',
          order: 1,
        }
      ]
    },
    audit: {
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      createdBy: 'user-1'
    }
  } as any;

  const mockBudgets: TravelBudget[] = [
    {
      id: 'b-1',
      costCenter: '100.01',
      year: 2024,
      month: 'Janeiro',
      value: 5000,
    }
  ] as any;

  const baseFilters: FinancialOverviewFilters = {
    year: 2024,
    month: 1,
    transportMode: 'all',
  };

  it('should sum both modes when filter is "all"', () => {
    const data = buildFinancialOverview([mockRequest], mockBudgets, baseFilters, ['100.01'], UserRole.MASTER, []);
    expect(data.summary.totalExecuted).toBe(1200);
    expect(data.summary.airAmount).toBe(1000);
    expect(data.summary.groundAmount).toBe(200);
    expect(data.summary.issuedAirCount).toBe(1);
    expect(data.summary.issuedGroundCount).toBe(1);
  });

  it('should sum only air segments when filter is "aereo"', () => {
    const filters: FinancialOverviewFilters = { ...baseFilters, transportMode: 'aereo' };
    const data = buildFinancialOverview([mockRequest], mockBudgets, filters, ['100.01'], UserRole.MASTER, []);
    expect(data.summary.totalExecuted).toBe(1000);
    expect(data.summary.airAmount).toBe(1000);
    expect(data.summary.groundAmount).toBe(0);
    expect(data.summary.issuedAirCount).toBe(1);
    expect(data.summary.issuedGroundCount).toBe(0);
  });

  it('should sum only ground segments when filter is "rodoviario"', () => {
    const filters: FinancialOverviewFilters = { ...baseFilters, transportMode: 'rodoviario' };
    const data = buildFinancialOverview([mockRequest], mockBudgets, filters, ['100.01'], UserRole.MASTER, []);
    expect(data.summary.totalExecuted).toBe(200);
    expect(data.summary.airAmount).toBe(0);
    expect(data.summary.groundAmount).toBe(200);
    expect(data.summary.issuedAirCount).toBe(0);
    expect(data.summary.issuedGroundCount).toBe(1);
  });

  it('should count missing price per segment', () => {
    const requestWithMissing: TravelRequest = {
      ...mockRequest,
      travel: {
        ...mockRequest.travel,
        segments: [
          { ...mockRequest.travel.segments![0], priceQuote: 0 }, // 0 is invalid
          { ...mockRequest.travel.segments![1] } // Has price (200)
        ]
      }
    } as any;

    const data = buildFinancialOverview([requestWithMissing], mockBudgets, baseFilters, ['100.01'], UserRole.MASTER, []);
    expect(data.summary.airAmount).toBe(0);
    expect(data.summary.groundAmount).toBe(200);
    expect(data.summary.totalExecuted).toBe(200);
    expect(data.summary.missingPriceCount).toBe(1);
  });
});
