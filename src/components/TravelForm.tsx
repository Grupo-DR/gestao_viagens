// ============================================================
// PRESENTATION — TravelForm
// View pura: delega toda lógica ao hook useTravelRequestForm.
// Campos expandidos para o modelo v2 com fallback para legado.
// ============================================================

import React from 'react';
import { TravelReason } from '../domain/enums';
import { needsValidation } from '../domain/travelRequest.rules';
import type { TravelRequest } from '../domain/types';
import { useIdentity } from '../application/identity/IdentityContext';
import { useTravelRequestForm } from '../application/hooks/useTravelRequestForm';
import { useEmployeeIntegration } from '../application/hooks/useEmployeeIntegration';
import { evaluateTravelPolicy } from '../application/use-cases/evaluateTravelPolicy';
import { PolicyResult, PolicySeverity } from '../domain/policy/enums';
import { PolicyDecision } from '../domain/policy/types';
import { X, Save, Send, AlertCircle, Luggage, Search, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface TravelFormProps {
  onClose: () => void;
  editingRequest: TravelRequest | null;
}

// ──────────────────────────────────────────────
// Utilitário: campo de formulário
// ──────────────────────────────────────────────

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}

function Field({ label, required, children, hint }: FieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

const INPUT_CLASS =
  'w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm';

const SELECT_CLASS =
  'w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-white text-sm';

// ──────────────────────────────────────────────
// Componente
// ──────────────────────────────────────────────

export function TravelForm({ onClose, editingRequest }: TravelFormProps) {
  const { currentUser } = useIdentity();
  const { formData, loading, setField, saveDraft, submit } = useTravelRequestForm(
    editingRequest,
    currentUser,
    onClose
  );

  const { 
    loading: lookupLoading, 
    error: lookupError, 
    data: integrationData, 
    lookupEmployee 
  } = useEmployeeIntegration();

  const [policyDecision, setPolicyDecision] = React.useState<PolicyDecision | null>(null);

  // Efeito para auto-hidratação e avaliação de política
  React.useEffect(() => {
    if (integrationData) {
      setField('employeeName', integrationData.employeeInfo.employeeName);
      setField('functionName', integrationData.employeeInfo.functionName || '');
    }
  }, [integrationData, setField]);

  // Re-avalia a política sempre que dados críticos mudarem
  React.useEffect(() => {
    // Só avalia se houver dados de integração ou se for motivo não crítico
    const decision = evaluateTravelPolicy(
      formData.reason,
      formData.leaveStartDate || formData.departureDateTime ? formData.departureDateTime.split('T')[0] : '',
      formData.leaveEndDate || formData.departureDateTime.split('T')[0],
      integrationData
    );
    setPolicyDecision(decision);
  }, [formData.reason, formData.leaveStartDate, formData.leaveEndDate, formData.departureDateTime, integrationData]);

  const handleLookup = () => {
    if (formData.chapa) {
      lookupEmployee(formData.chapa);
    }
  };

  const isLeaveReason = needsValidation(formData.reason);
  
  // Bloqueio de submissão se houver violação de política (BLOCK)
  const hasBlockingViolation = policyDecision?.result === PolicyResult.REJECTED || 
                             policyDecision?.violations.some(v => v.severity === PolicySeverity.BLOCK);

  const handleSave = () => saveDraft(policyDecision || undefined);
  const handleSubmit = () => submit(policyDecision || undefined);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h2 className="text-lg font-bold text-slate-900">
          {editingRequest ? 'Editar Solicitação' : 'Nova Solicitação de Viagem'}
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          aria-label="Fechar formulário"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto">

        {/* ─── Seção: Dados do Colaborador ─── */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            Dados do Colaborador
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Field label="CHAPA" hint="Código interno Protheus">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.chapa}
                  onChange={(e) => setField('chapa', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  className={INPUT_CLASS}
                  placeholder="Ex: 000123"
                />
                <button
                  type="button"
                  onClick={handleLookup}
                  disabled={lookupLoading || !formData.chapa}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all border border-blue-200 flex items-center justify-center min-w-[48px]"
                >
                  {lookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </div>
            </Field>
            <Field label="Nome do Passageiro" required>
              <input
                type="text"
                value={formData.employeeName}
                onChange={(e) => setField('employeeName', e.target.value)}
                className={INPUT_CLASS}
                placeholder="Nome completo"
              />
            </Field>
            <Field label="Função / Cargo">
              <input
                type="text"
                value={formData.functionName}
                onChange={(e) => setField('functionName', e.target.value)}
                className={INPUT_CLASS}
                placeholder="Ex: Técnico de Campo"
              />
            </Field>
          </div>
        </section>

        {/* ─── Seção: Dados da Viagem ─── */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            Dados da Viagem
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Motivo da Viagem" required>
              <select
                value={formData.reason}
                onChange={(e) => setField('reason', e.target.value as TravelReason)}
                className={SELECT_CLASS}
              >
                {Object.values(TravelReason).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {isLeaveReason && (
                <div className="flex items-center gap-2 text-[11px] text-amber-600 font-medium mt-1.5">
                  <AlertCircle className="w-3 h-3" />
                  Exige validação do Capital Humano
                </div>
              )}
            </Field>

            <Field label="Responsável / Gestor">
              <input
                type="text"
                value={formData.managerName}
                onChange={(e) => setField('managerName', e.target.value)}
                className={INPUT_CLASS}
                placeholder="Nome do gestor responsável"
              />
            </Field>

            <Field label="Origem" required>
              <input
                type="text"
                value={formData.origin}
                onChange={(e) => setField('origin', e.target.value)}
                className={INPUT_CLASS}
                placeholder="Ex: São Paulo (GRU)"
              />
            </Field>

            <Field label="Destino" required>
              <input
                type="text"
                value={formData.destination}
                onChange={(e) => setField('destination', e.target.value)}
                className={INPUT_CLASS}
                placeholder="Ex: Rio de Janeiro (SDU)"
              />
            </Field>

            <Field label="Data e Hora de Ida" required>
              <input
                type="datetime-local"
                value={formData.departureDateTime}
                onChange={(e) => setField('departureDateTime', e.target.value)}
                className={INPUT_CLASS}
              />
            </Field>

            <Field label="Data e Hora de Volta (Opcional)">
              <input
                type="datetime-local"
                value={formData.returnDateTime}
                onChange={(e) => setField('returnDateTime', e.target.value)}
                className={INPUT_CLASS}
              />
            </Field>

            <Field label="Centro de Custo" required>
              <input
                type="text"
                value={formData.costCenter}
                onChange={(e) => setField('costCenter', e.target.value)}
                className={INPUT_CLASS}
                placeholder="Ex: 102030 - Operações"
              />
            </Field>

            <Field label="Código do Projeto">
              <input
                type="text"
                value={formData.projectCode}
                onChange={(e) => setField('projectCode', e.target.value)}
                className={INPUT_CLASS}
                placeholder="Ex: PRJ-2024-001"
              />
            </Field>
          </div>

          {/* Bagagem */}
          <div className="mt-4 flex items-center gap-3">
            <input
              id="baggageRequired"
              type="checkbox"
              checked={formData.baggageRequired}
              onChange={(e) => setField('baggageRequired', e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded"
            />
            <label htmlFor="baggageRequired" className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
              <Luggage className="w-4 h-4 text-slate-400" />
              Necessita despacho de bagagem
            </label>
          </div>
          {/* Mensagens de Integração e Política */}
          {(lookupError || policyDecision) && (
            <div className={cn(
              "p-5 rounded-2xl border text-sm mt-6 transition-all",
              lookupError || policyDecision?.result === PolicyResult.REJECTED 
                ? "bg-red-50 border-red-100 text-red-700" 
                : policyDecision?.result === PolicyResult.MANUAL_VALIDATION 
                ? "bg-amber-50 border-amber-100 text-amber-700"
                : "bg-emerald-50 border-emerald-100 text-emerald-700"
            )}>
              {lookupError ? (
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{lookupError}</span>
                </div>
              ) : policyDecision && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-bold text-base">
                    {policyDecision.result === PolicyResult.APPROVED ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <ShieldAlert className="w-5 h-5" />
                    )}
                    <span>{policyDecision.summary}</span>
                  </div>

                  {/* Detalhes de violações */}
                  {(policyDecision.violations.length > 0 || policyDecision.warnings.length > 0) && (
                    <ul className="space-y-1.5 list-disc pl-5 opacity-90 font-medium">
                      {policyDecision.violations.map((v, i) => (
                        <li key={`v-${i}`}>{v.message}</li>
                      ))}
                      {policyDecision.warnings.map((w, i) => (
                        <li key={`w-${i}`} className="italic">{w.message}</li>
                      ))}
                    </ul>
                  )}
                  
                  {policyDecision.result === PolicyResult.MANUAL_VALIDATION && (
                    <p className="text-[11px] font-bold uppercase tracking-wider opacity-60">
                      Esta solicitação será encaminhada para análise do Capital Humano.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ─── Seção: Período de Folga / Férias (condicional) ─── */}
        {isLeaveReason && (
          <section className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
            <h3 className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5" />
              Período de Folga / Férias
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Início do Período" required>
                <input
                  type="date"
                  value={formData.leaveStartDate}
                  onChange={(e) => setField('leaveStartDate', e.target.value)}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Fim do Período" required>
                <input
                  type="date"
                  value={formData.leaveEndDate}
                  onChange={(e) => setField('leaveEndDate', e.target.value)}
                  className={INPUT_CLASS}
                />
              </Field>
            </div>
          </section>
        )}

        {/* ─── Justificativa ─── */}
        <section>
          <Field label="Justificativa">
            <textarea
              value={formData.justification}
              onChange={(e) => setField('justification', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none min-h-[90px] text-sm"
              placeholder="Descreva a necessidade da viagem..."
            />
          </Field>
        </section>
      </div>

      {/* Footer com ações */}
      <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          Salvar Rascunho
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || lookupLoading || !formData.employeeName || !formData.destination || !formData.departureDateTime || hasBlockingViolation}
          className="flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {loading ? 'Enviando...' : 'Enviar Solicitação'}
        </button>
      </div>
    </div>
  );
}
