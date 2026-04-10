import React from 'react';
import { cn } from '../../lib/utils';

export function EmployeeRayXSkeleton() {
  const shimmer = "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent";

  return (
    <div className="space-y-6 animate-pulse">
      {/* Skeletons de Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={cn("h-28 rounded-[24px] bg-slate-100/50 border border-slate-100 relative overflow-hidden", shimmer)} />
        ))}
      </div>

      {/* Skeleton de Filtros */}
      <div className="h-16 rounded-[28px] bg-slate-50 border border-slate-100 flex items-center px-6 gap-4">
         <div className="h-8 w-1/3 bg-slate-200/50 rounded-full" />
         <div className="h-4 w-4 bg-slate-200/50 rounded-full" />
         <div className="h-8 w-1/3 bg-slate-200/50 rounded-full" />
         <div className="h-4 w-4 bg-slate-200/50 rounded-full" />
         <div className="h-8 w-1/3 bg-slate-200/50 rounded-full" />
      </div>

      {/* Skeleton de Tabela */}
      <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
        <div className="h-16 bg-slate-50/50 border-b border-slate-100 px-6 flex items-center justify-between">
           {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-3 w-20 bg-slate-200/40 rounded-full" />)}
        </div>
        <div className="divide-y divide-slate-50">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="px-6 py-8 flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-48 bg-slate-100 rounded-full" />
                <div className="h-2 w-32 bg-slate-50 rounded-full" />
              </div>
              <div className="h-8 w-24 bg-slate-100/50 rounded-xl" />
              <div className="h-10 w-32 bg-slate-50 rounded-2xl" />
              <div className="h-8 w-16 bg-slate-100 rounded-lg ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
