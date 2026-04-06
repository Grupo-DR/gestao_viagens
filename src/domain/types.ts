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
import { PolicyDecision } from './policy/types';

// ──────────────────────────────────────────────
// Perfil de usuário e identidade
// ──────────────────────────────────────────────

export interface UserProfile {
  /** ID único do usuário (Firebase UID ou ID local provisório) */
  uid: string;
  email: string;
  role: UserRole;
  name?: string;
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

/**
 * Dados do colaborador que vai viajar.
 * Futuramente preenchido via CHAPA pelo endpoint do Protheus.
 */
export interface EmployeeInfo {
  chapa: string;
  employeeName: string;
  functionName?: string;
  employmentStatus?: EmploymentStatus;
  directOrIndirect?: DirectOrIndirect;
}

export type TransportMode = 'aereo' | 'rodoviario';

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
}

/** Dados do trecho de viagem (Agregador) */
export interface TravelInfo {
  reason: TravelReason;
  /** Lista de trechos ordenada — Fonte de verdade v3 */
  segments?: TravelSegment[];
  
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
  policyDecision?: PolicyDecision; // Nova estrutura de decisão detalhada
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
  employee: EmployeeInfo;
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
  // Employee
  chapa: string;
  employeeName: string;
  functionName: string;

  // Travel — Itinerário v3
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
  managerName: string;
  justification: string;

  // Leave (visível apenas para motivos CH)
  leaveStartDate: string;
  leaveEndDate: string;
}
