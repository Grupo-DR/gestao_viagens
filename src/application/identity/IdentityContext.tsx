// ============================================================
// APPLICATION — Identity — React Context
// Fornece o usuário corrente e ações de identidade para toda a árvore.
// Desacoplado do provider concreto (local vs Firebase).
// ============================================================

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { UserRole } from '../../domain/enums';
import type { UserProfile } from '../../domain/types';
import type { IdentityProvider } from './types';
import { localIdentityProvider } from './localIdentityProvider';

// Em uma fase futura, isso viria de uma configuração/env
const activeProvider: IdentityProvider = localIdentityProvider;

// ──────────────────────────────────────────────
// Contrato do context
// ──────────────────────────────────────────────

interface IdentityContextValue {
  currentUser: UserProfile;
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
  // Estado inicializado a partir do provider ativo
  const [currentUser, setCurrentUser] = useState<UserProfile>(
    () => activeProvider.getProfile()
  );

  const switchRole = useCallback((role: UserRole) => {
    const updated = activeProvider.switchRole(role);
    setCurrentUser(updated);
  }, []);

  const logout = useCallback(() => {
    activeProvider.logout();
    // Na fase provisória simplesmente recarrega — Firebase Auth faria o redirect
    window.location.reload();
  }, []);

  const value: IdentityContextValue = useMemo(() => ({
    currentUser,
    switchRole,
    logout,
  }), [currentUser, switchRole, logout]);

  return (
    <IdentityContext.Provider value={value}>
      {children}
    </IdentityContext.Provider>
  );
}
