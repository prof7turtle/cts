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
  workflowGroupId?: string;
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

const DEFAULT_PRE_REQUEST = '/New/Request';
const DEFAULT_POST_REQUEST = '/New/Request';

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

function getRequestName(
  node: Node,
  nodeById: Map<string, Node>,
  incomingByTarget: Map<string, Edge[]>,
  visited = new Set<string>()
): string {
  const nodeId = node.id;
  if (visited.has(nodeId)) return ''; // Prevent infinite loops
  visited.add(nodeId);

  // 1. If this is a start node, it's the source of truth for the request name
  if (node.type === 'start') {
    return (node.data as BuilderNodeData)?.requestName ?? DEFAULT_PRE_REQUEST;
  }

  // 2. Trace up the graph to find a start node
  const incoming = incomingByTarget.get(nodeId) ?? [];
  for (const edge of incoming) {
    const name = getRequestName(nodeById.get(edge.source)!, nodeById, incomingByTarget, visited);
    if (name) return name;
  }

  // 3. If no start node found via connections, try parent group as fallback
  if (node.parentId) {
    const groupStartNode = Array.from(nodeById.values()).find(
      (n) => n.parentId === node.parentId && n.type === 'start'
    );
    const startData = groupStartNode?.data as BuilderNodeData | undefined;
    if (startData?.requestName) {
      return startData.requestName;
    }
  }

  // 4. Final fallback to node's own data or global default (hardcoded defaults in definitions are ignored)
  const data = (node.data ?? {}) as BuilderNodeData;
  return (
    data.requestName ??
    (nodeDefinitionByType[node.type ?? '']?.category === 'Post Hook'
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
 * Metadata extracted from start nodes, keyed by RequestName.
 * These hold the workflow-level properties set via the sidebar config.
 */
interface StartNodeMeta {
  needCascading: boolean;
  hookCallCascading?: boolean;
  staticParams: Record<string, unknown>;
}

/**
 * Groups action nodes by their associated Start node and RequestName.
 * This ensures that multiple visual workflows are preserved in the schema,
 * even if they share the same RequestName (preventing destructive merging).
 */
function groupNodesByRequestName(
  nodes: Node[],
  nodeById: Map<string, Node>,
  incomingByTarget: Map<string, Edge[]>,
  resolveCondition: (nodeId: string) => string = () => '',
  startNodeMetas: Map<string, StartNodeMeta> = new Map()
): HookEntry[] {
  const entryMap = new Map<string, { nodes: Node[]; entry: Partial<HookEntry> }>();

  // Helper to find the "anchor" start node ID for any node
  const getStartNodeId = (nodeId: string, visited = new Set<string>()): string | null => {
    if (visited.has(nodeId)) return null;
    visited.add(nodeId);
    const node = nodeById.get(nodeId);
    if (!node) return null;
    if (node.type === 'start') return node.id;
    
    const incoming = incomingByTarget.get(nodeId) ?? [];
    for (const edge of incoming) {
      const sid = getStartNodeId(edge.source, visited);
      if (sid) return sid;
    }
    
    if (node.parentId) {
      const groupStart = Array.from(nodeById.values()).find(n => n.parentId === node.parentId && n.type === 'start');
      if (groupStart) return groupStart.id;
    }
    return null;
  };

  for (const node of nodes) {
    const startNodeId = getStartNodeId(node.id) || 'orphaned';
    const requestName = getRequestName(node, nodeById, incomingByTarget);
    // We use startNodeId as the key to keep separate workflow columns distinct
    const key = startNodeId;

    if (!entryMap.has(key)) {
      let meta: StartNodeMeta | undefined;
      const startNode = nodeById.get(startNodeId);
      if (startNode) {
        const sData = startNode.data as BuilderNodeData;
        meta = {
          needCascading: sData.needCascading !== false,
          hookCallCascading: sData.hookCallCascading,
          staticParams: sData.staticParams ?? {}
        };
      }

      entryMap.set(key, {
        nodes: [],
        entry: {
          RequestName: requestName,
          NeedCascading: meta?.needCascading ?? getNeedCascading(node),
          StaticParams: meta?.staticParams ?? getStaticParams(node),
        },
      });

      const cascading = meta?.hookCallCascading ?? getHookCallCascading(node);
      if (cascading !== undefined) {
        entryMap.get(key)!.entry.HookCallCascading = cascading;
      }
    }

    entryMap.get(key)!.nodes.push(node);
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
    nodes.filter((node) => node.type !== 'start' && node.type !== 'end' && node.type !== 'requestNameLabel' && node.type !== 'group')
  );
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const incomingByTarget = new Map<string, Edge[]>();

  for (const edge of edges) {
    const incoming = incomingByTarget.get(edge.target) ?? [];
    incoming.push(edge);
    incomingByTarget.set(edge.target, incoming);
  }

  // ── Collect workflow-level metadata from start nodes ────────
  // The sidebar config stores requestName, needCascading, hookCallCascading,
  // and staticParams on the start node. We extract them here so that
  // groupNodesByRequestName uses the correct values.
  const startNodeMetas = new Map<string, StartNodeMeta>();
  for (const node of nodes) {
    if (node.type !== 'start') continue;
    const data = (node.data ?? {}) as BuilderNodeData;
    const reqName = data.requestName ?? DEFAULT_PRE_REQUEST;
    if (!startNodeMetas.has(reqName)) {
      startNodeMetas.set(reqName, {
        needCascading: data.needCascading !== false,
        hookCallCascading: data.hookCallCascading,
        staticParams: data.staticParams ?? {},
      });
    }
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
      Pre: groupNodesByRequestName(preNodes, nodeById, incomingByTarget, inferNodeCondition, startNodeMetas),
      Post: groupNodesByRequestName(postNodes, nodeById, incomingByTarget, inferNodeCondition, startNodeMetas),
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
  needCascading: boolean;
  hookCallCascading?: boolean;
  staticParams: Record<string, unknown>;
  preActions: HookAction[];
  postActions: HookAction[];
}

/**
 * Groups all Pre and Post hook entries by their RequestName.
 * Returns an ordered list of groups (preserving first-seen order).
 * Carries through NeedCascading, HookCallCascading, and StaticParams
 * from the first entry encountered per RequestName.
 */
function groupHooksByRequestName(config: HookConfig): RequestNameGroup[] {
  const groupMap = new Map<string, RequestNameGroup>();
  const order: string[] = [];

  for (const entry of config.Hooks.Pre ?? []) {
    const name = entry.RequestName;
    if (!groupMap.has(name)) {
      groupMap.set(name, {
        requestName: name,
        needCascading: entry.NeedCascading ?? true,
        hookCallCascading: entry.HookCallCascading,
        staticParams: entry.StaticParams ?? {},
        preActions: [],
        postActions: [],
      });
      order.push(name);
    }
    groupMap.get(name)!.preActions.push(...(entry.Actions ?? []));
  }

  for (const entry of config.Hooks.Post ?? []) {
    const name = entry.RequestName;
    if (!groupMap.has(name)) {
      groupMap.set(name, {
        requestName: name,
        needCascading: entry.NeedCascading ?? true,
        hookCallCascading: entry.HookCallCascading,
        staticParams: entry.StaticParams ?? {},
        preActions: [],
        postActions: [],
      });
      order.push(name);
    }
    groupMap.get(name)!.postActions.push(...(entry.Actions ?? []));
  }

  return order.map((name) => groupMap.get(name)!);
}

/**
 * Builds a single vertical workflow column for a RequestName group.
 * All nodes are children of an invisible group node so the entire workflow
 * moves together when the group (or start node via drag handler) is dragged.
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
  const centerX = columnWidth / 2 - 95; // relative to group origin

  // ─── Invisible Group Node (parent for the whole column) ──
  const groupId = `group-${columnIndex}`;
  nodes.push({
    id: groupId,
    type: 'group',
    position: { x: columnX, y: 0 },
    data: {},
    style: {
      width: columnWidth,
      height: 9999, // large enough; won't be visible
      background: 'transparent',
      border: 'none',
      pointerEvents: 'none' as const,
    },
    draggable: false,
    selectable: false,
    connectable: false,
  } as Node);

  // ─── Request Name Label (child of group, centered) ───────
  const labelNodeId = `label-${columnIndex}`;
  nodes.push({
    id: labelNodeId,
    type: 'requestNameLabel',
    position: { x: columnWidth / 2 - 130, y: 10 },
    data: { label: `Request Name:\n${group.requestName}`, requestName: group.requestName, workflowGroupId: groupId },
    parentId: groupId,
    extent: 'parent' as const,
    draggable: true,
    selectable: true,
    connectable: false,
  } as Node);

  // ─── Start Node (child of group) ─────────────────────────
  const startId = `start-${columnIndex}`;
  nodes.push({
    id: startId,
    type: 'start',
    position: { x: centerX, y: 80 },
    data: {
      label: 'Start',
      workflowGroupId: groupId,
      requestName: group.requestName,
      needCascading: group.needCascading,
      hookCallCascading: group.hookCallCascading,
      staticParams: group.staticParams,
    },
    parentId: groupId,
    extent: 'parent' as const,
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
      parentId: groupId,
      extent: 'parent' as const,
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
        parentId: groupId,
        extent: 'parent' as const,
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

  // ─── End Node (child of group) ──────────────────────────
  const endY = activeCondition
    ? Math.max(mainY, activeCondition.yesNextY, activeCondition.noNextY)
    : mainY;
  const endId = `end-${columnIndex}`;
  const endNode = {
    id: endId,
    type: 'end',
    position: { x: centerX, y: endY },
    parentId: groupId,
    extent: 'parent' as const,
    data: { label: 'End' },
  } satisfies Node;
  nodes.push(endNode);

  if (activeCondition) {
    joinActiveCondition(endNode.id);
  } else {
    connectNodes(mainCursorNodeId, endNode.id);
  }

  // Update group height to fit all content
  const groupNode = nodes.find((n) => n.id === groupId);
  if (groupNode) {
    groupNode.style = { ...groupNode.style, height: endY + 200 };
  }

  return { nodes, edges };
}

export function hookSchemaToCanvas(config: HookConfig): {
  nodes: Node[];
  edges: Edge[];
} {
  const groups = groupHooksByRequestName(config);

  if (groups.length === 0) {
    return { nodes: [], edges: [] };
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
