// ============================================================
// INFRASTRUCTURE — Firebase
// Movido de src/firebase.ts para src/infrastructure/firebase/firebase.ts.
// Firebase Auth REMOVIDO desta camada — gerenciado pelo IdentityProvider.
// Mantém apenas db (Firestore) e utilitários de erro.
// ============================================================

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';

// Evita inicialização dupla (hot reload do Vite)
const app = getApps().length > 0
  ? getApps()[0]
  : initializeApp(firebaseConfig);

// Firestore — banco de dados principal
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// ──────────────────────────────────────────────
// Tipos de operação (para logging estruturado)
// ──────────────────────────────────────────────

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

/**
 * Centraliza o tratamento de erros do Firestore com contexto estruturado.
 * Loga no console e relança como Error para os componentes tratarem.
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  console.error('[Firestore Error]', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
