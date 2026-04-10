// ============================================================
// APPLICATION — Service — User Management Service
// Exclusivo para o papel MASTER.
// Operações CRUD sobre a coleção 'users' do Firestore.
// ============================================================

import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../infrastructure/firebase/firebase';
import { UserRole } from '../../domain/enums';
import type { UserProfile } from '../../domain/types';

const COLLECTION = 'users';

export interface ManagedUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  allowedCostCenters: string[];
  /** ISO string: data em que o perfil foi criado (preenchido pelo auto-registro) */
  createdAt?: string;
}

/**
 * Busca todos os usuários cadastrados no Firestore.
 * Uso exclusivo do painel MASTER.
 */
export async function listAllUsers(): Promise<ManagedUser[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('name'));
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        uid: d.id,
        name: data.name || 'Sem nome',
        email: data.email || '',
        role: (data.role as UserRole) || UserRole.PENDENTE,
        allowedCostCenters: Array.isArray(data.allowedCostCenters) ? data.allowedCostCenters : [],
        createdAt: data.createdAt as string | undefined,
      };
    });
  } catch (error) {
    console.error('[UserManagement] Erro ao listar usuários:', error);
    return [];
  }
}

/**
 * Atualiza o papel e os centros de custo de um usuário.
 */
export async function updateUserAccess(
  uid: string,
  role: UserRole,
  allowedCostCenters: string[]
): Promise<void> {
  const ref = doc(db, COLLECTION, uid);
  await updateDoc(ref, { role, allowedCostCenters });
}

/**
 * Cria ou sobrescreve um documento de usuário.
 * Usado para inicializar o perfil de novos usuários.
 */
export async function upsertUser(user: ManagedUser): Promise<void> {
  const ref = doc(db, COLLECTION, user.uid);
  await setDoc(ref, {
    name: user.name,
    email: user.email,
    role: user.role,
    allowedCostCenters: user.allowedCostCenters,
  }, { merge: true });
}
