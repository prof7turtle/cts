import type { ActionCategory } from './nodeTypes';

export type PastelSet = {
  bg: string;
  fg: string;
  handle: string;
  border: string;
  shadow: string;
};

export const PASTEL: Record<'flow' | 'decision' | 'preHook' | 'postHook' | 'custom', PastelSet> = {
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
  preHook: {
    bg: '#cffafe',
    fg: '#164e63',
    handle: '#22d3ee',
    border: '#a5f3fc',
    shadow: 'rgba(8, 145, 178, 0.14)',
  },
  postHook: {
    bg: '#ffe4e6',
    fg: '#9f1239',
    handle: '#fb7185',
    border: '#fecdd3',
    shadow: 'rgba(190, 24, 93, 0.14)',
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
  if (category === 'Pre Hook') return 'preHook';
  if (category === 'Post Hook') return 'postHook';
  return 'flow';
}

export function getPastelForCategory(category: ActionCategory | undefined): PastelSet {
  if (!category) return PASTEL.flow;
  return PASTEL[categoryToPastelKey(category)];
}

export function getPastelForSectionTitle(title: string): PastelSet {
  const t = title.trim().toLowerCase();
  if (t === 'flow') return PASTEL.flow;
  if (t === 'decision') return PASTEL.decision;
  if (t === 'pre hook') return PASTEL.preHook;
  if (t === 'post hook') return PASTEL.postHook;
  if (t === 'custom hooks') return PASTEL.custom;
  return PASTEL.flow;
}
