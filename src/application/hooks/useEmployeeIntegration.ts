// ============================================================
// APPLICATION — Hook — useEmployeeIntegration
// Sincronização centralizada com RM TOTVS via VENCIMENTO_FER.
// Gerencia cache local da base mestre para UX veloz.
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import { 
  getCompleteEmployeeData, 
  getMasterEmployeeList,
  EmployeeIntegrationResult 
} from '../use-cases/fetchEmployeeIntegrationData.ts';
import { EmployeeMapper } from '../mappers/EmployeeMapper.ts';
import { ExternalVacationDTO } from '../dtos/ExternalEmployeeDTO.ts';

export interface CCListItem { code: string; label: string }
export interface EmployeeListItem { chapa: string; name: string; role: string }

export function useEmployeeIntegration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Base mestre cacheada
  const [masterList, setMasterList] = useState<ExternalVacationDTO[]>([]);
  
  // Listas para seleção na UI
  const [costCenters, setCostCenters] = useState<CCListItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  
  // Resultado da integração final (Policy/Férias)
  const [data, setData] = useState<EmployeeIntegrationResult | null>(null);

  /** 
   * Inicialização: Baixa a base mestre do RM via GET.
   * Extraímos Centros de Custo (DESCRICAO) na hora.
   */
  const init = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getMasterEmployeeList();
      setMasterList(list);
      
      const ccList = EmployeeMapper.mapToCostCenterList(list);
      setCostCenters(ccList);
    } catch (err: any) {
      console.warn('[Integration] Erro ao carregar base mestre RM. Ativando Mock Fallback.');
      setCostCenters([
        { code: '3015.03 - VLI SERV. E LOC. DE EQUIP. COR. CENTRO-NORTE', label: '3015.03 - VLI...' },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  /** 
   * Filtragem de colaboradores por Centro de Custo (Local) 
   */
  const fetchEmployeesByCC = useCallback((ccValue: string) => {
    if (!ccValue) {
      setEmployees([]);
      return;
    }
    const filtered = masterList.filter(e => e.DESCRICAO === ccValue);
    const empList = EmployeeMapper.mapToEmployeeSummaryList(filtered);
    setEmployees(empList);
  }, [masterList]);

  /** 
   * Busca final: Dados completos (Férias/Folga/Política) 
   */
  const lookupEmployee = useCallback(async (chapa: string) => {
    if (!chapa) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getCompleteEmployeeData(chapa);
      setData(result);
      return result;
    } catch (err: any) {
      // Tenta recuperar do masterList local se falhar o fetch individual
      const localData = masterList.find(e => e.CHAPA === chapa);
      if (localData) {
        const result: EmployeeIntegrationResult = {
          employeeInfo: EmployeeMapper.mapToEmployeeInfo(localData),
          vacationValidation: EmployeeMapper.mapToVacationValidation(localData),
        };
        setData(result);
        return result;
      }
      setError(err.message || 'Erro ao carregar dados do colaborador.');
    } finally {
      setLoading(false);
    }
  }, [masterList]);

  // Bootstrapping
  useEffect(() => {
    init();
  }, [init]);

  return {
    loading,
    error,
    costCenters,
    employees,
    data,
    fetchEmployees: fetchEmployeesByCC, // Alias mantido para compatibilidade UI
    lookupEmployee,
  };
}
