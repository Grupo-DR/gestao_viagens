// ============================================================
// APPLICATION — Serviço de Exportação: Relatório de Passagens
// Gera um arquivo .xlsx com UMA LINHA POR TRECHO de viagem.
//
// Cada segmento (TravelSegment) dentro de uma solicitação
// origina uma linha independente na planilha, com seu próprio
// valor orçado (priceQuote), origem, destino e data.
//
// Status incluídos:
//   Disponível para compra | Aguardando aprovação de compra
//   Emitida | Concluída
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

const ALLOWED_STATUSES = new Set<string>([
  RequestStatus.DISPONIVEL_PARA_COMPRA,
  RequestStatus.AGUARDANDO_APROVACAO_COMPRA,
  RequestStatus.EMITIDA,
  RequestStatus.CONCLUIDA,
  // Labels em português para compatibilidade com registros legados
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
// Helpers de segmentos
// ──────────────────────────────────────────────

/**
 * Retorna os segmentos ordenados por `order`.
 * Fonte principal: travel.segments.
 * Fallback: travel.requestedSegments.
 */
function getSegments(request: TravelRequest): TravelSegment[] {
  const segments =
    request.travel?.segments?.length
      ? request.travel.segments
      : request.travel?.requestedSegments ?? [];

  return [...segments].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
}

/** Chapa do colaborador interno ou rótulo para externos. */
function getChapa(request: TravelRequest): string {
  if (request.employee?.passengerType === 'external') return 'Terceiro/Convidado';
  if (request.employee?.passengerType === 'internal') return request.employee.chapa || '';
  return '';
}

/** Tradução do modal de transporte. */
const MODAL_LABELS: Record<string, string> = {
  aereo: 'Aéreo',
  rodoviario: 'Rodoviário',
};

// ──────────────────────────────────────────────
// Formatação de data
// ──────────────────────────────────────────────

/**
 * Converte "YYYY-MM-DDTHH:mm" ou ISO completo → "dd/MM/yyyy".
 * Parseia apenas a parte da data para evitar variação de fuso horário.
 */
function formatDateBR(value?: string | null): string {
  if (!value) return '';
  try {
    const datePart = value.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    if (!year || !month || !day) return '';
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  } catch {
    return '';
  }
}

// ──────────────────────────────────────────────
// Mapeador de um segmento → linha do Excel
// ──────────────────────────────────────────────

/**
 * Gera o descritivo resumido de um único trecho.
 * Ex: "[Ida] GOIÂNIA-GO → JOÃO PESSOA-PB (06/05/2026)"
 */
function formatSegmentItinerary(seg: TravelSegment): string {
  const dirLabel: Record<string, string> = { ida: 'Ida', volta: 'Volta' };
  const dir = seg.direction ? `[${dirLabel[seg.direction] ?? seg.direction}] ` : '';
  const route = [seg.origin, seg.destination].filter(Boolean).join(' → ');
  const date = formatDateBR(seg.departureDateTime);
  return `${dir}${route}${date ? ` (${date})` : ''}`;
}

interface ExcelRow {
  Passageiro: string;
  'Chapa / Vínculo': string;
  'Centro de Custo': string;
  Motivo: string;
  Itinerário: string;
  Origem: string;
  Destino: string;
  'Data Ida': string;
  'Data Volta': string;
  Modal: string;
  Companhia: string;
  'Valor Orçado': number;
  'Valor Real da Passagem': number | '';
  'Status da Passagem': string;
}

/**
 * Expande uma solicitação em múltiplas linhas — uma por segmento.
 *
 * - "Valor Orçado" = priceQuote do segmento específico.
 * - "Valor Real da Passagem" = purchase.price (total da compra),
 *   exibido apenas na linha do primeiro segmento para evitar
 *   duplicação ao somar na planilha.
 * - "Data Ida" preenchida quando direction === 'ida'.
 * - "Data Volta" preenchida quando direction === 'volta'.
 */
function expandRequestToRows(request: TravelRequest): ExcelRow[] {
  const segments = getSegments(request);

  // Solicitações sem segmentos (dados legados): gera uma linha com fallback
  if (!segments.length) {
    return [
      {
        Passageiro: getPassengerDisplayName(request),
        'Chapa / Vínculo': getChapa(request),
        'Centro de Custo': request.travel?.costCenter || '',
        Motivo: request.travel?.reason || '',
        Itinerário:
          [request.travel?.origin, request.travel?.destination].filter(Boolean).join(' → '),
        Origem: request.travel?.origin || '',
        Destino: request.travel?.destination || '',
        'Data Ida': formatDateBR(request.travel?.departureDateTime),
        'Data Volta': formatDateBR(request.travel?.returnDateTime),
        Modal: '',
        Companhia: request.purchase?.airline || '',
        'Valor Orçado': 0,
        'Valor Real da Passagem': request.purchase?.price ?? '',
        'Status da Passagem': request.status || '',
      },
    ];
  }

  // ── Uma linha por segmento ──
  return segments.map((seg, index) => {
    const isIdaDirection = !seg.direction || seg.direction === 'ida';

    return {
      Passageiro: getPassengerDisplayName(request),
      'Chapa / Vínculo': getChapa(request),
      'Centro de Custo': request.travel?.costCenter || '',
      Motivo: request.travel?.reason || '',

      // Descritivo resumido deste trecho específico
      Itinerário: formatSegmentItinerary(seg),

      Origem: seg.origin || '',
      Destino: seg.destination || '',

      // Data de partida do trecho na coluna correspondente à direção
      'Data Ida': isIdaDirection ? formatDateBR(seg.departureDateTime) : '',
      'Data Volta': seg.direction === 'volta' ? formatDateBR(seg.departureDateTime) : '',

      Modal: MODAL_LABELS[seg.transportMode] ?? seg.transportMode ?? '',

      // Companhia: emitida usa purchase.airline; cotação usa airlineQuote do trecho
      Companhia: request.purchase?.airline || seg.airlineQuote || '',

      // Valor orçado deste trecho específico
      'Valor Orçado': Number(seg.priceQuote) || 0,

      // Valor real apenas na 1ª linha para não inflar totais ao somar no Excel
      'Valor Real da Passagem': index === 0 ? (request.purchase?.price ?? '') : '',

      'Status da Passagem': request.status || '',
    };
  });
}

// ──────────────────────────────────────────────
// Função principal — exportação pública
// ──────────────────────────────────────────────

/**
 * Gera e faz download de um arquivo .xlsx com o relatório de passagens.
 * Cada trecho de viagem origina uma linha independente na planilha.
 *
 * @param requests Lista completa de solicitações disponíveis na tela
 */
export function exportIssuedTicketsToExcel(requests: TravelRequest[]): void {
  // 1. Filtra pelos status relevantes
  const filtered = requests.filter(isRelevantRequest);

  // 2. Expande cada solicitação em N linhas (uma por segmento)
  const rows = filtered.flatMap(expandRequestToRows);

  // 3. Cria a planilha
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // 4. Larguras de coluna otimizadas (14 colunas)
  worksheet['!cols'] = [
    { wch: 30 }, // Passageiro
    { wch: 18 }, // Chapa / Vínculo
    { wch: 42 }, // Centro de Custo
    { wch: 20 }, // Motivo
    { wch: 52 }, // Itinerário
    { wch: 24 }, // Origem
    { wch: 24 }, // Destino
    { wch: 13 }, // Data Ida
    { wch: 13 }, // Data Volta
    { wch: 14 }, // Modal
    { wch: 20 }, // Companhia
    { wch: 15 }, // Valor Orçado
    { wch: 22 }, // Valor Real da Passagem
    { wch: 28 }, // Status da Passagem
  ];

  // 5. Monta o workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Passagens');

  // 6. Download com data de geração no nome
  const today = format(new Date(), 'yyyy-MM-dd');
  XLSX.writeFile(workbook, `passagens_emitidas_${today}.xlsx`);
}
