// ============================================================
// APPLICATION — Hook — useTravelRequestForm
// Gerencia estado do formulário e delega persistência para o serviço.
// Mantém componente TravelForm como view pura.
// ============================================================

import { useState, useCallback } from 'react';
import { TravelReason } from '../../domain/enums';
import type { TravelRequest, TravelRequestFormData, UserProfile } from '../../domain/types';
import {
  createTravelRequest,
  updateTravelRequest,
} from '../services/travelRequestService';
import { PolicyDecision } from '../../domain/policy/types';

// ──────────────────────────────────────────────
// Estado inicial do formulário
// ──────────────────────────────────────────────

function buildInitialState(editing: TravelRequest | null): TravelRequestFormData {
  if (!editing) {
    return {
      chapa: '',
      employeeName: '',
      functionName: '',
      reason: TravelReason.VISITA_TECNICA,
      origin: '',
      destination: '',
      departureDateTime: '',
      returnDateTime: '',
      baggageRequired: false,
      costCenter: '',
      projectCode: '',
      managerName: '',
      justification: '',
      leaveStartDate: '',
      leaveEndDate: '',
    };
  }

  // Preenche com dados do modelo v2
  return {
    chapa: editing.employee.chapa ?? '',
    employeeName: editing.employee.employeeName ?? '',
    functionName: editing.employee.functionName ?? '',
    reason: editing.travel.reason ?? TravelReason.VISITA_TECNICA,
    origin: editing.travel.origin ?? '',
    destination: editing.travel.destination ?? '',
    departureDateTime: editing.travel.departureDateTime ?? '',
    returnDateTime: editing.travel.returnDateTime ?? '',
    baggageRequired: editing.travel.baggageRequired ?? false,
    costCenter: editing.travel.costCenter ?? '',
    projectCode: editing.travel.projectCode ?? '',
    managerName: editing.travel.managerName ?? '',
    justification: editing.travel.justification ?? '',
    leaveStartDate: editing.leavePeriod?.leaveStartDate ?? '',
    leaveEndDate: editing.leavePeriod?.leaveEndDate ?? '',
  };
}

// ──────────────────────────────────────────────
// Resultado do hook
// ──────────────────────────────────────────────

interface UseTravelRequestFormResult {
  formData: TravelRequestFormData;
  loading: boolean;
  /** Atualiza um campo do formulário */
  setField: <K extends keyof TravelRequestFormData>(key: K, value: TravelRequestFormData[K]) => void;
  /** Salva como rascunho */
  saveDraft: (policyDecision?: PolicyDecision) => Promise<void>;
  /** Envia a solicitação (status calculado pelas regras de negócio) */
  submit: (policyDecision?: PolicyDecision) => Promise<void>;
}

// ──────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────

export function useTravelRequestForm(
  editingRequest: TravelRequest | null,
  author: UserProfile,
  onSuccess: () => void
): UseTravelRequestFormResult {
  const [formData, setFormData] = useState<TravelRequestFormData>(
    () => buildInitialState(editingRequest)
  );
  const [loading, setLoading] = useState(false);

  const setField = useCallback(
    <K extends keyof TravelRequestFormData>(key: K, value: TravelRequestFormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (asDraft: boolean, policyDecision?: PolicyDecision) => {
      setLoading(true);
      try {
        if (editingRequest) {
          await updateTravelRequest(
            editingRequest.requestId,
            formData,
            editingRequest.audit.history,
            author,
            asDraft,
            policyDecision
          );
        } else {
          await createTravelRequest(formData, author, asDraft, policyDecision);
        }
        onSuccess();
      } finally {
        setLoading(false);
      }
    },
    [editingRequest, formData, author, onSuccess]
  );

  const saveDraft = useCallback((policyDecision?: PolicyDecision) => handleSubmit(true, policyDecision), [handleSubmit]);
  const submit = useCallback((policyDecision?: PolicyDecision) => handleSubmit(false, policyDecision), [handleSubmit]);

  return { formData, loading, setField, saveDraft, submit };
}
