import type { Edge, Node } from '@xyflow/react';
import { nodeDefinitionByType } from './nodes/nodeTypes';

// ─── Exported Types ─────────────────────────────────────────────

export interface HookAction {
  FunctionName: string;
  ModuleName: string;
  CallFunction: boolean;
  isEndpoint: boolean;
  Condition: string;
  Path: string;
}

export interface HookEntry {
  RequestName: string;
  NeedCascading: boolean;
  HookCallCascading?: boolean;
  StaticParams: Record<string, unknown>;
  Actions: HookAction[];
}

export interface HookConfig {
  Client: string;
  Hooks: {
    Pre: HookEntry[];
    Post: HookEntry[];
  };
}

// ─── Builder Node Data ──────────────────────────────────────────

export interface BuilderNodeData {
  label?: string;
  condition?: string;
  color?: string;
  // Action-level properties (from Cogitate HookSchema spec)
  requestName?: string;
  moduleName?: string;
  isEndpoint?: boolean;
  callFunction?: boolean;
  path?: string;
  needCascading?: boolean;
  hookCallCascading?: boolean;
  staticParams?: Record<string, unknown>;
  description?: string;
}

// ─── Default RequestName by category ────────────────────────────

const DEFAULT_PRE_REQUEST = '/Quote/Landing';
const DEFAULT_POST_REQUEST = '/Application/Summary';

// ─── Canvas → HookSchema ────────────────────────────────────────

function buildAction(node: Node): HookAction {
  const definition = nodeDefinitionByType[node.type ?? ''];
  const data = (node.data ?? {}) as BuilderNodeData;

  return {
    FunctionName:
      definition?.functionName ?? data.label ?? node.type ?? 'Unknown',
    ModuleName:
      data.moduleName ??
      definition?.defaultModuleName ??
      '@cogitate/core-pos-components',
    CallFunction: data.callFunction !== false,
    isEndpoint: data.isEndpoint ?? definition?.defaultData?.isEndpoint ?? false,
    Condition: data.condition ?? '',
    Path: data.path ?? '',
  };
}

function getRequestName(node: Node): string {
  const definition = nodeDefinitionByType[node.type ?? ''];
  const data = (node.data ?? {}) as BuilderNodeData;

  return (
    data.requestName ??
    definition?.defaultData?.requestName ??
    (definition?.category === 'Post Hook'
      ? DEFAULT_POST_REQUEST
      : DEFAULT_PRE_REQUEST)
  );
}

function getNeedCascading(node: Node): boolean {
  const data = (node.data ?? {}) as BuilderNodeData;
  return data.needCascading !== false;
}

function getHookCallCascading(node: Node): boolean | undefined {
  const data = (node.data ?? {}) as BuilderNodeData;
  return data.hookCallCascading;
}

function getStaticParams(node: Node): Record<string, unknown> {
  const data = (node.data ?? {}) as BuilderNodeData;
  return data.staticParams ?? {};
}

/**
 * Groups action nodes by their RequestName and builds HookEntry objects.
 * Nodes sharing the same RequestName are grouped into a single entry.
 */
function groupNodesByRequestName(nodes: Node[]): HookEntry[] {
  const entryMap = new Map<string, { nodes: Node[]; entry: Partial<HookEntry> }>();

  for (const node of nodes) {
    const requestName = getRequestName(node);

    if (!entryMap.has(requestName)) {
      entryMap.set(requestName, {
        nodes: [],
        entry: {
          RequestName: requestName,
          NeedCascading: getNeedCascading(node),
          StaticParams: getStaticParams(node),
        },
      });

      const cascading = getHookCallCascading(node);
      if (cascading !== undefined) {
        entryMap.get(requestName)!.entry.HookCallCascading = cascading;
      }
    }

    entryMap.get(requestName)!.nodes.push(node);
  }

  return Array.from(entryMap.values()).map(({ nodes: groupedNodes, entry }) => ({
    RequestName: entry.RequestName!,
    NeedCascading: entry.NeedCascading ?? true,
    ...(entry.HookCallCascading !== undefined
      ? { HookCallCascading: entry.HookCallCascading }
      : {}),
    StaticParams: entry.StaticParams ?? {},
    Actions: groupedNodes.map(buildAction),
  }));
}

export function canvasToHookSchema(
  nodes: Node[],
  _edges: Edge[],
  clientCode: string
): HookConfig {
  const actionNodes = nodes.filter(
    (node) => node.type !== 'start' && node.type !== 'end'
  );

  const preNodes = actionNodes.filter((node) => {
    const definition = nodeDefinitionByType[node.type ?? ''];
    return definition?.category !== 'Post Hook';
  });

  const postNodes = actionNodes.filter(
    (node) => nodeDefinitionByType[node.type ?? '']?.category === 'Post Hook'
  );

  return {
    Client: clientCode || 'YOUR_CLIENT_CODE',
    Hooks: {
      Pre: groupNodesByRequestName(preNodes),
      Post: groupNodesByRequestName(postNodes),
    },
  };
}

// ─── HookSchema → Canvas ────────────────────────────────────────

function mapFunctionToNodeType(functionName: string): string {
  const normalized = functionName.trim().toLowerCase();
  const matched = Object.values(nodeDefinitionByType).find(
    (definition) => definition.functionName.toLowerCase() === normalized
  );

  return matched?.type ?? 'generateQuoteNumber';
}

export function hookSchemaToCanvas(config: HookConfig): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = [
    {
      id: 'start',
      type: 'start',
      position: { x: 320, y: 30 },
      data: { label: 'Start' },
    },
  ];

  let yOffset = 150;
  const Y_SPACING = 130;

  // Restore Pre hook actions
  for (const entry of config.Hooks.Pre ?? []) {
    for (const action of entry.Actions ?? []) {
      const type = mapFunctionToNodeType(action.FunctionName);
      const definition = nodeDefinitionByType[type];

      nodes.push({
        id: `n-${nodes.length}`,
        type,
        position: { x: 320, y: yOffset },
        data: {
          label: definition?.label ?? action.FunctionName,
          condition: action.Condition || undefined,
          requestName: entry.RequestName,
          moduleName: action.ModuleName || undefined,
          isEndpoint: action.isEndpoint || undefined,
          callFunction: action.CallFunction,
          path: action.Path || undefined,
          needCascading: entry.NeedCascading,
          hookCallCascading: entry.HookCallCascading,
          staticParams:
            Object.keys(entry.StaticParams ?? {}).length > 0
              ? entry.StaticParams
              : undefined,
        } satisfies BuilderNodeData,
      });

      yOffset += Y_SPACING;
    }
  }

  // Restore Post hook actions
  for (const entry of config.Hooks.Post ?? []) {
    for (const action of entry.Actions ?? []) {
      const type = mapFunctionToNodeType(action.FunctionName);
      const definition = nodeDefinitionByType[type];

      nodes.push({
        id: `n-${nodes.length}`,
        type,
        position: { x: 320, y: yOffset },
        data: {
          label: definition?.label ?? action.FunctionName,
          condition: action.Condition || undefined,
          requestName: entry.RequestName,
          moduleName: action.ModuleName || undefined,
          isEndpoint: action.isEndpoint || undefined,
          callFunction: action.CallFunction,
          path: action.Path || undefined,
          needCascading: entry.NeedCascading,
          hookCallCascading: entry.HookCallCascading,
          staticParams:
            Object.keys(entry.StaticParams ?? {}).length > 0
              ? entry.StaticParams
              : undefined,
        } satisfies BuilderNodeData,
      });

      yOffset += Y_SPACING;
    }
  }

  // End node
  nodes.push({
    id: 'end',
    type: 'end',
    position: { x: 320, y: yOffset },
    data: { label: 'End' },
  });

  // Build sequential edges
  const edges: Edge[] = nodes.slice(0, -1).map((node, index) => ({
    id: `e-${index + 1}`,
    source: node.id,
    target: nodes[index + 1].id,
    type: 'smoothstep',
  }));

  return { nodes, edges };
}
