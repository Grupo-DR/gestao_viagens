// ============================================================
// APPLICATION — Hook — useTravelBudgets
// Subscribe ao Firestore na coleção 'budgets'.
// Fallback para localStorage quando em modo demo.
// Segue o mesmo padrão de useTravelRequests.ts.
// ============================================================

import { useState, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../infrastructure/firebase/firebase';
import type { TravelBudget } from '../../domain/types';

// ──────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────

interface UseTravelBudgetsResult {
  budgets: TravelBudget[];
  loading: boolean;
  error: string | null;
  isDemoMode: boolean;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function loadDemoBudgets(): TravelBudget[] {
  return JSON.parse(localStorage.getItem('demo_budgets') || '[]');
}

function normalizeDocument(raw: Record<string, unknown> & { id: string }): TravelBudget {
  return {
    id: raw.id,
    year: Number(raw['year']),
    month: String(raw['month']),
    costCenter: String(raw['costCenter']),
    category: raw['category'] === 'aereo' ? 'aereo' : 'rodoviario',
    value: Number(raw['value']),
    uploadedAt: raw['uploadedAt'] as string | undefined,
    uploadedBy: raw['uploadedBy'] as string | undefined,
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
  const [budgets, setBudgets] = useState<TravelBudget[]>([]);
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
        const normalized = snapshot.docs.map((docSnap) =>
          normalizeDocument({ id: docSnap.id, ...docSnap.data() })
        );
        setBudgets(normalized);
        setLoading(false);
        setIsDemoMode(false);
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
