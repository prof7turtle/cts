# HookSchema Reference

The HookSchema (also referred to as HookConfig) is the JSON format that the Workflow Builder exports and imports. It describes all hook actions that should fire for a given client and transaction request.

## Top-Level Structure

```json
{
  "Client": "COGITATE",
  "Hooks": {
    "Pre": [ ... ],
    "Post": [ ... ]
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `Client` | string | Yes | Client code identifier (e.g., "COGITATE"). Set via the Client Code input in the toolbar. |
| `Hooks` | object | Yes | Container for Pre and Post hook arrays. |
| `Hooks.Pre` | HookEntry[] | Yes | Actions that execute before the main transaction handler. |
| `Hooks.Post` | HookEntry[] | Yes | Actions that execute after the main transaction handler. |

## HookEntry

Each entry in `Pre` or `Post` represents a single Request Name with its associated actions.

```json
{
  "RequestName": "/Quote/Summary",
  "NeedCascading": true,
  "HookCallCascading": false,
  "StaticParams": {
    "key": "value"
  },
  "Actions": [ ... ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `RequestName` | string | Yes | The API request path this hook fires for. Follows the pattern `/Category/Action`. |
| `NeedCascading` | boolean | Yes | Whether the hook should cascade to downstream handlers. Defaults to `true`. |
| `HookCallCascading` | boolean | No | When present, controls hook-call-level cascading independently from `NeedCascading`. |
| `StaticParams` | object | Yes | Key-value pairs injected into the action context as static parameters. Empty object if none. |
| `Actions` | HookAction[] | Yes | Ordered list of actions to execute for this request. |

## HookAction

Each action maps to one node on the canvas.

```json
{
  "FunctionName": "GenerateQuoteNumber",
  "ModuleName": "@cogitate/core-pos-components",
  "CallFunction": true,
  "isEndpoint": false,
  "Condition": "",
  "Path": ""
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `FunctionName` | string | Yes | Name of the function to invoke. Must match the `functionName` defined in `nodeTypes.ts`. |
| `ModuleName` | string | Yes | npm package or module path where the function is exported. |
| `CallFunction` | boolean | Yes | Whether to actually call the function. Set to `false` to register but skip. |
| `isEndpoint` | boolean | Yes | Marks the action as an API endpoint call. |
| `Condition` | string or object | Yes | Expression that must be true for this action to execute. Empty string means always execute. |
| `Path` | string | Yes | Optional file path for the module. Used for path-based module resolution. |

## Condition Field

The `Condition` field supports two forms.

**String form** - A plain condition expression:
```json
"Condition": "Transaction.Type = 'Quote'"
```

**Object form** - When the condition includes structured metadata:
```json
"Condition": {
  "expression": "Transaction.Type = 'Quote' AND Amount > 1000"
}
```

The builder normalizes both forms. When exporting, conditions are stored as strings. When parsing conditions from imported schemas, both forms are accepted.

### Condition Inference in If/Else Branches

When an `ifCondition` node has actions on its YES and NO branches, the builder automatically infers the condition for each downstream action:

- Actions on the YES branch receive the condition expression from the If/Else node.
- Actions on the NO branch receive `not(<expression>)`.
- Actions after the branch re-joins receive the combined expression using `and`.

This inference is performed by `canvasToHookSchema` and does not require manual condition entry on individual action nodes.

## Special Action: EvaluateCondition

When the builder encounters an `ifCondition` node on the canvas, it serializes it as:

```json
{
  "FunctionName": "EvaluateCondition",
  "ModuleName": "@cogitate/core-pos-components",
  "CallFunction": true,
  "isEndpoint": false,
  "Condition": "Transaction.Type = 'Quote'",
  "Path": ""
}
```

When importing a schema, any action with `FunctionName` equal to `EvaluateCondition` (case-insensitive) is reconstructed as an `ifCondition` node with branching edges.

## Complete Example

```json
{
  "Client": "COGITATE",
  "Hooks": {
    "Pre": [
      {
        "RequestName": "/Quote/Summary",
        "NeedCascading": true,
        "StaticParams": {},
        "Actions": [
          {
            "FunctionName": "GenerateQuoteNumber",
            "ModuleName": "@cogitate/core-pos-components",
            "CallFunction": true,
            "isEndpoint": false,
            "Condition": "",
            "Path": ""
          },
          {
            "FunctionName": "EvaluateCondition",
            "ModuleName": "@cogitate/core-pos-components",
            "CallFunction": true,
            "isEndpoint": false,
            "Condition": "Transaction.Type = 'Quote'",
            "Path": ""
          },
          {
            "FunctionName": "ExecuteUnderwritingRules",
            "ModuleName": "@cogitate/core-pos-components",
            "CallFunction": true,
            "isEndpoint": false,
            "Condition": "Transaction.Type = 'Quote'",
            "Path": ""
          }
        ]
      }
    ],
    "Post": [
      {
        "RequestName": "/Quote/Summary",
        "NeedCascading": true,
        "StaticParams": {},
        "Actions": [
          {
            "FunctionName": "PublishEvent",
            "ModuleName": "@cogitate/core-pos-components",
            "CallFunction": true,
            "isEndpoint": false,
            "Condition": "",
            "Path": ""
          }
        ]
      }
    ]
  }
}
```

## Validation Rules

The builder does not strictly validate schema JSON on export, but the following rules must hold for a schema to round-trip correctly through import:

1. `Client` must be a non-empty string.
2. Every `HookEntry` must have a non-empty `RequestName`.
3. Every `HookAction` must have a non-empty `FunctionName`.
4. `Hooks.Pre` and `Hooks.Post` must be arrays (may be empty).
5. `StaticParams` must be a JSON object (not an array or primitive).

Schemas that violate these rules may import without error but will render incorrectly on the canvas.
