import { TravelReason } from '../../domain/enums.ts';
import type { TravelRequestFormData } from '../../domain/types.ts';

/**
 * Adaptador de Datas para o Portal de Viagens.
 * Centraliza normalizações e resoluções de datas para evitar lógica duplicada na UI.
 */
export const dateService = {
  /**
   * Extrai apenas a data (YYYY-MM-DD) de uma string ISO ou datetime-local.
   * Ex: "2024-03-20T14:30" -> "2024-03-20"
   */
  formatToIsoDate(value?: string): string {
    if (!value) return '';
    // Suporta ambos os formatos: YYYY-MM-DDTHH:mm e YYYY-MM-DD
    return value.split('T')[0].split(' ')[0];
  },

  /**
   * Resolve as datas efetivas para avaliação de política.
   * Prioriza datas de afastamento (CH) se o motivo for crítico (Férias/Folga).
   */
  resolvePolicyDates(formData: TravelRequestFormData): { startDate: string; endDate: string } {
    const isHRReason = [
      TravelReason.FERIAS, 
      TravelReason.FOLGA, 
      TravelReason.FOLGA_FERIAS
    ].includes(formData.reason);

    if (isHRReason) {
      return {
        startDate: formData.leaveStartDate || '',
        endDate: formData.leaveEndDate || ''
      };
    }

    // Para outros motivos, extrai do itinerário
    const departureDate = this.formatToIsoDate(formData.departureDateTime);
    const returnDate = this.formatToIsoDate(formData.returnDateTime);

    return {
      startDate: departureDate,
      endDate: returnDate || departureDate // Fallback se não houver retorno
    };
  }
};
