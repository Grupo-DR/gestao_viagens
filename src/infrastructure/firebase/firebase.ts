// ============================================================
// INFRASTRUCTURE — Firebase
// Firebase Auth restaurado para produção
// ============================================================

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
// Configuração via Variáveis de Ambiente (Vite)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const databaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DB_ID || '(default)';

// Evita inicialização dupla (hot reload do Vite)
const app = getApps().length > 0
  ? getApps()[0]
  : initializeApp(firebaseConfig);

// Firestore — banco de dados principal
export const db = getFirestore(app, databaseId);

// Auth — serviço de identidade nativa (Produção)
export const auth = getAuth(app);

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
