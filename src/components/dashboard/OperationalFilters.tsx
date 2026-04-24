import React from 'react';
import { Filter, X, Calendar, AlertTriangle } from 'lucide-react';
import { DashboardFilters } from '../../application/use-cases/buildOperationalDashboard';
import { UrgencyFilter } from '../../domain/travelRequest.operationalMetrics';
import { cn } from '../../lib/utils';

interface Props {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
  onClear: () => void;
  availableCostCenters: string[];
}

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const YEARS = [2024, 2025, 2026];

export const OperationalFilters: React.FC<Props> = ({ filters, onChange, onClear, availableCostCenters }) => {
  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
      <div className="flex items-center gap-2 pr-4 border-r border-slate-100">
        <Filter className="w-4 h-4 text-indigo-500" />
        <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider">Filtros Operacionais</span>
      </div>

      <div className="flex flex-wrap items-center gap-3 flex-1">
        {/* Ano */}
        <select 
          value={filters.year}
          onChange={e => onChange({ ...filters, year: Number(e.target.value) })}
          className="bg-slate-50 border-none rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
        >
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        {/* Mês */}
        <select 
          value={filters.month}
          onChange={e => onChange({ ...filters, month: Number(e.target.value) })}
          className="bg-slate-50 border-none rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
        >
          {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>

        {/* Centro de Custo */}
        <select 
          value={filters.costCenter || ''}
          onChange={e => onChange({ ...filters, costCenter: e.target.value || undefined })}
          className="bg-slate-50 border-none rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 min-w-[200px]"
        >
          <option value="">Todos Centros de Custo</option>
          {availableCostCenters.map(cc => <option key={cc} value={cc}>{cc}</option>)}
        </select>
      </div>

      <button 
        onClick={onClear}
        className="text-[10px] font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
      >
        <X className="w-3 h-3" />
        Limpar
      </button>
    </div>
  );
};
