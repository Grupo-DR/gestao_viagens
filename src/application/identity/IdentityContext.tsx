// ============================================================
// APPLICATION — Identity — React Context
// Fornece o usuário corrente e ações de identidade para toda a árvore.
// Desacoplado do provider concreto (local vs Firebase).
// ============================================================

import React, { createContext, useContext, useState, useCallback } from 'react';
import { UserRole } from '../../domain/enums';
import type { UserProfile } from '../../domain/types';
import { firebaseIdentityProvider } from './firebaseIdentityProvider';

// ──────────────────────────────────────────────
// Contrato do context
// ──────────────────────────────────────────────

interface IdentityContextValue {
  currentUser: UserProfile | null;
  isLoading: boolean;
  /** Troca o papel do usuário sem reiniciar a aplicação */
  switchRole: (role: UserRole) => void;
  /** Encerra a sessão provisória */
  logout: () => void;
}

// ──────────────────────────────────────────────
// Context e hook de acesso
// ──────────────────────────────────────────────

const IdentityContext = createContext<IdentityContextValue | null>(null);

/**
 * Hook de acesso ao contexto de identidade.
 * Lança erro descritivo se usado fora do provider.
 */
export function useIdentity(): IdentityContextValue {
  const ctx = useContext(IdentityContext);
  if (!ctx) {
    throw new Error('useIdentity deve ser usado dentro de <IdentityProvider>');
  }
  return ctx;
}

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

interface IdentityProviderProps {
  children: React.ReactNode;
}

export function IdentityProvider({ children }: IdentityProviderProps) {
  // Estado inicializado via observer do Firebase
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    firebaseIdentityProvider.onAuthStateChanged((profile) => {
      setCurrentUser(profile);
      setIsLoading(false);
    });
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    try {
      const updated = firebaseIdentityProvider.switchRole(role);
      setCurrentUser(updated);
    } catch (e) {
      console.warn('Switch role temporariamente indisponível no perfil remoto');
    }
  }, []);

  const logout = useCallback(() => {
    firebaseIdentityProvider.logout();
    window.location.reload();
  }, []);

  const value: IdentityContextValue = {
    currentUser,
    isLoading,
    switchRole,
    logout,
  };

  return (
    <IdentityContext.Provider value={value}>
      {children}
    </IdentityContext.Provider>
  );
}
