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
import { normalizeSegmentsFromTravel } from '../../domain/travelSegment.helpers';

// ──────────────────────────────────────────────
// Estado inicial do formulário
// ──────────────────────────────────────────────

function buildInitialState(editing: TravelRequest | null): TravelRequestFormData {
  if (!editing) {
    return {
      passengerType: 'internal',
      chapa: '',
      employeeName: '',
      functionName: '',
      cpf: '',
      birthDate: '',
      externalFullName: '',
      externalCpfOrPassport: '',
      externalBirthDate: '',
      externalContactEmail: '',
      externalContactPhone: '',
      reason: TravelReason.VISITA_TECNICA,
      segments: [],
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

  const isExternal = editing.employee.passengerType === 'external';
  
  // Preenche com dados do modelo v3
  return {
    passengerType: editing.employee.passengerType || 'internal',
    chapa: (!isExternal && 'chapa' in editing.employee) ? editing.employee.chapa ?? '' : '',
    employeeName: (!isExternal && 'employeeName' in editing.employee) ? editing.employee.employeeName ?? '' : '',
    functionName: (!isExternal && 'functionName' in editing.employee) ? editing.employee.functionName ?? '' : '',
    cpf: (!isExternal && 'cpf' in editing.employee) ? editing.employee.cpf ?? '' : '',
    birthDate: (!isExternal && 'birthDate' in editing.employee) ? editing.employee.birthDate ?? '' : '',
    externalFullName: isExternal && 'fullName' in editing.employee ? editing.employee.fullName ?? '' : '',
    externalCpfOrPassport: isExternal && 'cpfOrPassport' in editing.employee ? editing.employee.cpfOrPassport ?? '' : '',
    externalBirthDate: isExternal && 'birthDate' in editing.employee ? editing.employee.birthDate ?? '' : '',
    externalContactEmail: isExternal && 'contactEmail' in editing.employee ? editing.employee.contactEmail ?? '' : '',
    externalContactPhone: isExternal && 'contactPhone' in editing.employee ? editing.employee.contactPhone ?? '' : '',
    reason: editing.travel.reason ?? TravelReason.VISITA_TECNICA,
    segments: editing.travel.segments ?? normalizeSegmentsFromTravel(editing.travel),
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
  saveDraft: (policyDecisions?: PolicyDecision[]) => Promise<void>;
  /** Envia a solicitação (status calculado pelas regras de negócio) */
  submit: (policyDecisions?: PolicyDecision[]) => Promise<void>;
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
    async (asDraft: boolean, policyDecisions?: PolicyDecision[]) => {
      setLoading(true);
      try {
        if (editingRequest) {
          await updateTravelRequest(
            editingRequest.requestId,
            formData,
            editingRequest.audit.history,
            author,
            asDraft,
            policyDecisions
          );
        } else {
          await createTravelRequest(formData, author, asDraft, policyDecisions);
        }
        onSuccess();
      } finally {
        setLoading(false);
      }
    },
    [editingRequest, formData, author, onSuccess]
  );

  const saveDraft = useCallback((policyDecisions?: PolicyDecision[]) => handleSubmit(true, policyDecisions), [handleSubmit]);
  const submit = useCallback((policyDecisions?: PolicyDecision[]) => handleSubmit(false, policyDecisions), [handleSubmit]);

  return { formData, loading, setField, saveDraft, submit };
}
