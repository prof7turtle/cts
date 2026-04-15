'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const [clientCode, setClientCode] = useState('COGITATE');
  const [serializedSchema, setSerializedSchema] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const [activePanel, setActivePanel] = useState<"schema" | "logs" | null>(null);

  const [showSchemaPanel, setShowSchemaPanel] = useState(true);
  const [showLogsPanel, setShowLogsPanel] = useState(true);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  const { screenToFlowPosition, fitView } = useReactFlow();
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  const nodesRef = useCallback(() => nodes, [nodes]);
  const edgesRef = useCallback(() => edges, [edges]);
  const engine = useExecutionEngine(nodesRef, edgesRef);

  const isExecuting = engine.state === 'running' || engine.state === 'paused';

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
            ? { fontSize: 10, fontWeight: 600, fill: '#64748b' }
            : edge.labelStyle,
        };
      }

      if (execStatus === 'active') {
        return {
          ...edge,
          animated: true,
          style: { ...(edge.style ?? {}), stroke: '#16a34a', strokeWidth: 2.5 },
          className: `${edge.className ?? ''} edge-exec-active`.trim(),
          label: branchLabel ?? edge.label,
          labelStyle: { fontSize: 10, fontWeight: 600, fill: '#166534' },
        };
      }

      return {
        ...edge,
        animated: false,
        style: { ...(edge.style ?? {}), stroke: '#22c55e', strokeWidth: 2 },
        className: `${edge.className ?? ''} edge-exec-completed`.trim(),
        label: branchLabel ?? edge.label,
        labelStyle: { fontSize: 10, fontWeight: 600, fill: '#166534' },
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
            style: { stroke: '#cbd5e1', strokeWidth: 1.5 },
            markerEnd: { type: 'arrowclosed', color: '#94a3b8', width: 12, height: 12 },
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
        const hookPayload = event.dataTransfer.getData('application/reactflow-custom-hook');
        const hookData = hookPayload ? (JSON.parse(hookPayload) as CustomHook) : null;
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
          } as Node['data'],
        };
      } else {
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
    if (hookData) {
      event.dataTransfer.setData(
        'application/reactflow-custom-hook',
        JSON.stringify(hookData)
      );
    }
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

  const handleRun = useCallback(() => {
    engine.reset();

    setActivePanel('logs');
    // Small delay to ensure reset completes before run

    setShowLogsPanel(true);

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

  const selectedData = (selectedNode?.data ?? {}) as BuilderNodeData;
  const selectedCondition =
    typeof selectedData.condition === 'string' ? selectedData.condition : '';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        actionsMenuRef.current &&
        !actionsMenuRef.current.contains(event.target as Node)
      ) {
        setShowActionsMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toolbarBtn =
    'inline-flex min-h-[44px] min-w-[112px] items-center justify-center rounded-lg border border-slate-200/80 bg-white px-8 py-2 text-sm font-medium leading-normal text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';
  const deleteBtn =
    'inline-flex min-h-[44px] min-w-[112px] items-center justify-center rounded-lg border border-red-200 bg-red-50 px-8 py-2 text-sm font-semibold leading-normal text-red-600 shadow-sm transition-all duration-200 hover:border-red-300 hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500';
  const toolbarToggle =
    'inline-flex min-h-[44px] min-w-[112px] items-center justify-center rounded-lg border border-slate-200/80 bg-white px-8 py-2 text-sm font-medium leading-normal text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';
  const actionMenuItem =
    'flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-100';

  const canvasStyle = activePanel === "schema" ? { flex: '0 0 80%', borderRight: '1px solid #e5e7eb' } : { flex: 1 };

  return (
    <div className="builder-layout">
      <NodesPanel onDragStart={onDragStart} />

      <div className="builder-main">
        <div className="builder-toolbar relative z-30 overflow-visible border-b border-slate-200/90 bg-white px-6 py-3 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.18)]">
          <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 lg:flex-nowrap">
                <div className="flex min-w-0 flex-wrap items-center gap-3 lg:flex-[0_0_auto]">
                  <span className="shrink-0 text-[13px] font-semibold text-slate-500">Client code</span>
                  <input
                    value={clientCode}
                    onChange={(event) => setClientCode(event.target.value)}
                    className="toolbar-input w-[180px] min-w-[140px] bg-white sm:w-[220px] lg:w-[240px]"
                  placeholder="e.g., COGITATE"
                />
                  {engine.state !== 'running' && engine.state !== 'paused' && (
                    <button
                      type="button"
                      onClick={handleRun}
                      className="inline-flex min-h-[44px] min-w-[112px] items-center justify-center rounded-lg bg-green-600 px-8 py-2 text-sm font-semibold text-white shadow-md shadow-green-600/25 transition-all duration-200 hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                    >
                      Run
                    </button>
                  )}
                  {engine.state === 'paused' && (
                    <button type="button" className={toolbarBtn} onClick={handleResume}>
                      Resume
                    </button>
                  )}
                  {engine.state === 'running' && (
                    <button type="button" className={toolbarBtn} onClick={handlePause}>
                      Pause
                    </button>
                  )}
                  {isExecuting && (
                    <button type="button" className={toolbarBtn} onClick={handleStop}>
                      Stop
                    </button>
                  )}
                  {(engine.state === 'completed' || engine.state === 'error') && (
                    <button type="button" className={toolbarBtn} onClick={handleReset}>
                      Reset
                    </button>
                  )}
                </div>

                <div className="flex flex-1 flex-wrap items-center gap-2 lg:flex-nowrap">
                  <button type="button" className={deleteBtn} onClick={deleteSelection}>
                    Delete
                  </button>


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

                  <div className="relative" ref={actionsMenuRef}>
                    <button
                      type="button"
                      className={toolbarBtn}
                      onClick={() => setShowActionsMenu((value) => !value)}
                    >
                      Actions
                    </button>

                    {showActionsMenu && (
                      <div className="pointer-events-auto absolute left-0 top-[calc(100%+10px)] z-[80] min-w-[220px] rounded-xl border border-slate-200/90 bg-white p-2 opacity-100 shadow-2xl shadow-slate-900/18 ring-1 ring-slate-900/5">
                        <button
                          type="button"
                          className={actionMenuItem}
                          onClick={() => {
                            importSchema();
                            setShowActionsMenu(false);
                          }}
                        >
                          Import schema
                        </button>
                        <button
                          type="button"
                          className={actionMenuItem}
                          onClick={() => {
                            exportSchema();
                            setShowActionsMenu(false);
                          }}
                        >
                          Export schema
                        </button>
                        <button
                          type="button"
                          className={actionMenuItem}
                          onClick={() => {
                            downloadSchema();
                            setShowActionsMenu(false);
                          }}
                        >
                        Download JSON
                      </button>
                    </div>
                  )}
                </div>
                </div>
              </div>

              <div className="ml-auto flex flex-wrap items-center gap-3 lg:flex-nowrap">
                <button type="button" className={toolbarBtn} onClick={() => fitView({ padding: 0.2 })}>
                  Fit screen
                </button>

                <div className="hidden h-8 w-px bg-slate-200 lg:block" aria-hidden />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLogsPanel((value) => !value)}
                    className={toolbarToggle}
                  >
                    {showLogsPanel ? 'Hide logs' : 'Show logs'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSchemaPanel((value) => !value)}
                    className={toolbarToggle}
                  >
                    {showSchemaPanel ? 'Hide schema' : 'Show schema'}
                  </button>
                </div>
              </div>
            </div>

          {message && (
            <div className="mt-3 flex justify-end">
              <span className="toolbar-message max-w-full truncate rounded-lg border border-blue-100 bg-blue-50/90 px-3 py-2 text-xs font-medium leading-snug text-[#1d4ed8]">
                {message}
              </span>
            </div>
          )}

        </div>

        {selectedNode?.type === 'ifCondition' && (
          <div className="condition-panel flex flex-wrap items-end gap-4">
            <label className="flex min-w-[200px] flex-1 flex-col gap-2 text-xs font-semibold text-amber-900/90">
              Condition expression
              <input
                className="toolbar-input w-full"
                value={selectedCondition}
                onChange={(event) => updateCondition(event.target.value)}
                placeholder='e.g., Transaction.Type = "Quote" AND Amount > 1000'
              />
            </label>

            <label className="flex min-w-[180px] flex-1 flex-col gap-2 text-xs font-semibold text-amber-900/90">
              Module name
              <input
                className="toolbar-input w-full"
                value={selectedData.moduleName ?? ''}
                onChange={(e) => updateNodeData('moduleName', e.target.value)}
                placeholder="@cogitate/core-pos-components"
              />
            </label>

            <label className="flex min-w-[180px] flex-1 flex-col gap-2 text-xs font-semibold text-amber-900/90">
              Condition
              <input
                className="toolbar-input w-full"
                value={selectedCondition}
                onChange={(e) => updateNodeData('condition', e.target.value)}
                placeholder="Transaction.Type = 'Application'"
              />
            </label>

            <label className="flex min-w-[200px] flex-[2] flex-col gap-2 text-xs font-semibold text-amber-900/90">
              Path
              <input
                className="toolbar-input w-full"
                value={selectedData.path ?? ''}
                onChange={(e) => updateNodeData('path', e.target.value)}
                placeholder="COGITATE/configs/Personal/HO3/hooksCall/property.js"
              />
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-amber-900/90">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-amber-300 text-[#1d4ed8] focus:ring-[#1d4ed8]"
                checked={selectedData.isEndpoint ?? false}
                onChange={(e) => updateNodeData('isEndpoint', e.target.checked)}
              />
              Is endpoint
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-amber-900/90">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-amber-300 text-[#1d4ed8] focus:ring-[#1d4ed8]"
                checked={selectedData.callFunction !== false}
                onChange={(e) => updateNodeData('callFunction', e.target.checked)}
              />
              Call function
            </label>
          </div>
        )}


        <div style={{ display: 'flex', gap: '0', flex: 1, minHeight: 0 }}>
          <div ref={reactFlowWrapper} className="canvas-wrap" style={canvasStyle}>

        <div className="flex min-h-0 flex-1">
          <div
            ref={reactFlowWrapper}
            className={`canvas-wrap min-w-0 ${showSchemaPanel ? 'flex-[0_0_80%] border-r border-slate-200' : 'flex-1'}`}
          >

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
                style: { stroke: '#cbd5e1', strokeWidth: 1.5 },
                markerEnd: { type: 'arrowclosed', color: '#94a3b8', width: 12, height: 12 },
              }}
            >
              <MiniMap
                className="!rounded-lg !border !border-slate-200 !bg-white !shadow-md"
                pannable
                zoomable
              />
              <Background
                variant={BackgroundVariant.Dots}
                gap={20}
                size={1}
                color="#cbd5e1"
                bgColor="#f1f5f9"
                className="opacity-80"
              />
              <Controls
                showInteractive={false}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md [&_button]:border-slate-200 [&_button]:bg-white [&_button]:fill-slate-600 [&_button:hover]:bg-slate-50"
              />
            </ReactFlow>
          </div>


          {activePanel === "schema" && (
            <div className="schema-panel" style={{ flex: '0 0 20%' }}>
              <label htmlFor="hook-schema">Schema Output</label>
              <textarea
                id="hook-schema"

          {showSchemaPanel && (
            <div className="schema-panel min-w-0 flex-[0_0_20%]">
              <label htmlFor="hook-schema-side" className="text-xs font-semibold text-slate-700">
                Hook schema
              </label>
              <textarea
                id="hook-schema-side"

                value={serializedSchema}
                onChange={(event) => setSerializedSchema(event.target.value)}
                placeholder="Export schema here or paste to import..."
              />
            </div>
          )}
        </div>


        {activePanel === 'logs' && (

        {showLogsPanel && (

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
