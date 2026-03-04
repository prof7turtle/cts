import type { Edge, Node } from '@xyflow/react';
import { nodeDefinitionByType } from './nodes/nodeTypes';

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

interface BuilderNodeData {
  label?: string;
  condition?: string;
}

function buildAction(node: Node): HookAction {
  const definition = nodeDefinitionByType[node.type ?? ''];
  const data = (node.data ?? {}) as BuilderNodeData;

  return {
    FunctionName: definition?.functionName ?? data.label ?? node.type ?? 'Unknown',
    ModuleName: '@cogitate/core-pos-components',
    CallFunction: true,
    isEndpoint: false,
    Condition: data.condition ?? '',
    Path: '',
  };
}

export function canvasToHookSchema(
  nodes: Node[],
  _edges: Edge[],
  clientCode: string
): HookConfig {
  const actionNodes = nodes.filter((node) => node.type !== 'start' && node.type !== 'end');
  const preActions = actionNodes
    .filter((node) => {
      const definition = nodeDefinitionByType[node.type ?? ''];
      return definition?.category !== 'Post Hook';
    })
    .map(buildAction);

  const postActions = actionNodes
    .filter((node) => nodeDefinitionByType[node.type ?? '']?.category === 'Post Hook')
    .map(buildAction);

  return {
    Client: clientCode || 'YOUR_CLIENT_CODE',
    Hooks: {
      Pre: [
        {
          RequestName: '/Quote/Landing',
          NeedCascading: true,
          HookCallCascading: true,
          StaticParams: {},
          Actions: preActions,
        },
      ],
      Post: [
        {
          RequestName: '/Application/Summary',
          NeedCascading: false,
          StaticParams: {},
          Actions: postActions,
        },
      ],
    },
  };
}

function mapFunctionToNodeType(functionName: string) {
  const normalized = functionName.trim().toLowerCase();
  const matched = Object.values(nodeDefinitionByType).find(
    (definition) => definition.functionName.toLowerCase() === normalized
  );

  return matched?.type ?? 'validatePolicy';
}

export function hookSchemaToCanvas(config: HookConfig): {
  nodes: Node[];
  edges: Edge[];
} {
  const combinedActions = [
    ...(config.Hooks.Pre[0]?.Actions ?? []),
    ...(config.Hooks.Post[0]?.Actions ?? []),
  ];

  const nodes: Node[] = [
    {
      id: 'start',
      type: 'start',
      position: { x: 320, y: 30 },
      data: { label: 'Start' },
    },
  ];

  const generatedNodes = combinedActions.map((action, index) => {
    const type = mapFunctionToNodeType(action.FunctionName);
    const definition = nodeDefinitionByType[type];

    return {
      id: `n-${index + 1}`,
      type,
      position: { x: 320, y: 150 + index * 130 },
      data: {
        label: definition?.label ?? action.FunctionName,
        condition: action.Condition || undefined,
      },
    } satisfies Node;
  });

  nodes.push(...generatedNodes);

  nodes.push({
    id: 'end',
    type: 'end',
    position: { x: 320, y: 150 + generatedNodes.length * 130 },
    data: { label: 'End' },
  });

  const edges: Edge[] = nodes.slice(0, -1).map((node, index) => ({
    id: `e-${index + 1}`,
    source: node.id,
    target: nodes[index + 1].id,
    type: 'smoothstep',
  }));

  return { nodes, edges };
}
