// ============================================================
// PRESENTATION — Layout
// Sidebar com RBAC completo: MASTER vê tudo + Gestão de Usuários.
// Outros papéis veem apenas as abas autorizadas.
// ============================================================

import React from 'react';
import { UserRole } from '../domain/enums';
import { useIdentity } from '../application/identity/IdentityContext';
import { Plane, ShieldCheck, ShoppingCart, BarChart3, LogOut, User as UserIcon, Users, Shield } from 'lucide-react';
import { cn } from '../lib/utils';

// ──────────────────────────────────────────────
// Configuração do menu
// ──────────────────────────────────────────────

const MENU_ITEMS = [
  {
    id: 'requests' as const,
    label: 'Solicitações',
    icon: Plane,
    roles: [UserRole.MASTER, UserRole.ADMINISTRATIVO, UserRole.CAPITAL_HUMANO, UserRole.COMPRADOR, UserRole.GESTOR],
  },
  {
    id: 'validation' as const,
    label: 'Validação CH',
    icon: ShieldCheck,
    roles: [UserRole.MASTER, UserRole.CAPITAL_HUMANO, UserRole.COMPRADOR],
  },
  {
    id: 'purchase' as const,
    label: 'Compras',
    icon: ShoppingCart,
    roles: [UserRole.MASTER, UserRole.COMPRADOR],
  },
  {
    id: 'dashboard' as const,
    label: 'Dashboard',
    icon: BarChart3,
    roles: [UserRole.MASTER, UserRole.ADMINISTRATIVO, UserRole.CAPITAL_HUMANO, UserRole.COMPRADOR, UserRole.GESTOR],
  },
  {
    id: 'raiox' as const,
    label: 'Gestão de Riscos',
    icon: Users,
    roles: [UserRole.MASTER, UserRole.ADMINISTRATIVO, UserRole.CAPITAL_HUMANO, UserRole.GESTOR],
  },
  {
    id: 'usuarios' as const,
    label: 'Gestão de Usuários',
    icon: Shield,
    roles: [UserRole.MASTER], // Exclusivo MASTER
  },
] as const;

export type AppTab = (typeof MENU_ITEMS)[number]['id'];

// ──────────────────────────────────────────────
// Rótulos de papéis
// ──────────────────────────────────────────────

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.MASTER]:         'Master',
  [UserRole.ADMINISTRATIVO]: 'Adm',
  [UserRole.CAPITAL_HUMANO]: 'CH',
  [UserRole.COMPRADOR]:      'Comp.',
  [UserRole.GESTOR]:         'Gestor',
  [UserRole.PENDENTE]:       'Pendente',
};

const ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.MASTER]:         'bg-purple-100 text-purple-700',
  [UserRole.ADMINISTRATIVO]: 'bg-blue-100 text-blue-700',
  [UserRole.CAPITAL_HUMANO]: 'bg-emerald-100 text-emerald-700',
  [UserRole.COMPRADOR]:      'bg-amber-100 text-amber-700',
  [UserRole.GESTOR]:         'bg-slate-100 text-slate-600',
  [UserRole.PENDENTE]:       'bg-orange-100 text-orange-700',
};

// ──────────────────────────────────────────────
// Props e componente
// ──────────────────────────────────────────────

interface LayoutProps {
  children: React.ReactNode;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

export function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const { currentUser, logout } = useIdentity();

  if (!currentUser) return null;

  const filteredMenu = MENU_ITEMS.filter((item) =>
    (item.roles as readonly UserRole[]).includes(currentUser.role)
  );

  const isMaster = currentUser.role === UserRole.MASTER;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* ─── Sidebar ─── */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 z-10">
        {/* Logo */}
        <div className="p-8 flex flex-col items-center border-b border-slate-100 bg-white">
          <div className="mb-4">
            <img
              src="/logo.png"
              alt="Logo"
              className="h-12 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/3125/3125713.png';
              }}
            />
          </div>
          <div className="text-center">
            <span className="block font-black text-slate-900 tracking-tighter text-xl leading-none">DR TravelHub</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">Gestão com agilidade e eficiência.</span>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredMenu.map((item) => {
            const isMasterTab = item.id === 'usuarios';
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group',
                  activeTab === item.id
                    ? isMasterTab
                      ? 'bg-purple-50 text-purple-700 shadow-sm'
                      : 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <item.icon
                  className={cn(
                    'w-5 h-5',
                    activeTab === item.id
                      ? isMasterTab ? 'text-purple-600' : 'text-blue-600'
                      : 'text-slate-400 group-hover:text-slate-600'
                  )}
                />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Rodapé: perfil */}
        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 font-black text-slate-700 text-sm">
                {(currentUser.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {currentUser.name || 'Usuário'}
                </p>
                <span className={cn(
                  'inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-0.5',
                  ROLE_COLORS[currentUser.role]
                )}>
                  {ROLE_LABELS[currentUser.role]}
                </span>
              </div>
            </div>


          </div>

          {/* Botão Sair */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* ─── Conteúdo principal ─── */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
