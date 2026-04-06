// ============================================================
// APPLICATION — Hook — useTravelRequestForm (Multitrecho)
// Gerencia estado do formulário e delega persistência para o serviço.
// Suporta operações semânticas em TravelSegment[].
// ============================================================

import { useState, useCallback } from 'react';
import { TravelReason } from '../../domain/enums';
import type { TravelRequest, TravelRequestFormData, UserProfile, TravelSegment } from '../../domain/types';
import {
  createTravelRequest,
  updateTravelRequest,
} from '../services/travelRequestService';
import { PolicyDecision } from '../../domain/policy/types';
import { 
  createEmptySegment, 
  normalizeSegmentsFromTravel, 
  deriveTravelSummaryFromSegments 
} from '../../domain/travelSegment.helpers';

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
      segments: [createEmptySegment('seg-1')],
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

  // Preenche com dados do modelo v2 e normaliza segmentos (v3)
  const segments = normalizeSegmentsFromTravel(editing.travel);
  const summary = deriveTravelSummaryFromSegments(segments);

  return {
    chapa: editing.employee.chapa ?? '',
    employeeName: editing.employee.employeeName ?? '',
    functionName: editing.employee.functionName ?? '',
    reason: editing.travel.reason ?? TravelReason.VISITA_TECNICA,
    segments,
    origin: summary.origin,
    destination: summary.destination,
    departureDateTime: summary.departureDateTime,
    returnDateTime: summary.returnDateTime || '',
    baggageRequired: summary.baggageRequired,
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
  /** Atualiza um campo do formulário (nível raiz) */
  setField: <K extends keyof TravelRequestFormData>(key: K, value: TravelRequestFormData[K]) => void;
  
  // Operações semânticas para segmentos
  /** Adiciona um novo trecho */
  addSegment: () => void;
  /** Remove um trecho específico */
  removeSegment: (segmentId: string) => void;
  /** Atualiza campo de um trecho */
  updateSegment: (segmentId: string, field: keyof TravelSegment, value: any) => void;

  /** Salva como rascunho */
  saveDraft: (policyDecision?: PolicyDecision) => Promise<void>;
  /** Envia a solicitação */
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

  /** 
   * Sincroniza campos legados sempre que segmentos mudam. 
   */
  const syncDerivedFields = useCallback((segments: TravelSegment[]) => {
    const summary = deriveTravelSummaryFromSegments(segments);
    return {
       ...summary,
       returnDateTime: summary.returnDateTime || ''
    };
  }, []);

  const setField = useCallback(
    <K extends keyof TravelRequestFormData>(key: K, value: TravelRequestFormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const addSegment = useCallback(() => {
    setFormData((prev) => {
      const newSegments = [...prev.segments, createEmptySegment()];
      return { 
        ...prev, 
        segments: newSegments,
        ...syncDerivedFields(newSegments)
      };
    });
  }, [syncDerivedFields]);

  const removeSegment = useCallback((id: string) => {
    setFormData((prev) => {
      if (prev.segments.length <= 1) return prev; // Não permite zero trechos
      const newSegments = prev.segments.filter(s => s.id !== id);
      return { 
        ...prev, 
        segments: newSegments,
        ...syncDerivedFields(newSegments)
      };
    });
  }, [syncDerivedFields]);

  const updateSegment = useCallback((id: string, field: keyof TravelSegment, value: any) => {
    setFormData((prev) => {
      const newSegments = prev.segments.map(s => 
        s.id === id ? { ...s, [field]: value } : s
      );
      return { 
        ...prev, 
        segments: newSegments,
        ...syncDerivedFields(newSegments)
      };
    });
  }, [syncDerivedFields]);

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

  return { 
    formData, 
    loading, 
    setField, 
    addSegment, 
    removeSegment, 
    updateSegment, 
    saveDraft, 
    submit 
  };
}
