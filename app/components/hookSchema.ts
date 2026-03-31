import type { Edge, Node } from '@xyflow/react';
import { nodeDefinitionByType } from './nodes/nodeTypes';

export interface HookAction {
  FunctionName: string;
  ModuleName: string;
  CallFunction: boolean;
  isEndpoint: boolean;
  Condition: string | Record<string, unknown>;
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
  condition?: string | Record<string, unknown>;
}

type BranchPath = '' | 'yes' | 'no';

interface ActiveConditionState {
  id: string;
  yesTailId: string | null;
  noTailId: string | null;
  yesNextY: number;
  noNextY: number;
  hasExplicitBranchAction: boolean;
}

function normalizeBranchPath(path?: string): BranchPath {
  const normalized = (path ?? '').trim().toLowerCase();
  if (normalized === 'yes' || normalized === 'y' || normalized === 'true') {
    return 'yes';
  }
  if (normalized === 'no' || normalized === 'n' || normalized === 'false') {
    return 'no';
  }
  return '';
}

function sortNodesByPosition(nodes: Node[]): Node[] {
  return [...nodes].sort((a, b) => {
    const yDelta = (a.position?.y ?? 0) - (b.position?.y ?? 0);
    if (yDelta !== 0) {
      return yDelta;
    }

    const xDelta = (a.position?.x ?? 0) - (b.position?.x ?? 0);
    if (xDelta !== 0) {
      return xDelta;
    }

    return a.id.localeCompare(b.id);
  });
}

function isConditionAction(action: HookAction): boolean {
  const hasCondition =
    typeof action.Condition === 'string'
      ? action.Condition.trim().length > 0
      : !!action.Condition;

  return action.FunctionName.trim().toLowerCase() === 'evaluatecondition' || hasCondition;
}

function buildAction(node: Node, path: BranchPath): HookAction {
  const definition = nodeDefinitionByType[node.type ?? ''];
  const data = (node.data ?? {}) as BuilderNodeData;

  // For ifCondition nodes, preserve the condition exactly as stored
  if (node.type === 'ifCondition') {
    return {
      FunctionName: 'EvaluateCondition',
      ModuleName: '@cogitate/core-pos-components',
      CallFunction: true,
      isEndpoint: false,
      Condition: data.condition ?? '',
      Path: '',
    };
  }

  return {
    FunctionName: definition?.functionName ?? data.label ?? node.type ?? 'Unknown',
    ModuleName: '@cogitate/core-pos-components',
    CallFunction: true,
    isEndpoint: false,
    Condition: '',
    Path: path,
  };
}

export function canvasToHookSchema(
  nodes: Node[],
  edges: Edge[],
  clientCode: string
): HookConfig {
  const actionNodes = sortNodesByPosition(
    nodes.filter((node) => node.type !== 'start' && node.type !== 'end')
  );
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const incomingByTarget = new Map<string, Edge[]>();

  for (const edge of edges) {
    const incoming = incomingByTarget.get(edge.target) ?? [];
    incoming.push(edge);
    incomingByTarget.set(edge.target, incoming);
  }

  const pathCache = new Map<string, BranchPath>();
  const resolving = new Set<string>();

  const inferNodePath = (nodeId: string): BranchPath => {
    const cached = pathCache.get(nodeId);
    if (cached !== undefined) {
      return cached;
    }

    if (resolving.has(nodeId)) {
      return '';
    }

    resolving.add(nodeId);
    const incoming = incomingByTarget.get(nodeId) ?? [];
    let resolvedPath: BranchPath = '';

    const directFromCondition = incoming.find((edge) => {
      const sourceNode = nodeById.get(edge.source);
      return sourceNode?.type === 'ifCondition';
    });

    if (directFromCondition) {
      resolvedPath = normalizeBranchPath(directFromCondition.sourceHandle ?? undefined);
    } else if (incoming.length === 1) {
      resolvedPath = inferNodePath(incoming[0].source);
    }

    resolving.delete(nodeId);
    pathCache.set(nodeId, resolvedPath);
    return resolvedPath;
  };

  const preActions = actionNodes
    .filter((node) => {
      // ifCondition nodes go to Pre by default (or based on context)
      if (node.type === 'ifCondition') return true;
      const definition = nodeDefinitionByType[node.type ?? ''];
      return definition?.category !== 'Post Hook';
    })
    .map((node) => buildAction(node, inferNodePath(node.id)));

  const postActions = actionNodes
    .filter((node) => node.type !== 'ifCondition' && nodeDefinitionByType[node.type ?? '']?.category === 'Post Hook')
    .map((node) => buildAction(node, inferNodePath(node.id)));

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
    ...(config.Hooks.Pre ?? []).flatMap((entry) => entry.Actions ?? []),
    ...(config.Hooks.Post ?? []).flatMap((entry) => entry.Actions ?? []),
  ];

  const nodes: Node[] = [
    {
      id: 'start',
      type: 'start',
      position: { x: 320, y: 30 },
      data: { label: 'Start' },
    },
  ];
  const edges: Edge[] = [];

  let mainY = 150;
  let nodeIndex = 1;
  let edgeIndex = 1;
  let mainCursorNodeId = 'start';
  let activeCondition: ActiveConditionState | null = null;

  const connectNodes = (
    source: string,
    target: string,
    sourceHandle?: BranchPath
  ) => {
    edges.push({
      id: `e-${edgeIndex++}`,
      source,
      target,
      sourceHandle: sourceHandle || undefined,
      type: 'smoothstep',
    });
  };

  const createActionNode = (
    action: HookAction,
    x: number,
    y: number
  ) => {
    const type = mapFunctionToNodeType(action.FunctionName);
    const definition = nodeDefinitionByType[type];
    const node = {
      id: `n-${nodeIndex++}`,
      type,
      position: { x, y },
      data: {
        label: definition?.label ?? action.FunctionName,
      },
    } satisfies Node;
    nodes.push(node);
    return node;
  };

  const joinActiveCondition = (targetNodeId: string) => {
    if (!activeCondition) {
      return;
    }

    if (activeCondition.yesTailId) {
      connectNodes(activeCondition.yesTailId, targetNodeId);
    } else {
      connectNodes(activeCondition.id, targetNodeId, 'yes');
    }

    if (activeCondition.noTailId) {
      connectNodes(activeCondition.noTailId, targetNodeId);
    } else {
      connectNodes(activeCondition.id, targetNodeId, 'no');
    }
  };

  for (const action of combinedActions) {
    if (isConditionAction(action)) {
      const conditionNode = {
        id: `n-${nodeIndex++}`,
        type: 'ifCondition',
        position: { x: 320, y: mainY },
        data: {
          label: 'If / Else',
          condition: action.Condition,
        },
      } satisfies Node;
      nodes.push(conditionNode);

      if (activeCondition) {
        joinActiveCondition(conditionNode.id);
      } else {
        connectNodes(mainCursorNodeId, conditionNode.id);
      }

      mainCursorNodeId = conditionNode.id;
      activeCondition = {
        id: conditionNode.id,
        yesTailId: null,
        noTailId: null,
        yesNextY: mainY + 130,
        noNextY: mainY + 130,
        hasExplicitBranchAction: false,
      };
      mainY += 150;
      continue;
    }

    const explicitPath = normalizeBranchPath(action.Path);

    if (activeCondition && explicitPath) {
      activeCondition.hasExplicitBranchAction = true;
      const isYesPath = explicitPath === 'yes';
      const nodeX = isYesPath ? 220 : 420;
      const nodeY = isYesPath
        ? activeCondition.yesNextY
        : activeCondition.noNextY;

      const branchNode = createActionNode(action, nodeX, nodeY);
      const branchTail = isYesPath
        ? activeCondition.yesTailId
        : activeCondition.noTailId;

      if (branchTail) {
        connectNodes(branchTail, branchNode.id);
      } else {
        connectNodes(activeCondition.id, branchNode.id, explicitPath);
      }

      if (isYesPath) {
        activeCondition.yesTailId = branchNode.id;
        activeCondition.yesNextY += 130;
      } else {
        activeCondition.noTailId = branchNode.id;
        activeCondition.noNextY += 130;
      }

      continue;
    }

    if (activeCondition && !activeCondition.hasExplicitBranchAction) {
      const branchNode = createActionNode(action, 220, activeCondition.yesNextY);
      if (activeCondition.yesTailId) {
        connectNodes(activeCondition.yesTailId, branchNode.id);
      } else {
        connectNodes(activeCondition.id, branchNode.id, 'yes');
      }

      activeCondition.yesTailId = branchNode.id;
      activeCondition.yesNextY += 130;
      continue;
    }

    const nextMainY = activeCondition
      ? Math.max(mainY, activeCondition.yesNextY, activeCondition.noNextY)
      : mainY;
    const actionNode = createActionNode(action, 320, nextMainY);

    if (activeCondition) {
      joinActiveCondition(actionNode.id);
      activeCondition = null;
    } else {
      connectNodes(mainCursorNodeId, actionNode.id);
    }

    mainCursorNodeId = actionNode.id;
    mainY = nextMainY + 130;
  }

  const endY = activeCondition
    ? Math.max(mainY, activeCondition.yesNextY, activeCondition.noNextY)
    : mainY;
  const endNode = {
    id: 'end',
    type: 'end',
    position: { x: 320, y: endY },
    data: { label: 'End' },
  } satisfies Node;
  nodes.push(endNode);

  if (activeCondition) {
    joinActiveCondition(endNode.id);
  } else {
    connectNodes(mainCursorNodeId, endNode.id);
  }

  return { nodes, edges };
}
