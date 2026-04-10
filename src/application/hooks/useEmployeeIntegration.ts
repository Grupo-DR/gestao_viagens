// ============================================================
// APPLICATION — Hook — useEmployeeIntegration
// Sincronização centralizada com RM TOTVS via VENCIMENTO_FER.
// Gerencia cache local da base mestre para UX veloz.
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import { 
  getCompleteEmployeeData, 
  getMasterEmployeeList,
  getSlaveMasterData,
  EmployeeIntegrationResult 
} from '../use-cases/fetchEmployeeIntegrationData';
import { EmployeeMapper } from '../mappers/EmployeeMapper';
import { getErrorMessage } from '../../lib/errorUtils';
import { useToast } from './useToast';
import { ExternalVacationDTO } from '../dtos/ExternalEmployeeDTO';

export interface CCListItem { code: string; label: string }
export interface EmployeeListItem { chapa: string; name: string }

export function useEmployeeIntegration() {
  const { showToast } = useToast();
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
   */
  const init = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getMasterEmployeeList();
      setMasterList(list);
      
      const ccList = EmployeeMapper.mapToCostCenterList(list);
      setCostCenters(ccList);
    } catch (err: any) {
      console.warn('[Integration] Erro ao carregar base mestre RM.');
      setError('Falha ao conectar com o RM TOTVS.');
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
    // No RM, DESCRICAO contém o agrupamento de Centro de Custo que usamos na UI
    const filtered = masterList.filter(e => String(e.DESCRICAO).trim() === String(ccValue).trim());
    const empList = EmployeeMapper.mapToEmployeeSummaryList(filtered)
      .sort((a, b) => a.name.localeCompare(b.name));
    
    setEmployees(empList);
  }, [masterList]);

  /**
   * Busca dados de CPF e Nascimento (Slave Data)
   */
  const fetchMasterData = useCallback(async (chapa: string) => {
    if (!chapa) return;
    try {
      const masterData = await getSlaveMasterData(chapa);
      if (masterData) {
        setData(prev => ({
          ...prev!,
          masterData
        }));
      }
    } catch (err) {
      console.error('[Integration] Erro ao buscar dados mestre:', err);
    }
  }, []);

  /** 
   * Busca final: Dados completos (Férias/Folga/Política) 
   */
  const lookupEmployee = useCallback(async (chapa: string) => {
    if (!chapa) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getCompleteEmployeeData(chapa);
      setData(prev => ({
        ...result,
        masterData: prev?.masterData // Preserva masterData se já buscado
      }));
      return result;
    } catch (err: any) {
      const msg = getErrorMessage(err, 'Erro ao carregar dados do colaborador');
      setError(msg);
      showToast('Erro RM', 'error', msg);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

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
    fetchByCostCenter: fetchEmployeesByCC,
    fetchMasterData,
    lookupEmployee,
  };
}
