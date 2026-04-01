import type { ActionCategory } from './nodeTypes';

/** Soft pastel system — one family per logical group (Flow / Decision / Hooks / Custom). */
export type PastelSet = {
  /** Node header & sidebar icon background */
  bg: string;
  /** Primary text on pastel */
  fg: string;
  /** Connection handles */
  handle: string;
  /** Subtle border / ring */
  border: string;
  /** Soft shadow tint */
  shadow: string;
};

/** `fg` / `iconFg` are always dark — never white — for contrast on pastel surfaces */
export const PASTEL: Record<'flow' | 'decision' | 'hooks' | 'custom', PastelSet> = {
  flow: {
    bg: '#d1fae5',
    fg: '#064e3b',
    handle: '#34d399',
    border: '#a7f3d0',
    shadow: 'rgba(20, 83, 45, 0.12)',
  },
  decision: {
    bg: '#ffedd5',
    fg: '#7c2d12',
    handle: '#fb923c',
    border: '#fed7aa',
    shadow: 'rgba(154, 52, 18, 0.12)',
  },
  hooks: {
    bg: '#dbeafe',
    fg: '#172554',
    handle: '#60a5fa',
    border: '#bfdbfe',
    shadow: 'rgba(30, 58, 138, 0.12)',
  },
  custom: {
    bg: '#ede9fe',
    fg: '#4c1d95',
    handle: '#a78bfa',
    border: '#ddd6fe',
    shadow: 'rgba(91, 33, 182, 0.12)',
  },
};

export function categoryToPastelKey(
  category: ActionCategory
): keyof typeof PASTEL {
  if (category === 'Flow') return 'flow';
  if (category === 'Decision') return 'decision';
  return 'hooks';
}

export function getPastelForCategory(category: ActionCategory | undefined): PastelSet {
  if (!category) return PASTEL.flow;
  return PASTEL[categoryToPastelKey(category)];
}

export function getPastelForSectionTitle(title: string): PastelSet {
  const t = title.trim().toLowerCase();
  if (t === 'flow') return PASTEL.flow;
  if (t === 'decision') return PASTEL.decision;
  if (t === 'hooks') return PASTEL.hooks;
  if (t === 'custom hooks') return PASTEL.custom;
  return PASTEL.flow;
}
