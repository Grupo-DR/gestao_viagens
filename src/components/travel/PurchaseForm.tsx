import React, { useState } from 'react';
import { ShoppingCart, Send, Loader2 } from 'lucide-react';
import { PurchaseInfo } from '../../domain/types.ts';
import { cn } from '../../lib/utils.ts';

/**
 * PurchaseForm (Sprint 3)
 * Formulário para preenchimento de dados de emissão por compradores.
 */

interface PurchaseFormProps {
  initialData?: Partial<PurchaseInfo>;
  onSubmit: (data: Partial<PurchaseInfo>, comment: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PurchaseForm({ initialData, onSubmit, onCancel, isLoading }: PurchaseFormProps) {
  const [ticketNumber, setTicketNumber] = useState(initialData?.ticketNumber || '');
  const [airline, setAirline] = useState(initialData?.airline || '');
  const [price, setPrice] = useState(initialData?.price?.toString() || '');
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(
      { ticketNumber, airline, price: parseFloat(price) || 0 },
      comment || 'Emissão concluída pelo comprador.'
    );
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-blue-50/30 rounded-[28px] border border-blue-100/50 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-blue-600 text-white rounded-lg shadow-blue-200 shadow-lg">
          <ShoppingCart className="w-4 h-4" />
        </div>
        <h4 className="font-bold text-slate-900 tracking-tight">Dados de Emissão</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Localizador / Bilhete</label>
          <input
            required
            type="text"
            placeholder="Ex: ABC123"
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-semibold"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Companhia Aérea</label>
          <input
            required
            type="text"
            placeholder="Ex: LATAM, Azul, Gol"
            value={airline}
            onChange={(e) => setAirline(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-semibold"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Valor Final (BRL)</label>
          <input
            required
            type="number"
            step="0.01"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-mono font-bold"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Comentário Adicional</label>
          <input
            type="text"
            placeholder="Opcional..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
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
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2 text-xs uppercase tracking-widest"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Concluir Emissão
        </button>
      </div>
    </form>
  );
}
