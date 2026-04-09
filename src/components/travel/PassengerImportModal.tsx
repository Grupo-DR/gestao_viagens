import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { bulkUploadPassengers, PassengerMasterData } from '../../application/services/passengerMasterService';
import { cn } from '../../lib/utils';

interface PassengerImportModalProps {
  onClose: () => void;
}

export function PassengerImportModal({ onClose }: PassengerImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        setError('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const processExcel = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Converte para JSON (range A1:D...)
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 'A' });

      // Validação básica: Pula o cabeçalho se existir (checa se a primeira linha tem "Chapa" ou similar)
      const rows = jsonData.filter((row, index) => {
        if (index === 0 && (row.A?.toString().toLowerCase().includes('chapa') || !row.A)) return false;
        return row.A && row.C; // Chapa e CPF obrigatórios
      });

      if (rows.length === 0) {
        throw new Error('Nenhum dado válido encontrado na planilha.');
      }

      const formattedData: PassengerMasterData[] = rows.map(row => {
        // Tratamento de Data de Nascimento (Excel pode vir como Serial Number ou String)
        let birthDate = '';
        if (typeof row.D === 'number') {
          const date = XLSX.utils.format_cell({ v: row.D, t: 'd' });
          // Converte para YYYY-MM-DD
          const d = new Date((row.D - 25569) * 86400 * 1000);
          birthDate = d.toISOString().split('T')[0];
        } else if (typeof row.D === 'string') {
          // Tenta converter dd/mm/aaaa para YYYY-MM-DD
          const parts = row.D.split('/');
          if (parts.length === 3) {
            birthDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }

        return {
          chapa: String(row.A).trim(),
          name: String(row.B || '').trim(),
          cpf: String(row.C || '').replace(/\D/g, ''), // Mantém apenas números
          birthDate: birthDate,
          updatedAt: new Date().toISOString()
        };
      });

      const res = await bulkUploadPassengers(formattedData);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao processar o arquivo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Upload className="text-white w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Importar Passageiros</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Módulo Capital Humano</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-slate-200/50 rounded-2xl transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          
          {/* Instruções */}
          <div className="bg-blue-50/50 rounded-[32px] p-6 border border-blue-100/50">
            <h4 className="flex items-center gap-2 text-blue-700 font-black text-[10px] uppercase tracking-widest mb-4">
              <FileSpreadsheet className="w-4 h-4" /> Layout do Arquivo Excel
            </h4>
            <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
              <div className="p-2 bg-white rounded-xl border border-blue-100 shadow-sm">
                <p className="font-black text-blue-800">Coluna A</p>
                <p className="text-slate-500 mt-1">Chapa</p>
              </div>
              <div className="p-2 bg-white rounded-xl border border-blue-100 shadow-sm">
                <p className="font-black text-blue-800">Coluna B</p>
                <p className="text-slate-500 mt-1">Nome</p>
              </div>
              <div className="p-2 bg-white rounded-xl border border-blue-100 shadow-sm">
                <p className="font-black text-blue-800">Coluna C</p>
                <p className="text-slate-500 mt-1">CPF</p>
              </div>
              <div className="p-2 bg-white rounded-xl border border-blue-100 shadow-sm">
                <p className="font-black text-blue-800">Coluna D</p>
                <p className="text-slate-500 mt-1">Nascimento</p>
              </div>
            </div>
          </div>

          {!result ? (
            <div className="space-y-6">
              {/* Dropzone/Input */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative h-48 border-2 border-dashed rounded-[40px] flex flex-col items-center justify-center transition-all cursor-pointer group",
                  file ? "border-blue-300 bg-blue-50/30" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
                )}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls"
                  className="hidden"
                />
                
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <FileSpreadsheet className="w-10 h-10 text-blue-600" />
                    <div className="text-center">
                      <p className="text-sm font-black text-slate-800">{file.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="w-14 h-14 bg-slate-100 rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-100 transition-all">
                       <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-700">Clique para selecionar</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1">Arquivos .xlsx suportados</p>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 animate-in slide-in-from-top-1">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-bold tracking-tight">{error}</p>
                </div>
              )}

              <button
                disabled={!file || loading}
                onClick={processExcel}
                className="w-full py-4 bg-slate-900 text-white rounded-[24px] font-black text-sm hover:bg-slate-800 disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center gap-3 shadow-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>PROCESSANDO...</span>
                  </>
                ) : (
                  <>
                    <span>INICIAR IMPORTAÇÃO</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Sucesso/Resultado */
            <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-[32px] flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Importação Concluída</h3>
                <p className="text-slate-500 font-medium text-sm mt-2">Os dados dos passageiros foram sincronizados.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-green-50 rounded-3xl border border-green-100">
                  <p className="text-2xl font-black text-green-700">{result.success}</p>
                  <p className="text-[10px] font-black text-green-600/70 uppercase tracking-widest mt-1">Sucessos</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-2xl font-black text-slate-400">{result.failed}</p>
                  <p className="text-[10px] font-black text-slate-400/70 uppercase tracking-widest mt-1">Erros</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full py-4 border-2 border-slate-100 text-slate-600 rounded-[24px] font-black text-sm hover:bg-slate-50 transition-all mt-4"
              >
                FECHAR JANELA
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
