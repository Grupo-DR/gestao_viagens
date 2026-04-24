// ============================================================
// PRESENTATION — BudgetImportModal
// Modal de upload e pré-visualização do arquivo de orçamento.
// Apenas leitura + confirmação de import; toda lógica delegada
// ao budgetService. O componente é uma view pura.
// ============================================================

import React, { useCallback, useState } from 'react';
import {
  X, UploadCloud, FileSpreadsheet, Loader2, CheckCircle2,
  AlertCircle, Plane, Bus,
} from 'lucide-react';
import { parseExcelFile, clearBudgetsByYearMonth, saveBudgets } from '../../application/services/budgetService';
import { useIdentity } from '../../application/identity/IdentityContext';
import type { TravelBudget } from '../../domain/types';
import { cn } from '../../lib/utils';

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface BudgetImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

// ──────────────────────────────────────────────
// Sub-componentes
// ──────────────────────────────────────────────

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function CategoryBadge({ category }: { category: TravelBudget['category'] }) {
  return category === 'aereo' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-wider">
      <Plane className="w-2.5 h-2.5" /> Aéreo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-wider">
      <Bus className="w-2.5 h-2.5" /> Terrestre
    </span>
  );
}

// ──────────────────────────────────────────────
// Componente Principal
// ──────────────────────────────────────────────

export function BudgetImportModal({ onClose, onSuccess }: BudgetImportModalProps) {
  const { currentUser } = useIdentity();

  const [preview, setPreview] = useState<TravelBudget[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // ── Handlers de arquivo ──

  const processFile = useCallback(async (file: File) => {
    setParseError(null);
    setPreview([]);
    setFileName(file.name);
    try {
      const parsed = await parseExcelFile(file);
      if (parsed.length === 0) {
        setParseError('Nenhum registro válido encontrado. Verifique se as colunas estão corretas (Mês, CC DR, Descrição, Valor, Ano).');
        return;
      }
      setPreview(parsed);
    } catch (err: any) {
      setParseError(err.message);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // ── Confirmação do import ──

  const handleConfirm = async () => {
    if (!currentUser || preview.length === 0) return;
    setIsSaving(true);
    try {
      // Agrupa por ano+mês para limpar antes de salvar (evita duplicatas)
      const periods: Set<string> = new Set(preview.map(b => `${b.year}|||${b.month}`));
      for (const period of periods) {
        const p = String(period);
        const sepIdx = p.indexOf('|||');
        const year = Number(p.slice(0, sepIdx));
        const month = p.slice(sepIdx + 3);
        await clearBudgetsByYearMonth(year, month);
      }
      await saveBudgets(preview, currentUser);
      onSuccess();
      onClose();
    } catch (err: any) {
      setParseError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Estatísticas de pré-visualização ──

  const totalAereo = preview.filter(b => b.category === 'aereo').reduce((s, b) => s + b.value, 0);
  const totalTerrestre = preview.filter(b => b.category === 'rodoviario').reduce((s, b) => s + b.value, 0);
  const totalGeral = totalAereo + totalTerrestre;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100">

        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">Importar Budget</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                Planilha Excel — Aéreo + Terrestre
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-slate-200 rounded-2xl transition-all text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">

          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-[28px] p-10 flex flex-col items-center gap-4 cursor-pointer transition-colors',
              isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-slate-50/50 hover:border-indigo-300'
            )}
          >
            <UploadCloud className={cn('w-10 h-10 transition-colors', isDragging ? 'text-indigo-500' : 'text-slate-300')} />
            <div className="text-center">
              <p className="text-sm font-bold text-slate-600">
                Arraste seu arquivo <span className="text-indigo-600">.xlsx</span> aqui ou
              </p>
              <label
                htmlFor="budget-file"
                className="mt-2 inline-block px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
              >
                Selecionar Arquivo
              </label>
              <input
                id="budget-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium italic">
              Colunas esperadas: Mês · CC DR · Descrição · Valor · Ano (ou Ano2)
            </p>
          </div>

          {/* Erro de parse */}
          {parseError && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{parseError}</p>
            </div>
          )}

          {/* Pré-visualização */}
          {preview.length > 0 && (
            <div className="space-y-4 animate-in fade-in duration-300">

              {/* Cards de resumo */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Aéreo', value: BRL.format(totalAereo), color: 'bg-blue-50 text-blue-700', border: 'border-blue-100' },
                  { label: 'Total Terrestre', value: BRL.format(totalTerrestre), color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-100' },
                  { label: 'Total Geral', value: BRL.format(totalGeral), color: 'bg-indigo-50 text-indigo-700', border: 'border-indigo-100' },
                ].map((card) => (
                  <div key={card.label} className={cn('p-4 rounded-2xl border', card.color, card.border)}>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">{card.label}</p>
                    <p className="text-lg font-black">{card.value}</p>
                  </div>
                ))}
              </div>

              {/* Info de arquivo e contagem */}
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100/50 rounded-xl">
                <FileSpreadsheet className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-bold text-slate-600 truncate">{fileName}</span>
                <span className="ml-auto text-[10px] font-black text-slate-400 whitespace-nowrap">
                  {preview.length} registro{preview.length !== 1 ? 's' : ''} encontrado{preview.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Tabela de pré-visualização */}
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                      <tr>
                        {['Ano', 'Mês', 'CC DR', 'Categoria', 'Valor'].map((h) => (
                          <th key={h} className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {preview.map((b, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-2.5 font-bold text-slate-700">{b.year}</td>
                          <td className="px-4 py-2.5 text-slate-600">{b.month}</td>
                          <td className="px-4 py-2.5 font-mono text-slate-700">{b.costCenter}</td>
                          <td className="px-4 py-2.5"><CategoryBadge category={b.category} /></td>
                          <td className="px-4 py-2.5 font-black text-slate-900">{BRL.format(b.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer com ações */}
        <div className="px-8 py-5 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
          <p className="text-[10px] text-slate-400 font-medium italic">
            Registros existentes do mesmo mês/ano serão substituídos.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-6 py-3 rounded-2xl text-xs font-black text-slate-500 hover:bg-slate-100 transition-all uppercase tracking-widest"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={preview.length === 0 || isSaving}
              className="px-8 py-3 rounded-2xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 transition-all uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isSaving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                : <><CheckCircle2 className="w-4 h-4" /> Confirmar Import</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
