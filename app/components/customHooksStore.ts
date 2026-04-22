'use client';

import type { ActionCategory } from './nodes/nodeTypes';

export interface CustomHook {
  id: string;
  hookName: string;
  category: ActionCategory;
  functionName: string;
  moduleName: string;
  condition?: string;
  code: string;
}

export type NewCustomHook = Omit<CustomHook, 'id'>;

const CUSTOM_HOOKS_STORAGE_KEY = 'cts.custom-hooks.v1';
const CUSTOM_HOOKS_UPDATED_EVENT = 'cts:custom-hooks-updated';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function parseStoredHooks(rawHooks: string | null): CustomHook[] {
  if (!rawHooks) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawHooks);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is CustomHook => {
      return (
        item &&
        typeof item.id === 'string' &&
        typeof item.hookName === 'string' &&
        typeof item.category === 'string' &&
        typeof item.functionName === 'string' &&
        typeof item.moduleName === 'string' &&
        typeof item.code === 'string'
      );
    });
  } catch {
    return [];
  }
}

function persistHooks(hooks: CustomHook[]): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(CUSTOM_HOOKS_STORAGE_KEY, JSON.stringify(hooks));
  window.dispatchEvent(new Event(CUSTOM_HOOKS_UPDATED_EVENT));
}

function generateHookId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `custom-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getCustomHooks(): CustomHook[] {
  if (!isBrowser()) {
    return [];
  }

  return parseStoredHooks(window.localStorage.getItem(CUSTOM_HOOKS_STORAGE_KEY));
}

export function createCustomHook(hook: NewCustomHook): CustomHook {
  const existingHooks = getCustomHooks();
  const newHook: CustomHook = {
    ...hook,
    id: generateHookId(),
    hookName: hook.hookName.trim(),
    functionName: hook.functionName.trim(),
    moduleName: hook.moduleName.trim(),
    condition: hook.condition?.trim(),
    code: hook.code,
  };

  persistHooks([...existingHooks, newHook]);
  return newHook;
}

export function getCustomHookById(hookId: string): CustomHook | null {
  const hooks = getCustomHooks();
  return hooks.find((hook) => hook.id === hookId) ?? null;
}

export function updateCustomHook(hookId: string, updates: NewCustomHook): CustomHook | null {
  const hooks = getCustomHooks();
  const existingHook = hooks.find((hook) => hook.id === hookId);

  if (!existingHook) {
    return null;
  }

  const updatedHook: CustomHook = {
    ...existingHook,
    ...updates,
    hookName: updates.hookName.trim(),
    functionName: updates.functionName.trim(),
    moduleName: updates.moduleName.trim(),
    condition: updates.condition?.trim(),
    code: updates.code,
  };

  persistHooks(hooks.map((hook) => (hook.id === hookId ? updatedHook : hook)));
  return updatedHook;
}

export function subscribeToCustomHooks(onChange: () => void): () => void {
  if (!isBrowser()) {
    return () => {};
  }

  const internalUpdateHandler = () => onChange();
  const storageHandler = (event: StorageEvent) => {
    if (event.key === CUSTOM_HOOKS_STORAGE_KEY) {
      onChange();
    }
  };

  window.addEventListener(CUSTOM_HOOKS_UPDATED_EVENT, internalUpdateHandler);
  window.addEventListener('storage', storageHandler);

  return () => {
    window.removeEventListener(CUSTOM_HOOKS_UPDATED_EVENT, internalUpdateHandler);
    window.removeEventListener('storage', storageHandler);
  };
}
