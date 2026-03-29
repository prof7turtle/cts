# Implementation Walkthrough — 5 Gaps Fixed

## Build Verification ✅
```
npm run build → ✓ Compiled successfully in 3.7s, TypeScript checks passed, all pages generated
```

## Changes Made

### Gap 1 — Real Cogitate Functions
```diff:nodeTypes.ts
export type ActionCategory = 'Flow' | 'Decision' | 'Pre Hook' | 'Post Hook';

export interface NodeDefinition {
  type: string;
  label: string;
  icon: string;
  color: string;
  category: ActionCategory;
  functionName: string;
  defaultData?: {
    condition?: string;
  };
}

export const nodeDefinitions: NodeDefinition[] = [
  {
    type: 'start',
    label: 'Start',
    icon: 'ST',
    color: '#16a34a',
    category: 'Flow',
    functionName: 'Start',
  },
  {
    type: 'end',
    label: 'End',
    icon: 'EN',
    color: '#dc2626',
    category: 'Flow',
    functionName: 'End',
  },
  {
    type: 'wait',
    label: 'Wait for Time',
    icon: 'WT',
    color: '#0ea5e9',
    category: 'Flow',
    functionName: 'WaitForTime',
  },
  {
    type: 'manualReview',
    label: 'Send to Manual Review',
    icon: 'MR',
    color: '#475569',
    category: 'Flow',
    functionName: 'SendToManualReview',
  },
  {
    type: 'ifCondition',
    label: 'If / Else',
    icon: 'IF',
    color: '#d97706',
    category: 'Decision',
    functionName: 'EvaluateCondition',
    defaultData: { condition: "Transaction.Type = 'Application'" },
  },
  {
    type: 'validatePolicy',
    label: 'Validate Policy Data',
    icon: 'VP',
    color: '#2563eb',
    category: 'Pre Hook',
    functionName: 'ValidatePolicyData',
  },
  {
    type: 'calculatePrice',
    label: 'Calculate Insurance Price',
    icon: 'CP',
    color: '#7c3aed',
    category: 'Pre Hook',
    functionName: 'CalculateInsurancePrice',
  },
  {
    type: 'underwriting',
    label: 'Run Underwriting Rules',
    icon: 'UW',
    color: '#6366f1',
    category: 'Pre Hook',
    functionName: 'ExecuteUnderwritingRules',
  },
  {
    type: 'riskScore',
    label: 'Check Risk Score',
    icon: 'RS',
    color: '#4f46e5',
    category: 'Pre Hook',
    functionName: 'FetchExternalRiskScore',
  },
  {
    type: 'updatePolicyStatus',
    label: 'Update Policy Status',
    icon: 'UP',
    color: '#1d4ed8',
    category: 'Pre Hook',
    functionName: 'UpdatePolicyStatus',
  },
  {
    type: 'esign',
    label: 'Send for E-Signature',
    icon: 'ES',
    color: '#be185d',
    category: 'Post Hook',
    functionName: 'SendForESignature',
  },
  {
    type: 'processPayment',
    label: 'Process Payment',
    icon: 'PP',
    color: '#db2777',
    category: 'Post Hook',
    functionName: 'ProcessPayment',
  },
  {
    type: 'sendEmail',
    label: 'Send Email Notification',
    icon: 'EM',
    color: '#dc2626',
    category: 'Post Hook',
    functionName: 'SendEmailNotification',
  },
  {
    type: 'sendSms',
    label: 'Send SMS Notification',
    icon: 'SM',
    color: '#f43f5e',
    category: 'Post Hook',
    functionName: 'SendSMSNotification',
  },
  {
    type: 'createDocument',
    label: 'Create Policy Document',
    icon: 'PD',
    color: '#14b8a6',
    category: 'Post Hook',
    functionName: 'GeneratePolicyPDF',
  },
];

export const nodeDefinitionByType = Object.fromEntries(
  nodeDefinitions.map((definition) => [definition.type, definition])
) as Record<string, NodeDefinition>;
===
export type ActionCategory = 'Flow' | 'Decision' | 'Pre Hook' | 'Post Hook';

export interface NodeDefinition {
  type: string;
  label: string;
  icon: string;
  color: string;
  category: ActionCategory;
  functionName: string;
  defaultModuleName: string;
  description: string;
  defaultData?: {
    condition?: string;
    isEndpoint?: boolean;
    requestName?: string;
  };
}

export const nodeDefinitions: NodeDefinition[] = [
  // ─── Flow Nodes ─────────────────────────────────────────
  {
    type: 'start',
    label: 'Start',
    icon: 'ST',
    color: '#16a34a',
    category: 'Flow',
    functionName: 'Start',
    defaultModuleName: '',
    description: 'Entry point of the workflow',
  },
  {
    type: 'end',
    label: 'End',
    icon: 'EN',
    color: '#dc2626',
    category: 'Flow',
    functionName: 'End',
    defaultModuleName: '',
    description: 'Exit point of the workflow',
  },
  {
    type: 'wait',
    label: 'Wait for Time',
    icon: 'WT',
    color: '#0ea5e9',
    category: 'Flow',
    functionName: 'WaitForTime',
    defaultModuleName: '@cogitate/core-pos-components',
    description: 'Pauses execution for a configured duration',
  },
  {
    type: 'manualReview',
    label: 'Send to Manual Review',
    icon: 'MR',
    color: '#475569',
    category: 'Flow',
    functionName: 'SendToManualReview',
    defaultModuleName: '@cogitate/core-pos-components',
    description: 'Routes the transaction for human review',
  },

  // ─── Decision Nodes ─────────────────────────────────────
  {
    type: 'ifCondition',
    label: 'If / Else',
    icon: 'IF',
    color: '#d97706',
    category: 'Decision',
    functionName: 'EvaluateCondition',
    defaultModuleName: '',
    description: 'Conditional branching based on an expression',
    defaultData: { condition: "Transaction.Type = 'Application'" },
  },

  // ─── Pre Hook Nodes (from Hooks-Action-Function-Struture.json) ──
  {
    type: 'generateQuoteNumber',
    label: 'Generate Quote Number',
    icon: 'QN',
    color: '#2563eb',
    category: 'Pre Hook',
    functionName: 'GenerateQuoteNumber',
    defaultModuleName: '@cogitate/core-pos-components',
    description: 'Generates or updates a quote number from product master',
    defaultData: { requestName: '/Quote/Landing' },
  },
  {
    type: 'getGeoCodeAddress',
    label: 'Geocode Address',
    icon: 'GC',
    color: '#0891b2',
    category: 'Pre Hook',
    functionName: 'getGeoCodeAddressHook',
    defaultModuleName: '@cogitate/core-pos-components',
    description: 'Fetches geocoding information for addresses using Google Maps API',
    defaultData: { requestName: '/Quote/Landing' },
  },
  {
    type: 'executeUnderwritingRules',
    label: 'Execute Underwriting Rules',
    icon: 'UW',
    color: '#6366f1',
    category: 'Pre Hook',
    functionName: 'ExecuteUnderwritingRules',
    defaultModuleName: '@cogitate/core-pos-components',
    description: 'Executes underwriting rules against the policy model',
    defaultData: { requestName: '/Quote/Summary' },
  },
  {
    type: 'getRatingFromThirdParty',
    label: 'Get Third-Party Rating',
    icon: 'TR',
    color: '#7c3aed',
    category: 'Pre Hook',
    functionName: 'getRatingFromThirdParty',
    defaultModuleName: '@cogitate/core-pos-components',
    description: 'Invokes a third-party rater to get policy rating',
    defaultData: { requestName: '/Quote/Summary' },
  },
  {
    type: 'invokeMultipleRaters',
    label: 'Invoke Multiple Raters',
    icon: 'MR',
    color: '#8b5cf6',
    category: 'Pre Hook',
    functionName: 'invokeMultipleRaters',
    defaultModuleName: '@cogitate/core-pos-components',
    description: 'Runs multiple raters concurrently and returns consolidated results',
    defaultData: { requestName: '/Quote/Summary' },
  },
  {
    type: 'getRaterKey',
    label: 'Get Rater Key',
    icon: 'RK',
    color: '#4f46e5',
    category: 'Pre Hook',
    functionName: 'getRaterKeyFromProductMaster',
    defaultModuleName: '@cogitate/core-pos-components',
    description: 'Retrieves the rater key for a product from master configuration',
    defaultData: { requestName: '/Quote/Summary' },
  },
  {
    type: 'startTransaction',
    label: 'Start Transaction',
    icon: 'TX',
    color: '#1d4ed8',
    category: 'Pre Hook',
    functionName: 'startTransaction',
    defaultModuleName: '@cogitate/core-pos-components',
    description: 'Initiates a new transaction, handles OOT scenarios and pending states',
  },
  {
    type: 'createNewQuoteVersion',
    label: 'Create Quote Version',
    icon: 'QV',
    color: '#1e40af',
    category: 'Pre Hook',
    functionName: 'createNewQuoteVersion',
    defaultModuleName: '@cogitate/core-pos-components',
    description: 'Creates a new version of a quote for endorsements or amendments',
  },
  {
    type: 'getAIMInsuredId',
    label: 'Get AIM Insured ID',
    icon: 'AI',
    color: '#0e7490',
    category: 'Pre Hook',
    functionName: 'getAIMInsuredId',
    defaultModuleName: '@cogitate/core-pos-components',
    description: 'Fetches AIM Insured ID from external API and updates external references',
  },
  {
    type: 'getAIMSubmissionId',
    label: 'Get AIM Submission ID',
    icon: 'AS',
    color: '#0369a1',
    category: 'Pre Hook',
    functionName: 'getAIMSubmissionId',
    defaultModuleName: '@cogitate/core-pos-components',
    description: 'Fetches AIM Quote ID from external API',
  },
  {
    type: 'summaryOOS',
    label: 'Summary OOS',
    icon: 'OS',
    color: '#3b82f6',
    category: 'Pre Hook',
    functionName: 'summaryOOS',
    defaultModuleName: '@cogitate/core-pos-components',
    description: 'Generates Out-of-Sequence summary with conflict detection',
  },
  {
    type: 'processOOS',
    label: 'Process OOS',
    icon: 'PO',
    color: '#2563eb',
    category: 'Pre Hook',
    functionName: 'processOOS',
    defaultModuleName: '@cogitate/core-pos-components',
    description: 'Processes Out-of-Sequence policy transactions',
  },
  {
    type: 'reinstatementUtilities',
    label: 'Reinstatement Utilities',
    icon: 'RI',
    color: '#1e3a5f',
    category: 'Pre Hook',
    functionName: 'ReinstatementUtilities',
    defaultModuleName: '@cogitate/core-pos-components',
    description: 'Handles policy reinstatement workflow including rating and binding',
  },

  // ─── Post Hook Nodes (from Hooks-Action-Function-Struture.json) ──
  {
    type: 'publishEvent',
    label: 'Publish Event',
    icon: 'PE',
    color: '#be185d',
    category: 'Post Hook',
    functionName: 'PublishEvent',
    defaultModuleName: '@cogitate/core-pos-components',
    description: 'Publishes a policy event to the event system for lifecycle tracking',
    defaultData: { requestName: '/Application/Summary' },
  },
  {
    type: 'generateForms',
    label: 'Generate Forms',
    icon: 'GF',
    color: '#db2777',
    category: 'Post Hook',
    functionName: 'generateForms',
    defaultModuleName: '@cogitate/core-pos-components',
    description: 'Generates forms by queuing an async web job',
    defaultData: { requestName: '/Application/Summary' },
  },
  {
    type: 'generateFormsDraft',
    label: 'Generate Forms Draft',
    icon: 'FD',
    color: '#ec4899',
    category: 'Post Hook',
    functionName: 'generateFormsDraft',
    defaultModuleName: '@cogitate/core-pos-components',
    description: 'Generates draft forms for a policy transaction',
    defaultData: { requestName: '/Quote/Summary' },
  },
  {
    type: 'getEmailTemplateBody',
    label: 'Get Email Template',
    icon: 'EM',
    color: '#dc2626',
    category: 'Post Hook',
    functionName: 'getEmailTemplateBody',
    defaultModuleName: '@cogitate/core-pos-components',
    description: 'Retrieves and returns the email template body for notification',
    defaultData: { requestName: '/Application/Summary' },
  },
  {
    type: 'copyDocuments',
    label: 'Copy Documents',
    icon: 'CD',
    color: '#f43f5e',
    category: 'Post Hook',
    functionName: 'copyDocuments',
    defaultModuleName: '@cogitate/core-pos-components',
    description: 'Copies documents from source to destination via DMS API',
    defaultData: { requestName: '/Application/Summary' },
  },
  {
    type: 'invokeAdaptiveAPI',
    label: 'Invoke Adaptive API',
    icon: 'AA',
    color: '#9f1239',
    category: 'Post Hook',
    functionName: 'invokeAdaptiveAPI',
    defaultModuleName: '@cogitate/core-pos-components',
    description: 'Invokes the Adaptive Form API to process policy documents',
    defaultData: { isEndpoint: true },
  },
  {
    type: 'executeAdaptiveApiRequest',
    label: 'Execute Adaptive API',
    icon: 'EA',
    color: '#881337',
    category: 'Post Hook',
    functionName: 'executeAdaptiveApiRequest',
    defaultModuleName: '@cogitate/core-pos-components',
    description: 'Executes an Adaptive Form API request with policy data',
    defaultData: { isEndpoint: true },
  },
  {
    type: 'deleteQuoteVersionsOnBind',
    label: 'Delete Quote Versions',
    icon: 'DV',
    color: '#14b8a6',
    category: 'Post Hook',
    functionName: 'deleteQuoteVersionsOnBind',
    defaultModuleName: '@cogitate/core-pos-components',
    description: 'Deletes intermediate quote versions when a quote is bound',
    defaultData: { requestName: '/Application/Summary' },
  },
  {
    type: 'getMarkelForms',
    label: 'Get Markel Forms',
    icon: 'MF',
    color: '#0d9488',
    category: 'Post Hook',
    functionName: 'getMarkelForms',
    defaultModuleName: '@cogitate/core-pos-components',
    description: 'Retrieves forms from Markel rater response',
    defaultData: { requestName: '/Quote/Summary' },
  },
];

export const nodeDefinitionByType = Object.fromEntries(
  nodeDefinitions.map((definition) => [definition.type, definition])
) as Record<string, NodeDefinition>;

```

**27 node definitions** matching [Hooks-Action-Function-Struture.json](file:///x:/cts/Dynamic%20Workflow/Hooks-Action-Function-Struture.json):
- 5 Flow/Decision nodes (start, end, wait, manualReview, ifCondition)
- 13 Pre Hook nodes (GenerateQuoteNumber, getGeoCodeAddressHook, ExecuteUnderwritingRules, getRatingFromThirdParty, invokeMultipleRaters, getRaterKeyFromProductMaster, startTransaction, createNewQuoteVersion, getAIMInsuredId, getAIMSubmissionId, summaryOOS, processOOS, ReinstatementUtilities)
- 9 Post Hook nodes (PublishEvent, generateForms, generateFormsDraft, getEmailTemplateBody, copyDocuments, invokeAdaptiveAPI, executeAdaptiveApiRequest, deleteQuoteVersionsOnBind, getMarkelForms)

Added `defaultModuleName` and `description` fields to [NodeDefinition](file:///x:/cts/app/components/nodes/nodeTypes.ts#3-18) interface.

---

### Gap 2 — Complete HookSchema Output
```diff:hookSchema.ts
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
===
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

```

- [canvasToHookSchema()](file:///x:/cts/app/components/hookSchema.ts#142-168) now produces output matching [Sample-HookSchema.json](file:///x:/cts/Dynamic%20Workflow/Sample-HookSchema.json) exactly
- All action-level fields: `FunctionName`, `ModuleName`, `CallFunction`, `isEndpoint`, `Condition`, `Path`
- All entry-level fields: [RequestName](file:///x:/cts/app/components/hookSchema.ts#74-86), [NeedCascading](file:///x:/cts/app/components/hookSchema.ts#87-91), [HookCallCascading](file:///x:/cts/app/components/hookSchema.ts#92-96), [StaticParams](file:///x:/cts/app/components/hookSchema.ts#97-101)
- Actions grouped by [RequestName](file:///x:/cts/app/components/hookSchema.ts#74-86) → multiple Pre/Post entries supported (Gap 5)
- [hookSchemaToCanvas()](file:///x:/cts/app/components/hookSchema.ts#180-276) restores all properties when importing

---

### Gap 3 — GraphQL Schema + Server Actions
```diff:schema.ts
import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # Enums
  enum NodeType {
    START
    END
    IF_CONDITION
    SWITCH_CASE
    RATING
    COPYWRITING
    VALIDATION
    PREMIUM
    API
    EMAIL
  }

  enum WorkflowStatus {
    DRAFT
    PUBLISHED
    ARCHIVED
    ACTIVE
  }

  enum EdgeType {
    DEFAULT
    TRUE_PATH
    FALSE_PATH
    CASE_PATH
  }

  # Input Types
  input CreateWorkflowInput {
    name: String!
    description: String
    category: String
  }

  input UpdateWorkflowInput {
    id: String!
    name: String
    description: String
    status: WorkflowStatus
  }

  input CreateNodeInput {
    workflowId: String!
    type: NodeType!
    label: String!
    position: PositionInput!
    data: NodeDataInput
  }

  input UpdateNodeInput {
    id: String!
    label: String
    position: PositionInput
    data: NodeDataInput
  }

  input DeleteNodeInput {
    id: String!
    workflowId: String!
  }

  input CreateEdgeInput {
    workflowId: String!
    source: String!
    target: String!
    sourceHandle: String
    targetHandle: String
    type: EdgeType
  }

  input DeleteEdgeInput {
    id: String!
    workflowId: String!
  }

  input PositionInput {
    x: Float!
    y: Float!
  }

  input NodeDataInput {
    condition: String
    variable: String
    formula: String
    ratingTable: String
    template: String
    url: String
    email: String
    cases: [CaseInput!]
  }

  input CaseInput {
    label: String!
    value: String!
  }

  # Object Types
  type Position {
    x: Float!
    y: Float!
  }

  type NodeData {
    condition: String
    variable: String
    formula: String
    ratingTable: String
    template: String
    url: String
    email: String
    cases: [Case!]
  }

  type Case {
    label: String!
    value: String!
  }

  type WorkflowNode {
    id: String!
    workflowId: String!
    type: NodeType!
    label: String!
    position: Position!
    data: NodeData
    createdAt: String!
    updatedAt: String!
  }

  type WorkflowEdge {
    id: String!
    workflowId: String!
    source: String!
    target: String!
    sourceHandle: String
    targetHandle: String
    type: EdgeType!
    createdAt: String!
  }

  type Workflow {
    id: String!
    name: String!
    description: String
    category: String
    status: WorkflowStatus!
    nodes: [WorkflowNode!]!
    edges: [WorkflowEdge!]!
    version: Int!
    createdAt: String!
    updatedAt: String!
    createdBy: String
  }

  type WorkflowResult {
    success: Boolean!
    message: String!
    workflow: Workflow
    errors: [String!]
  }

  type NodeResult {
    success: Boolean!
    message: String!
    node: WorkflowNode
    errors: [String!]
  }

  type EdgeResult {
    success: Boolean!
    message: String!
    edge: WorkflowEdge
    errors: [String!]
  }

  type PaginatedWorkflows {
    workflows: [Workflow!]!
    total: Int!
    page: Int!
    pageSize: Int!
    hasMore: Boolean!
  }

  # Queries
  type Query {
    """Get all workflows with pagination"""
    workflows(page: Int = 1, pageSize: Int = 10): PaginatedWorkflows!

    """Get a specific workflow by ID"""
    workflow(id: String!): Workflow

    """Get a workflow node by ID"""
    workflowNode(id: String!): WorkflowNode

    """Get all nodes in a workflow"""
    workflowNodes(workflowId: String!): [WorkflowNode!]!

    """Get all edges in a workflow"""
    workflowEdges(workflowId: String!): [WorkflowEdge!]!

    """Search workflows by name or description"""
    searchWorkflows(query: String!, page: Int = 1, pageSize: Int = 10): PaginatedWorkflows!

    """Get workflows by status"""
    workflowsByStatus(status: WorkflowStatus!, page: Int = 1, pageSize: Int = 10): PaginatedWorkflows!

    """Get workflow statistics"""
    workflowStats: WorkflowStats!
  }

  type WorkflowStats {
    totalWorkflows: Int!
    publishedWorkflows: Int!
    draftWorkflows: Int!
    archivedWorkflows: Int!
    totalNodes: Int!
    totalEdges: Int!
  }

  # Mutations
  type Mutation {
    """Create a new workflow"""
    createWorkflow(input: CreateWorkflowInput!): WorkflowResult!

    """Update an existing workflow"""
    updateWorkflow(input: UpdateWorkflowInput!): WorkflowResult!

    """Delete a workflow"""
    deleteWorkflow(id: String!): WorkflowResult!

    """Publish a workflow (set status to PUBLISHED)"""
    publishWorkflow(id: String!): WorkflowResult!

    """Archive a workflow"""
    archiveWorkflow(id: String!): WorkflowResult!

    """Create a node in a workflow"""
    createNode(input: CreateNodeInput!): NodeResult!

    """Update a node"""
    updateNode(input: UpdateNodeInput!): NodeResult!

    """Delete a node from a workflow"""
    deleteNode(input: DeleteNodeInput!): NodeResult!

    """Create an edge between two nodes"""
    createEdge(input: CreateEdgeInput!): EdgeResult!

    """Delete an edge"""
    deleteEdge(input: DeleteEdgeInput!): EdgeResult!

    """Validate workflow"""
    validateWorkflow(id: String!): WorkflowResult!

    """Duplicate a workflow"""
    duplicateWorkflow(id: String!): WorkflowResult!
  }

  # Subscriptions
  type Subscription {
    """Subscribe to workflow updates"""
    workflowUpdated(workflowId: String!): Workflow!

    """Subscribe to node changes"""
    nodeChanged(workflowId: String!): WorkflowNode!
  }
`;
===
import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # Enums
  enum NodeType {
    START
    END
    IF_CONDITION
    SWITCH_CASE
    RATING
    COPYWRITING
    VALIDATION
    PREMIUM
    API
    EMAIL
  }

  enum WorkflowStatus {
    DRAFT
    PUBLISHED
    ARCHIVED
    ACTIVE
  }

  enum EdgeType {
    DEFAULT
    TRUE_PATH
    FALSE_PATH
    CASE_PATH
  }

  # Input Types
  input CreateWorkflowInput {
    name: String!
    description: String
    category: String
  }

  input UpdateWorkflowInput {
    id: String!
    name: String
    description: String
    status: WorkflowStatus
  }

  input CreateNodeInput {
    workflowId: String!
    type: NodeType!
    label: String!
    position: PositionInput!
    data: NodeDataInput
  }

  input UpdateNodeInput {
    id: String!
    label: String
    position: PositionInput
    data: NodeDataInput
  }

  input DeleteNodeInput {
    id: String!
    workflowId: String!
  }

  input CreateEdgeInput {
    workflowId: String!
    source: String!
    target: String!
    sourceHandle: String
    targetHandle: String
    type: EdgeType
  }

  input DeleteEdgeInput {
    id: String!
    workflowId: String!
  }

  input PositionInput {
    x: Float!
    y: Float!
  }

  input NodeDataInput {
    condition: String
    variable: String
    formula: String
    ratingTable: String
    template: String
    url: String
    email: String
    cases: [CaseInput!]
    requestName: String
    moduleName: String
    isEndpoint: Boolean
    callFunction: Boolean
    path: String
    description: String
    needCascading: Boolean
    hookCallCascading: Boolean
    staticParamsJson: String
  }

  input CaseInput {
    label: String!
    value: String!
  }

  # Object Types
  type Position {
    x: Float!
    y: Float!
  }

  type NodeData {
    condition: String
    variable: String
    formula: String
    ratingTable: String
    template: String
    url: String
    email: String
    cases: [Case!]
    requestName: String
    moduleName: String
    isEndpoint: Boolean
    callFunction: Boolean
    path: String
    description: String
    needCascading: Boolean
    hookCallCascading: Boolean
    staticParamsJson: String
  }

  type Case {
    label: String!
    value: String!
  }

  type WorkflowNode {
    id: String!
    workflowId: String!
    type: NodeType!
    label: String!
    position: Position!
    data: NodeData
    createdAt: String!
    updatedAt: String!
  }

  type WorkflowEdge {
    id: String!
    workflowId: String!
    source: String!
    target: String!
    sourceHandle: String
    targetHandle: String
    type: EdgeType!
    createdAt: String!
  }

  type Workflow {
    id: String!
    name: String!
    description: String
    category: String
    status: WorkflowStatus!
    nodes: [WorkflowNode!]!
    edges: [WorkflowEdge!]!
    version: Int!
    createdAt: String!
    updatedAt: String!
    createdBy: String
  }

  type WorkflowResult {
    success: Boolean!
    message: String!
    workflow: Workflow
    errors: [String!]
  }

  type NodeResult {
    success: Boolean!
    message: String!
    node: WorkflowNode
    errors: [String!]
  }

  type EdgeResult {
    success: Boolean!
    message: String!
    edge: WorkflowEdge
    errors: [String!]
  }

  type PaginatedWorkflows {
    workflows: [Workflow!]!
    total: Int!
    page: Int!
    pageSize: Int!
    hasMore: Boolean!
  }

  # Queries
  type Query {
    """Get all workflows with pagination"""
    workflows(page: Int = 1, pageSize: Int = 10): PaginatedWorkflows!

    """Get a specific workflow by ID"""
    workflow(id: String!): Workflow

    """Get a workflow node by ID"""
    workflowNode(id: String!): WorkflowNode

    """Get all nodes in a workflow"""
    workflowNodes(workflowId: String!): [WorkflowNode!]!

    """Get all edges in a workflow"""
    workflowEdges(workflowId: String!): [WorkflowEdge!]!

    """Search workflows by name or description"""
    searchWorkflows(query: String!, page: Int = 1, pageSize: Int = 10): PaginatedWorkflows!

    """Get workflows by status"""
    workflowsByStatus(status: WorkflowStatus!, page: Int = 1, pageSize: Int = 10): PaginatedWorkflows!

    """Get workflow statistics"""
    workflowStats: WorkflowStats!
  }

  type WorkflowStats {
    totalWorkflows: Int!
    publishedWorkflows: Int!
    draftWorkflows: Int!
    archivedWorkflows: Int!
    totalNodes: Int!
    totalEdges: Int!
  }

  # Mutations
  type Mutation {
    """Create a new workflow"""
    createWorkflow(input: CreateWorkflowInput!): WorkflowResult!

    """Update an existing workflow"""
    updateWorkflow(input: UpdateWorkflowInput!): WorkflowResult!

    """Delete a workflow"""
    deleteWorkflow(id: String!): WorkflowResult!

    """Publish a workflow (set status to PUBLISHED)"""
    publishWorkflow(id: String!): WorkflowResult!

    """Archive a workflow"""
    archiveWorkflow(id: String!): WorkflowResult!

    """Create a node in a workflow"""
    createNode(input: CreateNodeInput!): NodeResult!

    """Update a node"""
    updateNode(input: UpdateNodeInput!): NodeResult!

    """Delete a node from a workflow"""
    deleteNode(input: DeleteNodeInput!): NodeResult!

    """Create an edge between two nodes"""
    createEdge(input: CreateEdgeInput!): EdgeResult!

    """Delete an edge"""
    deleteEdge(input: DeleteEdgeInput!): EdgeResult!

    """Validate workflow"""
    validateWorkflow(id: String!): WorkflowResult!

    """Duplicate a workflow"""
    duplicateWorkflow(id: String!): WorkflowResult!
  }

  # Subscriptions
  type Subscription {
    """Subscribe to workflow updates"""
    workflowUpdated(workflowId: String!): Workflow!

    """Subscribe to node changes"""
    nodeChanged(workflowId: String!): WorkflowNode!
  }
`;
```
```diff:workflow.ts
'use server';

/**
 * Server Actions for Workflow GraphQL operations
 * These functions run on the server and handle GraphQL queries and mutations
 */

async function executeGraphQL(query: string, variables?: Record<string, any>) {
  const explicitUrl = process.env.WORKFLOW_API_URL;
  const vercelUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : null;
  const baseUrl = explicitUrl || vercelUrl || 'http://localhost:3000';

  const response = await fetch(`${baseUrl}/api/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`);
  }

  const raw = await response.json();

  // Apollo Server v4 executeOperation wraps the payload under body.singleResult
  const singleResult = raw?.body?.singleResult;
  const resultData = raw?.data ?? singleResult?.data;
  const resultErrors = raw?.errors ?? singleResult?.errors;

  if (resultErrors?.length) {
    throw new Error(resultErrors[0]?.message || 'GraphQL request returned errors');
  }

  if (!resultData) {
    throw new Error('GraphQL response missing data');
  }

  return { data: resultData };
}

// ============ Workflow Queries ============

export async function fetchWorkflows(page: number = 1, pageSize: number = 10) {
  const query = `
    query GetWorkflows($page: Int, $pageSize: Int) {
      workflows(page: $page, pageSize: $pageSize) {
        workflows {
          id
          name
          description
          category
          status
          version
          createdAt
          updatedAt
        }
        total
        page
        pageSize
        hasMore
      }
    }
  `;

  const data = await executeGraphQL(query, { page, pageSize });
  return data.data.workflows;
}

export async function fetchWorkflowById(id: string) {
  const query = `
    query GetWorkflow($id: String!) {
      workflow(id: $id) {
        id
        name
        description
        category
        status
        version
        createdAt
        updatedAt
        nodes {
          id
          type
          label
          position {
            x
            y
          }
          data {
            condition
            variable
            formula
            ratingTable
            template
            url
            email
          }
        }
        edges {
          id
          source
          target
          sourceHandle
          targetHandle
          type
        }
      }
    }
  `;

  const data = await executeGraphQL(query, { id });
  return data.data.workflow;
}

export async function searchWorkflows(query: string, page: number = 1, pageSize: number = 10) {
  const gql = `
    query SearchWorkflows($query: String!, $page: Int, $pageSize: Int) {
      searchWorkflows(query: $query, page: $page, pageSize: $pageSize) {
        workflows {
          id
          name
          description
          category
          status
          version
          createdAt
          updatedAt
        }
        total
        page
        pageSize
        hasMore
      }
    }
  `;

  const data = await executeGraphQL(gql, { query, page, pageSize });
  return data.data.searchWorkflows;
}

export async function fetchWorkflowStats() {
  const query = `
    query GetStats {
      workflowStats {
        totalWorkflows
        publishedWorkflows
        draftWorkflows
        archivedWorkflows
        totalNodes
        totalEdges
      }
    }
  `;

  const data = await executeGraphQL(query);
  return data.data.workflowStats;
}

// ============ Workflow Mutations ============

export async function createWorkflow(name: string, description?: string, category?: string) {
  const mutation = `
    mutation CreateWorkflow($input: CreateWorkflowInput!) {
      createWorkflow(input: $input) {
        success
        message
        workflow {
          id
          name
          description
          category
          status
          version
          createdAt
          updatedAt
        }
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, {
    input: { name, description, category },
  });

  return data.data.createWorkflow;
}

export async function updateWorkflow(
  id: string,
  updates: {
    name?: string;
    description?: string;
    status?: string;
  }
) {
  const mutation = `
    mutation UpdateWorkflow($input: UpdateWorkflowInput!) {
      updateWorkflow(input: $input) {
        success
        message
        workflow {
          id
          name
          description
          status
          version
          updatedAt
        }
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, {
    input: { id, ...updates },
  });

  return data.data.updateWorkflow;
}

export async function deleteWorkflow(id: string) {
  const mutation = `
    mutation DeleteWorkflow($id: String!) {
      deleteWorkflow(id: $id) {
        success
        message
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, { id });
  return data.data.deleteWorkflow;
}

export async function publishWorkflow(id: string) {
  const mutation = `
    mutation PublishWorkflow($id: String!) {
      publishWorkflow(id: $id) {
        success
        message
        workflow {
          id
          status
          updatedAt
        }
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, { id });
  return data.data.publishWorkflow;
}

export async function archiveWorkflow(id: string) {
  const mutation = `
    mutation ArchiveWorkflow($id: String!) {
      archiveWorkflow(id: $id) {
        success
        message
        workflow {
          id
          status
          updatedAt
        }
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, { id });
  return data.data.archiveWorkflow;
}

export async function validateWorkflow(id: string) {
  const mutation = `
    mutation ValidateWorkflow($id: String!) {
      validateWorkflow(id: $id) {
        success
        message
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, { id });
  return data.data.validateWorkflow;
}

export async function duplicateWorkflow(id: string) {
  const mutation = `
    mutation DuplicateWorkflow($id: String!) {
      duplicateWorkflow(id: $id) {
        success
        message
        workflow {
          id
          name
          status
          createdAt
        }
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, { id });
  return data.data.duplicateWorkflow;
}

// ============ Node Mutations ============

export async function createNode(
  workflowId: string,
  type: string,
  label: string,
  position: { x: number; y: number },
  data?: Record<string, any>
) {
  const mutation = `
    mutation CreateNode($input: CreateNodeInput!) {
      createNode(input: $input) {
        success
        message
        node {
          id
          type
          label
          position {
            x
            y
          }
          data {
            condition
            variable
            formula
            ratingTable
            template
            url
            email
          }
        }
        errors
      }
    }
  `;

  const nodeData = await executeGraphQL(mutation, {
    input: {
      workflowId,
      type,
      label,
      position,
      data,
    },
  });

  return nodeData.data.createNode;
}

export async function updateNode(
  id: string,
  updates: {
    label?: string;
    position?: { x: number; y: number };
    data?: Record<string, any>;
  }
) {
  const mutation = `
    mutation UpdateNode($input: UpdateNodeInput!) {
      updateNode(input: $input) {
        success
        message
        node {
          id
          label
          position {
            x
            y
          }
          updatedAt
        }
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, {
    input: { id, ...updates },
  });

  return data.data.updateNode;
}

export async function deleteNode(id: string, workflowId: string) {
  const mutation = `
    mutation DeleteNode($input: DeleteNodeInput!) {
      deleteNode(input: $input) {
        success
        message
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, {
    input: { id, workflowId },
  });

  return data.data.deleteNode;
}

// ============ Edge Mutations ============

export async function createEdge(
  workflowId: string,
  source: string,
  target: string,
  sourceHandle?: string,
  targetHandle?: string,
  type: string = 'DEFAULT'
) {
  const mutation = `
    mutation CreateEdge($input: CreateEdgeInput!) {
      createEdge(input: $input) {
        success
        message
        edge {
          id
          source
          target
          sourceHandle
          targetHandle
          type
        }
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, {
    input: {
      workflowId,
      source,
      target,
      sourceHandle,
      targetHandle,
      type,
    },
  });

  return data.data.createEdge;
}

export async function deleteEdge(id: string, workflowId: string) {
  const mutation = `
    mutation DeleteEdge($input: DeleteEdgeInput!) {
      deleteEdge(input: $input) {
        success
        message
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, {
    input: { id, workflowId },
  });

  return data.data.deleteEdge;
}
===
'use server';

/**
 * Server Actions for Workflow GraphQL operations
 * These functions run on the server and handle GraphQL queries and mutations
 */

async function executeGraphQL(query: string, variables?: Record<string, any>) {
  const explicitUrl = process.env.WORKFLOW_API_URL;
  const vercelUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : null;
  const baseUrl = explicitUrl || vercelUrl || 'http://localhost:3000';

  const response = await fetch(`${baseUrl}/api/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`);
  }

  const raw = await response.json();

  // Apollo Server v4 executeOperation wraps the payload under body.singleResult
  const singleResult = raw?.body?.singleResult;
  const resultData = raw?.data ?? singleResult?.data;
  const resultErrors = raw?.errors ?? singleResult?.errors;

  if (resultErrors?.length) {
    throw new Error(resultErrors[0]?.message || 'GraphQL request returned errors');
  }

  if (!resultData) {
    throw new Error('GraphQL response missing data');
  }

  return { data: resultData };
}

// ============ Workflow Queries ============

export async function fetchWorkflows(page: number = 1, pageSize: number = 10) {
  const query = `
    query GetWorkflows($page: Int, $pageSize: Int) {
      workflows(page: $page, pageSize: $pageSize) {
        workflows {
          id
          name
          description
          category
          status
          version
          createdAt
          updatedAt
        }
        total
        page
        pageSize
        hasMore
      }
    }
  `;

  const data = await executeGraphQL(query, { page, pageSize });
  return data.data.workflows;
}

export async function fetchWorkflowById(id: string) {
  const query = `
    query GetWorkflow($id: String!) {
      workflow(id: $id) {
        id
        name
        description
        category
        status
        version
        createdAt
        updatedAt
        nodes {
          id
          type
          label
          position {
            x
            y
          }
          data {
            condition
            variable
            formula
            ratingTable
            template
            url
            email
            requestName
            moduleName
            isEndpoint
            callFunction
            path
            description
            needCascading
            hookCallCascading
            staticParamsJson
          }
        }
        edges {
          id
          source
          target
          sourceHandle
          targetHandle
          type
        }
      }
    }
  `;

  const data = await executeGraphQL(query, { id });
  return data.data.workflow;
}

export async function searchWorkflows(query: string, page: number = 1, pageSize: number = 10) {
  const gql = `
    query SearchWorkflows($query: String!, $page: Int, $pageSize: Int) {
      searchWorkflows(query: $query, page: $page, pageSize: $pageSize) {
        workflows {
          id
          name
          description
          category
          status
          version
          createdAt
          updatedAt
        }
        total
        page
        pageSize
        hasMore
      }
    }
  `;

  const data = await executeGraphQL(gql, { query, page, pageSize });
  return data.data.searchWorkflows;
}

export async function fetchWorkflowStats() {
  const query = `
    query GetStats {
      workflowStats {
        totalWorkflows
        publishedWorkflows
        draftWorkflows
        archivedWorkflows
        totalNodes
        totalEdges
      }
    }
  `;

  const data = await executeGraphQL(query);
  return data.data.workflowStats;
}

// ============ Workflow Mutations ============

export async function createWorkflow(name: string, description?: string, category?: string) {
  const mutation = `
    mutation CreateWorkflow($input: CreateWorkflowInput!) {
      createWorkflow(input: $input) {
        success
        message
        workflow {
          id
          name
          description
          category
          status
          version
          createdAt
          updatedAt
        }
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, {
    input: { name, description, category },
  });

  return data.data.createWorkflow;
}

export async function updateWorkflow(
  id: string,
  updates: {
    name?: string;
    description?: string;
    status?: string;
  }
) {
  const mutation = `
    mutation UpdateWorkflow($input: UpdateWorkflowInput!) {
      updateWorkflow(input: $input) {
        success
        message
        workflow {
          id
          name
          description
          status
          version
          updatedAt
        }
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, {
    input: { id, ...updates },
  });

  return data.data.updateWorkflow;
}

export async function deleteWorkflow(id: string) {
  const mutation = `
    mutation DeleteWorkflow($id: String!) {
      deleteWorkflow(id: $id) {
        success
        message
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, { id });
  return data.data.deleteWorkflow;
}

export async function publishWorkflow(id: string) {
  const mutation = `
    mutation PublishWorkflow($id: String!) {
      publishWorkflow(id: $id) {
        success
        message
        workflow {
          id
          status
          updatedAt
        }
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, { id });
  return data.data.publishWorkflow;
}

export async function archiveWorkflow(id: string) {
  const mutation = `
    mutation ArchiveWorkflow($id: String!) {
      archiveWorkflow(id: $id) {
        success
        message
        workflow {
          id
          status
          updatedAt
        }
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, { id });
  return data.data.archiveWorkflow;
}

export async function validateWorkflow(id: string) {
  const mutation = `
    mutation ValidateWorkflow($id: String!) {
      validateWorkflow(id: $id) {
        success
        message
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, { id });
  return data.data.validateWorkflow;
}

export async function duplicateWorkflow(id: string) {
  const mutation = `
    mutation DuplicateWorkflow($id: String!) {
      duplicateWorkflow(id: $id) {
        success
        message
        workflow {
          id
          name
          status
          createdAt
        }
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, { id });
  return data.data.duplicateWorkflow;
}

// ============ Node Mutations ============

export async function createNode(
  workflowId: string,
  type: string,
  label: string,
  position: { x: number; y: number },
  data?: Record<string, any>
) {
  const mutation = `
    mutation CreateNode($input: CreateNodeInput!) {
      createNode(input: $input) {
        success
        message
        node {
          id
          type
          label
          position {
            x
            y
          }
          data {
            condition
            variable
            formula
            ratingTable
            template
            url
            email
          }
        }
        errors
      }
    }
  `;

  const nodeData = await executeGraphQL(mutation, {
    input: {
      workflowId,
      type,
      label,
      position,
      data,
    },
  });

  return nodeData.data.createNode;
}

export async function updateNode(
  id: string,
  updates: {
    label?: string;
    position?: { x: number; y: number };
    data?: Record<string, any>;
  }
) {
  const mutation = `
    mutation UpdateNode($input: UpdateNodeInput!) {
      updateNode(input: $input) {
        success
        message
        node {
          id
          label
          position {
            x
            y
          }
          updatedAt
        }
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, {
    input: { id, ...updates },
  });

  return data.data.updateNode;
}

export async function deleteNode(id: string, workflowId: string) {
  const mutation = `
    mutation DeleteNode($input: DeleteNodeInput!) {
      deleteNode(input: $input) {
        success
        message
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, {
    input: { id, workflowId },
  });

  return data.data.deleteNode;
}

// ============ Edge Mutations ============

export async function createEdge(
  workflowId: string,
  source: string,
  target: string,
  sourceHandle?: string,
  targetHandle?: string,
  type: string = 'DEFAULT'
) {
  const mutation = `
    mutation CreateEdge($input: CreateEdgeInput!) {
      createEdge(input: $input) {
        success
        message
        edge {
          id
          source
          target
          sourceHandle
          targetHandle
          type
        }
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, {
    input: {
      workflowId,
      source,
      target,
      sourceHandle,
      targetHandle,
      type,
    },
  });

  return data.data.createEdge;
}

export async function deleteEdge(id: string, workflowId: string) {
  const mutation = `
    mutation DeleteEdge($input: DeleteEdgeInput!) {
      deleteEdge(input: $input) {
        success
        message
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, {
    input: { id, workflowId },
  });

  return data.data.deleteEdge;
}
```

9 new fields added to [NodeData](file:///x:/cts/app/components/hookSchema.ts#33-48) and `NodeDataInput` types: `requestName`, `moduleName`, `isEndpoint`, `callFunction`, `path`, `description`, `needCascading`, `hookCallCascading`, `staticParamsJson`.

---

### Gap 4 — Download JSON Button
```diff:WorkflowBuilder.tsx
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
import { customNodeTypes } from './nodes/CustomNodes';
import { nodeDefinitionByType } from './nodes/nodeTypes';
import {
  canvasToHookSchema,
  hookSchemaToCanvas,
  type HookConfig,
} from './hookSchema';

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

type BuilderNodeData = {
  label?: string;
  condition?: string;
  color?: string;
};

function WorkflowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [clientCode, setClientCode] = useState('COGITATE');
  const [serializedSchema, setSerializedSchema] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );

  const onConnect = useCallback(
    (params: Connection) => {
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
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
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
        } satisfies BuilderNodeData,
      };

      setNodes((currentNodes) => currentNodes.concat(node));
      setMessage(null);
    },
    [screenToFlowPosition, setNodes]
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
  }, [selectedEdgeId, selectedNodeId, setEdges, setNodes]);

  const updateCondition = useCallback(
    (condition: string) => {
      if (!selectedNodeId) {
        return;
      }

      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (node.id !== selectedNodeId) {
            return node;
          }

          const data = (node.data ?? {}) as BuilderNodeData;
          return {
            ...node,
            data: {
              ...data,
              condition,
            } satisfies BuilderNodeData,
          };
        })
      );
    },
    [selectedNodeId, setNodes]
  );

  const exportSchema = useCallback(() => {
    const schema = canvasToHookSchema(nodes, edges, clientCode);
    setSerializedSchema(JSON.stringify(schema, null, 2));
    setMessage('Hook schema generated from canvas.');
  }, [clientCode, edges, nodes]);

  const importSchema = useCallback(() => {
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
  }, [fitView, serializedSchema, setEdges, setNodes]);

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
            />
          </label>
          <button type="button" onClick={deleteSelection}>
            Delete Selection
          </button>
          <button type="button" onClick={() => fitView({ padding: 0.2 })}>
            Fit View
          </button>
          <button type="button" onClick={exportSchema}>
            Export Hook Schema
          </button>
          <button type="button" onClick={importSchema}>
            Import Hook Schema
          </button>
          {message && <span className="toolbar-message">{message}</span>}
        </div>

        {selectedNode?.type === 'ifCondition' && (
          <div className="condition-panel">
            <label>
              Decision Condition (plain language)
              <input
                className="toolbar-input"
                value={((selectedNode.data ?? {}) as BuilderNodeData).condition ?? ''}
                onChange={(event) => updateCondition(event.target.value)}
                placeholder="Transaction.Type = 'Application' and isMaster = true"
              />
            </label>
          </div>
        )}

        <div ref={reactFlowWrapper} className="canvas-wrap">
          <ReactFlow
            nodes={nodes}
            edges={edges}
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

        <div className="schema-panel">
          <label htmlFor="hook-schema">Hook Schema JSON</label>
          <textarea
            id="hook-schema"
            value={serializedSchema}
            onChange={(event) => setSerializedSchema(event.target.value)}
            placeholder="Export schema to edit or paste existing schema for import..."
          />
        </div>
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
===
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
import { customNodeTypes } from './nodes/CustomNodes';
import { nodeDefinitionByType } from './nodes/nodeTypes';
import {
  canvasToHookSchema,
  hookSchemaToCanvas,
  type HookConfig,
  type BuilderNodeData,
} from './hookSchema';

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
  const { screenToFlowPosition, fitView } = useReactFlow();

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );

  const onConnect = useCallback(
    (params: Connection) => {
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
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
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
    [screenToFlowPosition, setNodes]
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
  }, [selectedEdgeId, selectedNodeId, setEdges, setNodes]);

  // ─── Generic node data updater ──────────────────────────────────
  const updateNodeData = useCallback(
    (field: keyof BuilderNodeData, value: string | boolean | undefined) => {
      if (!selectedNodeId) return;

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
    [selectedNodeId, setNodes]
  );

  // ─── Export / Import / Download ─────────────────────────────────
  const exportSchema = useCallback(() => {
    const schema = canvasToHookSchema(nodes, edges, clientCode);
    setSerializedSchema(JSON.stringify(schema, null, 2));
    setMessage('Hook schema generated from canvas.');
  }, [clientCode, edges, nodes]);

  const importSchema = useCallback(() => {
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
  }, [fitView, serializedSchema, setEdges, setNodes]);

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
            />
          </label>
          <button type="button" onClick={deleteSelection}>
            Delete Selection
          </button>
          <button type="button" onClick={() => fitView({ padding: 0.2 })}>
            Fit View
          </button>
          <button type="button" onClick={exportSchema}>
            Export Hook Schema
          </button>
          <button type="button" onClick={importSchema}>
            Import Hook Schema
          </button>
          <button type="button" onClick={downloadSchema}>
            ⬇ Download JSON
          </button>
          {message && <span className="toolbar-message">{message}</span>}
        </div>

        {/* ─── Node Property Panel ───────────────────────────── */}
        {isActionNode && (
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
            nodes={nodes}
            edges={edges}
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

        <div className="schema-panel">
          <label htmlFor="hook-schema">Hook Schema JSON</label>
          <textarea
            id="hook-schema"
            value={serializedSchema}
            onChange={(event) => setSerializedSchema(event.target.value)}
            placeholder="Export schema to edit or paste existing schema for import..."
          />
        </div>
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

```

- **"⬇ Download JSON"** button triggers browser download of `hook-schema-{client}.json`
- Node property panel shows RequestName, ModuleName, Condition, Path, isEndpoint, CallFunction for any selected action node

---

### Gap 5 — Multiple RequestNames
Handled inside [hookSchema.ts](file:///x:/cts/app/components/hookSchema.ts) via [groupNodesByRequestName()](file:///x:/cts/app/components/hookSchema.ts#102-141) — nodes with the same `requestName` are grouped into a single [HookEntry](file:///x:/cts/app/components/hookSchema.ts#15-22), nodes with different `requestName` values create separate entries.

---

### Type Alignment
```diff:CustomNodes.tsx
'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { nodeDefinitionByType } from './nodeTypes';

type BuilderNodeData = {
  label?: string;
  condition?: string;
  color?: string;
};

function BaseNode({ data, selected, type }: NodeProps) {
  const typedData = (data ?? {}) as BuilderNodeData;
  const definition = nodeDefinitionByType[type ?? ''];
  const color = typedData.color ?? definition?.color ?? '#334155';
  const label = typedData.label ?? definition?.label ?? type ?? 'Action';
  const isDecision = type === 'ifCondition';
  const condition =
    typedData.condition ?? "Transaction.Type = 'Application'";

  return (
    <div className={`workflow-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} style={{ background: color }} />

      <div className="node-header" style={{ background: color }}>
        <span className="node-icon-badge">{definition?.icon ?? 'AC'}</span>
        <span>{label}</span>
      </div>

      {isDecision && (
        <div className="node-body">
          <div className="decision-shape" style={{ borderColor: color }}>
            IF
          </div>
          <div className="node-label">Condition</div>
          <div className="node-condition">{condition}</div>
          <div className="decision-paths">
            <span>YES</span>
            <span>NO</span>
          </div>
        </div>
      )}

      {!isDecision && (
        <Handle type="source" position={Position.Bottom} style={{ background: color }} />
      )}

      {isDecision && (
        <>
          <Handle
            id="yes"
            type="source"
            position={Position.Bottom}
            style={{ background: '#16a34a', left: '30%' }}
          />
          <Handle
            id="no"
            type="source"
            position={Position.Bottom}
            style={{ background: '#dc2626', left: '70%' }}
          />
        </>
      )}
    </div>
  );
}

const MemoNode = memo(BaseNode);
MemoNode.displayName = 'MemoNode';

export const customNodeTypes = Object.fromEntries(
  Object.keys(nodeDefinitionByType).map((type) => [type, MemoNode])
);
===
'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { nodeDefinitionByType } from './nodeTypes';
import type { BuilderNodeData } from '../hookSchema';

function BaseNode({ data, selected, type }: NodeProps) {
  const typedData = (data ?? {}) as BuilderNodeData;
  const definition = nodeDefinitionByType[type ?? ''];
  const color = typedData.color ?? definition?.color ?? '#334155';
  const label = typedData.label ?? definition?.label ?? type ?? 'Action';
  const isDecision = type === 'ifCondition';
  const condition =
    typedData.condition ?? "Transaction.Type = 'Application'";

  return (
    <div className={`workflow-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} style={{ background: color }} />

      <div className="node-header" style={{ background: color }}>
        <span className="node-icon-badge">{definition?.icon ?? 'AC'}</span>
        <span>{label}</span>
      </div>

      {isDecision && (
        <div className="node-body">
          <div className="decision-shape" style={{ borderColor: color }}>
            IF
          </div>
          <div className="node-label">Condition</div>
          <div className="node-condition">{condition}</div>
          <div className="decision-paths">
            <span>YES</span>
            <span>NO</span>
          </div>
        </div>
      )}

      {!isDecision && (
        <Handle type="source" position={Position.Bottom} style={{ background: color }} />
      )}

      {isDecision && (
        <>
          <Handle
            id="yes"
            type="source"
            position={Position.Bottom}
            style={{ background: '#16a34a', left: '30%' }}
          />
          <Handle
            id="no"
            type="source"
            position={Position.Bottom}
            style={{ background: '#dc2626', left: '70%' }}
          />
        </>
      )}
    </div>
  );
}

const MemoNode = memo(BaseNode);
MemoNode.displayName = 'MemoNode';

export const customNodeTypes = Object.fromEntries(
  Object.keys(nodeDefinitionByType).map((type) => [type, MemoNode])
);

```

Imports [BuilderNodeData](file:///x:/cts/app/components/hookSchema.ts#33-48) from shared [hookSchema.ts](file:///x:/cts/app/components/hookSchema.ts) instead of local type definition.
