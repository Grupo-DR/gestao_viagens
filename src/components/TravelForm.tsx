// ============================================================
// PRESENTATION — TravelForm (Sprint Final - Refatorado)
// View modularizada: orquestra seções visuais do diretório ./form/
// REORGANIZAÇÃO: Motivo e Datas RM agora integrados no bloco inicial.
// ============================================================

import React from 'react';
import { TravelReason } from '../domain/enums.ts';
import { TravelRequest } from '../domain/types.ts';
import { useIdentity } from '../application/identity/IdentityContext.tsx';
import { useTravelRequestForm } from '../application/hooks/useTravelRequestForm.ts';
import { useEmployeeIntegration } from '../application/hooks/useEmployeeIntegration.ts';
import { usePolicyEvaluation } from '../application/hooks/usePolicyEvaluation.ts';
import { X, Luggage } from 'lucide-react';

// Subcomponentes de Formulário
import { EmployeeSelectionSection } from './travel/form/EmployeeSelectionSection.tsx';
import { PolicyStatusCard } from './travel/form/PolicyStatusCard.tsx';
import { TravelItinerarySection } from './travel/form/TravelItinerarySection.tsx';
import { TravelFormFooterActions } from './travel/form/TravelFormFooterActions.tsx';

interface TravelFormProps {
  onClose: () => void;
  editingRequest: TravelRequest | null;
}

export function TravelForm({ onClose, editingRequest }: TravelFormProps) {
  const { currentUser } = useIdentity();
  
  // 1. Hook de Estado do Formulário
  const { 
    formData, 
    loading: formLoading, 
    setField, 
    addSegment,
    removeSegment,
    updateSegment,
    saveDraft, 
    submit 
  } = useTravelRequestForm(
    editingRequest,
    currentUser,
    onClose
  );

  // 2. Hook de Integração RM TOTVS
  const { 
    loading: lookupLoading, 
    costCenters, 
    employees, 
    data: integrationData, 
    fetchEmployees,
    lookupEmployee 
  } = useEmployeeIntegration();

  // 3. Hook de Avaliação de Política (Contextual)
  const { policyDecision } = usePolicyEvaluation(formData, integrationData);

  // 4. Handlers de UI Orquestrados
  const handleCostCenterChange = (ccCode: string) => {
    setField('costCenter', ccCode);
    setField('chapa', ''); // Reset cascade
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

  return (
    <div className="w-full h-full animate-in fade-in slide-in-from-bottom-6 duration-700 flex flex-col pb-10">
      <div className="bg-white w-full rounded-[48px] border-4 border-slate-50 shadow-2xl overflow-hidden flex flex-col flex-1">
        
        {/* Cabeçalho */}
        <header className="px-12 py-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 shrink-0">
          <div className="flex items-center gap-8">
            <button 
              onClick={onClose}
              className="p-4 hover:bg-slate-200 rounded-[24px] transition-all text-slate-500 bg-white border border-slate-100 shadow-sm group active:scale-90"
              title="Voltar para a listagem"
            >
              <X className="w-7 h-7 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="flex items-center gap-6 border-l-2 border-slate-200 pl-8">
              <div className="p-4 bg-blue-600 text-white rounded-[24px] shadow-2xl shadow-blue-200 border-2 border-blue-400/30">
                 <Luggage className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {editingRequest ? 'Editar Requisição' : 'Nova Solicitação'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                   <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                   <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">Workflow Operacional Ativo</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Corpo do Formulário */}
        <div className="p-12 overflow-y-auto space-y-12 custom-scrollbar flex-1 bg-white">
          
          {/* SEÇÃO 1: SINCRONIZAÇÃO RM TOTVS (UNIFICADA) */}
          <EmployeeSelectionSection 
            costCenter={formData.costCenter}
            chapa={formData.chapa}
            reason={formData.reason}
            leaveStartDate={formData.leaveStartDate}
            leaveEndDate={formData.leaveEndDate}
            costCenters={costCenters}
            employees={employees}
            loading={lookupLoading}
            onCostCenterChange={handleCostCenterChange}
            onEmployeeChange={handleEmployeeChange}
            onFieldChange={setField}
          />

          {/* SEÇÃO 2: FEEDBACK DE POLÍTICA (REAL-TIME) */}
          <PolicyStatusCard 
            decision={policyDecision || null}
            visible={!!formData.chapa}
          />

          {/* SEÇÃO 3: ITINERÁRIO (NOVO - MULTISEGMENTO) */}
          <TravelItinerarySection 
            segments={formData.segments}
            justification={formData.justification}
            onAddSegment={addSegment}
            onRemoveSegment={removeSegment}
            onUpdateSegment={updateSegment}
            onFieldChange={setField}
          />
        </div>

        {/* Rodapé — Ações Persistentes */}
        <TravelFormFooterActions 
          onSaveDraft={saveDraft}
          onSubmit={submit}
          policyDecision={policyDecision || null}
          formLoading={formLoading}
        />
      </div>
    </div>
  );
}
