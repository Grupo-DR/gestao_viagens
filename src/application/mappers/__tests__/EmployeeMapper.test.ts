import { describe, it, expect } from 'vitest';
import { EmployeeMapper } from '../EmployeeMapper';
import type { ExternalVacationDTO } from '../../dtos/ExternalEmployeeDTO';

describe('EmployeeMapper', () => {
  it('should deduplicate duplicate employee chapes when mapping to summary list', () => {
    const raw: ExternalVacationDTO[] = [
      { CHAPA: '2630', NOME: 'Ana', FUNCAO: 'Engenheira', DESCRICAO: 'Comercial' } as any,
      { CHAPA: '2630', NOME: 'Ana Lima', FUNCAO: 'Engenheira', DESCRICAO: 'Comercial' } as any,
      { CHAPA: '2782', NOME: 'Bruno', FUNCAO: 'Analista', DESCRICAO: 'Comercial' } as any,
    ];

    const summary = EmployeeMapper.mapToEmployeeSummaryList(raw);

    expect(summary).toEqual([
      { chapa: '2630', name: 'Ana' },
      { chapa: '2782', name: 'Bruno' },
    ]);
  });
});
