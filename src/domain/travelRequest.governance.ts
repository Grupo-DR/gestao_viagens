import { UserRole } from './enums';
import { TravelRequest, UserProfile } from './types';

/**
 * Remove caracteres especiais de Centros de Custo para permitir comparação flexível.
 * Ex: "3044.03" -> "304403"
 */
export function sanitizeCC(cc: string | undefined): string {
  if (!cc) return '';
  // Extrai apenas os números do início da string (ex: "3044.01 - Obra A" -> "304401")
  const match = cc.match(/^[\d.]+/);
  const code = match ? match[0] : cc;
  return code.replace(/[^0-9]/g, '');
}

/**
 * Verifica se um usuário pode visualizar uma solicitação específica.
 */
export function canViewTravelRequest(request: TravelRequest, user: UserProfile): boolean {
  // MASTER, CH e COMPRADOR têm visão total
  if (
    user.role === UserRole.MASTER ||
    user.role === UserRole.CAPITAL_HUMANO ||
    user.role === UserRole.COMPRADOR
  ) {
    return true;
  }

  // O solicitante sempre vê suas próprias solicitações
  if (request.requester.requesterId === user.uid) {
    return true;
  }

  // Verificação por Centro de Custo permitido
  if (user.allowedCostCenters && user.allowedCostCenters.length > 0) {
    const allowed = user.allowedCostCenters.map(sanitizeCC);
    const requestCC = sanitizeCC(request.travel.costCenter);
    
    if (allowed.includes(requestCC)) {
      return true;
    }

    // Para passageiros externos, verificar também o sponsorCostCenter se aplicável
    if (request.employee.passengerType === 'external' && request.employee.sponsorCostCenter) {
      if (allowed.includes(sanitizeCC(request.employee.sponsorCostCenter))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Filtra uma lista de solicitações com base nas regras de governança do usuário.
 */
export function filterRequestsByGovernance(requests: TravelRequest[], user: UserProfile): TravelRequest[] {
  return requests.filter(r => canViewTravelRequest(r, user));
}
