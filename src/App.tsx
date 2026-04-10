// ============================================================
// APP — Ponto de entrada da aplicação
// Autenticação Real via Firebase Auth habilitada.
// ============================================================

import React, { useState } from 'react';
import { IdentityProvider, useIdentity } from './application/identity/IdentityContext.tsx';
import { Layout, AppTab } from './components/Layout.tsx';
import { TravelForm } from './components/TravelForm.tsx';
import { TravelList } from './components/TravelList.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { EmployeeRayXPanel } from './components/employees/EmployeeRayXPanel';
import { LoginPage } from './components/auth/LoginPage';
import { PendingAccessScreen } from './components/auth/PendingAccessScreen';
import { UserManagementPanel } from './components/admin/UserManagementPanel';
import { Loader2, ShieldCheck } from 'lucide-react';
import type { TravelRequest } from './domain/types.ts';
import { UserRole } from './domain/enums.ts';

/**
 * Gatekeeper: Gerencia o estado de carregamento e a tela de login.
 * Protege todo o conteúdo da aplicação.
 */
function Gatekeeper({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useIdentity();

  // Splash Screen durante a verificação do Firebase Auth
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-8 animate-in fade-in duration-700">
         <div className="relative">
            <div className="w-20 h-20 bg-blue-600 rounded-[32px] flex items-center justify-center shadow-2xl shadow-blue-500/20 relative z-10">
               <ShieldCheck className="text-white w-10 h-10" />
            </div>
            <div className="absolute inset-0 bg-blue-600/20 blur-3xl rounded-full scale-150 animate-pulse" />
         </div>
         <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Verificando Identidade...</p>
         </div>
      </div>
    );
  }

  // Se não estiver logado, exibe tela de login profissional
  if (!currentUser) {
    return <LoginPage />;
  }

  // Usuário logado mas aguardando ativação pelo MASTER
  if (currentUser.role === UserRole.PENDENTE) {
    return <PendingAccessScreen />;
  }

  return <>{children}</>;
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<AppTab>('requests');
  const [editingRequest, setEditingRequest] = useState<TravelRequest | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRequest(null);
  };

  const handleEdit = (req: TravelRequest) => {
    setEditingRequest(req);
    setShowForm(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'requests':
        if (showForm) {
          return (
            <TravelForm
              onClose={handleCloseForm}
              editingRequest={editingRequest}
            />
          );
        }
        return (
          <TravelList
            view="requester"
            onEdit={handleEdit}
            onCreate={() => setShowForm(true)}
          />
        );
      case 'validation':
        return <TravelList view="hr" />;
      case 'purchase':
        return <TravelList view="buyer" />;
      case 'dashboard':
        return <Dashboard />;
      case 'raiox':
        return <EmployeeRayXPanel />;
      case 'usuarios':
        return <UserManagementPanel />;
      default:
        return null;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default function App() {
  return (
    <IdentityProvider>
      <Gatekeeper>
        <AppContent />
      </Gatekeeper>
    </IdentityProvider>
  );
}
