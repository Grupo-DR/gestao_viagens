// ============================================================
// APPLICATION — Hook — useTravelRequestForm (Multitrecho Hardened)
// Gerencia estado do formulário, validação de trechos e reindexação.
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
  deriveTravelSummaryFromSegments,
  reindexSegments,
  validateSegments
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
      segments: [createEmptySegment(1)],
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
      cpf: '',
      birthDate: '',
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
    cpf: editing.employee.cpf ?? '',
    birthDate: editing.employee.birthDate ?? '',
  };
}

// ──────────────────────────────────────────────
// Resultado do hook
// ──────────────────────────────────────────────

interface UseTravelRequestFormResult {
  formData: TravelRequestFormData;
  loading: boolean;
  errors: Record<string, string[]>; // Erros por ID de segmento
  
  /** Atualiza um campo do formulário (nível raiz) */
  setField: <K extends keyof TravelRequestFormData>(key: K, value: TravelRequestFormData[K]) => void;
  
  // Operações semânticas para segmentos
  addSegment: () => void;
  removeSegment: (segmentId: string) => void;
  /** Atualiza campo de um trecho com tipagem forte */
  updateSegment: <K extends keyof TravelSegment>(id: string, field: K, value: TravelSegment[K]) => void;

  saveDraft: (policyDecision?: PolicyDecision) => Promise<void>;
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
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  /** 
   * Sincroniza campos legados e reseta erros ao mudar segmentos.
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
      const lastSegment = prev.segments[prev.segments.length - 1];
      const nextOrder = prev.segments.length + 1;
      
      // Lógica de adivinhação: o novo trecho herda o sentido do anterior
      const nextDirection = lastSegment?.direction || 'ida';
      
      const newSegments = [...prev.segments, createEmptySegment(nextOrder, nextDirection)];
      return { 
        ...prev, 
        segments: newSegments,
        ...syncDerivedFields(newSegments)
      };
    });
  }, [syncDerivedFields]);

  const removeSegment = useCallback((id: string) => {
    setFormData((prev) => {
      if (prev.segments.length <= 1) return prev;
      const filtered = prev.segments.filter(s => s.id !== id);
      const newSegments = reindexSegments(filtered);
      return { 
        ...prev, 
        segments: newSegments,
        ...syncDerivedFields(newSegments)
      };
    });
    // Limpa erro do segmento removido
    setErrors(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, [syncDerivedFields]);

  const updateSegment = useCallback(<K extends keyof TravelSegment>(id: string, field: K, value: TravelSegment[K]) => {
    setFormData((prev) => {
      const newSegments = prev.segments.map(s => {
        if (s.id !== id) return s;
        
        const updated = { ...s, [field]: value };
        
        // Regra Colateral: Rodoviário não despacha bagagem
        if (field === 'transportMode' && value === 'rodoviario') {
           updated.baggageRequired = false;
        }

        return updated;
      });

      return { 
        ...prev, 
        segments: newSegments,
        ...syncDerivedFields(newSegments)
      };
    });
  }, [syncDerivedFields]);

  const handleSubmit = useCallback(
    async (asDraft: boolean, policyDecision?: PolicyDecision) => {
      // 1. Validar trechos se for envio definitivo
      if (!asDraft) {
         const segmentErrors = validateSegments(formData.segments);
         setErrors(segmentErrors);
         
         if (Object.keys(segmentErrors).length > 0) {
            console.warn('[Validation] Envio bloqueado por dados incompletos nos trechos.');
            return;
         }
      }

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
    errors,
    setField, 
    addSegment, 
    removeSegment, 
    updateSegment, 
    saveDraft, 
    submit 
  };
}
