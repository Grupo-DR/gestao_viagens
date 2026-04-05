/**
 * Utilitários de Tratamento de Erro (Sprint 3)
 * Resolve o problema de 'any' em catches e padroniza mensagens.
 */

/**
 * Converte um erro desconhecido (unknown) em uma mensagem de string amigável.
 */
export function getErrorMessage(error: unknown, fallback = 'Erro inesperado no servidor'): string {
  if (error instanceof Error) return error.message;
  
  if (typeof error === 'string') return error;
  
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as any).message);
  }

  return fallback;
}

/**
 * Type guard para verificar se um objeto é um erro estruturado.
 */
export function isAppError(error: unknown): error is { message: string; code?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  );
}
