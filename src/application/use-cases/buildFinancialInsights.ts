// ============================================================
// USE CASE — buildFinancialInsights
// Camada de inteligência financeira que transforma métricas 
// brutas em alertas, diagnósticos e recomendações.
// ============================================================

import { FinancialOverviewSummary, FinancialCostCenterRow, FinancialOverviewFilters } from './buildFinancialOverview';
import { formatCurrencyBRL, formatPercentBR } from '../../domain/financial/financialMetrics';

export type FinancialInsightSeverity =
  | 'critical'
  | 'attention'
  | 'warning'
  | 'ok'
  | 'info';

export type FinancialInsightCategory =
  | 'budget'
  | 'modal'
  | 'quotation'
  | 'data_quality'
  | 'efficiency'
  | 'trend';

export type FinancialInsight = {
  id: string;
  severity: FinancialInsightSeverity;
  category: FinancialInsightCategory;
  title: string;
  message: string;
  recommendation?: string;
  metric?: {
    label: string;
    value: string;
  };
  priority: number;
};

export type FinancialInsightContext = {
  summary: FinancialOverviewSummary;
  rows: FinancialCostCenterRow[];
  filters: FinancialOverviewFilters;
};

export function buildFinancialInsights(
  context: FinancialInsightContext
): FinancialInsight[] {
  const { summary } = context;
  const insights: FinancialInsight[] = [];

  // 1. Execução sem orçamento global
  if (summary.totalBudget <= 0 && summary.totalExecuted > 0) {
    insights.push({
      id: 'no_global_budget',
      severity: 'critical',
      category: 'budget',
      title: 'Execução sem orçamento cadastrado',
      message: 'Existe valor executado para o período, porém nenhum orçamento foi cadastrado para o filtro selecionado.',
      recommendation: 'Revisar ou cadastrar orçamento na tela de Gestão de Budget.',
      priority: 100,
      metric: { label: 'Executado', value: formatCurrencyBRL(summary.totalExecuted) }
    });
  }

  // 2. Modal aéreo sem orçamento
  if (summary.airBudgetAmount <= 0 && summary.airAmount > 0) {
    insights.push({
      id: 'no_air_budget',
      severity: 'critical',
      category: 'modal',
      title: 'Aéreo sem budget',
      message: 'Foram emitidas passagens aéreas sem orçamento previsto para este modal.',
      recommendation: 'Alocar budget específico para Aéreo ou revisar planejamento.',
      priority: 90,
      metric: { label: 'Gasto Aéreo', value: formatCurrencyBRL(summary.airAmount) }
    });
  }

  // 3. Modal rodoviário sem orçamento
  if (summary.groundBudgetAmount <= 0 && summary.groundAmount > 0) {
    insights.push({
      id: 'no_ground_budget',
      severity: 'critical',
      category: 'modal',
      title: 'Rodoviário sem budget',
      message: 'Foram emitidos trechos rodoviários sem orçamento previsto para este modal.',
      recommendation: 'Alocar budget específico para Rodoviário.',
      priority: 85,
      metric: { label: 'Gasto Rodov.', value: formatCurrencyBRL(summary.groundAmount) }
    });
  }

  // 4. Budget global excedido
  if (summary.consumptionPercent !== null && summary.consumptionPercent >= 1) {
    insights.push({
      id: 'budget_exceeded',
      severity: 'critical',
      category: 'budget',
      title: 'Budget excedido',
      message: `O consumo geral ultrapassou 100% do planejado para esta competência.`,
      recommendation: 'Interromper novas emissões ou solicitar suplementação de verba.',
      priority: 95,
      metric: { label: 'Consumo', value: formatPercentBR(summary.consumptionPercent) }
    });
  }

  // 5. Consumo geral elevado (quase esgotado)
  if (summary.consumptionPercent !== null && summary.consumptionPercent >= 0.9 && summary.consumptionPercent < 1) {
    insights.push({
      id: 'budget_near_limit',
      severity: 'attention',
      category: 'budget',
      title: 'Budget quase esgotado',
      message: 'O consumo geral já atingiu mais de 90% do orçamento total.',
      recommendation: 'Monitorar de perto as próximas emissões.',
      priority: 80,
      metric: { label: 'Consumo', value: formatPercentBR(summary.consumptionPercent) }
    });
  }

  // 6. Consumo geral em atenção
  if (summary.consumptionPercent !== null && summary.consumptionPercent >= 0.8 && summary.consumptionPercent < 0.9) {
    insights.push({
      id: 'budget_attention',
      severity: 'warning',
      category: 'budget',
      title: 'Consumo elevado',
      message: 'O consumo geral está acima de 80%, entrando em zona de atenção.',
      priority: 70,
      metric: { label: 'Consumo', value: formatPercentBR(summary.consumptionPercent) }
    });
  }

  // 7. Modal excedido com saldo global positivo (Estouro Mascarado)
  const airExceeded = summary.airAvailableAmount < 0;
  const groundExceeded = summary.groundAvailableAmount < 0;
  if (summary.totalAvailable > 0 && (airExceeded || groundExceeded)) {
    const modal = airExceeded && groundExceeded ? 'Aéreo e Rodoviário' : airExceeded ? 'Aéreo' : 'Rodoviário';
    insights.push({
      id: 'masked_modal_overrun',
      severity: 'attention',
      category: 'modal',
      title: 'Estouro por modal mascarado',
      message: `O saldo geral está positivo, mas o modal ${modal} excedeu seu orçamento individual.`,
      recommendation: 'Revisar equilíbrio entre os modais.',
      priority: 75,
    });
  }

  // 8. Cotações pendentes
  if (summary.missingPriceCount > 0) {
    insights.push({
      id: 'pending_quotations',
      severity: 'attention',
      category: 'quotation',
      title: 'Cotações pendentes',
      message: `${summary.missingPriceCount} trecho(s) emitido(s) aguardando preenchimento de preço real.`,
      recommendation: 'Regularizar valores reais para melhorar a confiabilidade dos indicadores executados.',
      priority: 60,
    });
  }

  // 9. Concentração de gasto no aéreo
  if (summary.totalExecuted > 0) {
    const airCostWeight = summary.airAmount / summary.totalExecuted;
    const airVolumeWeight = summary.issuedTotalCount > 0 ? summary.issuedAirCount / summary.issuedTotalCount : 0;
    
    if (airCostWeight >= 0.75 && airVolumeWeight <= 0.50) {
      insights.push({
        id: 'air_concentration',
        severity: 'warning',
        category: 'efficiency',
        title: 'Concentração de custo no aéreo',
        message: `O aéreo representa ${formatPercentBR(airCostWeight)} do gasto total, mas responde por apenas ${formatPercentBR(airVolumeWeight)} dos trechos.`,
        recommendation: 'Avaliar alternativas rodoviárias ou compra antecipada para reduzir ticket médio.',
        priority: 50,
      });
    }
  }

  // 10. Operação saudável
  const hasAlerts = insights.some(i => ['critical', 'attention', 'warning'].includes(i.severity));
  if (!hasAlerts) {
    insights.push({
      id: 'healthy_operation',
      severity: 'ok',
      category: 'efficiency',
      title: 'Operação financeira dentro do planejado',
      message: 'Nenhuma inconsistência financeira relevante identificada no período.',
      priority: 0,
    });
  }

  // Ordenação por prioridade e limite de 4
  return insights
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4);
}
