// ============================================================
// PRESENTATION — Layout
// Lê identidade do IdentityContext (não via props).
// switchRole usa o provider local — sem chamada Firestore.
// ============================================================

import React from 'react';
import { UserRole } from '../domain/enums';
import { useIdentity } from '../application/identity/IdentityContext.tsx';
import { Plane, ShieldCheck, ShoppingCart, BarChart3, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { cn } from '../lib/utils.ts';

// ──────────────────────────────────────────────
// Configuração do menu (roles que têm acesso a cada aba)
// ──────────────────────────────────────────────

const MENU_ITEMS = [
  {
    id: 'requests' as const,
    label: 'Solicitações',
    icon: Plane,
    roles: [UserRole.ADMINISTRATIVO, UserRole.CAPITAL_HUMANO, UserRole.COMPRADOR, UserRole.GESTOR],
  },
  {
    id: 'validation' as const,
    label: 'Validação CH',
    icon: ShieldCheck,
    roles: [UserRole.CAPITAL_HUMANO, UserRole.GESTOR],
  },
  {
    id: 'purchase' as const,
    label: 'Compras',
    icon: ShoppingCart,
    roles: [UserRole.COMPRADOR, UserRole.GESTOR],
  },
  {
    id: 'dashboard' as const,
    label: 'Dashboard',
    icon: BarChart3,
    roles: [UserRole.GESTOR],
  },
] as const;

export type AppTab = (typeof MENU_ITEMS)[number]['id'];

// ──────────────────────────────────────────────
// Rótulos legíveis dos papéis para exibição
// ──────────────────────────────────────────────

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMINISTRATIVO]: 'Adm',
  [UserRole.CAPITAL_HUMANO]: 'CH',
  [UserRole.COMPRADOR]: 'Comp.',
  [UserRole.GESTOR]: 'Gestor',
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
  const { currentUser, switchRole, logout } = useIdentity();

  // Filtra o menu de acordo com o papel atual
  const filteredMenu = MENU_ITEMS.filter((item) =>
    (item.roles as readonly UserRole[]).includes(currentUser.role)
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* ─── Sidebar ─── */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 z-10">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
            <Plane className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-slate-900 tracking-tight">TravelHub</span>
        </div>

        {/* Navegação */}
        <nav className="flex-1 p-4 space-y-1">
          {filteredMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group',
                activeTab === item.id
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <item.icon
                className={cn(
                  'w-5 h-5',
                  activeTab === item.id
                    ? 'text-blue-600'
                    : 'text-slate-400 group-hover:text-slate-600'
                )}
              />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Rodapé: perfil + troca de papel */}
        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-4 mb-4">
            {/* Info do usuário */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200">
                <UserIcon className="w-4 h-4 text-slate-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {currentUser.name || 'Usuário'}
                </p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {currentUser.role.replace('_', ' ')}
                </p>
              </div>
            </div>

            {/* Alternador de papel — modo provisório */}
            <div className="pt-3 border-t border-slate-200">
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                <Settings className="w-2.5 h-2.5" /> Alternar Perfil (Demo)
              </p>
              <div className="grid grid-cols-2 gap-1">
                {(Object.values(UserRole) as UserRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => switchRole(role)}
                    className={cn(
                      'text-[9px] py-1 px-2 rounded-md border transition-all',
                      currentUser.role === role
                        ? 'bg-blue-600 border-blue-600 text-white font-bold'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'
                    )}
                  >
                    {ROLE_LABELS[role]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Botão sair */}
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
