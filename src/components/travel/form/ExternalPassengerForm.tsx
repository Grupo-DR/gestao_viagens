import React from 'react';
import { cn } from '../../../lib/utils.ts';

interface ExternalPassengerFormProps {
  fullName: string;
  cpfOrPassport: string;
  birthDate: string;
  contactEmail: string;
  contactPhone: string;
  costCenter: string;
  onFieldChange: (field: string, value: any) => void;
}

const INPUT_CLASS =
  'w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm font-bold text-slate-700 shadow-sm placeholder:text-slate-300';

export function ExternalPassengerForm({
  fullName,
  cpfOrPassport,
  birthDate,
  contactEmail,
  contactPhone,
  costCenter,
  onFieldChange,
}: ExternalPassengerFormProps) {
  return (
    <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-xs text-amber-800 font-medium">
          <strong>Aviso de Apadrinhamento:</strong> O custo da viagem deste passageiro externo 
          será rateado no centro de custo <strong>{costCenter || 'selecionado acima'}</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Nome Completo do Passageiro *
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => onFieldChange('externalFullName', e.target.value)}
            placeholder="Ex: João da Silva"
            className={INPUT_CLASS}
            required
          />
        </div>

        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            CPF (apenas números) ou Passaporte *
          </label>
          <input
            type="text"
            value={cpfOrPassport}
            onChange={(e) => onFieldChange('externalCpfOrPassport', e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
            placeholder="Ex: 12345678901 ou AB123456"
            className={INPUT_CLASS}
            required
          />
          {cpfOrPassport.length > 0 && cpfOrPassport.length < 11 && !/[a-zA-Z]/.test(cpfOrPassport) && (
             <p className="text-[10px] text-amber-600 font-bold px-1">CPF deve ter 11 dígitos se não for passaporte.</p>
          )}
        </div>

        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Data de Nascimento *
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => onFieldChange('externalBirthDate', e.target.value)}
            className={INPUT_CLASS}
            required
          />
        </div>

        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            E-mail de Contato
          </label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => onFieldChange('externalContactEmail', e.target.value)}
            placeholder="Ex: joao@email.com"
            className={INPUT_CLASS}
          />
        </div>

        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Telefone de Contato
          </label>
          <input
            type="text"
            value={contactPhone}
            onChange={(e) => onFieldChange('externalContactPhone', e.target.value)}
            placeholder="Ex: 11999999999"
            className={INPUT_CLASS}
          />
        </div>
      </div>
    </div>
  );
}
