// ============================================================
// PRESENTATION — TravelForm (Sprint Final - Refatorado)
// View modularizada: orquestra seções visuais do diretório ./form/
// REORGANIZAÇÃO: Motivo e Datas RM agora integrados no bloco inicial.
// ============================================================

import React, { useState } from 'react';
import { TravelReason } from '../domain/enums.ts';
import { TravelRequest } from '../domain/types.ts';
import { useIdentity } from '../application/identity/IdentityContext.tsx';
import { useTravelRequestForm } from '../application/hooks/useTravelRequestForm.ts';
import { useEmployeeIntegration } from '../application/hooks/useEmployeeIntegration.ts';
import { usePolicyEvaluation } from '../application/hooks/usePolicyEvaluation.ts';
import { X, Luggage } from 'lucide-react';
import { getPassengerByChapa } from '../application/services/passengerMasterService.ts';

// Subcomponentes de Formulário
import { EmployeeSelectionSection } from './travel/form/EmployeeSelectionSection.tsx';
import { PolicyStatusCard } from './travel/form/PolicyStatusCard.tsx';
import { DestinationCityAlert } from './travel/form/DestinationCityAlert.tsx';
import { TravelItinerarySection } from './travel/form/TravelItinerarySection.tsx';
import { TravelFormFooterActions } from './travel/form/TravelFormFooterActions.tsx';

interface TravelFormProps {
  onClose: () => void;
  editingRequest: TravelRequest | null;
}

export function TravelForm({ onClose, editingRequest }: TravelFormProps) {
  const { currentUser } = useIdentity();
  const [homeCity, setHomeCity] = useState<string>('');
  
  // 1. Hook de Estado do Formulário
  const { 
    formData, 
    loading: formLoading, 
    errors,
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
      
      // Busca dados mestre (CPF/Nascimento/Cidade)
      getPassengerByChapa(selected.chapa).then(master => {
        if (master) {
          setField('cpf', master.cpf);
          setField('birthDate', master.birthDate);
          setHomeCity(master.homeCity || '');
        } else {
          setField('cpf', '');
          setField('birthDate', '');
          setHomeCity('');
        }
      });
    }
  };

  return (
    <div className="w-full min-h-full animate-in fade-in slide-in-from-bottom-6 duration-700 flex flex-col gap-12 pb-20">
      
      {/* Cabeçalho de Página (Integrado) */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <button 
            onClick={onClose}
            className="p-3.5 hover:bg-white rounded-2xl transition-all text-slate-400 bg-slate-50 border border-slate-100 shadow-sm group active:scale-90"
            title="Voltar para a listagem"
          >
            <X className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex items-center gap-5 border-l-2 border-slate-200 pl-6">
            <div className="p-3.5 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-100">
               <Luggage className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {editingRequest ? 'Editar Requisição' : 'Nova Solicitação'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                 <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                 <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic">Workflow Operacional Ativo</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo do Formulário (Sem Container de Card) */}
      <div className="space-y-16">
        
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
          cpf={formData.cpf}
          birthDate={formData.birthDate}
        />

        {/* SEÇÃO 2: FEEDBACK DE POLÍTICA (REAL-TIME) */}
        <PolicyStatusCard 
          decision={policyDecision || null}
          visible={!!formData.chapa}
        />

        {/* ALERTA DE CIDADE (Validação de Destino vs. Cadastro RM) */}
        <DestinationCityAlert
          homeCity={homeCity}
          segments={formData.segments}
          reason={formData.reason}
          visible={!!formData.chapa && formData.segments.length > 0}
        />

        {/* SEÇÃO 3: ITINERÁRIO (MULTISEGMENTO) */}
        <TravelItinerarySection 
          segments={formData.segments}
          justification={formData.justification}
          segmentErrors={errors}
          onAddSegment={addSegment}
          onRemoveSegment={removeSegment}
          onUpdateSegment={updateSegment}
          onFieldChange={setField}
        />
      </div>

      {/* Rodapé — Ações Persistentes (Integrado) */}
      <TravelFormFooterActions 
        onSaveDraft={saveDraft}
        onSubmit={submit}
        policyDecision={policyDecision || null}
        formLoading={formLoading}
      />
    </div>
  );
}
