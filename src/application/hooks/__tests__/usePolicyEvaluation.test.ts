import { describe, it, expect } from 'vitest';
import { TravelReason } from '../../../domain/enums';
import { PolicyResult } from '../../../domain/policy/enums';
import type { TravelRequestFormData } from '../../../domain/types';
import { dateService } from '../../services/dateService';
import { evaluateTravelPolicy } from '../../use-cases/evaluateTravelPolicy';

const baseFormData: TravelRequestFormData = {
  chapa: '123456',
  employeeName: 'João Silva',
  functionName: 'Analista',
  cpf: '12345678900',
  birthDate: '1990-01-01',
  reason: TravelReason.VISITA_TECNICA,
  segments: [
    {
      id: 'segment-1',
      order: 1,
      transportMode: 'aereo',
      direction: 'ida',
      origin: 'São Paulo',
      originTerminal: 'GRU',
      destination: 'Salvador - BA',
      destinationTerminal: 'SSA',
      departureDateTime: '2025-06-01T08:00',
      arrivalDateTime: '2025-06-01T10:00',
      baggageRequired: false,
      airlineQuote: 'GOL',
      priceQuote: 250,
    },
  ],
  origin: '',
  destination: '',
  departureDateTime: '',
  returnDateTime: '',
  baggageRequired: false,
  costCenter: '',
  projectCode: '',
  managerName: '',
  justification: '',
  leaveStartDate: '',
  leaveEndDate: '',
};

describe('usePolicyEvaluation integration behavior', () => {
  it('should derive policy dates from itinerary segments when root travel fields are empty', () => {
    const policyDates = dateService.resolvePolicyDates(baseFormData);

    expect(policyDates).toEqual({
      startDate: '2025-06-01',
      endDate: '2025-06-01',
    });
  });

  it('should switch from itinerary approval to vacation validation when reason changes', () => {
    const technicalPolicy = evaluateTravelPolicy(
      TravelReason.VISITA_TECNICA,
      '2025-06-01',
      '2025-06-01',
      null,
      baseFormData.segments
    );

    expect(technicalPolicy.result).toBe(PolicyResult.APPROVED);

    const vacationPolicy = evaluateTravelPolicy(
      TravelReason.FERIAS,
      '2025-06-01',
      '2025-06-10',
      null,
      []
    );

    expect(vacationPolicy.result).toBe(PolicyResult.MANUAL_VALIDATION);
    expect(vacationPolicy.summary.toLowerCase()).toContain('dados');
  });
});
