import { TravelRequest, TransportMode } from '../types';

/**
 * Classifica se uma solicitação é predominantemente aéreo ou terrestre.
 */
export function classifyLogisticsType(request: TravelRequest): 'aereo' | 'rodoviario' {
  // Prioridade 1: Segments v3
  const segments = request.travel.segments || [];
  if (segments.length > 0) {
    // Se houver qualquer trecho aéreo, classificamos como aéreo para fins financeiros (maior peso)
    const hasAir = segments.some(s => s.transportMode === 'aereo');
    return hasAir ? 'aereo' : 'rodoviario';
  }

  // Prioridade 2: Fallback para campo legado se existir (em alguns casos está no costCenter ou tags)
  // Mas no modelo v2, o segment é a fonte da verdade.
  return 'rodoviario'; // Default safe
}
