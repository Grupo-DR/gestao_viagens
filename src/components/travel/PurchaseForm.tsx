import React, { useState } from 'react';
import { ShoppingCart, Send, Loader2, X } from 'lucide-react';
import { PurchaseInfo } from '../../domain/types.ts';
import { cn } from '../../lib/utils.ts';

interface PurchaseFormProps {
  initialData?: Partial<PurchaseInfo>;
  onSubmit: (data: Partial<PurchaseInfo>, comment: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * PurchaseForm (Sprint Final)
 * Formulário para preenchimento de dados de emissão por compradores.
 * Totalmente tipado e refatorado.
 */
export function PurchaseForm({ initialData, onSubmit, onCancel, isLoading }: PurchaseFormProps) {
  const [ticketNumber, setTicketNumber] = useState(initialData?.ticketNumber || '');
  const [airline, setAirline] = useState(initialData?.airline || '');
  const [price, setPrice] = useState(initialData?.price?.toString() || '');
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPrice = parseFloat(price.replace(',', '.')) || 0;
    
    onSubmit(
      { 
        ticketNumber: ticketNumber.trim().toUpperCase(), 
        airline: airline.trim(), 
        price: finalPrice 
      },
      comment.trim() || 'Emissão concluída pelo comprador via portal.'
    );
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="p-6 bg-blue-50/10 rounded-[32px] border-2 border-blue-100/50 space-y-6 animate-in slide-in-from-top-2 duration-300 relative"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-blue-200 shadow-lg">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 tracking-tight leading-tight">Dados de Emissão</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Etapa Final de Compra</p>
          </div>
        </div>
        <button 
          type="button"
          onClick={onCancel}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Localizador / Bilhete</label>
          <input
            required
            type="text"
            placeholder="Ex: GHJ89K"
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold placeholder:text-slate-300 uppercase"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Companhia Aérea</label>
          <input
            required
            type="text"
            placeholder="Ex: LATAM, AZUL..."
            value={airline}
            onChange={(e) => setAirline(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold placeholder:text-slate-300"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Valor do Bilhete (BRL)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
            <input
              required
              type="text"
              placeholder="0,00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-mono font-bold"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Observações do Voo</label>
          <input
            type="text"
            placeholder="Ex: Escala em Congonhas..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium italic"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-blue-50">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-200 transition-all uppercase tracking-widest"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2 text-xs uppercase tracking-widest group"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          )}
          Finalizar Compra
        </button>
      </div>
    </form>
  );
}
