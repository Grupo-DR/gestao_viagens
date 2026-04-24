// ============================================================
// APPLICATION — Service — Budget Service
// Responsabilidades:
//   1. Parseamento do arquivo Excel (colunas Mês/CC DR/Descrição/Valor/Ano)
//   2. Persistência em batch na coleção Firestore `budgets`
//   3. Fallback para localStorage em modo demo
// Seguindo o mesmo padrão de travelRequestService.ts.
// ============================================================

import * as XLSX from 'xlsx';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  writeBatch,
  doc,
} from 'firebase/firestore';
import { db } from '../../infrastructure/firebase/firebase';
import type { TravelBudget } from '../../domain/types';
import type { UserProfile } from '../../domain/types';

// ──────────────────────────────────────────────
// Constantes
// ──────────────────────────────────────────────

const COLLECTION = 'budgets';
const DEMO_STORAGE_KEY = 'demo_budgets';

// ──────────────────────────────────────────────
// Helpers privados
// ──────────────────────────────────────────────

/**
 * Converte a coluna "Descrição" da planilha para a categoria do domínio.
 * Qualquer variação de "AÉREA" resulta em 'aereo'; do contrário, 'rodoviario'.
 */
function parseCategory(descricao: string): TravelBudget['category'] {
  const upper = descricao.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return upper.includes('AERE') || upper.includes('AERA') ? 'aereo' : 'rodoviario';
}

/**
 * Converte valor numérico ou string no formato "R$ 1.234,56" para number.
 * O Excel pode entregar números diretamente ou strings formatadas.
 */
function parseValue(raw: unknown): number {
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const cleaned = raw.replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  }
  return 0;
}

/** Lê do localStorage no modo demo */
function loadFromLocalStorage(): TravelBudget[] {
  return JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) || '[]');
}

/** Persiste no localStorage no modo demo */
function saveToLocalStorage(budgets: TravelBudget[]): void {
  const existing = loadFromLocalStorage();
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify([...existing, ...budgets]));
}

/** Remove entradas do localStorage para um ano+mês específico antes do reimport */
function clearLocalStorageByYearMonth(year: number, month: string): void {
  const existing = loadFromLocalStorage();
  const filtered = existing.filter(b => !(b.year === year && b.month === month));
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(filtered));
}

// ──────────────────────────────────────────────
// API Pública
// ──────────────────────────────────────────────

/**
 * Lê um arquivo Excel (.xlsx) e retorna os registros de budget normalizados.
 * Mapeamento de colunas esperadas:
 *   Mês → month | CC DR → costCenter | Descrição → category | Valor → value | Ano → year
 */
export function parseExcelFile(file: File): Promise<TravelBudget[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Usa a primeira planilha do arquivo
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Converte para array de objetos (linha 1 = cabeçalho)
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        const budgets: TravelBudget[] = rows
          .filter((row) => {
            // Ignora linhas sem dados essenciais
            return row['Mês'] && row['CC DR'] && row['Valor'] && row['Ano'];
          })
          .map((row): TravelBudget => ({
            year: Number(row['Ano'] ?? row['Ano2'] ?? 0),
            month: String(row['Mês'] ?? '').trim(),
            costCenter: String(row['CC DR'] ?? '').trim(),
            category: parseCategory(String(row['Descrição'] ?? '')),
            value: parseValue(row['Valor']),
          }));

        resolve(budgets);
      } catch (err) {
        reject(new Error('Falha ao processar o arquivo Excel. Verifique o formato e as colunas.'));
      }
    };

    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Remove todos os registros de budget de um mês/ano antes de um reimport,
 * evitando duplicações caso o usuário faça upload da mesma planilha duas vezes.
 */
export async function clearBudgetsByYearMonth(year: number, month: string): Promise<void> {
  try {
    const col = collection(db, COLLECTION);
    const q = query(col, where('year', '==', year), where('month', '==', month));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => batch.delete(doc(db, COLLECTION, docSnap.id)));
    await batch.commit();
  } catch (error: any) {
    if (error.message?.includes('permission')) {
      clearLocalStorageByYearMonth(year, month);
    } else {
      throw error;
    }
  }
}

/**
 * Persiste um conjunto de budgets no Firestore.
 * Cada registro recebe os metadados de auditoria (uploadedAt, uploadedBy).
 * Em modo demo (erro de permissão), persiste no localStorage.
 */
export async function saveBudgets(
  budgets: TravelBudget[],
  author: UserProfile
): Promise<void> {
  const now = new Date().toISOString();
  const enriched = budgets.map((b) => ({
    ...b,
    uploadedAt: now,
    uploadedBy: author.email,
  }));

  try {
    const col = collection(db, COLLECTION);
    // Firestore não suporta batch com addDoc; usamos Promise.all para performance
    await Promise.all(enriched.map((b) => addDoc(col, b)));
  } catch (error: any) {
    if (error.message?.includes('permission')) {
      console.warn('[Demo Mode] Salvando budgets no localStorage.');
      saveToLocalStorage(enriched);
    } else {
      throw new Error(`Erro ao salvar orçamento: ${error.message}`);
    }
  }
}
