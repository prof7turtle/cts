import type { HookConfig } from '../hookSchema';

export interface WorkflowChatProps {
  currentSchema: HookConfig;
  onApplySchema: (schema: HookConfig) => void;
}
