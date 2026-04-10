/// <reference types="vite/client" />

/**
 * Declarações de tipo para variáveis de ambiente VITE_*.
 * Garante tipagem segura ao usar import.meta.env no projeto.
 */
interface ImportMetaEnv {
  // RM TOTVS
  readonly VITE_RM_API_URL: string;
  readonly VITE_RM_API_TOKEN: string;
  readonly VITE_RM_API_TIMEOUT_MS: string;

  // Firebase
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_DATABASE_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
