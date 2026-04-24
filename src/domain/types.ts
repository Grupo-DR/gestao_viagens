// ============================================================
// DOMAIN — Tipos
// Modelo de domínio v2 agrupado por contexto de negócio.
// Documentos Firestore legados continuam suportados via LegacyTravelRequest.
// ============================================================

import {
  UserRole,
  RequestStatus,
  TravelReason,
  ValidationStatus,
  PurchaseStatus,
  EmploymentStatus,
  DirectOrIndirect,
} from './enums';
import { PolicyDecision, CombinedPolicyEvidence } from './policy/types';

// ──────────────────────────────────────────────
// Tipos de Validação (Integração RM)
// ──────────────────────────────────────────────

export interface VacationValidation {
  chapa: string;
  hasBalance: boolean;
  vacationDays: number;
  accruedDays: number;
  periodStart: string;
  periodEnd: string;
  limitDate: string;
  isExpired: boolean;
}

export interface TimeOffValidation {
  chapa: string;
  balance: number;
  isEligible: boolean;
}

// ──────────────────────────────────────────────
// Perfil de usuário e identidade
// ──────────────────────────────────────────────

export interface UserProfile {
  /** ID único do usuário (Firebase UID ou ID local provisório) */
  uid: string;
  email: string;
  role: UserRole;
  name?: string;
  /**
   * Centros de Custo aos quais o usuário tem acesso.
   * MASTER e CAPITAL_HUMANO ignoram este campo e veem todos os CCs.
   * Para GESTOR e ADMINISTRATIVO, apenas os CCs listados aqui são visíveis.
   * Array vazio = sem acesso a nenhum CC.
   */
  allowedCostCenters?: string[];
}

// ──────────────────────────────────────────────
// Grupos de dados da solicitação
// ──────────────────────────────────────────────

/** Quem criou a solicitação (administrativo que abriu o pedido) */
export interface RequesterInfo {
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  requesterRole: UserRole;
}

// ──────────────────────────────────────────────
// Passageiro — Union Type Discriminado
// ──────────────────────────────────────────────

/** Discriminante do tipo de passageiro */
export type PassengerType = 'internal' | 'external';

/**
 * Passageiro Interno — Colaborador DR Construtora.
 * Identificado via CHAPA no RM TOTVS.
 */
export interface InternalPassenger {
  passengerType: 'internal';
  chapa: string;
  employeeName: string;
  functionName?: string;
  employmentStatus?: EmploymentStatus;
  directOrIndirect?: DirectOrIndirect;
  /** CPF apenas números — preenchido via integração RM */
  cpf?: string;
  /** Data de nascimento YYYY-MM-DD — preenchida via integração RM */
  birthDate?: string;
}

/**
 * Passageiro Externo — Terceiro / Convidado.
 * Não possui vínculo com o RM TOTVS.
 * O custo é apadrinhado pelo Centro de Custo do Solicitante.
 */
export interface ExternalPassenger {
  passengerType: 'external';
  fullName: string;
  /** CPF (11 dígitos numéricos) ou número de passaporte */
  cpfOrPassport: string;
  /** Data de nascimento YYYY-MM-DD — obrigatório */
  birthDate: string;
  contactEmail: string;
  contactPhone: string;
  /** Centro de Custo do Solicitante — herdado no momento da criação */
  sponsorCostCenter: string;
}

/** Union Type — tipo de passageiro aceito em TravelRequest */
export type Passenger = InternalPassenger | ExternalPassenger;

/**
 * Alias de retrocompatibilidade.
 * `EmployeeInfo` referencia `InternalPassenger` para não quebrar
 * o EmployeeMapper nem importações existentes.
 */
export type EmployeeInfo = InternalPassenger;

export type TransportMode = 'aereo' | 'rodoviario';
export type TravelDirection = 'ida' | 'volta';

export interface TravelSegment {
  id: string;
  order: number; // Ordem sequencial (1, 2, 3...)
  transportMode: TransportMode;
  origin: string;
  originTerminal?: string; // Ex: Aeroporto de Guarulhos, Rodoviária do Tietê
  destination: string;
  destinationTerminal?: string;
  departureDateTime: string;   // ISO 8601
  arrivalDateTime?: string;     // ISO 8601 — opcional
  baggageRequired: boolean;    // Aplicável apenas para aéreo
  direction: TravelDirection;
  
  /** Cotação inicial da obra para este trecho */
  airlineQuote?: string; // Ex: LATAM, GOL, AZUL, UTIL (Ônibus)
  priceQuote?: number;
}

/** Dados do trecho de viagem (Agregador) */
export interface TravelInfo {
  reason: TravelReason;
  /** Definido manualmente pelo solicitante no ato do pedido */
  isUrgent?: boolean;
  /** Lista de trechos ordenada — Fonte de verdade v3 */
  segments?: TravelSegment[];
  /** Snapshot dos trechos originais no momento da compra (para análise Orçado vs Realizado) */
  requestedSegments?: TravelSegment[];
  
  // Campos derivados para compatibilidade legada
  origin: string;
  destination: string;
  departureDateTime: string;       // ISO 8601
  returnDateTime?: string;         // ISO 8601 — opcional (ida somente)
  baggageRequired: boolean;
  
  costCenter: string;
  projectCode?: string;
  managerName?: string;
  /** Justificativa livre — mantido do modelo legado */
  justification?: string;
}

/**
 * Período de afastamento para motivos Folga / Férias.
 * Preenchido somente quando o motivo exige validação CH.
 */
export interface LeavePeriod {
  leaveStartDate?: string;  // 'YYYY-MM-DD'
  leaveEndDate?: string;    // 'YYYY-MM-DD'
}

/** Resultado do processo de validação pelo Capital Humano */
export interface ValidationInfo {
  validationRequired: boolean;
  validationType?: 'Folga' | 'Férias' | 'Folga + férias';
  validationStatus: ValidationStatus;
  validationSummary?: string;
  blockingReasons?: string[];
  warnings?: string[];
  policyDecision?: PolicyDecision; // Fallback legada
  policyDecisions?: PolicyDecision[]; // Nova estrutura multidecisão
}

/** Dados registrados pelo comprador na emissão da passagem */
export interface PurchaseInfo {
  airline?: string;
  ticketNumber?: string;
  price?: number;
  notes?: string;
  purchaseStatus: PurchaseStatus;
}

/** Entrada de histórico de mudanças */
export interface HistoryEntry {
  status: RequestStatus;
  updatedBy: string;
  updatedByRole: UserRole;
  updatedAt: string;  // ISO 8601
  comment?: string;
}

/** Metadados de auditoria */
export interface AuditInfo {
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
  createdBy: string;
  history: HistoryEntry[];
}

// ──────────────────────────────────────────────
// Entidade raiz do domínio
// ──────────────────────────────────────────────

/**
 * Solicitação de viagem corporativa — Modelo v2.
 * Reflete fielmente o processo de negócio em 3 esteiras:
 *   1. Solicitação (requester + employee + travel)
 *   2. Validação CH (validation + leavePeriod)
 *   3. Compra/emissão (purchase)
 */
export interface TravelRequest {
  requestId: string;
  status: RequestStatus;

  requester: RequesterInfo;
  /** Passageiro da viagem — interno (Colaborador DR) ou externo (Terceiro) */
  employee: Passenger;
  travel: TravelInfo;
  leavePeriod: LeavePeriod;
  validation: ValidationInfo;
  purchase: PurchaseInfo;
  audit: AuditInfo;
}

// ──────────────────────────────────────────────
// Modelo legado (compatibilidade com Firestore)
// ──────────────────────────────────────────────

/**
 * Formato dos documentos já existentes no Firestore.
 * Usado pelo mapeador para garantir retrocompatibilidade
 * sem precisar migrar dados.
 */
export interface LegacyTravelRequest {
  id: string;
  requesterUid: string;
  requesterEmail: string;
  passengerName: string;
  reason: string;
  route: string;
  departureDate: string;
  returnDate?: string;
  costCenter: string;
  justification?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  history?: Array<{
    status: string;
    updatedBy: string;
    updatedAt: string;
    comment?: string;
  }>;
  purchaseDetails?: {
    ticketNumber?: string;
    price?: number;
    airline?: string;
    notes?: string;
  };
}

// ──────────────────────────────────────────────
// DTOs para formulários
// ──────────────────────────────────────────────

/** Dados do formulário de criação/edição — tudo opcional para rascunho */
export interface TravelRequestFormData {
  // ── Tipo de passageiro ────────────────────────
  passengerType: PassengerType;

  // ── Passageiro Interno (Colaborador DR / RM) ──
  chapa: string;
  employeeName: string;
  functionName: string;
  /** CPF apenas números — preenchido via integração RM */
  cpf: string;
  birthDate: string;

  // ── Passageiro Externo (Terceiro / Convidado) ─
  externalFullName: string;
  /** CPF (11 dígitos) ou número de passaporte */
  externalCpfOrPassport: string;
  externalBirthDate: string;
  externalContactEmail: string;
  externalContactPhone: string;

  // ── Dados de Viagem — Itinerário v3 ──────────
  reason: TravelReason;
  segments: TravelSegment[];
  
  // Campos derivados para compatibilidade legada
  origin: string;
  destination: string;
  departureDateTime: string;
  returnDateTime: string;
  baggageRequired: boolean;
  costCenter: string;
  projectCode: string;
  isUrgent?: boolean;
  managerName: string;
  justification: string;

  // Leave (visível apenas para motivos CH — não aplicável a externos)
  leaveStartDate: string;
  leaveEndDate: string;
}

// ──────────────────────────────────────────────
// Budget — Orçamento Anual por Centro de Custo
// ──────────────────────────────────────────────

/**
 * Representa uma linha de orçamento importada da planilha de budget.
 * Granularidade: Ano × Mês × Centro de Custo × Categoria.
 * A categoria é derivada da coluna "Descrição":
 *   "PASSAGENS AÉREAS"      → 'aereo'
 *   "PASSAGENS TERRESTRES"  → 'rodoviario'
 */
export interface TravelBudget {
  /** ID gerado pelo Firestore (ausente antes do primeiro salvamento) */
  id?: string;
  year: number;
  /** Nome do mês em português — ex: "Janeiro" */
  month: string;
  /** Código do Centro de Custo — ex: "3044.01" */
  costCenter: string;
  /** Tipo de transporte orçado */
  category: 'aereo' | 'rodoviario';
  /** Valor orçado em BRL */
  value: number;
  /** ISO 8601 — momento do upload */
  uploadedAt?: string;
  /** E-mail do usuário que realizou o upload */
  uploadedBy?: string;
}
