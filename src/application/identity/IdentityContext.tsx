// ============================================================
// APPLICATION — Identity — React Context
// Fornece o usuário corrente e ações de identidade para toda a árvore.
// Migrado para Firebase Auth (Real).
// ============================================================

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { UserRole } from '../../domain/enums';
import type { UserProfile } from '../../domain/types';
import { firebaseIdentityProvider } from './firebaseIdentityProvider';

// ──────────────────────────────────────────────
// Contrato do context
// ──────────────────────────────────────────────

interface IdentityContextValue {
  currentUser: UserProfile | null;
  loading: boolean;
  /** Troca o papel do usuário (Modo Admin/Simulação) */
  switchRole: (role: UserRole) => void;
  /** Encerra a sessão real no Firebase */
  logout: () => Promise<void>;
}

// ──────────────────────────────────────────────
// Context e hook de acesso
// ──────────────────────────────────────────────

const IdentityContext = createContext<IdentityContextValue | null>(null);

export function useIdentity(): IdentityContextValue {
  const ctx = useContext(IdentityContext);
  if (!ctx) {
    throw new Error('useIdentity deve ser usado dentro de <IdentityProvider>');
  }
  return ctx;
}

// ──────────────────────────────────────────────
// Provider Real (Firebase)
// ──────────────────────────────────────────────

interface IdentityProviderProps {
  children: React.ReactNode;
}

export function IdentityProvider({ children }: IdentityProviderProps) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Inscreve no listener de autenticação real
    firebaseIdentityProvider.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    const updated = firebaseIdentityProvider.switchRole(role);
    setCurrentUser(updated);
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    await firebaseIdentityProvider.logout();
    setCurrentUser(null);
    setLoading(false);
  }, []);

  const value: IdentityContextValue = useMemo(() => ({
    currentUser,
    loading,
    switchRole,
    logout,
  }), [currentUser, loading, switchRole, logout]);

  return (
    <IdentityContext.Provider value={value}>
      {children}
    </IdentityContext.Provider>
  );
}
