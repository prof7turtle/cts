import type { HookConfig } from '@/app/components/hookSchema';

type ConditionValue = string | Record<string, unknown>;

function toConditionObject(condition: ConditionValue): Record<string, unknown> {
  if (typeof condition === 'string') {
    return { expression: condition };
  }

  const expression = condition.expression;
  if (typeof expression === 'string') {
    return { ...condition, expression };
  }

  return { expression: '' };
}

export function normalizeHookConfigConditions(config: HookConfig): HookConfig {
  return {
    ...config,
    Hooks: {
      Pre: (config.Hooks.Pre ?? []).map((entry) => ({
        ...entry,
        Actions: (entry.Actions ?? []).map((action) => ({
          ...action,
          Condition: toConditionObject(action.Condition),
        })),
      })),
      Post: (config.Hooks.Post ?? []).map((entry) => ({
        ...entry,
        Actions: (entry.Actions ?? []).map((action) => ({
          ...action,
          Condition: toConditionObject(action.Condition),
        })),
      })),
    },
  };
}
