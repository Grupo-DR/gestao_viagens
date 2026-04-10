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
import { getErrorMessage } from '../../lib/errorUtils.ts';
import { useToast } from './useToast.ts';
import { useIdentity } from '../identity/IdentityContext.tsx';
import { UserRole } from '../../domain/enums.ts';
import { ExternalVacationDTO } from '../dtos/ExternalEmployeeDTO.ts';

export interface CCListItem { code: string; label: string }
export interface EmployeeListItem { chapa: string; name: string; role: string }

/** Papéis com acesso irrestrito a todos os Centros de Custo */
const UNRESTRICTED_ROLES = new Set<UserRole>([UserRole.MASTER, UserRole.CAPITAL_HUMANO]);

export function useEmployeeIntegration() {
  const { currentUser } = useIdentity();
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
   * Aplica filtro de CCs conforme o papel do usuário.
   */
  const init = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getMasterEmployeeList();
      setMasterList(list);
      
      let ccList = EmployeeMapper.mapToCostCenterList(list);

      // Aplica filtro de CC para papéis restritos
      if (currentUser && !UNRESTRICTED_ROLES.has(currentUser.role)) {
        const allowed = new Set(currentUser.allowedCostCenters ?? []);
        if (allowed.size > 0) {
          ccList = ccList.filter(cc => allowed.has(cc.code));
        } else {
          ccList = []; // Sem CCs liberados = lista vazia
        }
      }

      setCostCenters(ccList);
    } catch (err: any) {
      console.warn('[Integration] Erro ao carregar base mestre RM. Ativando Mock Fallback.');
      setCostCenters([
        { code: '3015.03 - VLI SERV. E LOC. DE EQUIP. COR. CENTRO-NORTE', label: '3015.03 - VLI...' },
      ]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

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
      const msg = getErrorMessage(err, 'Erro ao carregar colaboradores');
      setError(msg);
      showToast('Erro RM', 'error', msg);
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
