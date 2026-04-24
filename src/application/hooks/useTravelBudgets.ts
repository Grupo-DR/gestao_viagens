// ============================================================
// APPLICATION — Hook — useTravelBudgets
// Subscribe ao Firestore na coleção 'budgets'.
// Fallback para localStorage quando em modo demo.
// Segue o mesmo padrão de useTravelRequests.ts.
// ============================================================

import { useState, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../infrastructure/firebase/firebase';
import { Budget } from '../../domain/budget/types';

// ──────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────

interface UseTravelBudgetsResult {
  budgets: Budget[];
  loading: boolean;
  error: string | null;
  isDemoMode: boolean;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

const MONTH_MAP: Record<string, string> = {
  'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
  'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
  'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
};

function loadDemoBudgets(): Budget[] {
  const stored = localStorage.getItem('demo_budgets');
  if (stored) return JSON.parse(stored);
  
  // Budgets default para demonstração
  return [
    {
      id: 'budget-1',
      period: '2026-03',
      costCenter: '3044.01 - Obra A',
      amount: 5000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin'
    },
    {
      id: 'budget-2',
      period: '2026-04',
      costCenter: '506070 - RH Central',
      amount: 3500,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin'
    }
  ];
}

function normalizeDocument(raw: Record<string, unknown> & { id: string }): Budget {
  const year = Number(raw['year']);
  const monthName = String(raw['month']).toLowerCase();
  const monthNum = MONTH_MAP[monthName] || '01';
  
  return {
    id: raw.id,
    period: `${year}-${monthNum}`,
    costCenter: String(raw['costCenter']),
    amount: Number(raw['value']),
    createdAt: (raw['uploadedAt'] as string) || new Date().toISOString(),
    updatedAt: (raw['uploadedAt'] as string) || new Date().toISOString(),
    createdBy: (raw['uploadedBy'] as string) || 'system',
  };
}

// ──────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────

/**
 * Retorna todos os registros de budget em tempo real.
 * Ativa modo demo automaticamente em caso de erro de permissão.
 */
export function useTravelBudgets(): UseTravelBudgetsResult {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'budgets'),
      orderBy('year', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          setBudgets(loadDemoBudgets());
          setIsDemoMode(true);
        } else {
          const normalized = snapshot.docs.map((docSnap) =>
            normalizeDocument({ id: docSnap.id, ...docSnap.data() })
          );
          setBudgets(normalized);
          setIsDemoMode(false);
        }
        setLoading(false);
      },
      (err) => {
        if (err.message.toLowerCase().includes('permission')) {
          console.warn('[Firestore] Budget: acesso negado. Ativando modo demo.');
          setBudgets(loadDemoBudgets());
          setIsDemoMode(true);
        } else {
          setError(err.message);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { budgets, loading, error, isDemoMode };
}
