'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import {
  Maximize2, Trash2, Play, Pause, Square, RotateCcw, Settings2,
  Download, Upload, FileJson, TerminalSquare, Bot, Eraser, MessageSquare, X, Copy, Check, Save,
  BookOpen, ChevronDown, ChevronUp, Search,
} from 'lucide-react';
import { loadSchema, saveSchema, generateWorkflowId, type WorkflowSaveData } from '@/lib/workflowSchemaUtils';

// ─── Predefined Request Library ─────────────────────────────────
const REQUEST_LIBRARY: { category: string; requests: string[] }[] = [
  {
    category: 'Quote',
    requests: [
      '/Quote/Summary',
      '/Quote/Detail',
      '/Quote/Validate',
      '/Quote/Submit',
      '/Quote/Bind',
      '/Quote/Rate',
    ],
  },
  {
    category: 'Policy',
    requests: [
      '/Policy/Issue',
      '/Policy/Renew',
      '/Policy/Cancel',
      '/Policy/Endorse',
      '/Policy/Reinstate',
    ],
  },
  {
    category: 'Claim',
    requests: [
      '/Claim/FNOL',
      '/Claim/Status',
      '/Claim/Reserve',
      '/Claim/Payment',
      '/Claim/Close',
    ],
  },
  {
    category: 'Account',
    requests: [
      '/Account/Create',
      '/Account/Update',
      '/Account/Search',
      '/Account/Delete',
    ],
  },
];
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type OnSelectionChangeParams,
  type NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import NodesPanel from './NodesPanel';
import ExecutionLogs from './ExecutionLogs';
import { customNodeTypes } from './nodes/CustomNodes';
import { nodeDefinitionByType } from './nodes/nodeTypes';
import {
  canvasToHookSchema,
  hookSchemaToCanvas,
  type HookConfig,
  type BuilderNodeData,
} from './hookSchema';
import { useExecutionEngine } from './useExecutionEngine';
import WorkflowChatPanel from './chat/WorkflowChatPanel';
import type { CustomHook } from './customHooksStore';

const initialNodes: Node[] = [];

const initialEdges: Edge[] = [];

const getNodeId = () => `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const getEdgeId = () => `edge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function WorkflowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const toolbarMenuRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [clientCode, setClientCode] = useState('COGITATE');
  const [serializedSchema, setSerializedSchema] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSchemaPanelOpen, setIsSchemaPanelOpen] = useState(false);
  const [isLogsDockVisible, setIsLogsDockVisible] = useState(true);
  const [isLogsDockExpanded, setIsLogsDockExpanded] = useState(false);
  const [isToolbarMenuOpen, setIsToolbarMenuOpen] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [schemaSidebarWidth, setSchemaSidebarWidth] = useState(280);
  const [chatSidebarWidth, setChatSidebarWidth] = useState(320);
  const [isSchemaCopied, setIsSchemaCopied] = useState(false);
  const [isIfElseModalOpen, setIsIfElseModalOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');

  // ─── Persistence state ─────────────────────────────────
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const handleCopySchema = useCallback(() => {
    navigator.clipboard.writeText(serializedSchema).then(() => {
      setIsSchemaCopied(true);
      setTimeout(() => setIsSchemaCopied(false), 2000);
    });
  }, [serializedSchema]);

  const startSchemaResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = schemaSidebarWidth;
    const onMove = (ev: MouseEvent) => {
      const delta = startX - ev.clientX;
      setSchemaSidebarWidth(Math.max(200, Math.min(600, startW + delta)));
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [schemaSidebarWidth]);

  const startChatResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = chatSidebarWidth;
    const onMove = (ev: MouseEvent) => {
      const delta = startX - ev.clientX;
      setChatSidebarWidth(Math.max(240, Math.min(560, startW + delta)));
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [chatSidebarWidth]);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // ─── Execution Engine ──────────────────────────────────────
  const nodesRef = useCallback(() => nodes, [nodes]);
  const edgesRef = useCallback(() => edges, [edges]);
  const engine = useExecutionEngine(nodesRef, edgesRef);

  const isExecuting = engine.state === 'running' || engine.state === 'paused';

  useEffect(() => {
    if (!isToolbarMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!toolbarMenuRef.current) return;
      if (!toolbarMenuRef.current.contains(event.target as globalThis.Node)) {
        setIsToolbarMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsToolbarMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isToolbarMenuOpen]);

  // ─── Load workflow from URL on mount ─────────────────────────
  useEffect(() => {
    const loadWorkflowFromUrl = async () => {
      const id = searchParams.get('workflowId');
      
      if (!id) {
        // No workflow ID, create a new one
        const newId = generateWorkflowId();
        setWorkflowId(newId);
        setIsLoading(false);
        return;
      }

      setWorkflowId(id);
      
      // Try to load the workflow
      const schema = await loadSchema(id);
      if (schema) {
        // Restore workflow from saved nodes/edges
        setNodes(schema.nodes);
        setEdges(schema.edges);
        setClientCode(schema.clientCode);
        setWorkflowName(schema.name);
        setLastSavedAt(new Date().toLocaleTimeString());
        setMessage(`Loaded workflow: ${schema.name}`);
      }
      setIsLoading(false);
    };

    loadWorkflowFromUrl();
  }, [searchParams, setNodes, setEdges]);

  // ─── Auto-save workflow when nodes/edges change ────────────────
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoading || !workflowId || isExecuting) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save (3 seconds after changes stop)
    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (!workflowId) return;
      
      setIsSaving(true);
      const success = await saveSchema({
        id: workflowId,
        name: workflowName,
        clientCode,
        nodes,
        edges,
      });

      if (success) {
        setLastSavedAt(new Date().toLocaleTimeString());
      }
      setIsSaving(false);
    }, 3000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [nodes, edges, clientCode, workflowName, workflowId, isLoading, isExecuting]);

  // Inject execution status into node data for visual highlighting
  const displayNodes = useMemo(() => {
    if (Object.keys(engine.nodeStatuses).length === 0) return nodes;

    return nodes.map((node) => {
      const status = engine.nodeStatuses[node.id];
      if (!status || status === 'idle') return node;
      return {
        ...node,
        data: { ...node.data, executionStatus: status },
      };
    });
  }, [nodes, engine.nodeStatuses]);

  const displayEdges = useMemo(() => {
    const hasEdgeExecutionState = Object.keys(engine.edgeStatuses).length > 0;

    return edges.map((edge) => {
      const execStatus = engine.edgeStatuses[edge.id];
      const branchLabel =
        edge.sourceHandle === 'yes' ? 'YES' : edge.sourceHandle === 'no' ? 'NO' : undefined;

      if (!hasEdgeExecutionState || !execStatus || execStatus === 'idle') {
        return {
          ...edge,
          label: branchLabel ?? edge.label,
          labelStyle: branchLabel
            ? { fontSize: 10, fontWeight: 700, fill: '#64748b' }
            : edge.labelStyle,
        };
      }

      if (execStatus === 'active') {
        return {
          ...edge,
          animated: true,
          style: { ...(edge.style ?? {}), stroke: '#16a34a', strokeWidth: 3.5 },
          className: `${edge.className ?? ''} edge-exec-active`.trim(),
          label: branchLabel ?? edge.label,
          labelStyle: { fontSize: 10, fontWeight: 700, fill: '#166534' },
        };
      }

      return {
        ...edge,
        animated: false,
        style: { ...(edge.style ?? {}), stroke: '#22c55e', strokeWidth: 3 },
        className: `${edge.className ?? ''} edge-exec-completed`.trim(),
        label: branchLabel ?? edge.label,
        labelStyle: { fontSize: 10, fontWeight: 700, fill: '#166534' },
      };
    });
  }, [edges, engine.edgeStatuses]);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (isExecuting) return;
      setEdges((currentEdges) =>
        addEdge(
          {
            ...params,
            id: getEdgeId(),
            type: 'smoothstep',
            animated: false,
            markerEnd: { type: 'arrowclosed' },
          },
          currentEdges
        )
      );
    },
    [setEdges, isExecuting]
  );

  const onDragOver = useCallback(
    (event: React.DragEvent) => {
      if (isExecuting) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    },
    [isExecuting]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      if (isExecuting) return;
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (type.startsWith('customHook-')) {
        // ── Custom hook node ──────────────────────────────────
        const payload = event.dataTransfer.getData('application/custom-hook');
        if (!payload) return;

        let hookData: CustomHook;
        try {
          hookData = JSON.parse(payload) as CustomHook;
        } catch {
          return;
        }
        if (!hookData) return;

        setNodes((currentNodes) => {
          const newId = getNodeId();
          const groupUnderDrop = currentNodes.find(
            (n) =>
              n.type === 'group' &&
              position.x >= n.position.x &&
              position.x <= n.position.x + ((n.style?.width as number) ?? 420) &&
              position.y >= n.position.y &&
              position.y <= n.position.y + ((n.style?.height as number) ?? 1000)
          );

          let nodePosition = position;
          let parentId: string | undefined;
          let extent: 'parent' | undefined;
          let extraData: Partial<BuilderNodeData> = {};

          if (groupUnderDrop) {
            parentId = groupUnderDrop.id;
            extent = 'parent';
            nodePosition = {
              x: position.x - groupUnderDrop.position.x,
              y: position.y - groupUnderDrop.position.y,
            };
            const startInGroup = currentNodes.find(
              (n) => n.parentId === groupUnderDrop.id && n.type === 'start'
            );
            if (startInGroup) {
              extraData.requestName = (startInGroup.data as BuilderNodeData).requestName;
            }
          }

          const newNode: Node = {
            id: newId,
            type: 'customHook',
            position: nodePosition,
            ...(parentId ? { parentId, extent } : {}),
            data: {
              label: hookData.hookName,
              type: 'customHook',
              config: {
                FunctionName: hookData.functionName,
                ModuleName: hookData.moduleName,
                Condition: hookData.condition || '',
                code: hookData.code,
              },
              moduleName: hookData.moduleName,
              condition: hookData.condition,
              callFunction: true,
              isEndpoint: false,
              ...extraData,
            } satisfies BuilderNodeData,
          };

          return currentNodes.concat(newNode);
        });

        setMessage(null);
        return;
      }

      if (type === 'start') {
        // ── Start node + group + label ────────────────────────
        const defaultReqName = '/New/Request';

        setNodes((currentNodes) => {
          let uniqueReqName = defaultReqName;
          let counter = 1;
          const existingNames = new Set(
            currentNodes
              .filter((n) => n.type === 'start')
              .map((n) => (n.data as BuilderNodeData).requestName)
          );
          while (existingNames.has(uniqueReqName)) {
            uniqueReqName = `${defaultReqName} ${counter}`;
            counter++;
          }

          const groupId = `group-${getNodeId()}`;

          const groupNode: Node = {
            id: groupId,
            type: 'group',
            position: { x: position.x - 95, y: position.y - 80 },
            data: {},
            style: {
              width: 420,
              height: 1000,
              background: 'transparent',
              border: 'none',
              pointerEvents: 'none' as const,
            },
            draggable: false,
            selectable: false,
            connectable: false,
          };

          const labelNode: Node = {
            id: `label-${getNodeId()}`,
            type: 'requestNameLabel',
            position: { x: 420 / 2 - 130, y: 10 },
            data: {
              label: `Request Name:\n${uniqueReqName}`,
              requestName: uniqueReqName,
              workflowGroupId: groupId,
            } satisfies BuilderNodeData,
            parentId: groupId,
            extent: 'parent' as const,
            draggable: true,
            selectable: true,
            connectable: false,
          };

          const startNode: Node = {
            id: getNodeId(),
            type: 'start',
            position: { x: 95, y: 80 },
            data: {
              label: 'Start',
              requestName: uniqueReqName,
              workflowGroupId: groupId,
              needCascading: true,
            } satisfies BuilderNodeData,
            parentId: groupId,
            extent: 'parent' as const,
          };

          return currentNodes.concat(groupNode, labelNode, startNode);
        });

        setMessage(null);
        return;
      }

      // ── Regular node (end, action types, etc.) ──────────────
      const definition = nodeDefinitionByType[type];

      setNodes((currentNodes) => {
        const newId = getNodeId();
        const groupUnderDrop = currentNodes.find(
          (n) =>
            n.type === 'group' &&
            position.x >= n.position.x &&
            position.x <= n.position.x + ((n.style?.width as number) ?? 420) &&
            position.y >= n.position.y &&
            position.y <= n.position.y + ((n.style?.height as number) ?? 1000)
        );

        let nodePosition = position;
        let parentId: string | undefined;
        let extent: 'parent' | undefined;
        let extraData: Partial<BuilderNodeData> = {};

        if (groupUnderDrop && type !== 'group' && type !== 'requestNameLabel') {
          parentId = groupUnderDrop.id;
          extent = 'parent';
          nodePosition = {
            x: position.x - groupUnderDrop.position.x,
            y: position.y - groupUnderDrop.position.y,
          };
          const startInGroup = currentNodes.find(
            (n) => n.parentId === groupUnderDrop.id && n.type === 'start'
          );
          if (startInGroup) {
            extraData.requestName = (startInGroup.data as BuilderNodeData).requestName;
          }
        }

        const newNode: Node = {
          id: newId,
          type,
          position: nodePosition,
          ...(parentId ? { parentId, extent } : {}),
          data: {
            label: definition?.label ?? type,
            color: definition?.color,
            condition: definition?.defaultData?.condition,
            requestName: definition?.defaultData?.requestName,
            moduleName: definition?.defaultModuleName || undefined,
            isEndpoint: definition?.defaultData?.isEndpoint,
            callFunction: true,
            description: definition?.description,
            ...extraData,
          } satisfies BuilderNodeData,
        };

        return currentNodes.concat(newNode);
      });

      setMessage(null);
    },
    [screenToFlowPosition, setNodes, isExecuting]
  );


  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    setSelectedNodeId(params.nodes[0]?.id ?? null);
    setSelectedEdgeId(params.edges[0]?.id ?? null);
  }, []);

  const onDragStart = (event: React.DragEvent, nodeType: string, hookData?: CustomHook) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('text/plain', nodeType);
    if (hookData) {
      event.dataTransfer.setData('application/custom-hook', JSON.stringify(hookData));
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  const deleteSelection = useCallback(() => {
    if (isExecuting) return;

    if (selectedNodeId) {
      setNodes((currentNodes) => {
        const nodeToDelete = currentNodes.find((n) => n.id === selectedNodeId);
        const idsToDelete = new Set<string>([selectedNodeId]);

        // If it's a workflow anchor (label or start), delete the whole workflow
        if (nodeToDelete?.type === 'requestNameLabel' || nodeToDelete?.type === 'start') {
          const groupId = nodeToDelete.parentId || (nodeToDelete.data as BuilderNodeData)?.workflowGroupId;
          if (groupId) {
            idsToDelete.add(groupId);
            currentNodes.forEach((n) => {
              if (
                n.parentId === groupId ||
                (n.data as BuilderNodeData)?.workflowGroupId === groupId
              ) {
                idsToDelete.add(n.id);
              }
            });
          }
        }

        // Clean up edges connected to any of the deleted nodes
        setEdges((currentEdges) =>
          currentEdges.filter(
            (edge) => !idsToDelete.has(edge.source) && !idsToDelete.has(edge.target)
          )
        );

        return currentNodes.filter((node) => !idsToDelete.has(node.id));
      });

      setSelectedNodeId(null);
      return;
    }

    if (selectedEdgeId) {
      setEdges((currentEdges) => currentEdges.filter((edge) => edge.id !== selectedEdgeId));
      setSelectedEdgeId(null);
    }
  }, [selectedEdgeId, selectedNodeId, setEdges, setNodes, isExecuting]);



  // ─── Drag whole workflow when start node is dragged ─────────────
  // Override onNodesChange to redirect start-node position changes to the group
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const redirected: NodeChange[] = [];
      const groupOverrides = new Map<string, { x: number; y: number }>();
      const additionalRemoves = new Set<string>();

      for (const change of changes) {
        if (change.type === 'position' && change.id) {
          const node = nodes.find((n) => n.id === change.id);
          // Redirect start-node or requestNameLabel drags to move the group
          if (node?.type === 'start' || node?.type === 'requestNameLabel') {
            const groupId = node.parentId || (node.data as Record<string, unknown>)?.workflowGroupId as string | undefined;
            if (groupId && change.position) {
              const groupNode = nodes.find((n) => n.id === groupId);
              if (groupNode) {
                // For child nodes, change.position is relative to the parent.
                // The delta from current relative pos gives us how much the group should shift.
                const dx = change.position.x - node.position.x;
                const dy = change.position.y - node.position.y;
                groupOverrides.set(groupId, {
                  x: groupNode.position.x + dx,
                  y: groupNode.position.y + dy,
                });
              }
              // Drop the child-node position change — group moves instead
              continue;
            }
          }
        }
        
        if (change.type === 'remove' && change.id) {
          const nodeToDelete = nodes.find((n) => n.id === change.id);
          if (nodeToDelete?.type === 'requestNameLabel' || nodeToDelete?.type === 'start') {
            const groupId = nodeToDelete.parentId || (nodeToDelete.data as BuilderNodeData)?.workflowGroupId;
            if (groupId) {
              additionalRemoves.add(groupId);
              nodes.forEach((n) => {
                if (
                  n.parentId === groupId ||
                  (n.data as BuilderNodeData)?.workflowGroupId === groupId
                ) {
                  additionalRemoves.add(n.id);
                }
              });
            }
          }
        }

        redirected.push(change);
      }

      // Add cascaded removes
      for (const id of additionalRemoves) {
        // Prevent adding a duplicate remove if it's already in 'redirected'
        if (!redirected.some((c) => c.type === 'remove' && c.id === id)) {
          redirected.push({ type: 'remove', id });
        }
      }

      // Apply group position overrides
      if (groupOverrides.size > 0) {
        const groupChanges: NodeChange[] = Array.from(groupOverrides.entries()).map(
          ([id, position]) => ({ type: 'position', id, position, dragging: true })
        );
        setNodes((currentNodes) => applyNodeChanges([...redirected, ...groupChanges], currentNodes));
      } else {
        setNodes((currentNodes) => applyNodeChanges(redirected, currentNodes));
      }
    },
    [nodes, setNodes]
  );

  const clearCanvas = useCallback(() => {
    if (isExecuting) return;
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setSerializedSchema('');
    setMessage('Canvas cleared.');
    engine.reset();
    setTimeout(() => fitView({ padding: 0.2 }), 50);
  }, [engine, fitView, isExecuting, setEdges, setNodes]);

  // ─── Generic node data updater ──────────────────────────────────
  const updateNodeData = useCallback(
    (field: keyof BuilderNodeData, value: string | boolean | undefined) => {
      if (!selectedNodeId || isExecuting) return;

      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (node.id !== selectedNodeId) return node;
          const data = (node.data ?? {}) as BuilderNodeData;
          return {
            ...node,
            data: { ...data, [field]: value } satisfies BuilderNodeData,
          };
        })
      );
    },
    [selectedNodeId, setNodes, isExecuting]
  );

  const updateCondition = useCallback(
    (value: string) => updateNodeData('condition', value),
    [updateNodeData]
  );

  // ─── Export / Import / Download ─────────────────────────────────
  const exportSchema = useCallback(() => {
    const schema = canvasToHookSchema(nodes, edges, clientCode);
    setSerializedSchema(JSON.stringify(schema, null, 2));
    setMessage('Hook schema generated from canvas.');
  }, [clientCode, edges, nodes]);

  const importSchema = useCallback(() => {
    if (isExecuting) return;
    try {
      const parsed = JSON.parse(serializedSchema) as HookConfig;
      const restored = hookSchemaToCanvas(parsed);
      setNodes(restored.nodes);
      setEdges(restored.edges);
      setClientCode(parsed.Client || 'COGITATE');
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setMessage('Canvas restored from hook schema.');
      setTimeout(() => fitView({ padding: 0.2 }), 50);
    } catch {
      setMessage('Invalid hook schema JSON. Please fix format and retry.');
    }
  }, [fitView, serializedSchema, setEdges, setNodes, isExecuting]);

  const applyAISchema = useCallback((newSchema: HookConfig) => {
    if (isExecuting) return;
    try {
      const restored = hookSchemaToCanvas(newSchema);
      setNodes(restored.nodes);
      setEdges(restored.edges);
      setClientCode(newSchema.Client || 'COGITATE');
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setMessage('Workflow updated by AI (HookConfig).');
      setTimeout(() => fitView({ padding: 0.2 }), 50);
    } catch (e) {
      console.error('Failed to apply AI HookConfig', e);
      setMessage('Failed to apply AI HookConfig. See console.');
    }
  }, [fitView, isExecuting, setEdges, setNodes]);

  const downloadSchema = useCallback(() => {
    const schema = canvasToHookSchema(nodes, edges, clientCode);
    const json = JSON.stringify(schema, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `hook-schema-${clientCode.toLowerCase()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setMessage(`Downloaded hook-schema-${clientCode.toLowerCase()}.json`);
  }, [clientCode, edges, nodes]);

  // ─── Execution handlers ─────────────────────────────────────────
  const handleRun = useCallback(() => {
    engine.reset();
    setIsLogsDockVisible(true);
    setIsLogsDockExpanded(true);
    // Small delay to ensure reset completes before run
    setTimeout(() => engine.run(), 50);
  }, [engine]);

  const handlePause = useCallback(() => {
    engine.pause();
  }, [engine]);

  // ─── Manual save handler ───────────────────────────────────────
  const handleManualSave = useCallback(async () => {
    if (!workflowId) return;
    
    setIsSaving(true);
    const success = await saveSchema({
      id: workflowId,
      name: workflowName,
      clientCode,
      nodes,
      edges,
    });

    if (success) {
      setLastSavedAt(new Date().toLocaleTimeString());
      setMessage(`Workflow saved: ${workflowName}`);
    } else {
      setMessage('Failed to save workflow');
    }
    setIsSaving(false);
  }, [workflowId, workflowName, clientCode, nodes, edges]);

  const handleResume = useCallback(() => {
    engine.resume();
  }, [engine]);

  const handleStop = useCallback(() => {
    engine.stop();
  }, [engine]);

  const handleReset = useCallback(() => {
    engine.reset();
  }, [engine]);

  const handleImportSchemaClick = useCallback(() => {
    if (!serializedSchema.trim()) {
      setIsSchemaPanelOpen(true);
      setMessage('Paste JSON in Schema Output and click Import Schema.');
      return;
    }

    importSchema();
  }, [importSchema, serializedSchema]);

  // ─── Helpers ────────────────────────────────────────────────────
  const selectedData = (selectedNode?.data ?? {}) as BuilderNodeData;
  const selectedCondition =
    typeof selectedData.condition === 'string'
      ? selectedData.condition
      : typeof selectedData.condition?.expression === 'string'
      ? selectedData.condition.expression
      : '';

  // ─── Start node workflow config updater ─────────────────────────
  // Updates the start node data and syncs the sibling label node
  const updateWorkflowConfig = useCallback(
    (field: keyof BuilderNodeData, value: string | boolean | Record<string, unknown>) => {
      if (!selectedNodeId || isExecuting) return;
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          // Update the start node itself
          if (node.id === selectedNodeId) {
            const data = (node.data ?? {}) as BuilderNodeData;
            return { ...node, data: { ...data, [field]: value } };
          }
          // If updating requestName, also sync the sibling label node
          if (field === 'requestName') {
            const startNode = currentNodes.find((n) => n.id === selectedNodeId);
            const groupId = (startNode?.data as BuilderNodeData)?.workflowGroupId;
            if (groupId && node.type === 'requestNameLabel' && (node.data as BuilderNodeData)?.workflowGroupId === groupId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  requestName: value,
                  label: `Request Name:\n${value}`,
                },
              };
            }
            // Also update requestName on all action nodes in this group
            if (groupId && node.parentId === groupId && node.type !== 'start' && node.type !== 'requestNameLabel' && node.type !== 'group') {
              return {
                ...node,
                data: { ...(node.data as BuilderNodeData), requestName: value as string },
              };
            }
          }
          return node;
        })
      );
    },
    [selectedNodeId, setNodes, isExecuting]
  );

  const hasSidebarOpen = isSchemaPanelOpen || selectedNode?.type === 'start';
  const canvasStyle = { 
    flex: 1, 
    minWidth: 0, 
    borderRight: hasSidebarOpen ? '1px solid #e5e7eb' : 'none' 
  };

  return (
    <div className="builder-layout">
      <NodesPanel onDragStart={onDragStart} />

      <div className="builder-main">
        <div className="builder-toolbar">
          <div className="builder-toolbar-left">
            <label>
              Client Code
              <input
                value={clientCode}
                onChange={(event) => setClientCode(event.target.value)}
                className="toolbar-input"
                placeholder="e.g., COGITATE"
              />
            </label>
            <button type="button" onClick={() => fitView({ padding: 0.2 })} title="Fit view">
              <Maximize2 size={13} /> Fit
            </button>
            <button
              type="button"
              onClick={deleteSelection}
              disabled={!selectedNodeId && !selectedEdgeId}
              title="Delete selected"
            >
              <Trash2 size={13} /> Delete
            </button>

            <div className="exec-controls-inline">
              {engine.state !== 'running' && engine.state !== 'paused' && (
                <button type="button" className="exec-btn exec-btn-run" onClick={handleRun} title="Execute workflow">
                  <Play size={12} /> Execute
                </button>
              )}
              {engine.state === 'running' && (
                <button type="button" className="exec-btn exec-btn-pause" onClick={handlePause} title="Pause execution">
                  <Pause size={12} /> Pause
                </button>
              )}
              {engine.state === 'paused' && (
                <button type="button" className="exec-btn exec-btn-run" onClick={handleResume} title="Resume execution">
                  <Play size={12} /> Resume
                </button>
              )}
              {isExecuting && (
                <button type="button" className="exec-btn exec-btn-stop" onClick={handleStop} title="Stop execution">
                  <Square size={12} /> Stop
                </button>
              )}
              {(engine.state === 'completed' || engine.state === 'error') && (
                <button type="button" className="exec-btn exec-btn-reset" onClick={handleReset} title="Reset">
                  <RotateCcw size={12} /> Reset
                </button>
              )}
            </div>

            <div className="toolbar-menu-wrap" ref={toolbarMenuRef}>
              <button
                type="button"
                className="toolbar-menu-trigger"
                onClick={() => setIsToolbarMenuOpen((prev) => !prev)}
                aria-label="Canvas actions"
                aria-haspopup="menu"
                aria-expanded={isToolbarMenuOpen}
                title="Canvas actions"
              >
                <Settings2 size={14} />
              </button>

              {isToolbarMenuOpen && (
                <div className="toolbar-menu-dropdown" role="menu">
                  <button type="button" role="menuitem" onClick={() => { clearCanvas(); setIsToolbarMenuOpen(false); }}>
                    <Eraser size={13} /> Clear Canvas
                  </button>
                  <button type="button" role="menuitem" onClick={() => { exportSchema(); setIsToolbarMenuOpen(false); }}>
                    <FileJson size={13} /> Export Schema
                  </button>
                  <button type="button" role="menuitem" onClick={() => { handleImportSchemaClick(); setIsToolbarMenuOpen(false); }}>
                    <Upload size={13} /> Import Schema
                  </button>
                  <button type="button" role="menuitem" onClick={() => { downloadSchema(); setIsToolbarMenuOpen(false); }}>
                    <Download size={13} /> Download JSON
                  </button>
                  <div className="toolbar-menu-divider" />
                  <button
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={isSchemaPanelOpen}
                    onClick={() => { setIsSchemaPanelOpen((prev) => !prev); setIsToolbarMenuOpen(false); }}
                  >
                    <FileJson size={13} />
                    <span>Schema Output</span>
                    {isSchemaPanelOpen && <span className="menu-check">✓</span>}
                  </button>
                  <button
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={isLogsDockVisible}
                    onClick={() => {
                      setIsLogsDockVisible((prev) => { const next = !prev; if (next) setIsLogsDockExpanded(true); return next; });
                      setIsToolbarMenuOpen(false);
                    }}
                  >
                    <TerminalSquare size={13} />
                    <span>Execution Logs</span>
                    {isLogsDockVisible && <span className="menu-check">✓</span>}
                  </button>
                  <button
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={!isChatCollapsed}
                    onClick={() => { setIsChatCollapsed((prev) => !prev); setIsToolbarMenuOpen(false); }}
                  >
                    <Bot size={13} />
                    <span>AI Chat Panel</span>
                    {!isChatCollapsed && <span className="menu-check">✓</span>}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* AI toggle + Schema Output in toolbar right rail */}
          <div className={`builder-toolbar-right builder-toolbar-right-rail`}>
              <button
                type="button"
                className={`toolbar-ai-btn ${isSchemaPanelOpen ? 'active' : ''}`}
                onClick={() => setIsSchemaPanelOpen((prev) => !prev)}
                title="Toggle Schema Output"
              >
                <FileJson size={14} />
                <span>Schema Output</span>
              </button>
              <span className="toolbar-rail-divider" aria-hidden="true" />
              <button
                type="button"
                className={`toolbar-ai-btn ${!isChatCollapsed ? 'active' : ''}`}
                onClick={() => setIsChatCollapsed(!isChatCollapsed)}
                title="Toggle Workflow AI"
              >
                <MessageSquare size={14} />
                <span>Workflow AI</span>
              </button>
          </div>
        </div>

        {message && (
          <div className="toolbar-message-row">
            <span className="toolbar-message">{message}</span>
            <button
              type="button"
              className="toolbar-message-dismiss"
              onClick={() => setMessage(null)}
              aria-label="Dismiss"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* If-Else modal — mounted via portal to escape CSS transforms */}
        {isIfElseModalOpen && selectedNode?.type === 'ifCondition' && typeof document !== 'undefined' && createPortal(
          <div className="ifelse-modal-backdrop" onClick={() => setIsIfElseModalOpen(false)}>
            <div className="ifelse-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ifelse-modal-header">
                <div className="ifelse-modal-header-left">
                  <span className="ifelse-modal-icon">⬡</span>
                  <span>If / Else Condition</span>
                </div>
                <button
                  type="button"
                  className="ifelse-modal-close"
                  onClick={() => setIsIfElseModalOpen(false)}
                  aria-label="Close"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="ifelse-modal-body">
                <div className="ifelse-modal-field">
                  <label className="ifelse-modal-label">Condition Expression</label>
                  <input
                    className="ifelse-modal-input"
                    value={selectedCondition}
                    onChange={(event) => updateCondition(event.target.value)}
                    placeholder='e.g., Transaction.Type = "Quote" AND Amount > 1000'
                    autoFocus
                  />
                </div>

                <div className="ifelse-modal-field">
                  <label className="ifelse-modal-label">Module Name</label>
                  <input
                    className="ifelse-modal-input"
                    value={selectedData.moduleName ?? ''}
                    onChange={(e) => updateNodeData('moduleName', e.target.value)}
                    placeholder="@cogitate/core-pos-components"
                  />
                </div>

                <div className="ifelse-modal-field">
                  <label className="ifelse-modal-label">Path</label>
                  <input
                    className="ifelse-modal-input"
                    value={selectedData.path ?? ''}
                    onChange={(e) => updateNodeData('path', e.target.value)}
                    placeholder="COGITATE/configs/Personal/HO3/hooksCall/property.js"
                  />
                </div>

                <div className="ifelse-modal-toggles">
                  <label className="ifelse-modal-toggle-label">
                    <input
                      type="checkbox"
                      checked={selectedData.isEndpoint ?? false}
                      onChange={(e) => updateNodeData('isEndpoint', e.target.checked)}
                      className="ifelse-modal-checkbox"
                    />
                    Is Endpoint
                  </label>
                  <label className="ifelse-modal-toggle-label">
                    <input
                      type="checkbox"
                      checked={selectedData.callFunction !== false}
                      onChange={(e) => updateNodeData('callFunction', e.target.checked)}
                      className="ifelse-modal-checkbox"
                    />
                    Call Function
                  </label>
                </div>
              </div>

              <div className="ifelse-modal-footer">
                <button
                  type="button"
                  className="ifelse-modal-cancel"
                  onClick={() => setIsIfElseModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="ifelse-modal-save"
                  onClick={() => setIsIfElseModalOpen(false)}
                >
                  <Save size={13} /> Save
                </button>
              </div>
            </div>
          </div>
        , document.body)}


        <div className="builder-workspace">
          <div className="builder-content">
            <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div ref={reactFlowWrapper} className="canvas-wrap" style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                {/* Floating Save Button */}
                <div className="canvas-save-fab">
                  <button
                    type="button"
                    className="canvas-save-btn"
                    onClick={handleManualSave}
                    disabled={isSaving || isLoading}
                    title={lastSavedAt ? `Last saved at ${lastSavedAt}` : 'Save workflow'}
                  >
                    <Save size={13} />
                    <span>{isSaving ? 'Saving…' : 'Save'}</span>
                  </button>
                  {lastSavedAt && (
                    <span className="canvas-save-timestamp">Saved {lastSavedAt}</span>
                  )}
                </div>
                <ReactFlow
                  nodes={displayNodes}
                  edges={displayEdges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onSelectionChange={onSelectionChange}
                  onNodeDoubleClick={(_, node) => {
                    if (node.type === 'ifCondition') {
                      setIsIfElseModalOpen(true);
                    }
                  }}
                  nodeTypes={customNodeTypes}
                  fitView
                  deleteKeyCode={['Backspace', 'Delete']}
                  defaultEdgeOptions={{
                    type: 'smoothstep',
                    markerEnd: { type: 'arrowclosed' },
                  }}
                >
                  <MiniMap pannable zoomable />
                  <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
                  <Controls showInteractive={false} />
                </ReactFlow>
              </div>

              {isSchemaPanelOpen && (
                <>
                  {/* Drag handle */}
                  <div
                    className="panel-resize-handle"
                    onMouseDown={startSchemaResize}
                    title="Drag to resize"
                    aria-hidden="true"
                  />
                  <div className="schema-sidebar" style={{ width: schemaSidebarWidth }}>
                    <div className="schema-sidebar-header">
                      <span>Schema Output</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          type="button"
                          className="schema-sidebar-icon-btn"
                          onClick={handleCopySchema}
                          title={isSchemaCopied ? 'Copied!' : 'Copy schema'}
                          aria-label="Copy schema"
                        >
                          {isSchemaCopied ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                        <button
                          type="button"
                          className="schema-sidebar-icon-btn"
                          onClick={() => setIsSchemaPanelOpen(false)}
                          aria-label="Close schema panel"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="schema-code-wrap">
                      <textarea
                        id="hook-schema"
                        className="schema-sidebar-textarea"
                        value={serializedSchema}
                        onChange={(event) => setSerializedSchema(event.target.value)}
                        placeholder="Export schema here or paste to import..."
                        spellCheck={false}
                      />
                    </div>
                    {/* Import / Export quick actions */}
                    <div className="schema-sidebar-actions">
                      <button
                        type="button"
                        className="schema-sidebar-action-btn schema-action-export"
                        onClick={() => { exportSchema(); }}
                        title="Generate schema from canvas"
                      >
                        <FileJson size={13} /> Export Schema
                      </button>
                      <button
                        type="button"
                        className="schema-sidebar-action-btn schema-action-import"
                        onClick={() => { handleImportSchemaClick(); }}
                        title="Load canvas from schema JSON"
                      >
                        <Upload size={13} /> Import Schema
                      </button>
                    </div>
                  </div>
                </>
              )}

              {selectedNode?.type === 'start' && (
                <div className="start-node-config-sidebar">
                  <div className="start-node-config-header">
                    <span className="start-node-config-icon">⚙</span>
                    <span>Workflow Config</span>
                  </div>
                  <div className="start-node-config-fields sidebar-fields">
                    <label className="start-node-config-field start-node-config-field-stacked" style={{ flex: 'none' }}>
                      <span className="start-node-config-label">Request Name</span>
                      <input
                        className="toolbar-input start-node-config-input"
                        value={selectedData.requestName ?? ''}
                        onChange={(e) => updateWorkflowConfig('requestName', e.target.value)}
                        placeholder="/Quote/Summary"
                        spellCheck={false}
                        style={{ minWidth: '100%', width: '100%' }}
                      />
                    </label>

                    {/* ── Request Library ──────────────────────────── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      <button
                        type="button"
                        onClick={() => { setIsLibraryOpen((p) => !p); setLibrarySearch(''); }}
                        aria-expanded={isLibraryOpen}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          height: 30,
                          padding: '0 10px',
                          border: isLibraryOpen ? '1px solid #4f46e5' : '1px solid rgba(99,102,241,0.35)',
                          borderRadius: 20,
                          background: isLibraryOpen ? '#6366f1' : 'rgba(238,242,255,0.7)',
                          color: isLibraryOpen ? '#fff' : '#4338ca',
                          fontSize: 11.5,
                          fontWeight: 600,
                          cursor: 'pointer',
                          letterSpacing: '0.01em',
                          alignSelf: 'flex-start',
                          width: 'auto',
                          minWidth: 0,
                          boxShadow: isLibraryOpen ? '0 2px 8px rgba(99,102,241,0.35)' : 'none',
                          transition: 'all 0.18s ease',
                          fontFamily: 'inherit',
                        }}
                      >
                        <BookOpen size={12} />
                        <span>Request Library</span>
                        {isLibraryOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>

                      {isLibraryOpen && (
                        <div style={{
                          marginTop: 8,
                          background: '#fff',
                          border: '1px solid #c7d2fe',
                          borderRadius: 10,
                          boxShadow: '0 4px 16px rgba(99,102,241,0.12)',
                          overflow: 'hidden',
                          animation: 'libraryFadeIn 0.15s ease',
                        }}>
                          {/* Search row */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '0 10px',
                            borderBottom: '1px solid #e0e7ff',
                            background: '#f5f7ff',
                          }}>
                            <Search size={11} style={{ color: '#a5b4fc', flexShrink: 0 }} />
                            <input
                              placeholder="Search requests…"
                              value={librarySearch}
                              onChange={(e) => setLibrarySearch(e.target.value)}
                              autoFocus
                              style={{
                                flex: 1,
                                border: 'none',
                                background: 'transparent',
                                outline: 'none',
                                boxShadow: 'none',
                                height: 34,
                                fontSize: 12,
                                color: '#1e1b4b',
                                padding: '0 4px',
                                fontFamily: 'inherit',
                              }}
                            />
                            {librarySearch && (
                              <button
                                type="button"
                                onClick={() => setLibrarySearch('')}
                                aria-label="Clear search"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 18,
                                  height: 18,
                                  padding: 0,
                                  border: 'none',
                                  borderRadius: '50%',
                                  background: '#e0e7ff',
                                  color: '#6366f1',
                                  cursor: 'pointer',
                                  flexShrink: 0,
                                  fontFamily: 'inherit',
                                }}
                              >
                                <X size={10} />
                              </button>
                            )}
                          </div>

                          {/* Results list */}
                          <div style={{
                            maxHeight: 200,
                            overflowY: 'auto',
                            padding: 8,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                          }}>
                            {REQUEST_LIBRARY.map((cat) => {
                              const filtered = cat.requests.filter((r) =>
                                r.toLowerCase().includes(librarySearch.toLowerCase())
                              );
                              if (filtered.length === 0) return null;
                              return (
                                <div key={cat.category}>
                                  {!librarySearch && (
                                    <span style={{
                                      display: 'block',
                                      fontSize: 10,
                                      fontWeight: 700,
                                      color: '#6366f1',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.7px',
                                      marginBottom: 5,
                                    }}>{cat.category}</span>
                                  )}
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                    {filtered.map((req) => {
                                      const isActive = selectedData.requestName === req;
                                      return (
                                        <button
                                          key={req}
                                          type="button"
                                          onClick={() => {
                                            updateWorkflowConfig('requestName', req);
                                            setIsLibraryOpen(false);
                                            setLibrarySearch('');
                                          }}
                                          title={req}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            height: 'auto',
                                            padding: '4px 9px',
                                            border: isActive ? '1px solid #4f46e5' : '1px solid #c7d2fe',
                                            borderRadius: 20,
                                            background: isActive ? '#6366f1' : '#f0f4ff',
                                            color: isActive ? '#fff' : '#3730a3',
                                            fontSize: 11,
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                            fontFamily: "'Fira Code', Consolas, Monaco, monospace",
                                            letterSpacing: 0,
                                            minWidth: 0,
                                            width: 'auto',
                                            boxShadow: isActive ? '0 2px 6px rgba(99,102,241,0.3)' : 'none',
                                            transition: 'all 0.15s ease',
                                          }}
                                        >
                                          {req}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                            {REQUEST_LIBRARY.every((cat) =>
                              cat.requests.every(
                                (r) => !r.toLowerCase().includes(librarySearch.toLowerCase())
                              )
                            ) && (
                              <p style={{ fontSize: 11.5, color: '#94a3b8', textAlign: 'center', padding: '12px 0 4px', fontStyle: 'italic' }}>
                                No matches for &ldquo;{librarySearch}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="start-node-config-toggles sidebar-toggles">
                      <label className="start-node-config-toggle">
                        <button
                          type="button"
                          className={`toggle-switch ${selectedData.needCascading !== false ? 'on' : 'off'}`}
                          onClick={() => updateWorkflowConfig('needCascading', selectedData.needCascading === false ? true : false)}
                          aria-pressed={selectedData.needCascading !== false}
                        >
                          <span className="toggle-thumb" />
                        </button>
                        <span>Need Cascading</span>
                      </label>

                      <label className="start-node-config-toggle">
                        <button
                          type="button"
                          className={`toggle-switch ${selectedData.hookCallCascading ? 'on' : 'off'}`}
                          onClick={() => updateWorkflowConfig('hookCallCascading', !selectedData.hookCallCascading)}
                          aria-pressed={!!selectedData.hookCallCascading}
                        >
                          <span className="toggle-thumb" />
                        </button>
                        <span>Hook Call Cascading</span>
                      </label>
                    </div>

                    <label className="start-node-config-field start-node-config-field-stacked">
                      <span className="start-node-config-label">
                        Static Params
                        <span className="start-node-config-label-hint">JSON</span>
                      </span>
                      <textarea
                        className="start-node-config-textarea"
                        value={
                          selectedData.staticParams
                            ? JSON.stringify(selectedData.staticParams, null, 2)
                            : ''
                        }
                        onChange={(e) => {
                          const raw = e.target.value.trim();
                          if (!raw) {
                            updateWorkflowConfig('staticParams', {});
                            return;
                          }
                          try {
                            const parsed = JSON.parse(raw) as Record<string, unknown>;
                            updateWorkflowConfig('staticParams', parsed);
                          } catch {
                            // keep raw text; don't update until valid
                          }
                        }}
                        placeholder={'{\n  "key": "value"\n}'}
                        rows={6}
                        spellCheck={false}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside
            className={`chat-sidebar ${isChatCollapsed ? 'collapsed' : ''}`}
            style={!isChatCollapsed ? { width: chatSidebarWidth, minWidth: chatSidebarWidth } : {}}
          >
            {!isChatCollapsed && (
              <>
                <div
                  className="panel-resize-handle"
                  onMouseDown={startChatResize}
                  title="Drag to resize"
                  aria-hidden="true"
                />
                <WorkflowChatPanel
                  currentSchema={canvasToHookSchema(nodes, edges, clientCode)}
                  onApplySchema={applyAISchema}
                  onClose={() => setIsChatCollapsed(true)}
                />
              </>
            )}
          </aside>
        </div>

        {isLogsDockVisible && (
          <section className={`logs-dock ${isLogsDockExpanded ? 'expanded' : 'collapsed'}`}>
            <button
              type="button"
              className="logs-dock-header"
              onClick={() => setIsLogsDockExpanded((prev) => !prev)}
              aria-expanded={isLogsDockExpanded}
            >
              <span>Logs</span>
              <span className="logs-dock-arrow">{isLogsDockExpanded ? '▾' : '▴'}</span>
            </button>

            {isLogsDockExpanded && (
              <ExecutionLogs
                logs={engine.logs}
                executionState={engine.state}
                progress={engine.progress}
                onClear={handleReset}
                showHeader={false}
                emptyMessage="Nothing to display yet. Execute the workflow to see execution logs."
              />
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default function WorkflowBuilder() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas />
    </ReactFlowProvider>
  );
}
