import React from 'react';
import { 
  Inbox, ShieldCheck, Clock, AlertCircle, 
  AlertTriangle, Users, ShoppingCart, Send 
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface KpiProps {
  label: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  loading?: boolean;
}

const KpiCard: React.FC<KpiProps> = ({ label, value, icon: Icon, colorClass, bgClass, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm animate-pulse space-y-3">
        <div className="w-10 h-10 bg-slate-100 rounded-2xl" />
        <div className="space-y-2">
          <div className="h-2 w-16 bg-slate-100 rounded" />
          <div className="h-6 w-12 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4 group hover:border-indigo-100 transition-all">
      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm", bgClass)}>
        <Icon className={cn("w-5 h-5", colorClass)} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className={cn("text-2xl font-black leading-none mt-1.5", colorClass)}>{value}</p>
      </div>
    </div>
  );
};

interface Props {
  data: {
    openRequests: number;
    withinSla: number;
    dueToday: number;
    overdue: number;
    urgent: number;
    waitingCH: number;
    waitingPurchase: number;
    inPurchase: number;
  };
  loading?: boolean;
}

export const OperationalKpiCards: React.FC<Props> = ({ data, loading }) => {
  const cards = [
    { label: 'Em Aberto', value: data.openRequests, icon: Inbox, color: 'text-slate-600', bg: 'bg-slate-50' },
    { label: 'Dentro do SLA', value: data.withinSla, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Vence Hoje', value: data.dueToday, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Fora do SLA', value: data.overdue, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Urgentes', value: data.urgent, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Aguardando CH', value: data.waitingCH, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pronta Compra', value: data.waitingPurchase, icon: ShoppingCart, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Em Emissão', value: data.inPurchase, icon: Send, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      {cards.map((card, i) => (
        <KpiCard key={i} {...card} loading={loading} />
      ))}
    </div>
  );
};
