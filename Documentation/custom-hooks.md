# Custom Hooks

Custom hooks allow you to define your own action nodes backed by JavaScript code. Once created, they appear in the Custom section of the left node panel and can be dragged onto the canvas like any built-in node.

## What is a Custom Hook?

A custom hook is a user-defined action that has:

- A display name and category for the panel
- A function name that maps to `FunctionName` in the exported schema
- A module name that maps to `ModuleName` in the exported schema
- An optional condition expression
- A JavaScript implementation (written in the Monaco editor)

Custom hooks are stored in `localStorage` under the key `cts.custom-hooks.v1`. They are local to the browser and are not shared between users or devices.

## Creating a Custom Hook

1. Open the builder and click the node library panel on the left.
2. Scroll to the Custom section at the bottom of the panel.
3. Click the "New Custom Hook" button (or navigate directly to `/custom-hooks/new?returnTo=%2F%3Fview%3Dbuilder`).
4. Fill in the form fields:

| Field | Required | Description |
|---|---|---|
| Hook Name | Yes | Display name shown in the panel and on the node |
| Action Category | Yes | Where the hook appears (Flow, Decision, Pre Hook, Post Hook) |
| Function Name | Yes | The function name written to the schema's FunctionName field |
| Module Name | No | The module path written to the schema's ModuleName field |
| Condition | No | Default condition expression for this hook |
| Code | Yes | JavaScript implementation of the hook function |

5. Click "Save Custom Hook". You are redirected back to the builder.
6. The hook appears immediately in the Custom section of the left panel.

## Editing a Custom Hook

1. In the left panel, locate the custom hook in the Custom section.
2. Click the edit icon next to the hook name.
3. You are taken to the edit form at `/custom-hooks/new?editId=<id>&returnTo=%2F%3Fview%3Dbuilder`.
4. Modify the fields and click "Update Custom Hook".

Editing a custom hook does not automatically update nodes that are already placed on the canvas. Canvas nodes capture a snapshot of the hook's data at the time they are dropped.

## Deleting a Custom Hook

1. In the left panel, click the delete icon next to the hook in the Custom section.
2. Confirm the deletion in the prompt.
3. The hook is removed from `localStorage` and the panel refreshes.

Deleting a custom hook does not remove nodes already placed on the canvas from that hook.

## Using Custom Hooks on the Canvas

Drag a custom hook from the panel onto the canvas. It behaves like any other action node:

- It can be connected to other nodes via edges.
- It inherits the Request Name from the Start node in its workflow group.
- It is exported in the Pre or Post array based on its assigned category.
- It participates in condition inference from If/Else nodes.

## Custom Hook Schema Output

A custom hook placed on the canvas exports as a standard HookAction:

```json
{
  "FunctionName": "MyCustomFunction",
  "ModuleName": "my-module-name",
  "CallFunction": true,
  "isEndpoint": false,
  "Condition": "",
  "Path": ""
}
```

## Storage Format

Custom hooks are stored as a JSON array in `localStorage`:

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "hookName": "My Custom Hook",
    "category": "Pre Hook",
    "functionName": "MyCustomFunction",
    "moduleName": "my-module-name",
    "condition": "",
    "code": "function MyCustomFunction(context) { ... }"
  }
]
```

The `id` field is generated using `crypto.randomUUID()` or a timestamp-based fallback.

## Panel Reactivity

The NodesPanel subscribes to two events to keep the custom hook list up to date without requiring a page reload:

- `cts:custom-hooks-updated` - A custom DOM event dispatched after every create, update, or delete operation within the same browser tab.
- `storage` - The native `StorageEvent` dispatched when `localStorage` changes in another tab.

This means that if you open the builder in two tabs and create a hook in one, the other tab's panel updates automatically.

## Limitations

- Custom hooks are stored only in the browser. There is no server-side persistence, export, or sync.
- The JavaScript code written in the Monaco editor is stored as a string in `localStorage` for reference purposes only. It is not executed by the builder at any point. The execution engine uses simulated node traversal regardless of the code content.
- Custom hooks do not support the full `NodeDefinition` interface (no icon or color customization). They always render with a default appearance on the canvas.
