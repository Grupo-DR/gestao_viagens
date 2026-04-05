// ============================================================
// COMPATIBILIDADE — src/types.ts
// Re-exporta os tipos do domínio para manter compatibilidade
// com qualquer import que ainda reference este arquivo.
// Novos arquivos devem importar diretamente de 'src/domain/types' e 'src/domain/enums'.
// ============================================================

export type { UserProfile, TravelRequest, LegacyTravelRequest, HistoryEntry } from './domain/types';
export { UserRole, RequestStatus as TravelStatus, TravelReason } from './domain/enums';

// Aliases para compatibilidade retroativa
export type { PurchaseInfo as PurchaseDetails } from './domain/types';
