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
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [clientCode, setClientCode] = useState('COGITATE');
  const [serializedSchema, setSerializedSchema] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [bottomPanel, setBottomPanel] = useState<'schema' | 'logs'>('logs');
  const { screenToFlowPosition, fitView } = useReactFlow();

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

      const definition = nodeDefinitionByType[type];
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const node: Node = {
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

      setNodes((currentNodes) => currentNodes.concat(node));
      setMessage(null);
    },
    [screenToFlowPosition, setNodes, isExecuting]
  );

  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    setSelectedNodeId(params.nodes[0]?.id ?? null);
    setSelectedEdgeId(params.edges[0]?.id ?? null);
  }, []);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
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
    setBottomPanel('logs');
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
  const selectedDef = nodeDefinitionByType[selectedNode?.type ?? ''];

  return (
    <div className="builder-layout">
      <NodesPanel onDragStart={onDragStart} />

      <div className="builder-main">
        <div className="builder-toolbar">
          <label>
            Client
            <input
              value={clientCode}
              onChange={(event) => setClientCode(event.target.value)}
              className="toolbar-input"
              disabled={isExecuting}
            />
          </label>
          <button type="button" onClick={deleteSelection} disabled={isExecuting}>
            Delete Selection
          </button>
          <button type="button" onClick={() => fitView({ padding: 0.2 })}>
            Fit View
          </button>
          <button type="button" onClick={exportSchema}>
            Export Hook Schema
          </button>
          <button type="button" onClick={importSchema} disabled={isExecuting}>
            Import Hook Schema
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

          {message && <span className="toolbar-message">{message}</span>}
        </div>

        {/* ─── Node Property Panel ───────────────────────────── */}
        {isActionNode && !isExecuting && (
          <div className="condition-panel" style={{ flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ width: '100%', fontWeight: 'bold', marginBottom: '4px', fontSize: '13px' }}>
              {selectedDef?.label ?? selectedNode?.type} — Properties
            </div>

            <label style={{ flex: '1 1 45%' }}>
              Request Name
              <input
                className="toolbar-input"
                value={selectedData.requestName ?? ''}
                onChange={(e) => updateNodeData('requestName', e.target.value)}
                placeholder="/Quote/Landing"
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
                value={selectedData.condition ?? ''}
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

        <div ref={reactFlowWrapper} className="canvas-wrap">
          <ReactFlow
            nodes={displayNodes}
            edges={edges}
            onNodesChange={isExecuting ? undefined : onNodesChange}
            onEdgesChange={isExecuting ? undefined : onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onSelectionChange={onSelectionChange}
            nodeTypes={customNodeTypes}
            fitView
            nodesDraggable={!isExecuting}
            nodesConnectable={!isExecuting}
            elementsSelectable={!isExecuting}
            deleteKeyCode={isExecuting ? [] : ['Backspace', 'Delete']}
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

        {/* ─── Bottom Panel: Schema / Logs Tab Switcher ─── */}
        <div className="bottom-panel-tabs">
          <button
            type="button"
            className={`bottom-panel-tab ${bottomPanel === 'logs' ? 'active' : ''}`}
            onClick={() => setBottomPanel('logs')}
          >
            🖥 Execution Logs
          </button>
          <button
            type="button"
            className={`bottom-panel-tab ${bottomPanel === 'schema' ? 'active' : ''}`}
            onClick={() => setBottomPanel('schema')}
          >
            📋 Hook Schema JSON
          </button>
        </div>

        {bottomPanel === 'schema' && (
          <div className="schema-panel">
            <label htmlFor="hook-schema">Hook Schema JSON</label>
            <textarea
              id="hook-schema"
              value={serializedSchema}
              onChange={(event) => setSerializedSchema(event.target.value)}
              placeholder="Export schema to edit or paste existing schema for import..."
            />
          </div>
        )}

        {bottomPanel === 'logs' && (
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
