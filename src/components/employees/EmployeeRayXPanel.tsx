import React from 'react';
import { RefreshCw, ChevronRight, XCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useEmployeeRayX } from '../../application/hooks/useEmployeeRayX';
import { EmployeeRayXTable } from './EmployeeRayXTable';
import { EmployeeRayXSkeleton } from './EmployeeRayXSkeleton';
import { cn } from '../../lib/utils';

export function EmployeeRayXPanel() {
  const { 
    data, loading, error, refresh, lastUpdate,
    counts, selectedCategory, setSelectedCategory,
    selectedCC, setSelectedCC, 
    selectedRole, setSelectedRole,
    selectedName, setSelectedName,
    costCenters, roles, names,
    clearFilters
  } = useEmployeeRayX();

  const categories = [
    { id: 'VENCIDA', label: 'Folga Vencida', color: 'bg-red-900', sub: 'Crítico / Atrasado', pulse: true },
    { id: 'NAO_RECOMENDAVEL', label: 'Não recomendável compra', color: 'bg-purple-600', sub: 'Urgência Máxima' },
    { id: 'ALTA', label: 'Alta Atenção aos Preços', color: 'bg-red-500', sub: '30-45 dias' },
    { id: 'MEDIA', label: 'Média Atenção aos Preços', color: 'bg-orange-500', sub: '45-60 dias' },
    { id: 'IDEAL', label: 'Ideal para Compra', color: 'bg-blue-600', sub: '60-90 dias' },
  ];

  if (loading && data.length === 0) return <EmployeeRayXSkeleton />;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      {/* Cabeçalho Premium - Identidade de Gestão de Riscos */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div className="space-y-3">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">
                Gestão de Riscos
              </h1>
           </div>
           <div className="flex items-center gap-4">
              <p className="text-slate-500 font-semibold text-base tracking-tight">
                Gestão por criticidade e economia
              </p>
              {lastUpdate && !loading && (
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50/50 backdrop-blur-sm text-emerald-600 rounded-full border border-emerald-100/50 animate-in zoom-in duration-500">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Dados Sincronizados {lastUpdate}</span>
                 </div>
              )}
           </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={refresh}
            disabled={loading}
            className="group flex items-center gap-2 px-5 py-3.5 bg-white/70 backdrop-blur-md border border-slate-200 rounded-[22px] text-slate-600 hover:text-blue-600 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/10 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4 transition-transform duration-700 group-hover:rotate-180", loading && "animate-spin")} />
            <span className="text-[10px] font-black uppercase tracking-widest">Atualizar RM</span>
          </button>
        </div>
      </div>

      {/* Grid de Bento Boxes (Status Monitoring) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {categories.map((cat) => {
          const count = (counts as any)[cat.id] || 0;
          const isActive = selectedCategory === cat.id;
          const isDisabled = count === 0;

          return (
            <button
              key={cat.id}
              disabled={isDisabled}
              onClick={() => setSelectedCategory(isActive ? null : cat.id)}
              className={cn(
                "relative group flex flex-col justify-between h-32 p-5 rounded-[28px] border-2 transition-all duration-500 text-left overflow-hidden",
                isActive 
                  ? `${cat.color} border-transparent shadow-[0_20px_40px_rgba(0,0,0,0.1)] ring-8 ring-slate-100/50 scale-[1.03] z-10` 
                  : isDisabled 
                    ? "bg-slate-50/50 border-slate-100 opacity-40 grayscale cursor-not-allowed"
                    : "bg-white/80 backdrop-blur-sm border-slate-100 hover:border-blue-200 hover:shadow-2xl hover:shadow-slate-200/50"
              )}
            >
              {/* Decorative Background Glow */}
              {isActive && <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 blur-3xl -mr-12 -mt-12" />}
              
              <div className="flex justify-between items-start relative z-10">
                 <div className="flex flex-col gap-0.5">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-[0.15em] leading-tight",
                      isActive ? "text-white/80" : "text-slate-400"
                    )}>
                      {cat.label}
                    </span>
                    <span className={cn(
                      "text-[8px] font-bold uppercase tracking-widest",
                      isActive ? "text-white/50" : "text-slate-300"
                    )}>
                      {cat.sub}
                    </span>
                 </div>
                 {isActive && <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_12px_rgba(255,255,255,1)]" />}
              </div>
              
              <div className="flex items-baseline gap-1.5 mt-auto relative z-10">
                <span className={cn(
                  "text-4xl font-black tracking-tighter leading-none",
                  isActive ? "text-white" : "text-slate-900"
                )}>
                  {count}
                </span>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-wider",
                  isActive ? "text-white/60" : "text-slate-400"
                )}>
                  Colabs.
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Barra de Filtros Glassmorphism */}
      <div className="bg-white/60 backdrop-blur-xl p-2.5 rounded-[32px] border border-slate-200 shadow-[0_8px_32px_rgba(15,23,42,0.04)] flex flex-col lg:flex-row gap-3">
        {/* Dropdowns Hierárquicos com Design Refinado */}
        <div className="flex-1 min-w-0 bg-white/40 rounded-[24px] border border-slate-100 px-5 py-2.5 hover:border-blue-200 transition-colors">
          <label className="block mb-1 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Centro de Custo</label>
          <select
            value={selectedCC}
            onChange={(e) => setSelectedCC(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-xs font-black text-slate-700 appearance-none cursor-pointer"
          >
            <option value="">Todos os Departamentos</option>
            {costCenters.map(cc => <option key={cc} value={cc}>{cc}</option>)}
          </select>
        </div>

        <div className="hidden lg:flex items-center text-slate-300">
           <ChevronRight className="w-5 h-5 opacity-40" />
        </div>

        <div className="flex-1 min-w-0 bg-white/40 rounded-[24px] border border-slate-100 px-5 py-2.5 hover:border-blue-200 transition-colors">
          <label className="block mb-1 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Função</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-xs font-black text-slate-700 appearance-none cursor-pointer"
          >
            <option value="">Todas as Funções</option>
            {roles.map(role => <option key={role} value={role}>{role}</option>)}
          </select>
        </div>

        <div className="hidden lg:flex items-center text-slate-300">
           <ChevronRight className="w-5 h-5 opacity-40" />
        </div>

        <div className="flex-1 min-w-0 bg-white/40 rounded-[24px] border border-slate-100 px-5 py-2.5 hover:border-blue-200 transition-colors">
          <label className="block mb-1 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Colaborador</label>
          <select
            value={selectedName}
            onChange={(e) => setSelectedName(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-xs font-black text-slate-700 appearance-none cursor-pointer"
          >
            <option value="">Todos os Nomes</option>
            {names.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>

        {/* Action Button */}
        <button 
          onClick={clearFilters}
          className="px-8 py-4 bg-slate-900 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:shadow-2xl hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
           <XCircle className="w-4 h-4" /> Limpar Filtros
        </button>
      </div>

      {/* Tabela de Resultados */}
      {error ? (
        <div className="p-20 bg-red-50/30 backdrop-blur-sm border-2 border-dashed border-red-100 rounded-[48px] text-center space-y-4">
           <div className="w-16 h-16 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-8 h-8 text-red-600" />
           </div>
           <h3 className="text-2xl font-black text-red-900 tracking-tight leading-none uppercase">Falha na Matriz de Dados</h3>
           <p className="text-sm text-red-700/60 font-semibold max-w-sm mx-auto">{error}</p>
        </div>
      ) : (
        <div className={cn("transition-all duration-1000", loading ? "opacity-30 blur-sm pointer-events-none" : "opacity-100 blur-0")}>
           <EmployeeRayXTable data={data} />
        </div>
      )}

      {/* Footer Insight */}
      {!loading && !error && (
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 rounded-[24px] border border-slate-100">
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">
                Gestão Inteligente: Analisando {data.length} Matrizes de Risco
              </p>
           </div>
           <span className="text-[9px] text-slate-400 font-black italic tracking-tighter">
             Powered by Portal Nexus Logic
           </span>
        </div>
      )}
    </div>
  );
}
