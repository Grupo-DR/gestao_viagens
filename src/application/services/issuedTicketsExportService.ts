// ============================================================
// APPLICATION — Serviço de Exportação: Relatório de Passagens
// Gera um arquivo .xlsx com solicitações nos status:
//   Disponível para compra | Aguardando aprovação de compra
//   Emitida | Concluída
//
// Origem, destino, datas e rota são extraídos dos trechos
// (travel.segments), com fallback em travel.requestedSegments
// e, por último, nos campos diretos de travel.
//
// Não altera regras de negócio nem o modelo de dados.
// ============================================================

import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { RequestStatus, PurchaseStatus } from '../../domain/enums';
import type { TravelRequest, TravelSegment } from '../../domain/types';
import { getPassengerDisplayName } from '../../domain/travelRequest.rules';

// ──────────────────────────────────────────────
// Critérios de filtro
// ──────────────────────────────────────────────

/**
 * Status que devem aparecer no relatório.
 * Inclui tanto os valores de enum quanto os labels em português
 * para garantir compatibilidade com registros legados.
 */
const ALLOWED_STATUSES = new Set<string>([
  RequestStatus.DISPONIVEL_PARA_COMPRA,
  RequestStatus.AGUARDANDO_APROVACAO_COMPRA,
  RequestStatus.EMITIDA,
  RequestStatus.CONCLUIDA,
  // Labels em português (usados em documentos legados do Firestore)
  'Disponível para compra',
  'Aguardando aprovação de compra',
  'Emitida',
  'Concluída',
]);

function isRelevantRequest(request: TravelRequest): boolean {
  return (
    ALLOWED_STATUSES.has(request.status) ||
    request.purchase?.purchaseStatus === PurchaseStatus.EMITIDA
  );
}

// ──────────────────────────────────────────────
// Helpers de extração de segmentos
// ──────────────────────────────────────────────

/**
 * Retorna os segmentos da viagem ordenados por `order`.
 * Fonte principal: travel.segments.
 * Fallback: travel.requestedSegments.
 */
function getSegments(request: TravelRequest): TravelSegment[] {
  const segments =
    request.travel?.segments?.length
      ? request.travel.segments
      : request.travel?.requestedSegments ?? [];

  return [...segments].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/**
 * Origem: primeiro trecho ordenado por `order`.
 * Fallback: travel.origin.
 */
function getOrigin(request: TravelRequest): string {
  const segments = getSegments(request);
  return segments[0]?.origin || request.travel?.origin || '';
}

/**
 * Destino: último trecho de ida.
 * Se não houver trecho de ida, usa o último trecho por `order`.
 * Fallback: travel.destination.
 */
function getDestination(request: TravelRequest): string {
  const segments = getSegments(request);

  const outbound = segments.filter((s) => s.direction === 'ida');
  if (outbound.length > 0) {
    return outbound[outbound.length - 1]?.destination || '';
  }

  return segments[segments.length - 1]?.destination || request.travel?.destination || '';
}

/**
 * Rota: encadeamento de origens/destinos sem duplicidade sequencial.
 * Ex: "Catanduva/SP → Campinas/SP → Salgueiro → Catanduva/SP"
 */
function getRoute(request: TravelRequest): string {
  const segments = getSegments(request);

  if (!segments.length) {
    const origin = request.travel?.origin || '';
    const destination = request.travel?.destination || '';
    return [origin, destination].filter(Boolean).join(' → ');
  }

  const points: string[] = [];
  segments.forEach((seg, index) => {
    if (index === 0 && seg.origin) {
      points.push(seg.origin);
    }
    if (seg.destination) {
      const lastPoint = points[points.length - 1];
      if (seg.destination !== lastPoint) {
        points.push(seg.destination);
      }
    }
  });

  return points.join(' → ');
}

/**
 * Data Ida: menor data de partida dos trechos com direction === 'ida'.
 * Fallback: primeiro departureDateTime ordenado por `order`.
 * Fallback final: travel.departureDateTime.
 */
function getDepartureDate(request: TravelRequest): string {
  const segments = getSegments(request);

  const outbound = segments.filter((s) => s.direction === 'ida' && s.departureDateTime);
  if (outbound.length > 0) {
    return outbound[0].departureDateTime;
  }

  return (
    segments.find((s) => s.departureDateTime)?.departureDateTime ||
    request.travel?.departureDateTime ||
    ''
  );
}

/**
 * Data Volta: menor data de partida dos trechos com direction === 'volta'.
 * Se não houver trecho de volta, retorna string vazia (não preencher com data de ida).
 */
function getReturnDate(request: TravelRequest): string {
  const segments = getSegments(request);

  const returnSegs = segments.filter((s) => s.direction === 'volta' && s.departureDateTime);
  return returnSegs[0]?.departureDateTime || '';
}

/**
 * Modal: valores únicos de transportMode, sem duplicidade.
 * Ex: "Aéreo / Rodoviário"
 */
function getTransportModes(request: TravelRequest): string {
  const segments = getSegments(request);
  const labels: Record<string, string> = {
    aereo: 'Aéreo',
    rodoviario: 'Rodoviário',
  };

  const unique = [...new Set(segments.map((s) => s.transportMode).filter(Boolean))];
  return unique.map((m) => labels[m] ?? m).join(' / ');
}

/**
 * Companhia:
 * - Passagens emitidas → purchase.airline.
 * - Demais → airlineQuote únicos dos trechos.
 */
function getAirlines(request: TravelRequest): string {
  if (request.purchase?.airline) {
    return request.purchase.airline;
  }

  const segments = getSegments(request);
  const unique = [...new Set(segments.map((s) => s.airlineQuote).filter(Boolean))];
  return unique.join(' / ');
}

/**
 * Valor Orçado: soma de priceQuote de todos os segmentos.
 */
function getBudgetAmount(request: TravelRequest): number {
  const segments = getSegments(request);
  return segments.reduce((sum, s) => sum + (Number(s.priceQuote) || 0), 0);
}

/**
 * Valor Real da Passagem:
 * - Retorna o valor numérico quando existir.
 * - Retorna string vazia ('') quando não houver emissão, para
 *   não confundir valor inexistente com zero real.
 */
function getRealTicketAmount(request: TravelRequest): number | '' {
  return request.purchase?.price ?? '';
}

// ──────────────────────────────────────────────
// Formatação de data
// ──────────────────────────────────────────────

/**
 * Converte uma string ISO 8601 para o formato brasileiro dd/MM/yyyy.
 * Retorna string vazia para valores ausentes ou inválidos.
 */
function formatDateBR(value?: string | null): string {
  if (!value) return '';
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    return format(date, 'dd/MM/yyyy');
  } catch {
    return '';
  }
}

// ──────────────────────────────────────────────
// Função principal — exportação pública
// ──────────────────────────────────────────────

/**
 * Gera e faz download de um arquivo .xlsx com o relatório de passagens.
 *
 * Inclui solicitações com status:
 *   - Disponível para compra
 *   - Aguardando aprovação de compra
 *   - Emitida
 *   - Concluída
 *
 * @param requests Lista completa de solicitações disponíveis na tela
 */
export function exportIssuedTicketsToExcel(requests: TravelRequest[]): void {
  // 1. Filtra pelos status relevantes
  const filtered = requests.filter(isRelevantRequest);

  // 2. Mapeia as linhas com as colunas finais definidas
  const rows = filtered.map((req) => ({
    Passageiro: getPassengerDisplayName(req),
    'Chapa / Vínculo':
      req.employee?.passengerType === 'external'
        ? 'Terceiro/Convidado'
        : req.employee?.passengerType === 'internal'
          ? req.employee.chapa || ''
          : '',
    'Centro de Custo': req.travel?.costCenter || '',
    Motivo: req.travel?.reason || '',
    Origem: getOrigin(req),
    Destino: getDestination(req),
    Rota: getRoute(req),
    'Data Ida': formatDateBR(getDepartureDate(req)),
    'Data Volta': formatDateBR(getReturnDate(req)),
    Modal: getTransportModes(req),
    Companhia: getAirlines(req),
    'Valor Orçado': getBudgetAmount(req),
    'Valor Real da Passagem': getRealTicketAmount(req),
    'Status da Passagem': req.status || '',
  }));

  // 3. Cria a planilha
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // 4. Larguras de coluna otimizadas
  worksheet['!cols'] = [
    { wch: 30 }, // Passageiro
    { wch: 18 }, // Chapa / Vínculo
    { wch: 18 }, // Centro de Custo
    { wch: 20 }, // Motivo
    { wch: 24 }, // Origem
    { wch: 24 }, // Destino
    { wch: 48 }, // Rota
    { wch: 14 }, // Data Ida
    { wch: 14 }, // Data Volta
    { wch: 16 }, // Modal
    { wch: 20 }, // Companhia
    { wch: 16 }, // Valor Orçado
    { wch: 22 }, // Valor Real da Passagem
    { wch: 28 }, // Status da Passagem
  ];

  // 5. Monta o workbook com aba nomeada
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Passagens');

  // 6. Nome do arquivo com data de geração
  const today = format(new Date(), 'yyyy-MM-dd');
  XLSX.writeFile(workbook, `passagens_emitidas_${today}.xlsx`);
}
