import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { PieChart as PieIcon, BarChart3, TrendingUp } from 'lucide-react';
import { SpendingByReason, SpendingByCC, MonthlySpending } from '../../application/use-cases/buildFinancialDashboard';
import { formatBRL } from '../../domain/financial/financial.rules';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface FinancialChartsProps {
  byReason: SpendingByReason[];
  byCC: SpendingByCC[];
  evolution: MonthlySpending[];
}

export const FinancialCharts: React.FC<FinancialChartsProps> = ({ byReason, byCC, evolution }) => {
  const reasonData = useMemo(() => {
    const top5 = byReason.slice(0, 5);
    const others = byReason.slice(5);
    
    if (others.length === 0) return top5;

    const othersTotal = others.reduce((sum, r) => sum + r.totalRealized, 0);
    return [...top5, { reason: 'Outros', totalRealized: othersTotal }];
  }, [byReason]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Gasto por Motivo */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <PieIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Gasto por Motivo</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Top 5 + Outros</p>
          </div>
        </div>
        
        <div className="h-[300px] flex items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={reasonData}
                dataKey="totalRealized"
                nameKey="reason"
                cx="50%" cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
              >
                {reasonData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatBRL(value)}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="w-1/2 space-y-2">
            {reasonData.map((r, i) => (
              <div key={r.reason} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[10px] font-bold text-slate-600 truncate max-w-[100px]">{r.reason}</span>
                </div>
                <span className="text-[10px] font-black text-slate-900">{formatBRL(r.totalRealized)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Evolução Mensal */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Evolução Mensal</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Orçado vs Realizado</p>
          </div>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={evolution}>
              <defs>
                <linearGradient id="colorRealized" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                tickFormatter={(v) => `R$ ${v/1000}k`}
              />
              <Tooltip 
                formatter={(value: number) => formatBRL(value)}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Area 
                type="monotone" 
                dataKey="realized" 
                stroke="#6366f1" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRealized)" 
                name="Realizado"
              />
              <Area 
                type="monotone" 
                dataKey="budget" 
                stroke="#94a3b8" 
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="none" 
                name="Orçado"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gasto por Centro de Custo */}
      <div className="xl:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Consumo por Centro de Custo</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Realizado + Comprometido</p>
          </div>
        </div>

        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byCC} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="costCenter" 
                type="category" 
                width={100}
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 9, fontWeight: 800, fill: '#475569' }}
              />
              <Tooltip 
                formatter={(value: number) => formatBRL(value)}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="realized" fill="#6366f1" stackId="a" radius={[0, 0, 0, 0]} name="Realizado" />
              <Bar dataKey="committed" fill="#f59e0b" stackId="a" radius={[0, 4, 4, 0]} name="Comprometido" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
