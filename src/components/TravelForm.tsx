// ============================================================
// PRESENTATION â€” TravelForm (V3 - Multisegmento)
// Orquestrador do formulÃ¡rio de solicitaÃ§Ã£o.
// Delega seÃ§Ãµes para componentes modulares e lÃ³gica para hooks.
// ============================================================

import React, { useEffect } from 'react';
import { AlertCircle, Plane, Save, Send, X } from 'lucide-react';
import { useEmployeeIntegration } from '../application/hooks/useEmployeeIntegration.ts';
import { usePolicyEvaluation } from '../application/hooks/usePolicyEvaluation.ts';
import { useTravelRequestForm } from '../application/hooks/useTravelRequestForm.ts';
import { useIdentity } from '../application/identity/IdentityContext.tsx';
import { PolicyResult } from '../domain/policy/enums.ts';
import type { TravelRequest } from '../domain/types';
import { EmployeeSelectionSection } from './travel/form/EmployeeSelectionSection.tsx';
import { TravelItinerarySection } from './travel/form/TravelItinerarySection.tsx';

interface TravelFormProps {
  onClose: () => void;
  editingRequest: TravelRequest | null;
}

export function TravelForm({ onClose, editingRequest }: TravelFormProps) {
  const { currentUser } = useIdentity();

  const { formData, loading, setField, saveDraft, submit } = useTravelRequestForm(
    editingRequest,
    currentUser,
    onClose
  );

  const {
    loading: integrationLoading,
    data: integrationResult,
    costCenters,
    employees,
    fetchByCostCenter,
    fetchMasterData,
    lookupEmployee,
  } = useEmployeeIntegration(currentUser);

  const { evaluation } = usePolicyEvaluation(formData, integrationResult);

  useEffect(() => {
    if (formData.costCenter) {
      fetchByCostCenter(formData.costCenter);
    }
  }, [formData.costCenter, fetchByCostCenter]);

  useEffect(() => {
    if (formData.chapa) {
      fetchMasterData(formData.chapa);
      lookupEmployee(formData.chapa);
    }
  }, [formData.chapa, fetchMasterData, lookupEmployee]);

  useEffect(() => {
    if (integrationResult?.masterData) {
      setField('cpf', integrationResult.masterData.cpf);
      setField('birthDate', integrationResult.masterData.birthDate);
      setField('employeeName', integrationResult.masterData.name);
      setField('functionName', integrationResult.masterData.functionName || '');
    }
  }, [integrationResult?.masterData, setField]);

  const homeCity =
    integrationResult?.masterData?.homeCity ||
    integrationResult?.rawVacation?.CIDADE ||
    '';

  const isPassengerReady = formData.passengerType === 'external'
    ? !!(formData.externalFullName && formData.externalCpfOrPassport && formData.externalBirthDate)
    : !!formData.chapa;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-5xl bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-white">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-slate-900 rounded-[22px] flex items-center justify-center shadow-xl shadow-slate-200">
              <Plane className="text-white w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {editingRequest ? 'Editar Solicitação' : 'Nova Solicitação de Viagem'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-4 hover:bg-slate-50 rounded-2xl transition-all group"
          >
            <X className="w-6 h-6 text-slate-300 group-hover:text-slate-600 transition-colors" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-10 py-10 space-y-12">
          <EmployeeSelectionSection
            costCenter={formData.costCenter}
            chapa={formData.chapa}
            reason={formData.reason}
            leaveStartDate={formData.leaveStartDate}
            leaveEndDate={formData.leaveEndDate}
            costCenters={costCenters || []}
            employees={employees || []}
            loading={integrationLoading}
            cpf={formData.cpf}
            birthDate={formData.birthDate}
            policyEvaluation={evaluation}
            homeCity={homeCity}
            segments={formData.segments}
            passengerType={formData.passengerType}
            externalFullName={formData.externalFullName}
            externalCpfOrPassport={formData.externalCpfOrPassport}
            externalBirthDate={formData.externalBirthDate}
            externalContactEmail={formData.externalContactEmail}
            externalContactPhone={formData.externalContactPhone}
            onCostCenterChange={(cc) => setField('costCenter', cc)}
            onEmployeeChange={(chapa) => setField('chapa', chapa)}
            onFieldChange={setField}
          />

          <TravelItinerarySection
            segments={formData.segments}
            justification={formData.justification}
            onSegmentsChange={(segments) => setField('segments', segments)}
            onFieldChange={setField}
          />

          <div className="flex items-center gap-3 bg-red-50/60 p-6 rounded-[24px] border border-red-100">
            <label className="flex items-center gap-4 cursor-pointer group w-full">
              <input
                type="checkbox"
                checked={formData.isUrgent ?? false}
                onChange={(e) => setField('isUrgent', e.target.checked)}
                className="w-6 h-6 text-red-600 rounded-[8px] border-red-300 focus:ring-red-500 transition-all cursor-pointer bg-white"
              />
              <div className="flex flex-col">
                <span className="text-sm font-black text-red-900 group-hover:text-red-700 transition-colors uppercase tracking-widest">
                  🚨 Sinalizar Viagem como URGENTE / SLA Curtíssimo
                </span>
                <span className="text-xs text-red-700 font-medium opacity-90 mt-1">
                  Marque esta opção apenas se a passagem precisar furar a fila cronológica de atendimento das gerências e suprimentos.
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="px-10 py-8 border-t border-slate-50 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2 text-slate-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {formData.passengerType === 'internal' 
                ? 'Os dados serão sincronizados com o RM TOTVS' 
                : 'Terceiro sem vínculo (Cadastro Manual)'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                const decisions = [];
                if (evaluation?.date) decisions.push(evaluation.date);
                if (evaluation?.geo) decisions.push(evaluation.geo);
                submit(decisions);
              }}
              disabled={loading || integrationLoading || !isPassengerReady}
              className="px-10 py-4 bg-slate-900 text-white rounded-[22px] text-xs font-black hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 flex items-center gap-3 tracking-widest disabled:opacity-30"
            >
              <Send className="w-5 h-5" />
              {loading ? 'PROCESSANDO...' : 'ENVIAR SOLICITAÇÃO'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
