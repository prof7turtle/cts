import type { Edge, Node } from '@xyflow/react';
import { nodeDefinitionByType } from './nodes/nodeTypes';

// ─── Exported Types ─────────────────────────────────────────────

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

// ─── Builder Node Data ──────────────────────────────────────────

export interface BuilderNodeData {
  label?: string;
  type?: string;
  config?: Record<string, unknown>;
  color?: string;
  condition?: string | Record<string, unknown>;
  moduleName?: string;
  isEndpoint?: boolean;
  callFunction?: boolean;
  path?: string;
  description?: string;
  requestName?: string;
  needCascading?: boolean;
  hookCallCascading?: boolean;
  staticParams?: Record<string, unknown>;
}

type BranchPath = '' | 'yes' | 'no';

interface ActiveConditionState {
  id: string;
  expression: string;
  yesTailId: string | null;
  noTailId: string | null;
  yesNextY: number;
  noNextY: number;
  hasExplicitBranchAction: boolean;
}

const DEFAULT_PRE_REQUEST = '/Quote/Summary';
const DEFAULT_POST_REQUEST = '/Application/Summary';

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
  return action.FunctionName.trim().toLowerCase() === 'evaluatecondition';
}

function asConditionExpression(
  condition: string | Record<string, unknown> | undefined
): string {
  if (typeof condition === 'string') {
    return condition.trim();
  }

  if (condition && typeof condition === 'object') {
    const expression = condition.expression;
    if (typeof expression === 'string') {
      return expression.trim();
    }
  }

  return '';
}

function negateConditionExpression(condition: string): string {
  const trimmed = condition.trim();
  if (!trimmed) {
    return '';
  }
  return `not(${trimmed})`;
}

function combineConditionExpressions(parts: string[]): string {
  const normalizedParts = parts.map((part) => part.trim()).filter(Boolean);
  if (normalizedParts.length === 0) {
    return '';
  }
  if (normalizedParts.length === 1) {
    return normalizedParts[0];
  }
  return normalizedParts.map((part) => `(${part})`).join(' and ');
}

function normalizeConditionText(expression: string): string {
  return expression.replace(/\s+/g, '').toLowerCase();
}

function inferBranchPathFromCondition(
  actionCondition: string | Record<string, unknown>,
  ifExpression: string
): BranchPath {
  const branchCondition = asConditionExpression(actionCondition);
  const conditionExpr = ifExpression.trim();
  if (!branchCondition || !conditionExpr) {
    return '';
  }

  const normalizedBranch = normalizeConditionText(branchCondition);
  const normalizedIf = normalizeConditionText(conditionExpr);
  const normalizedNotIf = normalizeConditionText(`not(${conditionExpr})`);

  if (normalizedBranch === normalizedIf) {
    return 'yes';
  }
  if (normalizedBranch === normalizedNotIf) {
    return 'no';
  }
  if (normalizedBranch.includes(normalizedNotIf)) {
    return 'no';
  }
  if (normalizedBranch.includes(normalizedIf)) {
    return 'yes';
  }
  return '';
}

function buildAction(
  node: Node,
  resolvedCondition: string
): HookAction {
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
    ModuleName: data.moduleName ?? definition?.defaultModuleName ?? '@cogitate/core-pos-components',
    CallFunction: data.callFunction !== false,
    isEndpoint: data.isEndpoint ?? false,
    Condition: resolvedCondition,
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
function groupNodesByRequestName(
  nodes: Node[],
  resolveCondition: (nodeId: string) => string = () => ''
): HookEntry[] {
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
    Actions: groupedNodes.map((node) => buildAction(node, resolveCondition(node.id))),
  }));
}

export function canvasToHookSchema(
  nodes: Node[],
  edges: Edge[],
  clientCode: string
): HookConfig {
  const actionNodes = sortNodesByPosition(
    nodes.filter((node) => node.type !== 'start' && node.type !== 'end' && node.type !== 'requestNameLabel')
  );
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const incomingByTarget = new Map<string, Edge[]>();

  for (const edge of edges) {
    const incoming = incomingByTarget.get(edge.target) ?? [];
    incoming.push(edge);
    incomingByTarget.set(edge.target, incoming);
  }

  const conditionCache = new Map<string, string>();
  const resolvingCondition = new Set<string>();

  const inferNodeCondition = (nodeId: string): string => {
    const cached = conditionCache.get(nodeId);
    if (cached !== undefined) {
      return cached;
    }

    if (resolvingCondition.has(nodeId)) {
      return '';
    }

    resolvingCondition.add(nodeId);
    const incoming = incomingByTarget.get(nodeId) ?? [];
    let resolvedCondition = '';

    const directFromCondition = incoming.find((edge) => {
      const sourceNode = nodeById.get(edge.source);
      return sourceNode?.type === 'ifCondition';
    });

    if (directFromCondition) {
      const conditionNode = nodeById.get(directFromCondition.source);
      const conditionData = (conditionNode?.data ?? {}) as BuilderNodeData;
      const inheritedCondition = inferNodeCondition(directFromCondition.source);
      const conditionExpression = asConditionExpression(conditionData.condition);
      const branchPath = normalizeBranchPath(directFromCondition.sourceHandle ?? undefined);
      let branchCondition = '';
      if (branchPath === 'yes') {
        branchCondition = conditionExpression;
      } else if (branchPath === 'no') {
        branchCondition = negateConditionExpression(conditionExpression);
      }
      resolvedCondition = combineConditionExpressions([
        inheritedCondition,
        branchCondition,
      ]);
    } else if (incoming.length === 1) {
      resolvedCondition = inferNodeCondition(incoming[0].source);
    }

    resolvingCondition.delete(nodeId);
    conditionCache.set(nodeId, resolvedCondition);
    return resolvedCondition;
  };

  const preNodes = actionNodes
    .filter((node) => {
      // ifCondition nodes go to Pre by default (or based on context)
      if (node.type === 'ifCondition') return true;
      const definition = nodeDefinitionByType[node.type ?? ''];
      return definition?.category !== 'Post Hook';
    });

  const postNodes = actionNodes
    .filter((node) => node.type !== 'ifCondition' && nodeDefinitionByType[node.type ?? '']?.category === 'Post Hook');

  return {
    Client: clientCode || 'YOUR_CLIENT_CODE',
    Hooks: {
      Pre: groupNodesByRequestName(preNodes, inferNodeCondition),
      Post: groupNodesByRequestName(postNodes, inferNodeCondition),
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

/**
 * Represents the actions grouped under a single RequestName,
 * combining both Pre and Post hooks for that request.
 */
interface RequestNameGroup {
  requestName: string;
  preActions: HookAction[];
  postActions: HookAction[];
}

/**
 * Groups all Pre and Post hook entries by their RequestName.
 * Returns an ordered list of groups (preserving first-seen order).
 */
function groupHooksByRequestName(config: HookConfig): RequestNameGroup[] {
  const groupMap = new Map<string, RequestNameGroup>();
  const order: string[] = [];

  for (const entry of config.Hooks.Pre ?? []) {
    const name = entry.RequestName;
    if (!groupMap.has(name)) {
      groupMap.set(name, { requestName: name, preActions: [], postActions: [] });
      order.push(name);
    }
    groupMap.get(name)!.preActions.push(...(entry.Actions ?? []));
  }

  for (const entry of config.Hooks.Post ?? []) {
    const name = entry.RequestName;
    if (!groupMap.has(name)) {
      groupMap.set(name, { requestName: name, preActions: [], postActions: [] });
      order.push(name);
    }
    groupMap.get(name)!.postActions.push(...(entry.Actions ?? []));
  }

  return order.map((name) => groupMap.get(name)!);
}

/**
 * Builds a single vertical workflow column for a RequestName group.
 * Returns the nodes, edges, and the max Y reached (for alignment).
 */
function buildWorkflowColumn(
  group: RequestNameGroup,
  columnIndex: number,
  columnX: number,
  columnWidth: number,
  nodeIndexRef: { value: number },
  edgeIndexRef: { value: number },
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const centerX = columnX + columnWidth / 2 - 95; // center nodes within column

  // ─── Request Name Label (annotation node) ───────────────
  const labelNodeId = `label-${columnIndex}`;
  nodes.push({
    id: labelNodeId,
    type: 'requestNameLabel',
    position: { x: columnX, y: 10 },
    data: { label: `Request Name:\n${group.requestName}`, requestName: group.requestName },
    draggable: false,
    selectable: false,
    connectable: false,
  } as Node);

  // ─── Start Node ─────────────────────────────────────────
  const startId = `start-${columnIndex}`;
  nodes.push({
    id: startId,
    type: 'start',
    position: { x: centerX, y: 80 },
    data: { label: 'Start' },
  });

  let mainY = 210;
  let mainCursorNodeId = startId;
  let activeCondition: ActiveConditionState | null = null;

  const connectNodes = (
    source: string,
    target: string,
    sourceHandle?: BranchPath
  ) => {
    edges.push({
      id: `e-${edgeIndexRef.value++}`,
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
      id: `n-${nodeIndexRef.value++}`,
      type,
      position: { x, y },
      data: {
        label: definition?.label ?? action.FunctionName,
        moduleName: action.ModuleName,
        callFunction: action.CallFunction !== false,
        isEndpoint: action.isEndpoint ?? false,
        path: action.Path ?? '',
        condition: action.Condition,
        requestName: group.requestName,
      },
    } satisfies Node;
    nodes.push(node);
    return node;
  };

  const joinActiveCondition = (targetNodeId: string) => {
    if (!activeCondition) return;

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

  // Process all actions (pre then post) for this request name
  const allActions = [...group.preActions, ...group.postActions];

  for (const action of allActions) {
    if (isConditionAction(action)) {
      const conditionNode = {
        id: `n-${nodeIndexRef.value++}`,
        type: 'ifCondition',
        position: { x: centerX, y: mainY },
        data: {
          label: 'If / Else',
          condition: action.Condition,
          requestName: group.requestName,
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
        expression: asConditionExpression(action.Condition),
        yesTailId: null,
        noTailId: null,
        yesNextY: mainY + 130,
        noNextY: mainY + 130,
        hasExplicitBranchAction: false,
      };
      mainY += 150;
      continue;
    }

    const explicitPath =
      normalizeBranchPath(action.Path) ||
      (activeCondition
        ? inferBranchPathFromCondition(action.Condition, activeCondition.expression)
        : '');

    if (activeCondition && explicitPath) {
      activeCondition.hasExplicitBranchAction = true;
      const isYesPath = explicitPath === 'yes';
      const nodeX = isYesPath ? centerX - 100 : centerX + 100;
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
      const branchNode = createActionNode(action, centerX - 100, activeCondition.yesNextY);
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
    const actionNode = createActionNode(action, centerX, nextMainY);

    if (activeCondition) {
      joinActiveCondition(actionNode.id);
      activeCondition = null;
    } else {
      connectNodes(mainCursorNodeId, actionNode.id);
    }

    mainCursorNodeId = actionNode.id;
    mainY = nextMainY + 130;
  }

  // ─── End Node ───────────────────────────────────────────
  const endY = activeCondition
    ? Math.max(mainY, activeCondition.yesNextY, activeCondition.noNextY)
    : mainY;
  const endId = `end-${columnIndex}`;
  const endNode = {
    id: endId,
    type: 'end',
    position: { x: centerX, y: endY },
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

export function hookSchemaToCanvas(config: HookConfig): {
  nodes: Node[];
  edges: Edge[];
} {
  const groups = groupHooksByRequestName(config);

  // If only one request name or no groups, fall back to single-column layout
  // but still use the new column-based approach for consistency
  if (groups.length === 0) {
    return {
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 320, y: 80 },
          data: { label: 'Start' },
        },
        {
          id: 'end',
          type: 'end',
          position: { x: 320, y: 210 },
          data: { label: 'End' },
        },
      ],
      edges: [
        {
          id: 'e-1',
          source: 'start',
          target: 'end',
          type: 'smoothstep',
        },
      ],
    };
  }

  const COLUMN_WIDTH = 420;
  const COLUMN_GAP = 60;
  const nodeIndexRef = { value: 1 };
  const edgeIndexRef = { value: 1 };

  const allNodes: Node[] = [];
  const allEdges: Edge[] = [];

  for (let i = 0; i < groups.length; i++) {
    const columnX = i * (COLUMN_WIDTH + COLUMN_GAP);
    const { nodes, edges } = buildWorkflowColumn(
      groups[i],
      i,
      columnX,
      COLUMN_WIDTH,
      nodeIndexRef,
      edgeIndexRef,
    );
    allNodes.push(...nodes);
    allEdges.push(...edges);
  }

  return { nodes: allNodes, edges: allEdges };
}
