import { buildFinancialInsights, FinancialInsightContext } from '../buildFinancialInsights';
import { FinancialOverviewSummary, FinancialOverviewFilters } from '../buildFinancialOverview';
import { FinancialCostCenterRow } from '../buildFinancialOverview';

describe('buildFinancialInsights', () => {
  const defaultSummary: FinancialOverviewSummary = {
    totalBudget: 1000,
    totalExecuted: 500,
    totalAvailable: 500,
    consumptionPercent: 0.5,
    issuedTotalCount: 10,
    issuedAirCount: 5,
    issuedGroundCount: 5,
    airAmount: 250,
    groundAmount: 250,
    airBudgetAmount: 500,
    groundBudgetAmount: 500,
    airAvailableAmount: 250,
    groundAvailableAmount: 250,
    airStatus: 'healthy',
    groundStatus: 'healthy',
    missingPriceCount: 0,
    healthyCostCenters: 0,
    attentionCostCenters: 0,
    criticalCostCenters: 0,
    noBudgetCostCenters: 0,
    airConsumptionPercent: 0,
    groundConsumptionPercent: 0,
    averageTicketTotal: 0,
    averageTicketAir: 0,
    averageTicketGround: 0
  };

  const defaultFilters: FinancialOverviewFilters = {
    year: 2024,
    month: 4,
    transportMode: 'all',
    financialStatus: 'all'
  };

  const defaultContext: FinancialInsightContext = {
    summary: defaultSummary,
    rows: [],
    filters: defaultFilters
  };

  it('should return a healthy operation insight when no issues are found', () => {
    const insights = buildFinancialInsights(defaultContext);
    expect(insights).toHaveLength(1);
    expect(insights[0].id).toBe('healthy_operation');
    expect(insights[0].severity).toBe('ok');
  });

  it('should return a critical insight when totalBudget is 0 and there is execution', () => {
    const context = {
      ...defaultContext,
      summary: {
        ...defaultSummary,
        totalBudget: 0,
        totalExecuted: 100
      }
    };
    const insights = buildFinancialInsights(context);
    expect(insights.some(i => i.id === 'no_global_budget')).toBe(true);
    expect(insights.find(i => i.id === 'no_global_budget')?.severity).toBe('critical');
  });

  it('should return air budget critical insight when air amount exists without budget', () => {
    const context = {
      ...defaultContext,
      summary: {
        ...defaultSummary,
        airBudgetAmount: 0,
        airAmount: 100
      }
    };
    const insights = buildFinancialInsights(context);
    expect(insights.some(i => i.id === 'no_air_budget')).toBe(true);
  });

  it('should return budget exceeded insight when consumption is >= 100%', () => {
    const context = {
      ...defaultContext,
      summary: {
        ...defaultSummary,
        consumptionPercent: 1.1
      }
    };
    const insights = buildFinancialInsights(context);
    expect(insights.some(i => i.id === 'budget_exceeded')).toBe(true);
  });

  it('should return masked modal overrun insight when total is positive but a modal is negative', () => {
    const context = {
      ...defaultContext,
      summary: {
        ...defaultSummary,
        totalAvailable: 100,
        airAvailableAmount: -50
      }
    };
    const insights = buildFinancialInsights(context);
    expect(insights.some(i => i.id === 'masked_modal_overrun')).toBe(true);
  });

  it('should return pending quotations insight when missingPriceCount > 0', () => {
    const context = {
      ...defaultContext,
      summary: {
        ...defaultSummary,
        missingPriceCount: 3
      }
    };
    const insights = buildFinancialInsights(context);
    expect(insights.some(i => i.id === 'pending_quotations')).toBe(true);
  });

  it('should return air concentration insight when air cost is high but volume is low', () => {
    const context = {
      ...defaultContext,
      summary: {
        ...defaultSummary,
        totalExecuted: 1000,
        airAmount: 800,
        issuedTotalCount: 10,
        issuedAirCount: 3
      }
    };
    const insights = buildFinancialInsights(context);
    expect(insights.some(i => i.id === 'air_concentration')).toBe(true);
  });
});
