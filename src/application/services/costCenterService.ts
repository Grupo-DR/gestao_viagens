// ============================================================
// APPLICATION — Service — Cost Center Service
// Busca a lista completa de Centros de Custo do TOTVS RM.
// Reutiliza a base mestre (VENCIMENTO_FER) já mapeada,
// evitando uma segunda chamada ao servidor.
// ============================================================

import { getMasterEmployeeList } from '../use-cases/fetchEmployeeIntegrationData';
import { EmployeeMapper } from '../mappers/EmployeeMapper';

export interface CostCenterItem {
  code: string;
  label: string;
}

let _cache: CostCenterItem[] | null = null;

/**
 * Retorna todos os Centros de Custo disponíveis no RM TOTVS.
 * Resultado é cacheado em memória para evitar re-fetches desnecessários.
 */
export async function getAllCostCenters(): Promise<CostCenterItem[]> {
  if (_cache) return _cache;

  try {
    const masterList = await getMasterEmployeeList();
    const ccList = EmployeeMapper.mapToCostCenterList(masterList);
    _cache = ccList;
    return ccList;
  } catch (error) {
    console.error('[CostCenterService] Falha ao carregar centros de custo do RM:', error);
    return [];
  }
}

/** Invalida o cache (útil após reload manual) */
export function invalidateCostCenterCache() {
  _cache = null;
}
