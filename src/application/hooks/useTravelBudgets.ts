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

function parseNumber(raw: unknown): number {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;

  if (typeof raw === 'string') {
    const cleaned = raw
      .replace(/[R$\s]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');

    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function normalizeDocument(raw: Record<string, unknown> & { id: string }): TravelBudget {
  return {
    id: raw.id,
    year: Number(raw.year ?? 0),
    month: String(raw.month ?? '').trim(),
    costCenter: String(raw.costCenter ?? '').trim(),
    category: raw.category === 'aereo' ? 'aereo' : 'rodoviario',
    value: parseNumber(raw.value),
    uploadedAt: (raw.uploadedAt as string) || new Date().toISOString(),
    uploadedBy: (raw.uploadedBy as string) || 'system',
  };
}

function loadDemoBudgets(): TravelBudget[] {
  const stored = localStorage.getItem('demo_budgets');

  if (stored) {
    const parsed = JSON.parse(stored) as Array<Record<string, unknown> & { id?: string }>;
    return parsed.map((item, index) =>
      normalizeDocument({ id: item.id ?? `demo-budget-${index}`, ...item })
    );
  }

  return [
    {
      id: 'budget-1',
      year: 2026,
      month: 'Março',
      costCenter: '3044.01 - Obra A',
      category: 'rodoviario',
      value: 5000,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'admin',
    },
    {
      id: 'budget-2',
      year: 2026,
      month: 'Abril',
      costCenter: '506070 - RH Central',
      category: 'rodoviario',
      value: 3500,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'admin',
    },
  ];
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
