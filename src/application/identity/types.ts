import { UserRole } from '../../domain/enums';
import type { UserProfile } from '../../domain/types';

export interface IdentityProvider {
  getProfile(): UserProfile;
  switchRole(role: UserRole): UserProfile;
  logout(): void;
  // Preparado para chamadas assíncronas futuras
  onAuthStateChanged?(callback: (user: UserProfile | null) => void): void;
}
