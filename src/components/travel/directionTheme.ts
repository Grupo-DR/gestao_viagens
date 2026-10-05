// ============================================================
// PRESENTATION — Tema visual de sentido (Ida / Volta)
// Única fonte das cores, ícones e rótulos de Ida e Volta.
// Regra: a cor identifica o SENTIDO; o modal (avião/ônibus) é só ícone neutro.
// Ida = tons frios (índigo) · Volta = tons quentes (laranja) — par seguro para daltonismo.
// Âmbar fica reservado aos alertas do itinerário, para não confundir com a Volta.
// ============================================================

import { ArrowRight, Undo2, type LucideIcon } from 'lucide-react';
import type { TravelDirection } from '../../domain/types';

export interface DirectionTheme {
  label: string;
  /** Prefixo do número do trecho (I1, V1...) — garante leitura sem depender da cor */
  prefix: string;
  icon: LucideIcon;
  /** Rótulo do campo de data no card do trecho */
  dateLabel: string;
  /** Rótulo da data no cabeçalho do bloco */
  blockDateLabel: string;
  /** Fundo e borda do painel do bloco */
  panelClass: string;
  titleClass: string;
  accentTextClass: string;
  barClass: string;
  /** Círculos e ícones preenchidos */
  badgeClass: string;
  /** Borda esquerda grossa do card */
  cardAccentClass: string;
  /** Destaque do campo de data */
  inputAccentClass: string;
  /** Botão secundário (adicionar trecho) */
  outlineButtonClass: string;
  /** Botão principal do bloco */
  solidButtonClass: string;
}

export const DIRECTION_THEME: Record<TravelDirection, DirectionTheme> = {
  ida: {
    label: 'Ida',
    prefix: 'I',
    icon: ArrowRight,
    dateLabel: 'Data e hora da ida',
    blockDateLabel: 'Partida',
    panelClass: 'bg-indigo-50/40 border-indigo-100',
    titleClass: 'text-indigo-900',
    accentTextClass: 'text-indigo-600',
    barClass: 'bg-indigo-500',
    badgeClass: 'bg-indigo-600 text-white shadow-indigo-200',
    cardAccentClass: 'border-l-indigo-500',
    inputAccentClass: 'bg-indigo-50/40 border-indigo-100',
    outlineButtonClass: 'border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300',
    solidButtonClass: 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700',
  },
  volta: {
    label: 'Volta',
    prefix: 'V',
    icon: Undo2,
    dateLabel: 'Data e hora da volta',
    blockDateLabel: 'Retorno',
    panelClass: 'bg-orange-50/50 border-orange-100',
    titleClass: 'text-orange-900',
    accentTextClass: 'text-orange-700',
    barClass: 'bg-orange-500',
    badgeClass: 'bg-orange-500 text-white shadow-orange-200',
    cardAccentClass: 'border-l-orange-500',
    inputAccentClass: 'bg-orange-50/50 border-orange-100',
    outlineButtonClass: 'border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300',
    solidButtonClass: 'bg-orange-500 text-white shadow-orange-100 hover:bg-orange-600',
  },
};

/** Trechos sem direção (legados) usam o tema de ida. */
export function getDirectionTheme(direction?: TravelDirection): DirectionTheme {
  return DIRECTION_THEME[direction === 'volta' ? 'volta' : 'ida'];
}

/** "São Paulo - SP" → "São Paulo" (para resumos de rota) */
export function shortCityName(value?: string): string {
  return (value ?? '').split(' - ')[0].split(' / ')[0].trim();
}
