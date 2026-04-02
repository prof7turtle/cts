import type { HookConfig } from '@/app/components/hookSchema';

export interface ReactFlowNodeLike {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface ReactFlowEdgeLike {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  type?: string;
}

export interface ReactFlowJson {
  nodes: ReactFlowNodeLike[];
  edges: ReactFlowEdgeLike[];
}

export interface ParsedAgentPayload {
  hookConfig?: HookConfig;
  reactFlow?: ReactFlowJson;
}

function safeJsonParse<T>(raw: string): T | undefined {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

function extractTagBlock(content: string, tag: string): string | undefined {
  const regex = new RegExp(`<${tag}>\\s*([\\s\\S]*?)\\s*<\\/${tag}>`, 'i');
  const match = content.match(regex);
  return match?.[1]?.trim();
}

function extractJsonFence(content: string): string | undefined {
  const fenceRegex = /```json\s*([\s\S]*?)```/gi;
  const blocks = Array.from(content.matchAll(fenceRegex));
  if (!blocks.length) return undefined;
  return blocks[blocks.length - 1][1]?.trim();
}

export function extractAgentPayload(content: string): ParsedAgentPayload {
  const hookBlock = extractTagBlock(content, 'HOOK_CONFIG_JSON');
  const reactFlowBlock = extractTagBlock(content, 'REACT_FLOW_JSON');

  const hookConfig = hookBlock ? safeJsonParse<HookConfig>(hookBlock) : undefined;
  const reactFlow = reactFlowBlock
    ? safeJsonParse<ReactFlowJson>(reactFlowBlock)
    : undefined;

  if (hookConfig || reactFlow) {
    return { hookConfig, reactFlow };
  }

  // Backward-compatible fallback: last JSON code block as HookConfig.
  const fallbackJson = extractJsonFence(content);
  const fallbackHook = fallbackJson
    ? safeJsonParse<HookConfig>(fallbackJson)
    : undefined;
  return { hookConfig: fallbackHook };
}

export function isValidReactFlowJson(value: unknown): value is ReactFlowJson {
  if (!value || typeof value !== 'object') return false;
  const typed = value as Partial<ReactFlowJson>;
  return Array.isArray(typed.nodes) && Array.isArray(typed.edges);
}
