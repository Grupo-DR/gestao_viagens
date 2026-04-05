import React from 'react';
import { Search } from 'lucide-react';
import { RequestStatus } from '../../domain/enums.ts';

interface TravelListFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

/**
 * TravelListFilters (Sprint Final)
 * Componente isolado para busca e filtragem.
 */
export function TravelListFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange
}: TravelListFiltersProps) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar passageiro ou destino..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
        />
      </div>
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        className="px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white min-w-[180px] text-sm font-bold text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors"
      >
        <option value="all">Todos os Status</option>
        {Object.values(RequestStatus).map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}
