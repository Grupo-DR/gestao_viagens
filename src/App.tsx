// ============================================================
// APP — Ponto de entrada da aplicação
// Firebase Auth REMOVIDO desta fase. Identidade gerenciada pelo IdentityProvider.
// O portal abre diretamente sem tela de login.
// Para reativar Firebase Auth: trocar IdentityProvider pelo adapter Firebase.
// ============================================================

import { useState } from 'react';
import { IdentityProvider } from './application/identity/IdentityContext.tsx';
import { useIdentity } from './application/identity/IdentityContext.tsx';
import { Layout, AppTab } from './components/Layout.tsx';
import { TravelForm } from './components/TravelForm.tsx';
import { TravelList } from './components/TravelList.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import type { TravelRequest } from './domain/types.ts';

// ──────────────────────────────────────────────
// Sub-componente interno: conteúdo com acesso ao contexto
// (IdentityProvider precisa estar na árvore acima)
// ──────────────────────────────────────────────

function AppContent() {
  const { currentUser } = useIdentity();
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
