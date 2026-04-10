import React from 'react';
import { FileQuestion, Loader2, Plane } from 'lucide-react';
import { TravelReason } from '../../../domain/enums.ts';
import { TravelPolicyEvaluation } from '../../../domain/policy/types.ts';
import { TravelSegment } from '../../../domain/types.ts';
import { cn } from '../../../lib/utils.ts';
import { DestinationCityAlert } from './DestinationCityAlert.tsx';
import { PolicyStatusCard } from './PolicyStatusCard.tsx';

interface EmployeeSelectionSectionProps {
  costCenter: string;
  chapa: string;
  reason: TravelReason;
  leaveStartDate: string;
  leaveEndDate: string;
  costCenters: Array<{ code: string; label: string }>;
  employees: Array<{ chapa: string; name: string }>;
  loading: boolean;
  onCostCenterChange: (code: string) => void;
  onEmployeeChange: (chapa: string) => void;
  onFieldChange: (field: string, value: any) => void;
  cpf: string;
  birthDate: string;
  policyEvaluation: TravelPolicyEvaluation | null;
  homeCity: string;
  segments: TravelSegment[];
}

const SELECT_CLASS =
  'w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-white text-sm font-bold text-slate-700 shadow-sm disabled:opacity-50 disabled:bg-slate-50';

const INPUT_CLASS =
  'w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm font-bold text-slate-700 shadow-sm placeholder:text-slate-300';

export function EmployeeSelectionSection({
  costCenter,
  chapa,
  reason,
  leaveStartDate,
  leaveEndDate,
  costCenters,
  employees,
  loading,
  onCostCenterChange,
  onEmployeeChange,
  onFieldChange,
  cpf,
  birthDate,
  policyEvaluation,
  homeCity,
  segments,
}: EmployeeSelectionSectionProps) {
  const isHRReason = [
    TravelReason.FERIAS,
    TravelReason.FOLGA,
    TravelReason.FOLGA_FERIAS,
  ].includes(reason);

  return (
    <section className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 text-blue-600">
        <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
          <Plane className="w-5 h-5" />
        </div>
        <h3 className="font-black text-[10px] uppercase tracking-[0.3em]">Sincronização RM TOTVS</h3>
        <div className="h-px flex-1 bg-slate-100 ml-2" />
      </div>

      <div className="space-y-6 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="space-y-2.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
              1. Unidade / Centro de Custo
            </label>
            <select
              className={SELECT_CLASS}
              value={costCenter}
              onChange={(e) => onCostCenterChange(e.target.value)}
            >
              <option value="">Selecione a unidade...</option>
              {costCenters.map((cc) => (
                <option key={cc.code} value={cc.code}>
                  {cc.label}
                </option>
              ))}
            </select>
          </div>

          <div
            className={cn(
              'space-y-2.5 transition-opacity duration-300',
              !costCenter && 'opacity-40 grayscale pointer-events-none'
            )}
          >
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
              2. Seleção do Passageiro
            </label>
            <div className="relative">
              <select
                className={cn(SELECT_CLASS, loading && 'pr-12')}
                value={chapa}
                onChange={(e) => onEmployeeChange(e.target.value)}
                disabled={!costCenter}
              >
                <option value="">Selecione o colaborador...</option>
                {employees.map((employee) => (
                  <option key={employee.chapa} value={employee.chapa}>
                    {employee.name} ({employee.chapa})
                  </option>
                ))}
              </select>
              {loading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-6">
          <div className={cn('space-y-2.5 transition-opacity duration-300', !chapa && 'opacity-40 grayscale')}>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
              3. CPF do Passageiro
            </label>
            <input
              type="text"
              value={cpf ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : ''}
              readOnly
              placeholder="Aguardando base mestre..."
              className={cn(INPUT_CLASS, 'bg-slate-50 border-slate-100 text-slate-500 shadow-none')}
            />
          </div>

          <div className={cn('space-y-2.5 transition-opacity duration-300', !chapa && 'opacity-40 grayscale')}>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
              4. Data de Nascimento
            </label>
            <input
              type="text"
              value={birthDate ? birthDate.split('-').reverse().join('/') : ''}
              readOnly
              placeholder="Aguardando base mestre..."
              className={cn(INPUT_CLASS, 'bg-slate-50 border-slate-100 text-slate-500 shadow-none')}
            />
          </div>

          <div
            className={cn(
              'space-y-2.5 transition-opacity duration-300',
              !chapa && 'opacity-40 grayscale pointer-events-none'
            )}
          >
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
              <FileQuestion className="w-3 h-3" /> 5. Motivo da Viagem
            </label>
            <select
              className={SELECT_CLASS}
              value={reason}
              onChange={(e) => onFieldChange('reason', e.target.value as TravelReason)}
              disabled={!chapa}
            >
              {Object.values(TravelReason).map((travelReason) => (
                <option key={travelReason} value={travelReason}>
                  {travelReason}
                </option>
              ))}
            </select>
          </div>
        </div>

        {chapa && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
            <PolicyStatusCard
              decision={policyEvaluation?.date || null}
              visible={true}
              showDateInputs={isHRReason}
              leaveStartDate={leaveStartDate}
              leaveEndDate={leaveEndDate}
              onFieldChange={onFieldChange}
            />
            <DestinationCityAlert
              homeCity={homeCity}
              segments={segments}
              reason={reason}
              visible={true}
              geoDecision={policyEvaluation?.geo}
            />
          </div>
        )}

        <div className="mt-1 px-1">
          <p className="text-[10px] text-slate-400 font-medium italic">
            Os campos acima atualizam automaticamente as políticas de data e destino conforme integração com o RM.
          </p>
        </div>
      </div>
    </section>
  );
}
