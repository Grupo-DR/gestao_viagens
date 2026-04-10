// ============================================================
// INFRASTRUCTURE — Firebase
// Configuração lida 100% de variáveis de ambiente (.env).
// Não há mais credenciais fixas no código-fonte.
// ============================================================

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID as string,
};

const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID as string | undefined;

// Evita inicialização dupla (hot reload do Vite)
const app = getApps().length > 0
  ? getApps()[0]
  : initializeApp(firebaseConfig);

// Firestore — banco de dados principal
// Suporta database ID customizado via variável de ambiente
export const db = firestoreDatabaseId
  ? getFirestore(app, firestoreDatabaseId)
  : getFirestore(app);

// Auth — serviço de autenticação
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
