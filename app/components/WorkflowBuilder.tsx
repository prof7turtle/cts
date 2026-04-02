'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type OnSelectionChangeParams,
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

interface CustomHook {
  id: string;
  hookName: string;
  category: string;
  functionName: string;
  moduleName: string;
  condition?: string;
  code: string;
}

const initialNodes: Node[] = [
  {
    id: 'start-1',
    type: 'start',
    position: { x: 320, y: 80 },
    data: { label: 'Start' },
  },
];

const initialEdges: Edge[] = [];

let nodeId = 0;
let edgeId = 0;

const getNodeId = () => `node-${++nodeId}`;
const getEdgeId = () => `edge-${++edgeId}`;

function WorkflowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggedHookData, setDraggedHookData] = useState<CustomHook | null>(null);
  const [clientCode, setClientCode] = useState('COGITATE');
  const [serializedSchema, setSerializedSchema] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<"schema" | "logs" | null>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // ─── Execution Engine ──────────────────────────────────────
  const nodesRef = useCallback(() => nodes, [nodes]);
  const edgesRef = useCallback(() => edges, [edges]);
  const engine = useExecutionEngine(nodesRef, edgesRef);

  const isExecuting = engine.state === 'running' || engine.state === 'paused';

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
      if (!type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      let node: Node;

      if (type.startsWith('customHook-')) {
        // Handle custom hook
        const hookData = draggedHookData;
        if (!hookData) return;

        node = {
          id: getNodeId(),
          type: 'customHook',
          position,
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
          } satisfies BuilderNodeData,
        };
      } else {
        // Handle regular node
        const definition = nodeDefinitionByType[type];
        node = {
          id: getNodeId(),
          type,
          position,
          data: {
            label: definition?.label ?? type,
            color: definition?.color,
            condition: definition?.defaultData?.condition,
            requestName: definition?.defaultData?.requestName,
            moduleName: definition?.defaultModuleName || undefined,
            isEndpoint: definition?.defaultData?.isEndpoint,
            callFunction: true,
            description: definition?.description,
          } satisfies BuilderNodeData,
        };
      }

      setNodes((currentNodes) => currentNodes.concat(node));
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
    event.dataTransfer.effectAllowed = 'move';
    setDraggedHookData(hookData || null);
  };

  const deleteSelection = useCallback(() => {
    if (isExecuting) return;

    if (selectedNodeId) {
      setNodes((currentNodes) => currentNodes.filter((node) => node.id !== selectedNodeId));
      setEdges((currentEdges) =>
        currentEdges.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId)
      );
      setSelectedNodeId(null);
      return;
    }

    if (selectedEdgeId) {
      setEdges((currentEdges) => currentEdges.filter((edge) => edge.id !== selectedEdgeId));
      setSelectedEdgeId(null);
    }
  }, [selectedEdgeId, selectedNodeId, setEdges, setNodes, isExecuting]);

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
    setActivePanel('logs');
    // Small delay to ensure reset completes before run
    setTimeout(() => engine.run(), 50);
  }, [engine]);

  const handlePause = useCallback(() => {
    engine.pause();
  }, [engine]);

  const handleResume = useCallback(() => {
    engine.resume();
  }, [engine]);

  const handleStop = useCallback(() => {
    engine.stop();
  }, [engine]);

  const handleReset = useCallback(() => {
    engine.reset();
  }, [engine]);

  // ─── Helpers ────────────────────────────────────────────────────
  const isActionNode =
    selectedNode &&
    selectedNode.type !== 'start' &&
    selectedNode.type !== 'end';

  const selectedData = (selectedNode?.data ?? {}) as BuilderNodeData;
  const selectedCondition =
    typeof selectedData.condition === 'string' ? selectedData.condition : '';
  const selectedDef = nodeDefinitionByType[selectedNode?.type ?? ''];

  const canvasStyle = activePanel === "schema" ? { flex: '0 0 80%', borderRight: '1px solid #e5e7eb' } : { flex: 1 };

  return (
    <div className="builder-layout">
      <NodesPanel onDragStart={onDragStart} />

      <div className="builder-main">
        <div className="builder-toolbar">
          <label>
            Client Code
            <input
              value={clientCode}
              onChange={(event) => setClientCode(event.target.value)}
              className="toolbar-input"
              placeholder="e.g., COGITATE"
            />
          </label>
          <button type="button" onClick={() => fitView({ padding: 0.2 })}>
            Fit View
          </button>
          <button type="button" onClick={deleteSelection}>
            Delete
          </button>
          <button type="button" onClick={exportSchema}>
            Export Schema
          </button>
          <button type="button" onClick={importSchema}>
            Import Schema
          </button>
          <button type="button" onClick={downloadSchema}>
            ⬇ Download JSON
          </button>

          {/* ─── Execution Controls ─────────────────────────── */}
          <div style={{ borderLeft: '1px solid #c9d7ea', paddingLeft: '8px', marginLeft: '4px', display: 'flex', gap: '4px' }}>
            {engine.state !== 'running' && engine.state !== 'paused' && (
              <button type="button" className="exec-btn exec-btn-run" onClick={handleRun}>
                ▶ Run
              </button>
            )}
            {engine.state === 'running' && (
              <button type="button" className="exec-btn exec-btn-pause" onClick={handlePause}>
                ⏸ Pause
              </button>
            )}
            {engine.state === 'paused' && (
              <button type="button" className="exec-btn exec-btn-run" onClick={handleResume}>
                ▶ Resume
              </button>
            )}
            {isExecuting && (
              <button type="button" className="exec-btn exec-btn-stop" onClick={handleStop}>
                ⏹ Stop
              </button>
            )}
            {(engine.state === 'completed' || engine.state === 'error') && (
              <button type="button" className="exec-btn exec-btn-reset" onClick={handleReset}>
                ↺ Reset
              </button>
            )}
          </div>

          <button
            type="button"
            className={`px-3 py-1.5 text-sm border rounded-md ${activePanel === "schema" ? "bg-blue-500 text-white" : "hover:bg-gray-100"}`}
            onClick={() => setActivePanel(activePanel === "schema" ? null : "schema")}
          >
            Schema Output
          </button>

          <button
            type="button"
            className={`px-3 py-1.5 text-sm border rounded-md ${activePanel === "logs" ? "bg-blue-500 text-white" : "hover:bg-gray-100"}`}
            onClick={() => setActivePanel(activePanel === "logs" ? null : "logs")}
          >
            Execution Logs
          </button>

          {message && <span className="toolbar-message">{message}</span>}
        </div>

        {selectedNode?.type === 'ifCondition' && (
          <div className="condition-panel">
            <label>
              Condition Expression
              <input
                className="toolbar-input"
                value={selectedCondition}
                onChange={(event) => updateCondition(event.target.value)}
                placeholder='e.g., Transaction.Type = "Quote" AND Amount > 1000'
                style={{ marginLeft: '8px' }}
              />
            </label>

            <label style={{ flex: '1 1 45%' }}>
              Module Name
              <input
                className="toolbar-input"
                value={selectedData.moduleName ?? ''}
                onChange={(e) => updateNodeData('moduleName', e.target.value)}
                placeholder="@cogitate/core-pos-components"
              />
            </label>

            <label style={{ flex: '1 1 45%' }}>
              Condition
              <input
                className="toolbar-input"
                value={selectedCondition}
                onChange={(e) => updateNodeData('condition', e.target.value)}
                placeholder="Transaction.Type = 'Application'"
              />
            </label>

            <label style={{ flex: '1 1 45%' }}>
              Path
              <input
                className="toolbar-input"
                value={selectedData.path ?? ''}
                onChange={(e) => updateNodeData('path', e.target.value)}
                placeholder="COGITATE/configs/Personal/HO3/hooksCall/property.js"
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '0 0 auto' }}>
              <input
                type="checkbox"
                checked={selectedData.isEndpoint ?? false}
                onChange={(e) => updateNodeData('isEndpoint', e.target.checked)}
              />
              Is Endpoint
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '0 0 auto' }}>
              <input
                type="checkbox"
                checked={selectedData.callFunction !== false}
                onChange={(e) => updateNodeData('callFunction', e.target.checked)}
              />
              Call Function
            </label>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0', flex: 1, minHeight: 0 }}>
          <div ref={reactFlowWrapper} className="canvas-wrap" style={canvasStyle}>
            <ReactFlow
              nodes={displayNodes}
              edges={displayEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onSelectionChange={onSelectionChange}
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

          {activePanel === "schema" && (
            <div className="schema-panel" style={{ flex: '0 0 20%' }}>
              <label htmlFor="hook-schema">Schema Output</label>
              <textarea
                id="hook-schema"
                value={serializedSchema}
                onChange={(event) => setSerializedSchema(event.target.value)}
                placeholder="Export schema here or paste to import..."
              />
            </div>
          )}
        </div>

        {activePanel === 'logs' && (
          <ExecutionLogs
            logs={engine.logs}
            executionState={engine.state}
            progress={engine.progress}
            onClear={handleReset}
          />
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
