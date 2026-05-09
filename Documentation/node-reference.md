# Node Reference

Every node type available in the builder is defined in `app/components/nodes/nodeTypes.ts`. This page documents all built-in node types, their properties, and what they serialize to in the HookSchema.

## Node Definition Structure

Each node type is described by a `NodeDefinition` object:

```typescript
interface NodeDefinition {
  type: string;           // React Flow node type key
  label: string;          // Display name in panel and on node
  icon: string;           // Two-letter badge shown in node header
  color: string;          // Hex color for the node header background
  category: ActionCategory; // 'Flow' | 'Decision' | 'Pre Hook' | 'Post Hook'
  functionName: string;   // FunctionName written to the schema
  defaultModuleName: string; // Default ModuleName written to the schema
  description: string;    // Tooltip in the node library panel
  defaultData?: {
    condition?: string;
    isEndpoint?: boolean;
    requestName?: string;
  };
}
```

## Categories

Nodes are organized into four categories in the left panel.

| Category | Purpose |
|---|---|
| Flow | Controls workflow structure (start, end, wait, routing) |
| Decision | Conditional branching |
| Pre Hook | Actions executed before the main transaction handler |
| Post Hook | Actions executed after the main transaction handler |

## Flow Nodes

### Start

| Property | Value |
|---|---|
| Type key | `start` |
| FunctionName | `Start` |
| Category | Flow |
| Color | Green (#16a34a) |

The entry point of every workflow. Exactly one Start node must exist per workflow column. The Start node carries the Request Name, cascading configuration, and static parameters for the entire column. It does not appear as an Action in the exported schema; it provides metadata only.

When selected, the Workflow Config sidebar opens on the right with the following fields:
- **Request Name** - The API path this workflow fires for (e.g., `/Quote/Summary`). Can also be selected from the Request Library.
- **Need Cascading** - Toggle. Corresponds to `NeedCascading` in the schema.
- **Hook Call Cascading** - Toggle. Corresponds to `HookCallCascading` in the schema.
- **Static Params** - JSON editor. Corresponds to `StaticParams` in the schema.

### End

| Property | Value |
|---|---|
| Type key | `end` |
| FunctionName | `End` |
| Category | Flow |
| Color | Red (#dc2626) |

Marks the termination of a workflow path. Like the Start node, End does not appear as an Action in the exported schema.

### Wait for Time

| Property | Value |
|---|---|
| Type key | `wait` |
| FunctionName | `WaitForTime` |
| Default module | `@cogitate/core-pos-components` |
| Category | Flow |
| Color | Sky blue (#0ea5e9) |

Pauses execution for a configured duration before proceeding to the next action.

### Send to Manual Review

| Property | Value |
|---|---|
| Type key | `manualReview` |
| FunctionName | `SendToManualReview` |
| Default module | `@cogitate/core-pos-components` |
| Category | Flow |
| Color | Slate (#475569) |

Routes the transaction to a human review queue and halts automated processing.

## Decision Nodes

### If / Else

| Property | Value |
|---|---|
| Type key | `ifCondition` |
| FunctionName | `EvaluateCondition` |
| Default module | `@cogitate/core-pos-components` |
| Category | Decision |
| Color | Amber (#d97706) |

Creates a conditional branch. The node has two output handles: `yes` and `no`. Nodes connected to the `yes` handle execute when the condition is true; nodes on `no` execute when false.

To configure the condition, double-click the node to open the If/Else Configuration modal. The condition expression uses the format:

```
Transaction.Type = 'Quote'
Amount > 1000
Policy.State = 'CA' AND Coverage.Type = 'HO3'
```

In the exported schema this node becomes an `EvaluateCondition` action. Downstream action nodes inherit their condition from the branch they are on.

## Pre Hook Nodes

All Pre Hook nodes share the same default module: `@cogitate/core-pos-components`. The module can be overridden per node in the node properties panel.

### Generate Quote Number

| Property | Value |
|---|---|
| Type key | `generateQuoteNumber` |
| FunctionName | `GenerateQuoteNumber` |
| Icon | QN |

Generates or updates a quote number from the product master configuration. Typically placed at the start of a Quote workflow.

### Geocode Address

| Property | Value |
|---|---|
| Type key | `getGeoCodeAddress` |
| FunctionName | `getGeoCodeAddressHook` |
| Icon | GC |

Calls the Google Maps Geocoding API to resolve latitude, longitude, and county information for policy addresses.

### Execute Underwriting Rules

| Property | Value |
|---|---|
| Type key | `executeUnderwritingRules` |
| FunctionName | `ExecuteUnderwritingRules` |
| Icon | UW |

Runs the configured underwriting rule set against the policy model. Returns pass/fail results and associated messages.

### Get Third-Party Rating

| Property | Value |
|---|---|
| Type key | `getRatingFromThirdParty` |
| FunctionName | `getRatingFromThirdParty` |
| Icon | TR |

Invokes a single external rater and returns the premium and coverage breakdown.

### Invoke Multiple Raters

| Property | Value |
|---|---|
| Type key | `invokeMultipleRaters` |
| FunctionName | `invokeMultipleRaters` |
| Icon | MR |

Runs multiple raters concurrently and returns a consolidated result set.

### Get Rater Key

| Property | Value |
|---|---|
| Type key | `getRaterKey` |
| FunctionName | `getRaterKeyFromProductMaster` |
| Icon | RK |

Retrieves the rater key for a product line from the product master configuration.

### Start Transaction

| Property | Value |
|---|---|
| Type key | `startTransaction` |
| FunctionName | `startTransaction` |
| Icon | TX |

Initiates a new policy transaction. Handles out-of-turn (OOT) scenarios and sets the transaction to a pending state.

### Create Quote Version

| Property | Value |
|---|---|
| Type key | `createNewQuoteVersion` |
| FunctionName | `createNewQuoteVersion` |
| Icon | QV |

Creates a new version of an existing quote, typically used for endorsements or mid-term changes.

### Get AIM Insured ID

| Property | Value |
|---|---|
| Type key | `getAIMInsuredId` |
| FunctionName | `getAIMInsuredId` |
| Icon | AI |

Fetches the AIM Insured ID from the external AIM API and writes it to the policy's external references.

### Get AIM Submission ID

| Property | Value |
|---|---|
| Type key | `getAIMSubmissionId` |
| FunctionName | `getAIMSubmissionId` |
| Icon | AS |

Fetches the AIM Quote ID from the external AIM API.

### Summary OOS

| Property | Value |
|---|---|
| Type key | `summaryOOS` |
| FunctionName | `summaryOOS` |
| Icon | OS |

Generates an Out-of-Sequence summary with conflict detection across transaction versions.

### Process OOS

| Property | Value |
|---|---|
| Type key | `processOOS` |
| FunctionName | `processOOS` |
| Icon | PO |

Processes an Out-of-Sequence policy transaction, reconciling version conflicts.

### Reinstatement Utilities

| Property | Value |
|---|---|
| Type key | `reinstatementUtilities` |
| FunctionName | `ReinstatementUtilities` |
| Icon | RI |

Handles the policy reinstatement workflow including re-rating and re-binding.

## Post Hook Nodes

### Publish Event

| Property | Value |
|---|---|
| Type key | `publishEvent` |
| FunctionName | `PublishEvent` |
| Icon | PE |

Publishes a policy lifecycle event to the event system after a transaction completes.

### Generate Forms

| Property | Value |
|---|---|
| Type key | `generateForms` |
| FunctionName | `generateForms` |
| Icon | GF |

Queues an asynchronous web job to generate policy forms after bind or issue.

### Generate Forms Draft

| Property | Value |
|---|---|
| Type key | `generateFormsDraft` |
| FunctionName | `generateFormsDraft` |
| Icon | FD |

Generates draft forms for a transaction before it is finalized.

### Get Email Template

| Property | Value |
|---|---|
| Type key | `getEmailTemplateBody` |
| FunctionName | `getEmailTemplateBody` |
| Icon | EM |

Retrieves the configured email template body for notification emails.

### Copy Documents

| Property | Value |
|---|---|
| Type key | `copyDocuments` |
| FunctionName | `copyDocuments` |
| Icon | CD |

Copies documents from a source location to a destination via the DMS API.

### Invoke Adaptive API

| Property | Value |
|---|---|
| Type key | `invokeAdaptiveAPI` |
| FunctionName | `invokeAdaptiveAPI` |
| Icon | AA |
| isEndpoint default | true |

Invokes the Adaptive Form API to process and generate policy documents.

### Execute Adaptive API

| Property | Value |
|---|---|
| Type key | `executeAdaptiveApiRequest` |
| FunctionName | `executeAdaptiveApiRequest` |
| Icon | EA |
| isEndpoint default | true |

Executes an Adaptive Form API request with full policy data payload.

### Delete Quote Versions on Bind

| Property | Value |
|---|---|
| Type key | `deleteQuoteVersionsOnBind` |
| FunctionName | `deleteQuoteVersionsOnBind` |
| Icon | DV |

Removes intermediate quote versions when a quote is successfully bound to a policy.

### Get Markel Forms

| Property | Value |
|---|---|
| Type key | `getMarkelForms` |
| FunctionName | `getMarkelForms` |
| Icon | MF |

Retrieves forms from the Markel rater response after rating.

## Custom Hook Nodes

Custom hook nodes are user-defined nodes created through the Custom Hook editor at `/custom-hooks/new`. They appear in the Custom section of the left panel and behave identically to built-in nodes on the canvas.

Custom hooks are stored in `localStorage` under the key `cts.custom-hooks.v1` and are available only in the current browser. They are not shared between users or devices.

See [custom-hooks.md](./custom-hooks.md) for the full guide.

## Adding a New Built-In Node Type

1. Open `app/components/nodes/nodeTypes.ts`.
2. Add a new object to the `nodeDefinitions` array following the `NodeDefinition` interface.
3. Choose a unique `type` string with no spaces or special characters.
4. Set `category` to the appropriate value.
5. Set `functionName` to match the exact function name expected in the HookSchema.
6. Save the file. The node appears in the panel immediately on next page load.

No changes are needed in any other file for a basic node type.
