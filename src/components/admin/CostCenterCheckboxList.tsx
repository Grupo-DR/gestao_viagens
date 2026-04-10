import React, { useState, useEffect, useMemo } from 'react';
import { Search, CheckSquare, Loader2, RotateCcw } from 'lucide-react';
import { getAllCostCenters, CostCenterItem } from '../../application/services/costCenterService';
import { cn } from '../../lib/utils';

interface CostCenterCheckboxListProps {
  /** Códigos dos CCs atualmente selecionados */
  selected: string[];
  /** Chamado ao mudar a seleção */
  onChange: (selected: string[]) => void;
  /** Desabilitar quando o papel for irrestrito (MASTER/CH) */
  disabled?: boolean;
  /** Mensagem exibida quando disabled=true */
  disabledMessage?: string;
}

export function CostCenterCheckboxList({
  selected,
  onChange,
  disabled = false,
  disabledMessage = 'Este papel tem acesso irrestrito a todos os centros de custo.',
}: CostCenterCheckboxListProps) {
  const [allCCs, setAllCCs] = useState<CostCenterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    getAllCostCenters().then(list => {
      setAllCCs(list);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return allCCs;
    const term = searchTerm.toLowerCase().trim();
    return allCCs.filter(cc => cc.label.toLowerCase().includes(term));
  }, [allCCs, searchTerm]);

  const selectedSet = useMemo(() => new Set<string>(selected), [selected]);

  const toggle = (code: string) => {
    if (disabled) return;
    const next = new Set<string>(selectedSet);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    onChange(Array.from(next));
  };

  const selectAll = () => {
    if (disabled) return;
    const next = new Set<string>(selectedSet);
    filtered.forEach(cc => next.add(cc.code));
    onChange(Array.from(next));
  };

  const clearAll = () => {
    if (disabled) return;
    // Remove apenas os que estão visíveis no filtro atual
    const filteredCodes = new Set(filtered.map(cc => cc.code));
    onChange(selected.filter(code => !filteredCodes.has(code)));
  };

  if (disabled) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
        <p className="text-xs text-emerald-700 font-medium">{disabledMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      {/* Header com busca e contador */}
      <div className="p-3 border-b border-slate-100 space-y-2">
        {/* Barra de busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar centro de custo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder:text-slate-400"
          />
        </div>

        {/* Contador e ações rápidas */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={cn(
              'px-2 py-0.5 rounded-full text-[10px] font-black border',
              selected.length > 0
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-slate-50 text-slate-500 border-slate-200'
            )}>
              {selected.length > 0 ? `${selected.length} selecionado${selected.length > 1 ? 's' : ''}` : 'Nenhum selecionado'}
            </span>
            {searchTerm && (
              <span className="text-[10px] text-slate-400 font-medium">
                · {filtered.length} de {allCCs.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {filtered.length > 0 && (
              <button
                type="button"
                onClick={selectAll}
                className="text-[10px] font-black text-purple-600 hover:text-purple-800 transition-colors uppercase tracking-wide"
              >
                Todos
              </button>
            )}
            {selected.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-[10px] font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-wide flex items-center gap-1"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lista com scroll */}
      <div className="max-h-52 overflow-y-auto divide-y divide-slate-50">
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
            <span className="text-xs font-bold text-slate-400">Carregando do RM...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-2">
            <Search className="w-5 h-5 text-slate-300" />
            <p className="text-xs font-bold text-slate-400">
              {allCCs.length === 0
                ? 'Nenhum centro de custo disponível.'
                : 'Nenhum resultado para sua busca.'}
            </p>
          </div>
        ) : (
          filtered.map(cc => {
            const isChecked = selectedSet.has(cc.code);
            return (
              <button
                key={cc.code}
                type="button"
                onClick={() => toggle(cc.code)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                  isChecked
                    ? 'bg-purple-50 hover:bg-purple-100'
                    : 'hover:bg-slate-50'
                )}
              >
                <div className={cn(
                  'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                  isChecked
                    ? 'bg-purple-600 border-purple-600'
                    : 'bg-white border-slate-300'
                )}>
                  {isChecked && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className={cn(
                  'text-xs font-medium truncate',
                  isChecked ? 'text-purple-900 font-bold' : 'text-slate-700'
                )}>
                  {cc.label}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
