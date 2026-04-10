import React from 'react';
import { Timer, UserCheck, AlertCircle } from 'lucide-react';
import { EmployeeRayXData } from '../../application/hooks/useEmployeeRayX';
import { cn } from '../../lib/utils';
import { format, parseISO, differenceInDays, isBefore, startOfDay } from 'date-fns';

interface EmployeeRayXTableProps {
  data: EmployeeRayXData[];
}

export function EmployeeRayXTable({ data }: EmployeeRayXTableProps) {
  
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return format(parseISO(dateStr), 'dd/MM/yyyy');
    } catch {
      return dateStr;
    }
  };

  const getDeadlineBadge = (deadlineStr?: string) => {
    if (!deadlineStr) return null;
    try {
      const deadline = parseISO(deadlineStr);
      const today = startOfDay(new Date());
      const daysLeft = differenceInDays(deadline, today);

      if (isBefore(deadline, today)) {
        return (
          <span className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
            Vencido
          </span>
        );
      }
      if (daysLeft < 90) {
        return (
          <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
            Crítico
          </span>
        );
      }
      return (
        <span className="px-3 py-1 bg-slate-50 text-slate-500 border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-wider">
          Regular
        </span>
      );
    } catch {
      return null;
    }
  };

  /**
   * Status de Janela de Compra com Estética de Cápsula
   */
  const getPredictedStatus = (predictedStr: string | undefined, category: EmployeeRayXData['category']) => {
    if (!predictedStr) return null;
    try {
      const predicted = parseISO(predictedStr);
      const today = startOfDay(new Date());
      const daysDiff = differenceInDays(predicted, today);

      if (category === 'VENCIDA') {
        return (
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-black text-white uppercase tracking-tighter bg-red-900 px-3 py-1 rounded-full shadow-lg shadow-red-900/20 leading-none flex items-center gap-2">
              <AlertCircle className="w-3 h-3" />
              Vencida há {Math.abs(daysDiff)} dias
            </span>
          </div>
        );
      }

      if (category === 'NAO_RECOMENDAVEL') {
        return (
          <span className="px-3 py-1 bg-purple-50 text-purple-600 border border-purple-100 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
            Não recomendável compra
          </span>
        );
      }
      if (category === 'ALTA') {
        return (
          <span className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
            Alta Atenção aos Preços
          </span>
        );
      }
      if (category === 'MEDIA') {
        return (
          <span className="px-3 py-1 bg-orange-50 text-orange-600 border border-orange-100 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
            Média Atenção aos Preços
          </span>
        );
      }
      if (category === 'IDEAL') {
        return (
          <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
            Ideal para Compra
          </span>
        );
      }

      return (
        <span className="px-3 py-1 bg-slate-50 text-slate-400 border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-wider">
          {daysDiff} dias restantes
        </span>
      );
    } catch {
      return null;
    }
  };

  const getEligibilityStatus = (lastTimeOffStr?: string, ruleStr?: string) => {
    if (!lastTimeOffStr) return null;
    try {
      const last = parseISO(lastTimeOffStr);
      const today = startOfDay(new Date());
      const daysSince = differenceInDays(today, last);
      const match = ruleStr?.match(/A cada (\d+) dias/);
      const threshold = match ? parseInt(match[1], 10) : 90;

      if (daysSince >= threshold) {
        return (
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-100/50 leading-none">
              Apto p/ Folga
            </span>
            <span className="text-[9px] font-bold text-slate-400">Há {daysSince} dias</span>
          </div>
        );
      }
      
      return (
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-3 py-0.5 rounded-full border border-slate-100/50 leading-none">
            {threshold - daysSince} dias restantes
          </span>
        </div>
      );
    } catch {
      return null;
    }
  };

  const getVacationStatus = (item: EmployeeRayXData) => {
    const today = startOfDay(new Date());
    
    if (item.programmedStart && item.programmedEnd) {
      try {
        const start = parseISO(item.programmedStart);
        const end = parseISO(item.programmedEnd);
        
        if ((isBefore(start, today) || start.getTime() === today.getTime()) && 
            (isBefore(today, end) || end.getTime() === today.getTime())) {
          return (
            <div className="flex items-center gap-2.5 text-emerald-700 bg-emerald-100/50 px-4 py-2 rounded-2xl border border-emerald-200 shadow-lg shadow-emerald-500/10">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-[11px] font-black uppercase tracking-widest">Em Gozo de Férias</span>
            </div>
          );
        }
      } catch { /* ... */ }
    }

    if (item.programmedStart) {
      try {
        const start = parseISO(item.programmedStart);
        const daysLeft = differenceInDays(start, today);
        
        if (daysLeft >= 0) {
          return (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-black text-slate-900 leading-none tracking-tight">
                {formatDate(item.programmedStart)}
              </span>
              <div className="flex items-center gap-2 text-blue-600 bg-blue-50/80 px-3 py-1.5 rounded-xl border border-blue-100 w-fit">
                <Timer className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-wider">Faltam {daysLeft} dias</span>
              </div>
            </div>
          );
        }
      } catch { /* ... */ }
    }

    if (item.vacationDeadline) {
      try {
        const deadline = parseISO(item.vacationDeadline);
        const daysToDeadline = differenceInDays(deadline, today);
        
        if (daysToDeadline < 0) {
          return (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-slate-300 italic">Sem agendamento</span>
              <span className="text-[10px] font-black text-red-600 uppercase tracking-wider bg-red-50 px-3 py-1 rounded-full border border-red-100 w-fit">
                Prazo Expirado
              </span>
            </div>
          );
        }

        return (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-slate-300 italic leading-none">Sem agendamento</span>
            <span className={cn(
              "text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border w-fit leading-none",
              daysToDeadline < 90 ? "text-amber-600 bg-amber-50 border-amber-100/50" : "text-slate-400 bg-slate-50 border-slate-100"
            )}>
              {daysToDeadline} dias p/ limite
            </span>
          </div>
        );
      } catch { /* ... */ }
    }

    return <span className="text-xs font-bold text-slate-200 italic">Nenhum agendamento</span>;
  };

  return (
    <div className="bg-white/40 backdrop-blur-md rounded-[48px] border border-slate-200/50 shadow-[0_24px_80px_rgba(15,23,42,0.08)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/40 border-b border-slate-100/50">
              <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Matriz Colaborador</th>
              <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Última Folga</th>
              <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Status de Risco</th>
              <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Prazo Férias</th>
              <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Férias Agendadas</th>
              <th className="px-8 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/50">
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-24 text-center">
                   <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                         <UserCheck className="w-8 h-8 text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-bold text-base italic">Nenhum risco detectado nos filtros atuais.</p>
                   </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={`${item.chapa}-${index}`} className="group hover:bg-white transition-all duration-300 hover:shadow-[0_0_40px_rgba(59,130,246,0.06)]">
                  <td className="px-8 py-7">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3">
                         {item.category === 'VENCIDA' && <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />}
                         <span className="text-[17px] font-black text-slate-900 leading-none tracking-tight group-hover:text-blue-600 transition-colors">
                           {item.name}
                         </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100/50 tracking-widest">
                           {item.chapa}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 truncate max-w-[180px]">
                          {item.role}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-7 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-sm font-black text-slate-800 tracking-tight">
                        {formatDate(item.lastTimeOff)}
                      </span>
                      {getEligibilityStatus(item.lastTimeOff, item.timeOffRule)}
                    </div>
                  </td>
                  <td className="px-8 py-7 text-center">
                    <div className="flex flex-col items-center gap-2">
                       <span className="text-sm font-black text-slate-900 tracking-tight">
                         {formatDate(item.predictedTimeOff)}
                       </span>
                       {getPredictedStatus(item.predictedTimeOff, item.category)}
                    </div>
                  </td>
                  <td className="px-8 py-7 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className={cn(
                        "text-sm font-black tracking-tight",
                        item.vacationDeadline && isBefore(parseISO(item.vacationDeadline), startOfDay(new Date())) ? "text-red-700 font-black" : "text-slate-800"
                      )}>
                        {formatDate(item.vacationDeadline)}
                      </span>
                      {getDeadlineBadge(item.vacationDeadline)}
                    </div>
                  </td>
                  <td className="px-8 py-7">
                    {getVacationStatus(item)}
                  </td>
                  <td className="px-8 py-7 text-right">
                    <div className="flex flex-col items-end">
                      <span className={cn(
                        "text-2xl font-black tracking-tighter leading-none mb-1",
                        item.vacationBalance >= 30 ? "text-red-700 drop-shadow-sm" : "text-slate-900"
                      )}>
                        {item.vacationBalance}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Dias Saldo</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
