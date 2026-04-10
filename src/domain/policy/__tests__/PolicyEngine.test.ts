import { describe, it, expect } from 'vitest';
import { PolicyEngine } from '../rules';
import { PolicyResult } from '../enums';
import { ExternalVacationDTO, ExternalTimeOffDTO } from '../../../application/dtos/ExternalEmployeeDTO';

describe('PolicyEngine (Domain Layer)', () => {
  const mockTimeOff: ExternalTimeOffDTO = {
    CHAPA: '123', NOME: 'TESTE', DATAADMISSAO: '', TIPO: '3', DESCRICAO: '',
    ESTADO: 'BA', CIDADE: 'SA', CODCCUSTO: '1', NOME_CC: 'CC',
    DATA_PREVISTA: '2024-05-10T00:00:00'
  };

  const mockVacation: ExternalVacationDTO = {
    CHAPA: '123', NOME: 'TESTE', CODSITUACAO: 'A', FUNCAO: 'OP', CODTIPO: 'N',
    INICIOPERAQUIS: '2023-01-01', FIMPERAQUIS: '2023-12-31', CODSECAO: '1', DESCRICAO: 'CC',
    SALDO: 30,
    LIMITE: '2025-12-31',
    PRAZO: '2024-12-31',
    PROGR_INICIO: '2024-06-01',
    PROGR_FIM: '2024-06-30',
    CODCUSTO: '1'
  };

  describe('evaluateTimeOff', () => {
    it('should approve if date >= predicted', () => {
      const res = PolicyEngine.evaluateTimeOff('2024-05-11', mockTimeOff);
      expect(res.result).toBe(PolicyResult.APPROVED);
    });

    it('should reject if date < predicted', () => {
      const res = PolicyEngine.evaluateTimeOff('2024-05-09', mockTimeOff);
      expect(res.result).toBe(PolicyResult.REJECTED);
      expect(res.violations.some(v => v.code === 'FOL_001')).toBe(true);
    });
  });

  describe('evaluateVacation', () => {
    it('should approve within programmed window', () => {
      const res = PolicyEngine.evaluateVacation('2024-06-10', '2024-06-20', mockVacation);
      expect(res.result).toBe(PolicyResult.APPROVED);
    });

    it('should reject outside programmed window (FER_001)', () => {
      const res = PolicyEngine.evaluateVacation('2024-05-20', '2024-05-30', mockVacation);
      expect(res.result).toBe(PolicyResult.REJECTED);
    });

    it('should reject after enjoyment deadline (FER_005)', () => {
      const res = PolicyEngine.evaluateVacation('2025-01-10', '2025-01-20', mockVacation);
      expect(res.result).toBe(PolicyResult.REJECTED);
    });

    it('should require manual validation if there is abono (FER_004)', () => {
      const mockVacationAbono = { ...mockVacation, PROGR_ABONO: 'S' };
      const res = PolicyEngine.evaluateVacation('2024-06-10', '2024-06-20', mockVacationAbono);
      expect(res.result).toBe(PolicyResult.MANUAL_VALIDATION);
    });

    it('should reject without balance (FER_002)', () => {
      const mockNoBalance = { ...mockVacation, SALDO: 0 };
      const res = PolicyEngine.evaluateVacation('2024-06-10', '2024-06-20', mockNoBalance);
      expect(res.result).toBe(PolicyResult.REJECTED);
    });
  });

  describe('evaluateCombinedLeave (Folga + Férias)', () => {
    it('should approve if both sub-engines approve', () => {
      const res = PolicyEngine.evaluateCombinedLeave('2024-06-10', '2024-06-20', mockTimeOff, mockVacation);
      expect(res.result).toBe(PolicyResult.APPROVED);
    });

    it('should reject if folga part is invalid', () => {
      const res = PolicyEngine.evaluateCombinedLeave('2024-05-09', '2024-05-15', mockTimeOff, mockVacation);
      expect(res.result).toBe(PolicyResult.REJECTED);
      expect(res.evidence.folga.dataPrevista).toBe('2024-05-10');
      expect(res.evidence.ferias.saldoDias).toBe(30);
    });
  });
});
