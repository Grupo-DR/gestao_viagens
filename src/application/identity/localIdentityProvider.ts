// ============================================================
// APPLICATION — Identity — Local Identity Provider (Provisório)
// Adapter que simula sessão de usuário sem Firebase Auth.
// Interface desenhada para ser trocada pelo Firebase Auth adapter
// no futuro sem alterar o IdentityContext ou componentes.
// ============================================================

import { UserRole } from '../../domain/enums';
import type { UserProfile } from '../../domain/types';
import type { IdentityProvider } from './types';

// Chave de persistência no localStorage
const STORAGE_KEY = 'gestao_viagens:identity';

// Usuário padrão ao abrir o portal pela primeira vez
const DEFAULT_PROFILE: UserProfile = {
  uid: 'local-user-001',
  email: 'admin@drcontrutora.com.br',
  name: 'Usuário (Modo Provisório)',
  role: UserRole.ADMINISTRATIVO,
};

// ──────────────────────────────────────────────
// Implementação: localStorage
// ──────────────────────────────────────────────

function loadFromStorage(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    // Valida que o role ainda é um valor aceito pelo enum
    if (!parsed.role || !Object.values(UserRole).includes(parsed.role as UserRole)) {
      return DEFAULT_PROFILE;
    }
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    return DEFAULT_PROFILE;
  }
}

function saveToStorage(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // localStorage pode estar bloqueado em alguns contextos — falha silenciosa
  }
}

/**
 * Cria o provider de identidade local (provisório).
 * Persiste papel e dados no localStorage.
 * Retorna um objeto com a interface IdentityProvider.
 */
export function createLocalIdentityProvider(): IdentityProvider {
  let current = loadFromStorage();

  return {
    getProfile(): UserProfile {
      return current;
    },

    switchRole(role: UserRole): UserProfile {
      current = { ...current, role };
      saveToStorage(current);
      return current;
    },

    logout(): void {
      localStorage.removeItem(STORAGE_KEY);
      current = DEFAULT_PROFILE;
    },
  };
}

// Singleton provisório — substituir por injeção de dependência quando
// Firebase Auth for reativado
export const localIdentityProvider = createLocalIdentityProvider();
