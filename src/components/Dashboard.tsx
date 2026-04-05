// ============================================================
// PRESENTATION — Dashboard
// Usa useTravelRequests hook (sem acesso direto ao Firestore).
// Sem uso de 'any' — tipos explícitos para todos os dados dos gráficos.
// ============================================================

import React from 'react';
import { useTravelRequests } from '../application/hooks/useTravelRequests';
import { RequestStatus } from '../domain/enums';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, Users, Clock, Plane, Loader2, AlertCircle, ShieldCheck, ShieldAlert, XCircle } from 'lucide-react';
import { PolicyResult } from '../domain/policy/enums';
import { cn } from '../lib/utils';

// ──────────────────────────────────────────────
// Tipos para dados de gráfico
// ──────────────────────────────────────────────

interface ChartDataPoint {
  name: string;
  value: number;
}

const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1',
];

// ──────────────────────────────────────────────
// Funções puras de agregação (sem 'any')
// ──────────────────────────────────────────────

function groupByField(items: { value: string }[]): ChartDataPoint[] {
  const map = new Map<string, number>();
  for (const item of items) {
    map.set(item.value, (map.get(item.value) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

// ──────────────────────────────────────────────
// Componente
// ──────────────────────────────────────────────

export function Dashboard() {
  const { requests, loading, error, isDemoMode } = useTravelRequests({ view: 'all' });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium italic">Sincronizando governança de viagens...</p>
      </div>
    );
  }

  // No modo demo, ignoramos o erro de permissão para renderizar a UI
  if (error && !isDemoMode) {
    return (
      <div className="p-8 bg-red-50 border border-red-100 rounded-2xl text-red-700 flex items-center gap-3">
        <ShieldAlert className="w-6 h-6" />
        <div>
          <h3 className="font-bold">Erro de Conexão</h3>
          <p className="text-sm opacity-90">{error}</p>
        </div>
      </div>
    );
  }

  // Agrega dados para gráficos usando funções puras
  const reasonData: ChartDataPoint[] = groupByField(
    requests.map((r) => ({ value: r.travel.reason }))
  );

  const statusData: ChartDataPoint[] = groupByField(
    requests.map((r) => ({ value: r.status }))
  );

  // Estatísticas rápidas
  // Novas métricas de política
  const autoApproved = requests.filter(r => r.validation.policyDecision?.result === PolicyResult.APPROVED).length;
  const manualValidation = requests.filter(r => r.validation.policyDecision?.result === PolicyResult.MANUAL_VALIDATION).length;
  const blockedByPolicy = requests.filter(r => r.validation.policyDecision?.result === PolicyResult.REJECTED).length;
  const totalPolicyAlerts = requests.filter(r => (r.validation.policyDecision?.warnings.length || 0) > 0).length;

  const stats = [
    {
      label: 'Total de Pedidos',
      value: requests.length,
      icon: Plane,
      color: 'bg-blue-500',
    },
    {
      label: 'Pendentes CH',
      value: requests.filter((r) => r.status === RequestStatus.EM_VALIDACAO_CH).length,
      icon: Clock,
      color: 'bg-amber-500',
    },
    {
      label: 'Prontas para Compra',
      value: requests.filter((r) => r.status === RequestStatus.DISPONIVEL_PARA_COMPRA).length,
      icon: ShieldCheck,
      color: 'bg-emerald-500',
    },
    {
      label: 'Emitidas',
      value: requests.filter((r) => r.status === RequestStatus.EMITIDA).length,
      icon: TrendingUp,
      color: 'bg-indigo-500',
    },
    {
      label: 'Reprovadas',
      value: requests.filter((r) => r.status === RequestStatus.REPROVADA).length,
      icon: XCircle,
      color: 'bg-red-500',
    }
  ];

  const policyStats = [
    { label: 'Aprovados Auto', value: autoApproved, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Análise Manual', value: manualValidation, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Bloqueios Política', value: blockedByPolicy, icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Alertas Ativos', value: totalPolicyAlerts, icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Gerencial</h1>
        <p className="text-slate-500 text-sm">Indicadores e métricas do processo de viagens.</p>
      </div>

      {/* Cards de estatísticas operacionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center gap-3 hover:shadow-md transition-shadow">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg', stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900 leading-none mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Cards de conformidade de política */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {policyStats.map((stat) => (
          <div key={stat.label} className={cn("p-5 rounded-2xl border border-black/5 flex items-center gap-4", stat.bg)}>
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stat.color, "bg-white shadow-sm")}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{stat.label}</p>
              <p className={cn("text-xl font-bold leading-none mt-0.5", stat.color)}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Volume por Motivo */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Volume por Motivo</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reasonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribuição por Status */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Distribuição por Status</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legenda manual */}
          <div className="flex flex-wrap gap-3 mt-4">
            {statusData.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="text-[11px] text-slate-500">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
