import React from 'react';
import { Filter, X, Search, AlertTriangle } from 'lucide-react';
import { RequestStatus, TravelReason } from '../../domain/enums';
import { DashboardFilters } from '../../application/use-cases/buildOperationalDashboard';
import { cn } from '../../lib/utils';

interface Props {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
  onClear: () => void;
  availableCostCenters: string[];
}

export const DashboardFiltersPanel: React.FC<Props> = ({ filters, onChange, onClear, availableCostCenters }) => {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-500" />
          Filtros de Visão Operacional
        </h3>
        <button 
          onClick={onClear}
          className="text-[10px] font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
        >
          <X className="w-3 h-3" />
          Limpar Filtros
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Período */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Início</label>
          <input 
            type="date" 
            value={filters.startDate || ''}
            onChange={e => onChange({ ...filters, startDate: e.target.value })}
            className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Fim</label>
          <input 
            type="date" 
            value={filters.endDate || ''}
            onChange={e => onChange({ ...filters, endDate: e.target.value })}
            className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Centro de Custo */}
        <div className="space-y-1.5 lg:col-span-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Centro de Custo</label>
          <select 
            value={filters.costCenter || ''}
            onChange={e => onChange({ ...filters, costCenter: e.target.value })}
            className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <option value="">Todos</option>
            {availableCostCenters.map(cc => (
              <option key={cc} value={cc}>{cc}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
          <select 
            value={filters.status || ''}
            onChange={e => onChange({ ...filters, status: e.target.value })}
            className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <option value="">Todos</option>
            {Object.values(RequestStatus).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Motivo */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivo</label>
          <select 
            value={filters.reason || ''}
            onChange={e => onChange({ ...filters, reason: e.target.value })}
            className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <option value="">Todos</option>
            {Object.values(TravelReason).map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Urgente */}
        <div className="flex items-end">
          <button 
            onClick={() => onChange({ ...filters, urgentOnly: !filters.urgentOnly })}
            className={cn(
              "w-full h-[38px] rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest border transition-all",
              filters.urgentOnly 
                ? "bg-red-50 border-red-200 text-red-600" 
                : "bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100"
            )}
          >
            <AlertTriangle className={cn("w-3.5 h-3.5", filters.urgentOnly ? "animate-pulse" : "")} />
            Urgentes
          </button>
        </div>
      </div>
    </div>
  );
};
