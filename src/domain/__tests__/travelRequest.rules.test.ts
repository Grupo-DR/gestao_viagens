import { describe, it, expect } from 'vitest';
import { 
  getInitialStatus, 
  canTransitionStatus, 
  needsValidation, 
  getStatusLabel,
  mapLegacyToTravelRequest 
} from '../travelRequest.rules';
import { RequestStatus, TravelReason, UserRole } from '../enums';

describe('travelRequest.rules', () => {
  describe('needsValidation', () => {
    it('should return true for reasons requiring CH validation', () => {
      expect(needsValidation(TravelReason.FOLGA)).toBe(true);
      expect(needsValidation(TravelReason.FERIAS)).toBe(true);
    });

    it('should return false for other reasons', () => {
      expect(needsValidation(TravelReason.TREINAMENTO)).toBe(false);
      expect(needsValidation(TravelReason.VISITA_TECNICA)).toBe(false);
    });
  });

  describe('getInitialStatus', () => {
    it('should return RASCUNHO when asDraft is true', () => {
      expect(getInitialStatus(TravelReason.TREINAMENTO, true)).toBe(RequestStatus.RASCUNHO);
    });

    it('should return EM_VALIDACAO_CH for all requests when not draft', () => {
      expect(getInitialStatus(TravelReason.FERIAS, false)).toBe(RequestStatus.EM_VALIDACAO_CH);
      expect(getInitialStatus(TravelReason.TREINAMENTO, false)).toBe(RequestStatus.EM_VALIDACAO_CH);
    });
  });

  describe('canTransitionStatus', () => {
    it('should allow GESTOR to transition from RASCUNHO to EM_VALIDACAO_CH', () => {
      expect(canTransitionStatus(RequestStatus.RASCUNHO, RequestStatus.EM_VALIDACAO_CH, UserRole.GESTOR)).toBe(true);
    });

    it('should NOT allow COMPRADOR to transition from RASCUNHO', () => {
      expect(canTransitionStatus(RequestStatus.RASCUNHO, RequestStatus.EM_VALIDACAO_CH, UserRole.COMPRADOR)).toBe(false);
    });

    it('should allow CH to approve from EM_VALIDACAO_CH', () => {
      expect(canTransitionStatus(RequestStatus.EM_VALIDACAO_CH, RequestStatus.DISPONIVEL_PARA_COMPRA, UserRole.CAPITAL_HUMANO)).toBe(true);
    });
  });

  describe('getStatusLabel', () => {
    it('should return correct label for common statuses', () => {
      expect(getStatusLabel(RequestStatus.RASCUNHO)).toBe('Rascunho');
      expect(getStatusLabel(RequestStatus.EMITIDA)).toBe('Bilhete Emitido');
    });
  });

  describe('mapLegacyToTravelRequest', () => {
    it('should correctly map a legacy document to v2', () => {
      const legacy = {
        id: 'leg-123',
        passengerName: 'John Doe',
        reason: TravelReason.FERIAS,
        status: RequestStatus.EM_VALIDACAO_CH,
        createdAt: '2024-01-01T00:00:00Z',
        route: 'SP - RJ',
        requesterEmail: 'test@example.com'
      } as any;

      const result = mapLegacyToTravelRequest(legacy);
      expect(result.requestId).toBe('leg-123');
      expect((result.employee as any).employeeName).toBe('John Doe');
      expect(result.travel.origin).toBe('SP');
      expect(result.travel.destination).toBe('RJ');
      expect(result.validation.validationRequired).toBe(true);
    });
  });
});
