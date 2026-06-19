// ============================================================
// APP — Ponto de entrada da aplicação
// Firebase Auth REMOVIDO desta fase. Identidade gerenciada pelo IdentityProvider.
// O portal abre diretamente sem tela de login.
// Para reativar Firebase Auth: trocar IdentityProvider pelo adapter Firebase.
// ============================================================

import { useState } from 'react';
import { IdentityProvider, useIdentity } from './application/identity/IdentityContext';
import { Layout, AppTab } from './components/Layout';
import { LoginPage } from './components/auth/LoginPage';
import { TravelForm } from './components/TravelForm';
import { TravelList } from './components/TravelList';
import { UnifiedDashboard as Dashboard } from './components/UnifiedDashboard';
import { UserManagementPanel } from './components/admin/UserManagementPanel';
import { EmployeeRayXPanel } from './components/employees/EmployeeRayXPanel';
import { BudgetView } from './components/finance/BudgetView';
import { AuditList } from './components/travel/AuditList'; // Aba de auditoria de prazos e conformidade
import type { TravelRequest } from './domain/types';
import { UserRole } from './domain/enums';

// ──────────────────────────────────────────────
// Sub-componente interno: conteúdo com acesso ao contexto
// (IdentityProvider precisa estar na árvore acima)
// ──────────────────────────────────────────────

function AppContent() {
  const { currentUser, isLoading } = useIdentity();
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
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (!currentUser) {
      return <LoginPage />;
    }

    // Formulário sobrepõe qualquer aba quando aberto
    if (showForm) {
      return (
        <TravelForm
          onClose={handleCloseForm}
          editingRequest={editingRequest}
        />
      );
    }

    switch (activeTab) {
      case 'requests':
        return (
          <TravelList
            view={
              currentUser?.role === UserRole.MASTER || 
              currentUser?.role === UserRole.GESTOR ||
              currentUser?.role === UserRole.ADMINISTRATIVO ||
              currentUser?.role === UserRole.CAPITAL_HUMANO ||
              currentUser?.role === UserRole.COMPRADOR
                ? 'all' 
                : 'requester'
            }
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
      case 'usuarios':
        return <UserManagementPanel />;
      case 'raiox':
        return <EmployeeRayXPanel />;
      case 'orcamento':
        return <BudgetView />;
      case 'audit':
        return <AuditList />;
      default:
        return null;
    }
  };

  if (isLoading || !currentUser) {
    return renderContent();
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

// ──────────────────────────────────────────────
// Componente raiz — wraps com o provider de identidade
// ──────────────────────────────────────────────

export default function App() {
  return (
    <IdentityProvider>
      <AppContent />
    </IdentityProvider>
  );
}
