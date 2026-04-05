// ============================================================
// PRESENTATION — TravelForm
// View pura: delega toda lógica ao hook useTravelRequestForm.
// Campos expandidos para o modelo v2 com suporte a seleção dinâmica.
// ============================================================

import React, { useState, useEffect } from 'react';
import { TravelReason } from '../domain/enums';
import { needsValidation } from '../domain/travelRequest.rules';
import type { TravelRequest } from '../domain/types';
import { useIdentity } from '../application/identity/IdentityContext.tsx';
import { useTravelRequestForm } from '../application/hooks/useTravelRequestForm.ts';
import { useEmployeeIntegration } from '../application/hooks/useEmployeeIntegration.ts';
import { usePolicyEvaluation } from '../application/hooks/usePolicyEvaluation.ts';
import { PolicyResult } from '../domain/policy/enums.ts';
import { X, Save, Send, Luggage, Search, Loader2, CheckCircle2, ShieldAlert, Landmark } from 'lucide-react';
import { cn } from '../lib/utils.ts';

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
  className?: string;
}

function Field({ label, required, children, hint, className }: FieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

const SELECT_CLASS =
  'w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-white text-sm';

const INPUT_CLASS =
  'w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm';

// ──────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────

export function TravelForm({ onClose, editingRequest }: TravelFormProps) {
  const { currentUser } = useIdentity();
  const { formData, loading: formLoading, setField, saveDraft, submit } = useTravelRequestForm(
    editingRequest,
    currentUser,
    onClose
  );

  // Integração com RM TOTVS
  const { 
    loading: lookupLoading, 
    costCenters, 
    employees, 
    data: integrationData, 
    fetchEmployees,
    lookupEmployee 
  } = useEmployeeIntegration();

  // 3. Avaliação de Política (Delegada para Hook de Aplicação - Sprint 1)
  const { policyDecision } = usePolicyEvaluation(formData, integrationData);

  // 4. Manipuladores de Eventos de UI
  const handleCostCenterChange = (ccCode: string) => {
    setField('costCenter', ccCode);
    setField('chapa', ''); // Reseta colaborador ao mudar CC
    setField('employeeName', '');
    fetchEmployees(ccCode);
  };

  const handleEmployeeChange = (chapa: string) => {
    const selected = employees.find(e => e.chapa === chapa);
    if (selected) {
      setField('chapa', selected.chapa);
      setField('employeeName', selected.name);
      setField('functionName', selected.role);
      lookupEmployee(selected.chapa);
    }
  };

  const isHRReason = [TravelReason.FERIAS, TravelReason.FOLGA, TravelReason.FOLGA_FERIAS].includes(formData.reason);

  return (
    <div className="w-full h-full animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col">
      <div className="bg-white w-full rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        
        {/* Cabeçalho — Integrado com Botão Voltar */}
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-6">
            <button 
              onClick={onClose}
              className="p-3 hover:bg-slate-200 rounded-2xl transition-all text-slate-500 bg-white border border-slate-100 shadow-sm group"
              title="Voltar para a lista"
            >
              <X className="w-6 h-6 group-hover:scale-95 transition-transform" />
            </button>
            <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
              <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg border border-blue-400">
                 <Luggage className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                  {editingRequest ? 'Editar Solicitação' : 'Nova Solicitação de Viagem'}
                </h2>
                <p className="text-slate-500 text-sm italic">Ambiente corporativo de programação de vôos e logística.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulário SCROLLABLE */}
        <div className="p-10 overflow-y-auto space-y-10 custom-scrollbar">
          
          {/* SEÇÃO 1: DADOS DO COLABORADOR (NOVA LÓGICA) */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-blue-600">
               <Landmark className="w-5 h-5" />
               <h3 className="font-bold text-xs uppercase tracking-[0.2em]">Sincronização RM TOTVS</h3>
               <div className="h-px flex-1 bg-slate-100 ml-2" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-blue-50/30 p-8 rounded-[28px] border border-blue-100/50">
              <Field label="1. Selecione o Centro de Custo" required hint="Filtra a lista de colaboradores oficiais da unidade.">
                <select 
                  className={SELECT_CLASS}
                  value={formData.costCenter}
                  onChange={(e) => handleCostCenterChange(e.target.value)}
                >
                  <option value="">Selecione centro de custo...</option>
                  {costCenters.map(cc => (
                    <option key={cc.code} value={cc.code}>{cc.label}</option>
                  ))}
                </select>
              </Field>

              <Field 
                label="2. Selecione o Colaborador" 
                required 
                hint="As informações de política serão carregadas automaticamente."
                className={cn(!formData.costCenter && "opacity-50 pointer-events-none")}
              >
                <div className="relative">
                  <select 
                    className={cn(SELECT_CLASS, lookupLoading && "pr-10")}
                    value={formData.chapa}
                    onChange={(e) => handleEmployeeChange(e.target.value)}
                  >
                    <option value="">Selecione o colaborador...</option>
                    {employees.map(e => (
                      <option key={e.chapa} value={e.chapa}>{e.name} ({e.chapa})</option>
                    ))}
                  </select>
                  {lookupLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    </div>
                  )}
                </div>
              </Field>
            </div>

            {/* Resultado da Política (Policy Engine) */}
            {formData.chapa && (
              <div className={cn(
                "p-6 rounded-[24px] border transition-all duration-500 flex gap-4",
                !policyDecision 
                  ? "bg-slate-50 border-slate-100" 
                  : policyDecision.result === PolicyResult.REJECTED ? "bg-red-50/50 border-red-100/50" :
                    policyDecision.result === PolicyResult.MANUAL_VALIDATION ? "bg-amber-50/50 border-amber-100/50" :
                    "bg-emerald-50/50 border-emerald-100/50"
              )}>
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0",
                  !policyDecision ? "bg-white text-slate-400" :
                  policyDecision.result === PolicyResult.REJECTED ? "bg-red-100 text-red-600" :
                  policyDecision.result === PolicyResult.MANUAL_VALIDATION ? "bg-amber-100 text-amber-600" :
                  "bg-emerald-100 text-emerald-600"
                )}>
                  {!policyDecision ? <Search className="w-6 h-6" /> :
                   policyDecision.result === PolicyResult.APPROVED ? <CheckCircle2 className="w-6 h-6" /> : 
                   <ShieldAlert className="w-6 h-6" />}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm tracking-tight italic">Status da Política Corporativa</h4>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed uppercase tracking-widest">
                    {policyDecision ? policyDecision.summary : "Aguardando preenchimento das datas para validação..."}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* SEÇÃO 2: DADOS DA VIAGEM */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-slate-400">
               <Luggage className="w-5 h-5" />
               <h3 className="font-bold text-xs uppercase tracking-[0.2em]">Itinerário e Logística</h3>
               <div className="h-px flex-1 bg-slate-100 ml-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Field label="Motivo da Viagem" required>
                <select 
                  className={SELECT_CLASS}
                  value={formData.reason}
                  onChange={(e) => setField('reason', e.target.value as TravelReason)}
                >
                  {Object.values(TravelReason).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </Field>

              <Field label="Bagagem Despachada" required>
                 <div className="flex gap-4 p-1 bg-slate-50 rounded-xl border border-slate-100">
                    <button 
                      onClick={() => setField('baggageRequired', true)}
                      className={cn("flex-1 py-1.5 rounded-lg text-xs font-bold transition-all", formData.baggageRequired ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                    >SIM</button>
                    <button 
                      onClick={() => setField('baggageRequired', false)}
                      className={cn("flex-1 py-1.5 rounded-lg text-xs font-bold transition-all", !formData.baggageRequired ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                    >NÃO</button>
                 </div>
              </Field>

              <Field label="Origem" required>
                <input 
                  className={INPUT_CLASS} 
                  placeholder="Ex: Curitiba (CWB)"
                  value={formData.origin}
                  onChange={(e) => setField('origin', e.target.value)}
                />
              </Field>
              <Field label="Destino" required>
                <input 
                  className={INPUT_CLASS} 
                  placeholder="Ex: Salvador (SSA)"
                  value={formData.destination}
                  onChange={(e) => setField('destination', e.target.value)}
                />
              </Field>

              <Field label="Partida" required>
                <input 
                  type="datetime-local"
                  className={INPUT_CLASS} 
                  value={formData.departureDateTime}
                  onChange={(e) => setField('departureDateTime', e.target.value)}
                />
              </Field>
              <Field label="Retorno" hint="Opcional para trechos somente ida">
                <input 
                  type="datetime-local"
                  className={INPUT_CLASS} 
                  value={formData.returnDateTime}
                  onChange={(e) => setField('returnDateTime', e.target.value)}
                />
              </Field>
            </div>

            {/* Campos Condicionais CH (FÉRIAS/FOLGA) */}
            {isHRReason && (
              <div className="animate-in slide-in-from-top-4 duration-300 grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-amber-50/30 rounded-[28px] border border-amber-100/50">
                 <Field label="Início Afastamento (RM)" required hint="Deve coincidir com período no sistema">
                    <input 
                      type="date"
                      className={INPUT_CLASS} 
                      value={formData.leaveStartDate}
                      onChange={(e) => setField('leaveStartDate', e.target.value)}
                    />
                 </Field>
                 <Field label="Fim Afastamento (RM)" required hint="Deve coincidir com período no sistema">
                    <input 
                      type="date"
                      className={INPUT_CLASS} 
                      value={formData.leaveEndDate}
                      onChange={(e) => setField('leaveEndDate', e.target.value)}
                    />
                 </Field>
              </div>
            )}
            
            <Field label="Justificativa da Viagem" required hint="Motivo real da viagem no local.">
              <textarea 
                className={cn(INPUT_CLASS, "min-h-[100px] resize-none")}
                placeholder="Descreva brevemente o propósito da viagem..."
                value={formData.justification}
                onChange={(e) => setField('justification', e.target.value)}
              />
            </Field>
          </section>
        </div>

        {/* Rodapé — Ações */}
        <div className="px-10 py-8 border-t border-slate-100 flex items-center justify-end gap-4 bg-slate-50/50">
           <button 
             onClick={() => saveDraft(policyDecision || undefined)}
             className="px-8 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-200 transition-all flex items-center gap-2"
           >
             <Save className="w-5 h-5" />
             SALVAR RASCUNHO
           </button>
           <button 
             onClick={() => submit(policyDecision || undefined)}
             className="px-8 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
           >
             <Send className="w-5 h-5" />
             ENVIAR SOLICITAÇÃO
           </button>
        </div>
      </div>
    </div>
  );
}
