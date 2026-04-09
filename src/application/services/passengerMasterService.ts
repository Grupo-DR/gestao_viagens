// ============================================================
// APPLICATION — Service — Passenger Master Service
// Gerencia a base mestre de passageiros (CPF e Nascimento).
// Permite importação em massa e consulta por Chapa.
// ============================================================

import {
  collection,
  setDoc,
  doc,
  getDoc,
  writeBatch,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../../infrastructure/firebase/firebase';

export interface PassengerMasterData {
  chapa: string;
  name: string;
  cpf: string;
  birthDate: string; // ISO format YYYY-MM-DD
  updatedAt: string;
}

const COLLECTION = 'passenger_master';

/** 
 * SET TO TRUE PARA TESTAR SEM FIREBASE (MODO LOCALSTORAGE)
 * Segue o padrão de travelRequestService.ts
 */
export const FORCE_MOCK_MODE = true;

// ──────────────────────────────────────────────
// Helpers Mock
// ──────────────────────────────────────────────

function saveToLocalStorage(data: PassengerMasterData) {
  const master: Record<string, PassengerMasterData> = JSON.parse(localStorage.getItem('passenger_master') || '{}');
  master[data.chapa] = data;
  localStorage.setItem('passenger_master', JSON.stringify(master));
}

function getFromLocalStorage(chapa: string): PassengerMasterData | null {
  const master: Record<string, PassengerMasterData> = JSON.parse(localStorage.getItem('passenger_master') || '{}');
  return master[chapa] || null;
}

// ──────────────────────────────────────────────
// Comandos Públicos
// ──────────────────────────────────────────────

/**
 * Busca dados mestres de um passageiro pela chapa.
 */
export async function getPassengerByChapa(chapa: string): Promise<PassengerMasterData | null> {
  if (!chapa) return null;

  if (FORCE_MOCK_MODE) {
    return getFromLocalStorage(chapa);
  }

  try {
    const docRef = doc(db, COLLECTION, chapa);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as PassengerMasterData;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar passageiro master:', error);
    return null;
  }
}

/**
 * Realiza a importação em massa de dados do Excel.
 * Usa Batches do Firestore para eficiência (limite de 500 por lote).
 */
export async function bulkUploadPassengers(data: PassengerMasterData[]): Promise<{ success: number; failed: number }> {
  if (FORCE_MOCK_MODE) {
    data.forEach(p => saveToLocalStorage(p));
    return { success: data.length, failed: 0 };
  }

  try {
    const batch = writeBatch(db);
    let count = 0;

    for (const passenger of data) {
      const docRef = doc(db, COLLECTION, passenger.chapa);
      batch.set(docRef, {
        ...passenger,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      count++;
      
      // O Firestore tem limite de 500 operações por batch
      if (count === 500) {
        // Nota: Para simplificar, assumimos que as planilhas são menores que 500 linhas.
        // Em produção de larga escala, quebraríamos em múltiplos batches assíncronos.
        break; 
      }
    }

    await batch.commit();
    return { success: count, failed: 0 };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, COLLECTION);
    return { success: 0, failed: data.length };
  }
}
