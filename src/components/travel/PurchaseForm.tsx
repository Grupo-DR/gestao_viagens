import React, { useState } from 'react';
import { ShoppingCart, Send, Loader2, X, Plane, Bus, Calendar, Clock, DollarSign, Mail, CheckCircle } from 'lucide-react';
import { TravelRequest, PurchaseInfo, TravelSegment } from '../../domain/types.ts';
import { ApprovalEmailBox } from './ApprovalEmailBox.tsx';
import { cn } from '../../lib/utils.ts';
import { RequestStatus } from '../../domain/enums.ts';

interface PurchaseFormProps {
  request: TravelRequest;
  initialData?: Partial<PurchaseInfo>;
  segments: TravelSegment[];
  onSubmit: (data: Partial<PurchaseInfo>, comment: string, updatedSegments?: TravelSegment[], nextStatus?: RequestStatus) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * PurchaseForm (Evolution v2)
 * Permite ao comprador preencher os dados de emissão e AJUSTAR o itinerário real.
 * Agora com suporte a fluxo de aprovação de variação.
 */
export function PurchaseForm({ request, initialData, segments, onSubmit, onCancel, isLoading }: PurchaseFormProps) {
  const [ticketNumber, setTicketNumber] = useState(initialData?.ticketNumber || '');
  const [airline, setAirline] = useState(initialData?.airline || '');
  const [price, setPrice] = useState(initialData?.price?.toString() || '');
  const [comment, setComment] = useState('');
  const [showEmailBox, setShowEmailBox] = useState(false);
  
  // Estado local para os trechos editáveis
  const [editableSegments, setEditableSegments] = useState<TravelSegment[]>(JSON.parse(JSON.stringify(segments)));

  const handleSegmentChange = (index: number, updates: Partial<TravelSegment>) => {
    const newSegments = [...editableSegments];
    newSegments[index] = { ...newSegments[index], ...updates };
    setEditableSegments(newSegments);
    
    // Auto-update do valor total (soma os priceQuote/finalPrice)
    const total = newSegments.reduce((sum, s) => sum + (s.priceQuote || 0), 0);
    setPrice(total.toFixed(2).replace('.', ','));
  };

  const isFinalizing = request.status === RequestStatus.EM_PROCESSO_DE_COMPRA;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPrice = parseFloat(price.replace(',', '.')) || 0;
    
    // DISPONIVEL_PARA_COMPRA: comprador inicia a compra (dados reais) → EM_PROCESSO_DE_COMPRA
    // EM_PROCESSO_DE_COMPRA: comprador confirma emissão final (localizador + bilhete) → EMITIDA
    const nextStatus = isFinalizing 
      ? RequestStatus.EMITIDA 
      : RequestStatus.EM_PROCESSO_DE_COMPRA;

    onSubmit(
      { 
        ticketNumber: ticketNumber.trim().toUpperCase(), 
        airline: airline.trim(), 
        price: finalPrice 
      },
      comment.trim() || (isFinalizing 
        ? 'Emissão confirmada com dados reais do bilhete.' 
        : 'Compra iniciada. Dados reais registrados pelo comprador.'),
      editableSegments,
      nextStatus
    );
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="p-8 bg-blue-50/20 rounded-[40px] border-2 border-blue-100/50 space-y-8 animate-in slide-in-from-top-4 duration-500 relative shadow-2xl shadow-blue-900/5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-blue-200 shadow-xl">
            {isFinalizing ? <CheckCircle className="w-6 h-6" /> : <ShoppingCart className="w-6 h-6" />}
          </div>
          <div>
            <h4 className="font-black text-slate-900 tracking-tight text-lg italic">
              {isFinalizing ? 'Finalizar Emissão' : 'Registrar Dados da Compra'}
            </h4>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] mt-0.5">
              {isFinalizing ? 'Confirme os dados do bilhete para encerrar' : 'Preencha os dados reais da passagem comprada'}
            </p>
          </div>
        </div>
        <button 
          type="button"
          onClick={onCancel}
          className="p-2.5 hover:bg-white rounded-full text-slate-400 transition-all hover:rotate-90"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* SEÇÃO: EDIÇÃO DE ITINERÁRIO (ORÇADO VS REALIZADO) */}
      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
           <Calendar className="w-3 h-3" /> Itinerário Real (Ajustado pelo Comprador)
        </label>
        
        <div className="grid gap-4">
          {editableSegments.map((seg, idx) => (
            <div key={seg.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-slate-900 text-white text-[10px] font-black flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <span className="text-xs font-black text-slate-800 italic uppercase tracking-wider">
                    {seg.origin} → {seg.destination}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 opacity-50">
                  {seg.transportMode === 'aereo' ? <Plane className="w-3.5 h-3.5" /> : <Bus className="w-3.5 h-3.5" />}
                  <span className="text-[10px] font-bold uppercase">{seg.transportMode}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cia / Voo Real</label>
                   <input 
                     type="text"
                     value={seg.airlineQuote || ''}
                     onChange={(e) => handleSegmentChange(idx, { airlineQuote: e.target.value })}
                     className="w-full bg-slate-50/50 border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                     placeholder="Ex: LATAM 3450"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Partida Real</label>
                   <div className="flex items-center gap-2 bg-slate-50/50 rounded-xl px-4 py-2">
                     <Clock className="w-3.5 h-3.5 text-slate-300" />
                     <input 
                       type="datetime-local"
                       value={seg.departureDateTime.slice(0, 16)}
                       onChange={(e) => handleSegmentChange(idx, { departureDateTime: new Date(e.target.value).toISOString() })}
                       className="bg-transparent border-none text-xs font-bold focus:ring-0 w-full"
                     />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-blue-600">Valor Final (BRL)</label>
                   <div className="flex items-center gap-2 bg-blue-50/50 rounded-xl px-4 py-2 border border-blue-100">
                     <DollarSign className="w-3.5 h-3.5 text-blue-500" />
                     <input 
                       type="number"
                       step="0.01"
                       value={seg.priceQuote || 0}
                       onChange={(e) => handleSegmentChange(idx, { priceQuote: parseFloat(e.target.value) || 0 })}
                       className="bg-transparent border-none text-xs font-black text-blue-700 focus:ring-0 w-full"
                     />
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEÇÃO: DADOS GERAIS DO BILHETE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Localizador / Bilhete Geral</label>
          <input
            required
            type="text"
            placeholder="Ex: GHJ89K"
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value)}
            className="w-full px-6 py-4 rounded-[22px] border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-black placeholder:text-slate-300 uppercase shadow-inner"
          />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Valor Total Ajustado (R$)</label>
          <div className="relative">
            <input
              required
              readOnly
              type="text"
              value={price}
              className="w-full px-6 py-4 rounded-[22px] border border-blue-100 bg-blue-50/30 text-sm font-black text-blue-700 shadow-inner"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => setShowEmailBox(true)}
          className="px-6 py-4 rounded-2xl text-[11px] font-black text-indigo-600 hover:bg-indigo-50 transition-all uppercase tracking-widest border border-indigo-100 flex items-center gap-2"
        >
          <Mail className="w-4 h-4" />
          E-mail de Aprovação
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-8 py-4 rounded-2xl text-[11px] font-bold text-slate-400 hover:bg-slate-200 transition-all uppercase tracking-widest"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-10 py-4 rounded-2xl text-[11px] font-black text-white bg-indigo-600 hover:bg-indigo-700 transition-all uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-100"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isFinalizing ? <CheckCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          {isFinalizing ? 'Finalizar Compra' : 'Registrar e Processar Compra'}
        </button>
      </div>

      {showEmailBox && (
        <ApprovalEmailBox 
          request={request}
          updatedSegments={editableSegments}
          onClose={() => setShowEmailBox(false)}
        />
      )}
    </form>
  );
}
