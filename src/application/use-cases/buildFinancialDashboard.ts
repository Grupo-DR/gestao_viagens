import { TravelRequest, TravelBudget } from '../../domain/types';
import { RequestStatus } from '../../domain/enums';
import { sanitizeCC } from '../../domain/travelRequest.governance';
import { 
  calculateRealizedAmount, 
  calculateRealizedByLogistics, 
  getQuotedAmount, 
  calculatePurchaseSaving,
  classifyFinancialStatus,
  FinancialHealthStatus
} from '../../domain/financial/financialMetrics';
import { classifyLogisticsType } from '../../domain/financial/logisticsClassifier';

export type FinancialFilters = {
  year: number;
  month: number;
  costCenter?: string;
};

export type BudgetManagementMetric = {
  budgetAmount: number | null;
  realizedAmount: number | null;
  usagePercent: number | null;
  deltaAmount: number | null;
};

export type LogisticsMixMetric = {
  airRealizedAmount: number | null;
  groundRealizedAmount: number | null;
  airPercent: number | null;
  groundPercent: number | null;
};

export type ControlEfficiencyMetric = {
  purchaseSavings: number | null;
  pendingAdministrativeCount: number;
  status: FinancialHealthStatus;
};

export type PurchaseEfficiencyMetric = {
  quotedAmount: number | null;
  effectivePurchaseAmount: number | null;
  savingsAmount: number | null;
  consideredTickets: number;
  ignoredDueToMissingData: number;
};

export type BudgetConsumptionMetric = {
  consumptionPercent: number | null;
  availableBudget: number | null;
  budgetAmount: number | null;
  realizedAmount: number | null;
  status: FinancialHealthStatus;
};

export type BudgetVsRealizedByCostCenterRow = {
  costCenter: string;
  budgetAmount: number | null;
  airRealizedAmount: number | null;
  groundRealizedAmount: number | null;
  totalRealizedAmount: number | null;
  deltaAmount: number | null;
  hasRealizedWithoutBudget: boolean;
};

export type FinancialDashboardData = {
  budgetManagement: BudgetManagementMetric;
  logisticsMix: LogisticsMixMetric;
  controlEfficiency: ControlEfficiencyMetric;
  purchaseEfficiency: PurchaseEfficiencyMetric;
  budgetConsumption: BudgetConsumptionMetric;
  budgetVsRealizedByCostCenter: BudgetVsRealizedByCostCenterRow[];
};

const MONTH_NAME_TO_NUMBER: Record<string, number> = {
  janeiro: 1,
  fevereiro: 2,
  marco: 3,
  março: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12,
};

function normalizeText(value?: string): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function getBudgetMonthNumber(month: string): number {
  return MONTH_NAME_TO_NUMBER[normalizeText(month)] ?? 0;
}

export function buildFinancialDashboard(
  requests: TravelRequest[],
  budgets: TravelBudget[],
  filters: FinancialFilters,
  allowedCostCenters: string[]
): FinancialDashboardData {
  
  // 1. Governança e Filtros
  const allowedKeys = allowedCostCenters.map(sanitizeCC);
  
  const filteredRequests = requests.filter(r => {
    const date = new Date(r.audit.createdAt);
    if (date.getFullYear() !== filters.year || (date.getMonth() + 1) !== filters.month) return false;
    
    const requestCCKey = sanitizeCC(r.travel.costCenter);
    const isCCAllowed = allowedKeys.length === 0 || allowedKeys.includes(requestCCKey);
    if (!isCCAllowed) return false;

    if (filters.costCenter && requestCCKey !== sanitizeCC(filters.costCenter)) return false;
    return true;
  });

  const filteredBudgets = budgets.filter(b => {
    if (b.year !== filters.year) return false;
    if (getBudgetMonthNumber(b.month) !== filters.month) return false;

    const budgetCCKey = sanitizeCC(b.costCenter);
    const isCCAllowed = allowedKeys.length === 0 || allowedKeys.includes(budgetCCKey);
    if (!isCCAllowed) return false;

    if (filters.costCenter && budgetCCKey !== sanitizeCC(filters.costCenter)) return false;
    return true;
  });

  // 2. Agregações Base
  const totalBudget = filteredBudgets.reduce((acc, b) => acc + (Number(b.value) || 0), 0) || null;
  const realizedAmounts = filteredRequests.map(r => calculateRealizedAmount(r)).filter(a => a !== null) as number[];
  const totalRealized = realizedAmounts.reduce((acc, a) => acc + a, 0) || null;

  // 3. Métricas
  
  // Bloco 1: Gestão Orçamentária
  const budgetManagement: BudgetManagementMetric = {
    budgetAmount: totalBudget,
    realizedAmount: totalRealized,
    usagePercent: totalBudget ? (totalRealized || 0) / totalBudget : null,
    deltaAmount: totalBudget !== null ? totalBudget - (totalRealized || 0) : null
  };

  // Bloco 2: Mix de Logística
  const logistics = calculateRealizedByLogistics(filteredRequests);
  const logisticsMix: LogisticsMixMetric = {
    airRealizedAmount: logistics.air || null,
    groundRealizedAmount: logistics.ground || null,
    airPercent: totalRealized ? logistics.air / totalRealized : null,
    groundPercent: totalRealized ? logistics.ground / totalRealized : null
  };

  // Bloco 3: Controle & Eficiência
  const savings = filteredRequests
    .map(r => calculatePurchaseSaving(r))
    .filter(s => s !== null) as number[];
  
  const totalSavings = savings.reduce((acc, s) => acc + s, 0) || null;
  const pendingCount = filteredRequests.filter(r => 
    r.status === RequestStatus.EM_VALIDACAO_CH || 
    r.status === RequestStatus.PENDENTE_CORRECAO ||
    r.status === RequestStatus.APROVADA // Aprovada mas não comprada
  ).length;

  const controlEfficiency: ControlEfficiencyMetric = {
    purchaseSavings: totalSavings,
    pendingAdministrativeCount: pendingCount,
    status: classifyFinancialStatus(totalRealized || 0, totalBudget)
  };

  // Bloco 4: Eficiência de Compra
  let quotedSum = 0;
  let effectiveSum = 0;
  let considered = 0;
  let ignored = 0;

  filteredRequests.forEach(r => {
    const q = getQuotedAmount(r);
    const e = calculateRealizedAmount(r);
    if (q !== null && e !== null) {
      quotedSum += q;
      effectiveSum += e;
      considered++;
    } else if (r.status === RequestStatus.EMITIDA || r.status === RequestStatus.CONCLUIDA) {
      ignored++;
    }
  });

  const purchaseEfficiency: PurchaseEfficiencyMetric = {
    quotedAmount: quotedSum || null,
    effectivePurchaseAmount: effectiveSum || null,
    savingsAmount: considered > 0 ? quotedSum - effectiveSum : null,
    consideredTickets: considered,
    ignoredDueToMissingData: ignored
  };

  // Bloco 5: Consumo do Orçamento
  const budgetConsumption: BudgetConsumptionMetric = {
    consumptionPercent: budgetManagement.usagePercent,
    availableBudget: budgetManagement.deltaAmount,
    budgetAmount: totalBudget,
    realizedAmount: totalRealized,
    status: classifyFinancialStatus(totalRealized || 0, totalBudget)
  };

  // Bloco 6: Tabela por CC
  const ccMap = new Map<string, BudgetVsRealizedByCostCenterRow>();

  // Inicia com orçamentos
  filteredBudgets.forEach(b => {
    const ccKey = sanitizeCC(b.costCenter);
    const budgetValue = Number(b.value) || 0;
    const existing = ccMap.get(ccKey);

    if (!existing) {
      ccMap.set(ccKey, {
        costCenter: b.costCenter,
        budgetAmount: budgetValue,
        airRealizedAmount: 0,
        groundRealizedAmount: 0,
        totalRealizedAmount: 0,
        deltaAmount: budgetValue,
        hasRealizedWithoutBudget: false
      });
    } else {
      existing.budgetAmount = (existing.budgetAmount || 0) + budgetValue;
      existing.deltaAmount = (existing.budgetAmount || 0) - (existing.totalRealizedAmount || 0);
    }
  });

  // Agrega realizados
  filteredRequests.forEach(r => {
    const amount = calculateRealizedAmount(r);
    if (amount === null) return;

    const ccKey = sanitizeCC(r.travel.costCenter);
    let row = ccMap.get(ccKey);
    
    if (!row) {
      row = {
        costCenter: r.travel.costCenter,
        budgetAmount: null,
        airRealizedAmount: 0,
        groundRealizedAmount: 0,
        totalRealizedAmount: 0,
        deltaAmount: 0,
        hasRealizedWithoutBudget: true
      };
      ccMap.set(ccKey, row);
    }

    const logType = classifyLogisticsType(r);
    if (logType === 'aereo') row.airRealizedAmount = (row.airRealizedAmount || 0) + amount;
    else row.groundRealizedAmount = (row.groundRealizedAmount || 0) + amount;

    row.totalRealizedAmount = (row.totalRealizedAmount || 0) + amount;
    row.deltaAmount = (row.budgetAmount || 0) - row.totalRealizedAmount;
    row.hasRealizedWithoutBudget = !row.budgetAmount || row.budgetAmount <= 0;
  });

  const tableRows = Array.from(ccMap.values()).sort((a, b) => {
    // Delta negativo primeiro
    if ((a.deltaAmount || 0) < 0 && (b.deltaAmount || 0) >= 0) return -1;
    if ((a.deltaAmount || 0) >= 0 && (b.deltaAmount || 0) < 0) return 1;
    // Depois maior realizado
    return (b.totalRealizedAmount || 0) - (a.totalRealizedAmount || 0);
  });

  return {
    budgetManagement,
    logisticsMix,
    controlEfficiency,
    purchaseEfficiency,
    budgetConsumption,
    budgetVsRealizedByCostCenter: tableRows
  };
}
