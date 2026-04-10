import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../infrastructure/firebase/firebase';
import { UserRole } from '../../domain/enums';
import type { UserProfile } from '../../domain/types';
import type { IdentityProvider } from './types';

/**
 * Provedor de Identidade via Firebase.
 * Conecta o estado de autenticação do Firebase com o modelo de domínio do portal.
 */
export class FirebaseIdentityProvider implements IdentityProvider {
  private currentProfile: UserProfile | null = null;
  private authListener: ((user: UserProfile | null) => void) | null = null;

  constructor() {
    // Escuta mudanças de estado do Firebase Auth
    onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        this.currentProfile = null;
        this.emitChange();
        return;
      }

      // Ao logar, busca o perfil detalhado no Firestore
      const profile = await this.fetchUserProfile(fbUser);
      this.currentProfile = profile;
      this.emitChange();
    });
  }

  getProfile(): UserProfile {
    // Nota: Como o Firebase é assíncrono, o IdentityContext deve 
    // lidar com o estado nulo inicial enquanto carrega.
    return this.currentProfile || {
      uid: '',
      email: '',
      name: 'Carregando...',
      role: UserRole.ADMINISTRATIVO // Mock temporário — será sobrescrito pelo fetch
    };
  }

  // Na versão real, a troca de papel seria um update no Firestore seguido de refresh.
  // Por enquanto, mantemos o contrato da interface.
  switchRole(role: UserRole): UserProfile {
    if (this.currentProfile) {
      this.currentProfile = { ...this.currentProfile, role };
      this.emitChange();
      return this.currentProfile;
    }
    throw new Error('Usuário não autenticado');
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  onAuthStateChanged(callback: (user: UserProfile | null) => void): void {
    this.authListener = callback;
    // Emite o estado atual imediatamente caso já tenha carregado
    callback(this.currentProfile);
  }

  private emitChange() {
    if (this.authListener) {
      this.authListener(this.currentProfile);
    }
  }

  /**
   * Busca o perfil do usuário no Firestore (coleção 'users').
   * Se não existir, cria um perfil básico com papel de Gestor por padrão (safe).
   */
  private async fetchUserProfile(fbUser: FirebaseUser): Promise<UserProfile> {
    try {
      const userRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          uid: fbUser.uid,
          email: fbUser.email || '',
          name: data.name || fbUser.displayName || 'Usuário',
          role: (data.role as UserRole) || UserRole.PENDENTE,
          allowedCostCenters: Array.isArray(data.allowedCostCenters) ? data.allowedCostCenters : [],
        };
      }

      // Sem perfil: auto-registra como PENDENTE e aguarda aprovação do MASTER
      const pendingProfile: UserProfile = {
        uid: fbUser.uid,
        email: fbUser.email || '',
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Novo Usuário',
        role: UserRole.PENDENTE,
        allowedCostCenters: [],
      };

      // Persiste no Firestore para aparecer na fila do painel MASTER
      await setDoc(userRef, {
        name: pendingProfile.name,
        email: pendingProfile.email,
        role: UserRole.PENDENTE,
        allowedCostCenters: [],
        createdAt: new Date().toISOString(),
      });

      return pendingProfile;
    } catch (error) {
      console.error('[Identity] Erro ao buscar/criar perfil no Firestore:', error);
      return {
        uid: fbUser.uid,
        email: fbUser.email || '',
        name: 'Erro ao carregar perfil',
        role: UserRole.PENDENTE,
        allowedCostCenters: [],
      };
    }
  }

  /**
   * Facade para login com e-mail e senha
   */
  async login(email: string, pass: string) {
    return signInWithEmailAndPassword(auth, email, pass);
  }
}

export const firebaseIdentityProvider = new FirebaseIdentityProvider();
