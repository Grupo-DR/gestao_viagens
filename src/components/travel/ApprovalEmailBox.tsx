import React, { useState, useMemo } from 'react';
import { X, Copy, Mail, CheckCircle2 } from 'lucide-react';
import { TravelRequest, TravelSegment } from '../../domain/types.ts';
import { getPassengerDisplayName } from '../../domain/travelRequest.rules.ts';
import { cn } from '../../lib/utils.ts';

interface ApprovalEmailBoxProps {
  request: TravelRequest;
  updatedSegments?: TravelSegment[];
  onClose: () => void;
}

/**
 * ApprovalEmailBox
 * Gera um rascunho de e-mail profissional comparando Orçado vs Real.
 */
export function ApprovalEmailBox({ request, updatedSegments, onClose }: ApprovalEmailBoxProps) {
  const [copied, setCopied] = useState(false);

  const emailContent = useMemo(() => {
    const passenger = getPassengerDisplayName(request);
    const chapa = request.employee.chapa;
    
    // Define o que é Orçado e o que é Real
    // Orçado: requestedSegments (v3) ou o segments original
    const budgetedSegments = request.travel.requestedSegments || request.travel.segments || [];
    // Real: updatedSegments (se estiver editando) ou o segments atual
    const actualSegments = updatedSegments || request.travel.segments || [];

    const totalBudgeted = budgetedSegments.reduce((sum, s) => sum + (s.priceQuote || 0), 0);
    const totalActual = actualSegments.reduce((sum, s) => sum + (s.priceQuote || 0), 0);
    const variation = totalActual - totalBudgeted;
    const variationPercent = totalBudgeted > 0 ? (variation / totalBudgeted) * 100 : 0;

    let text = `Solicitação de De Acordo para Emissão de Passagem\n`;
    text += `==============================================\n\n`;
    text += `Olá,\n\n`;
    text += `Solicitamos seu "de acordo" para a emissão da passagem abaixo:\n\n`;
    text += `PASSAGEIRO: ${passenger.toUpperCase()}\n`;
    text += `CHAPA: ${chapa}\n`;
    text += `MOTIVO: ${request.travel.reason}\n\n`;
    
    text += `COMPARATIVO DE CUSTOS (ORÇADO vs REAL):\n`;
    text += `----------------------------------------------\n`;
    
    actualSegments.forEach((seg, idx) => {
      const budgeted = budgetedSegments[idx];
      text += `Trecho ${idx + 1}: ${seg.origin} -> ${seg.destination}\n`;
      text += `  - Cia (Orçada): ${budgeted?.airlineQuote || 'N/A'}\n`;
      text += `  - Cia (Real):   ${seg.airlineQuote || 'N/A'}\n`;
      text += `  - Valor Orçado: R$ ${budgeted?.priceQuote?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}\n`;
      text += `  - Valor Atual:  R$ ${seg.priceQuote?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}\n\n`;
    });

    text += `----------------------------------------------\n`;
    text += `RESUMO FINANCEIRO:\n`;
    text += `VALOR TOTAL ORÇADO: R$ ${totalBudgeted.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    text += `VALOR TOTAL REAL:   R$ ${totalActual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    text += `VARIAÇÃO:           R$ ${variation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${variation >= 0 ? '+' : ''}${variationPercent.toFixed(1)}%)\n\n`;

    text += `Ficamos no aguardo de sua confirmação para prosseguir com a emissão.\n\n`;
    text += `Atenciosamente,\n`;
    text += `Departamento de Compras - Grupo DR`;

    return text;
  }, [request, updatedSegments]);

  const handleCopy = () => {
    navigator.clipboard.writeText(emailContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 tracking-tight">E-mail de Aprovação</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Rascunho Automático Gerado</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 bg-slate-50/30">
          <pre className="whitespace-pre-wrap font-mono text-xs text-slate-700 bg-white p-6 rounded-2xl border border-slate-200 shadow-inner leading-relaxed select-all">
            {emailContent}
          </pre>
        </div>

        <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between gap-4">
          <p className="text-[10px] text-slate-400 font-medium italic max-w-xs leading-tight">
            Use este texto para enviar ao gestor da obra ou centro de custo para validar variações de preço.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-100 transition-all uppercase tracking-widest"
            >
              Fechar
            </button>
            <button
              onClick={handleCopy}
              className={cn(
                "px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl shadow-indigo-100",
                copied ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"
              )}
            >
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado!' : 'Copiar Conteúdo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
