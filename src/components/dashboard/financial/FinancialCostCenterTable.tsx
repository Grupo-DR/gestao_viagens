// ============================================================
// PRESENTATION — FinancialCostCenterTable
// Tabela principal da Visão Financeira com 12 colunas.
// Ordenação: no_budget → critical → attention → maior executado.
// ============================================================

import React from 'react';
import { TrendingDown, TrendingUp, AlertCircle, Building2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { FinancialCostCenterRow, FinancialStatus } from '../../../application/use-cases/buildFinancialOverview';
import { formatCurrencyBRL, formatPercentBR } from '../../../domain/financial/financialMetrics';

// ──────────────────────────────────────────────
// Helpers de estilo
// ──────────────────────────────────────────────

const STATUS_CONFIG: Record<
  FinancialStatus,
  { label: string; badgeClass: string; barClass: string }
> = {
  healthy: {
    label: 'Saudável',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    barClass: 'bg-emerald-500',
  },
  attention: {
    label: 'Atenção',
    badgeClass: 'bg-amber-100 text-amber-700',
    barClass: 'bg-amber-500',
  },
  critical: {
    label: 'Crítico',
    badgeClass: 'bg-red-100 text-red-700',
    barClass: 'bg-red-500',
  },
  no_budget: {
    label: 'Sem Orçamento',
    badgeClass: 'bg-slate-100 text-slate-600',
    barClass: 'bg-slate-300',
  },
};

// ──────────────────────────────────────────────
// Sub-componentes
// ──────────────────────────────────────────────

const StatusBadge: React.FC<{ status: FinancialStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap',
        cfg.badgeClass
      )}
    >
      {cfg.label}
    </span>
  );
};

const ConsumptionBar: React.FC<{ percent: number | null; status: FinancialStatus }> = ({
  percent,
  status,
}) => {
  if (percent === null) return <span className="text-slate-300 text-xs">—</span>;
  const cfg = STATUS_CONFIG[status];
  const width = `${Math.min((percent ?? 0) * 100, 100)}%`;
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', cfg.barClass)} style={{ width }} />
      </div>
      <span className="text-[10px] font-bold text-slate-600 tabular-nums whitespace-nowrap">
        {formatPercentBR(percent)}
      </span>
    </div>
  );
};

// ──────────────────────────────────────────────
// Coluna header helper
// ──────────────────────────────────────────────

const Th: React.FC<{ children: React.ReactNode; right?: boolean }> = ({ children, right }) => (
  <th
    className={cn(
      'px-4 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap',
      right && 'text-right'
    )}
  >
    {children}
  </th>
);

const Td: React.FC<{ children: React.ReactNode; right?: boolean; className?: string }> = ({
  children,
  right,
  className,
}) => (
  <td className={cn('px-4 py-3.5', right && 'text-right', className)}>{children}</td>
);

// ──────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────

interface Props {
  rows: FinancialCostCenterRow[];
}

export const FinancialCostCenterTable: React.FC<Props> = ({ rows }) => {
  // Totals
  const totals = rows.reduce(
    (acc, r) => ({
      budget: acc.budget + r.budgetAmount,
      airCount: acc.airCount + r.issuedAirCount,
      airAmount: acc.airAmount + r.airAmount,
      groundCount: acc.groundCount + r.issuedGroundCount,
      groundAmount: acc.groundAmount + r.groundAmount,
      totalCount: acc.totalCount + r.issuedTotalCount,
      executed: acc.executed + r.executedAmount,
      available: acc.available + r.availableAmount,
      missing: acc.missing + r.missingPriceCount,
    }),
    { budget: 0, airCount: 0, airAmount: 0, groundCount: 0, groundAmount: 0, totalCount: 0, executed: 0, available: 0, missing: 0 }
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header da tabela */}
      <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 rounded-lg">
            <Building2 className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Budget vs Executado por Centro de Custo
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Análise granular por unidade operacional</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-slate-50 rounded-full">
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            {rows.length} {rows.length === 1 ? 'Unidade' : 'Unidades'}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/60 border-b border-slate-100">
              <Th>Centro de Custo</Th>
              <Th right>Budget</Th>
              <Th right>Valor Aéreo</Th>
              <Th right>Valor Rodov.</Th>
              <Th right>Qtd Total</Th>
              <Th right>Executado</Th>
              <Th right>Saldo</Th>
              <Th>Consumo</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((row) => {
              const isOver = row.availableAmount < 0;
              return (
                <tr
                  key={row.costCenterKey}
                  className="hover:bg-slate-50/40 transition-colors group"
                >
                  {/* Centro de Custo */}
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          'w-1 h-6 rounded-full transition-all group-hover:h-8 flex-shrink-0',
                          STATUS_CONFIG[row.status].barClass
                        )}
                      />
                      <div>
                        <p className="text-xs font-black text-slate-800 leading-none">
                          {row.costCenterCode}
                        </p>
                        {row.costCenterLabel !== row.costCenterCode && (
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5 max-w-[450px] truncate">
                            {row.costCenterLabel}
                          </p>
                        )}
                      </div>
                    </div>
                  </Td>

                  {/* Budget */}
                  <Td right>
                    <span className={cn(
                      'text-xs font-black tabular-nums',
                      row.budgetAmount === 0 ? 'text-slate-300 italic' : 'text-slate-600'
                    )}>
                      {row.budgetAmount > 0 ? formatCurrencyBRL(row.budgetAmount) : 'Sem orçamento'}
                    </span>
                  </Td>

                  {/* Valor Aéreo */}
                  <Td right>
                    <span className="text-[11px] font-bold text-slate-500 tabular-nums">
                      {row.airAmount > 0 ? formatCurrencyBRL(row.airAmount) : '—'}
                    </span>
                  </Td>

                  {/* Valor Rodoviário */}
                  <Td right>
                    <span className="text-[11px] font-bold text-slate-500 tabular-nums">
                      {row.groundAmount > 0 ? formatCurrencyBRL(row.groundAmount) : '—'}
                    </span>
                  </Td>

                  {/* Qtd Total */}
                  <Td right>
                    <span className="text-xs font-black text-slate-700">{row.issuedTotalCount}</span>
                  </Td>

                  {/* Executado */}
                  <Td right>
                    <span className="text-xs font-black text-slate-900 tabular-nums">
                      {formatCurrencyBRL(row.executedAmount)}
                    </span>
                  </Td>

                  {/* Saldo */}
                  <Td right>
                    <div className={cn(
                      'inline-flex items-center gap-1 text-xs font-black tabular-nums',
                      isOver ? 'text-red-500' : 'text-emerald-600'
                    )}>
                      {isOver
                        ? <TrendingDown className="w-3 h-3" />
                        : <TrendingUp className="w-3 h-3" />}
                      {formatCurrencyBRL(row.availableAmount)}
                    </div>
                  </Td>

                  {/* Consumo */}
                  <Td>
                    <ConsumptionBar percent={row.consumptionPercent} status={row.status} />
                  </Td>

                  {/* Status */}
                  <Td>
                    <StatusBadge status={row.status} />
                  </Td>
                </tr>
              );
            })}
          </tbody>

          {/* Totals footer */}
          {rows.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-100">
                <td className="px-4 py-4 text-[10px] font-black text-slate-900 uppercase tracking-widest">
                  Totais
                </td>
                <td className="px-4 py-4 text-right text-xs font-black text-slate-900 tabular-nums">
                  {formatCurrencyBRL(totals.budget)}
                </td>
                <td className="px-4 py-4 text-right text-xs font-bold text-slate-500 tabular-nums">
                  {formatCurrencyBRL(totals.airAmount)}
                </td>
                <td className="px-4 py-4 text-right text-xs font-bold text-slate-500 tabular-nums">
                  {formatCurrencyBRL(totals.groundAmount)}
                </td>
                <td className="px-4 py-4 text-right text-xs font-black text-slate-900">{totals.totalCount}</td>
                <td className="px-4 py-4 text-right text-xs font-black text-slate-900 tabular-nums">
                  {formatCurrencyBRL(totals.executed)}
                </td>
                <td className="px-4 py-4 text-right">
                  <span className={cn(
                    'px-3 py-1 rounded-full text-xs font-black tabular-nums',
                    totals.available < 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'
                  )}>
                    {formatCurrencyBRL(totals.available)}
                  </span>
                </td>
                <td colSpan={2} className="px-4 py-4" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Estado vazio */}
      {rows.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-center gap-3">
          <Building2 className="w-10 h-10 text-slate-200" />
          <p className="text-sm font-black text-slate-300 uppercase tracking-widest">
            Nenhum dado encontrado
          </p>
          <p className="text-xs text-slate-400 font-medium">
            Ajuste os filtros ou importe orçamentos para a competência selecionada.
          </p>
        </div>
      )}
    </div>
  );
};
