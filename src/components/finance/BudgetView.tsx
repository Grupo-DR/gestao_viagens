// ============================================================
// PRESENTATION — BudgetView
// Container da funcionalidade de orçamento.
// Abas: "Orçamento" (dados importados) | "Análise CC" (realizado vs orçado).
// Acesso restrito a MASTER (garantido no Layout + App).
// ============================================================

import React, { useMemo, useState } from 'react';
import {
  DollarSign, Plane, Bus, UploadCloud, Loader2,
  ShieldAlert, AlertCircle, Filter, BarChart3, TableProperties,
} from 'lucide-react';
import { useTravelBudgets } from '../../application/hooks/useTravelBudgets';
import { useTravelRequests } from '../../application/hooks/useTravelRequests';
import { useIdentity } from '../../application/identity/IdentityContext';
import { BudgetImportModal } from './BudgetImportModal';
import { BudgetAnalysisView } from './BudgetAnalysisView';
import { cn } from '../../lib/utils';
import type { TravelBudget } from '../../domain/types';

// ──────────────────────────────────────────────
// Constantes
// ──────────────────────────────────────────────

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const MONTHS_ORDER = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

type ActiveTab = 'orcamento' | 'analise';

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function sortByMonth(a: TravelBudget, b: TravelBudget): number {
  return MONTHS_ORDER.indexOf(a.month) - MONTHS_ORDER.indexOf(b.month);
}

function sumValues(budgets: TravelBudget[]): number {
  return budgets.reduce((acc, b) => acc + b.value, 0);
}

// ──────────────────────────────────────────────
// Sub-componentes
// ──────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
}

function SummaryCard({ label, value, icon: Icon, colorClass, bgClass }: SummaryCardProps) {
  return (
    <div className={cn('p-5 rounded-2xl border flex items-center gap-4', bgClass)}>
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm', colorClass)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-0.5">{label}</p>
        <p className={cn('text-xl font-black', colorClass)}>{BRL.format(value)}</p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Componente Principal
// ──────────────────────────────────────────────

export function BudgetView() {
  const { currentUser } = useIdentity();
  const { budgets, loading: loadingBudgets, error: budgetError, isDemoMode } = useTravelBudgets();
  const { requests, loading: loadingRequests } = useTravelRequests({ view: 'all', user: currentUser! });

  const [activeTab,       setActiveTab]       = useState<ActiveTab>('orcamento');
  const [showImportModal, setShowImportModal]  = useState(false);
  const [filterYear,      setFilterYear]       = useState<number | 'all'>('all');
  const [filterMonth,     setFilterMonth]      = useState<string>('all');
  const [filterCategory,  setFilterCategory]   = useState<'all' | 'aereo' | 'rodoviario'>('all');

  // ── Derivações ──

  const availableYears = useMemo(
    () => [...new Set(budgets.map(b => b.year))].sort((a, b) => b - a),
    [budgets]
  );

  const filteredBudgets = useMemo(() =>
    budgets
      .filter(b => filterYear     === 'all' || b.year     === filterYear)
      .filter(b => filterMonth    === 'all' || b.month    === filterMonth)
      .filter(b => filterCategory === 'all' || b.category === filterCategory)
      .sort(sortByMonth),
    [budgets, filterYear, filterMonth, filterCategory]
  );

  const totalAereo    = useMemo(() => sumValues(filteredBudgets.filter(b => b.category === 'aereo')),     [filteredBudgets]);
  const totalTerrestre = useMemo(() => sumValues(filteredBudgets.filter(b => b.category === 'rodoviario')), [filteredBudgets]);
  const totalGeral    = totalAereo + totalTerrestre;

  // ── Loading global ──

  if (loadingBudgets) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-slate-400 italic text-sm font-medium">Carregando orçamentos...</p>
      </div>
    );
  }

  if (budgetError) {
    return (
      <div className="p-8 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700">
        <ShieldAlert className="w-6 h-6 shrink-0" />
        <div>
          <h3 className="font-bold">Erro ao carregar orçamentos</h3>
          <p className="text-sm opacity-80 mt-0.5">{budgetError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* ── Cabeçalho ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Orçamento de Viagens</h1>
          <p className="text-slate-400 text-sm mt-0.5 flex items-center gap-2">
            Acompanhe o orçamento e o realizado de passagens por Centro de Custo.
            {isDemoMode && (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded text-[9px] font-black uppercase tracking-widest">
                Modo Demo
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 whitespace-nowrap"
        >
          <UploadCloud className="w-4 h-4" />
          Importar Budget
        </button>
      </div>

      {/* ── Abas ── */}
      <div className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-2xl w-fit">
        {([
          { id: 'orcamento', label: 'Orçamento', icon: TableProperties },
          { id: 'analise',   label: 'Orçado vs Realizado', icon: BarChart3 },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all',
              activeTab === tab.id
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Conteúdo da aba Análise ── */}
      {activeTab === 'analise' && (
        <BudgetAnalysisView
          budgets={budgets}
          requests={requests}
          loadingRequests={loadingRequests}
        />
      )}

      {/* ── Conteúdo da aba Orçamento ── */}
      {activeTab === 'orcamento' && (
        <>
          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard
              label="Total Aéreo"
              value={totalAereo}
              icon={Plane}
              colorClass="text-blue-600"
              bgClass="bg-blue-50/60 border-blue-100"
            />
            <SummaryCard
              label="Total Terrestre"
              value={totalTerrestre}
              icon={Bus}
              colorClass="text-emerald-600"
              bgClass="bg-emerald-50/60 border-emerald-100"
            />
            <SummaryCard
              label="Total Geral"
              value={totalGeral}
              icon={DollarSign}
              colorClass="text-indigo-600"
              bgClass="bg-indigo-50/60 border-indigo-100"
            />
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <Filter className="w-4 h-4 text-slate-400" />

            <select
              value={String(filterYear)}
              onChange={e => setFilterYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
            >
              <option value="all">Todos os anos</option>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            <select
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
            >
              <option value="all">Todos os meses</option>
              {MONTHS_ORDER.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value as typeof filterCategory)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
            >
              <option value="all">Todas as categorias</option>
              <option value="aereo">Aéreo</option>
              <option value="rodoviario">Terrestre</option>
            </select>

            {filteredBudgets.length !== budgets.length && (
              <span className="text-[10px] font-bold text-slate-400">
                {filteredBudgets.length} de {budgets.length} registros
              </span>
            )}
          </div>

          {/* Estado vazio */}
          {budgets.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-4 text-slate-300">
              <AlertCircle className="w-12 h-12" />
              <div className="text-center">
                <p className="font-bold text-slate-500">Nenhum orçamento importado</p>
                <p className="text-sm text-slate-400 mt-1">
                  Clique em <span className="font-bold text-indigo-500">Importar Budget</span> para começar.
                </p>
              </div>
            </div>
          ) : (
            /* Tabela */
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Ano', 'Mês', 'Centro de Custo', 'Categoria', 'Valor Orçado'].map(h => (
                        <th key={h} className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredBudgets.map((b, i) => (
                      <tr key={b.id ?? i} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3 font-bold text-slate-600 text-xs">{b.year}</td>
                        <td className="px-5 py-3 text-slate-700 text-xs">{b.month}</td>
                        <td className="px-5 py-3 font-mono text-slate-700 text-xs">{b.costCenter}</td>
                        <td className="px-5 py-3">
                          {b.category === 'aereo' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-wider">
                              <Plane className="w-2.5 h-2.5" /> Aéreo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-wider">
                              <Bus className="w-2.5 h-2.5" /> Terrestre
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 font-black text-slate-900 text-sm">{BRL.format(b.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                  {filteredBudgets.length > 0 && (
                    <tfoot>
                      <tr className="bg-indigo-50/40 border-t-2 border-indigo-100">
                        <td colSpan={4} className="px-5 py-3 text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                          Total do Filtro
                        </td>
                        <td className="px-5 py-3 font-black text-indigo-700 text-sm">
                          {BRL.format(totalGeral)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de importação */}
      {showImportModal && (
        <BudgetImportModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {/* hook já atualiza em tempo real via onSnapshot */}}
        />
      )}
    </div>
  );
}
