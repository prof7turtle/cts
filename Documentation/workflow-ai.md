# Workflow AI

The AI chat panel allows users to describe workflow requirements in plain language and receive a generated or modified HookConfig that is applied directly to the canvas.

## Overview

The AI chat panel is an optional sidebar that can be toggled from the toolbar's "Workflow AI" button. When open, it provides a conversational interface connected to Google's Generative AI API via the Vercel AI SDK.

The AI is instructed to:
1. Understand the HookConfig schema structure.
2. Know all available node types and their function names.
3. Generate complete, valid HookConfig JSON based on user descriptions.
4. Modify an existing schema when the user asks to add, remove, or change parts of a workflow.

## Architecture

### Components and Files

| File | Responsibility |
|---|---|
| `app/components/chat/WorkflowChatPanel.tsx` | Chat UI: message list, input, send logic |
| `app/components/chat/messageUtils.ts` | Role helpers for message formatting |
| `app/components/chat/types.ts` | `ChatMessage` type definition |
| `app/api/chat/route.ts` | Streaming API route handler |
| `lib/workflow-ai/systemPrompt.ts` | The full system instruction sent to the AI |
| `lib/workflow-ai/parser.ts` | Extracts JSON from AI text responses |
| `lib/workflow-ai/normalize.ts` | Normalizes AI-generated schema before applying |

### API Route

The chat endpoint is a Next.js streaming route handler:

```
POST /api/chat
```

It uses the Vercel AI SDK's `streamText` function with the Google Generative AI provider. The system prompt and the user message history are sent on each request. The response streams back token by token.

### System Prompt

The system prompt in `lib/workflow-ai/systemPrompt.ts` instructs the model to:

- Always respond with a valid HookConfig JSON block when generating a workflow.
- Never truncate the JSON.
- Use only known function names from the node type definitions.
- Preserve the existing schema structure when the user asks for modifications.

The system prompt includes a reference of all available function names and the HookConfig schema structure.

### Response Parsing

After the AI streams its full response, `parser.ts` extracts the JSON block using a regex that matches content between triple backtick code fences. If no code block is found, the full response text is attempted as JSON.

```typescript
// Attempts to extract:
// ```json
// { ... }
// ```
// or just the raw JSON from the response text
```

### Schema Normalization

`normalize.ts` applies light cleanup to the extracted JSON before it is applied to the canvas:

- Ensures `Hooks.Pre` and `Hooks.Post` are arrays.
- Strips unknown top-level fields.
- Applies default values for missing required fields.

### Applying the Schema

When the parser successfully extracts a `HookConfig` from the AI response, `WorkflowChatPanel` calls the `onApplySchema` callback provided by `WorkflowBuilder`. This callback calls `hookSchemaToCanvas` and updates the canvas nodes and edges, replacing the current canvas state.

The user is notified via the toolbar message bar that the workflow was updated by AI.

## Usage

1. Open the builder and click "Workflow AI" in the toolbar.
2. Describe the workflow you want to create:
   - "Create a Pre-Hook for /Quote/Summary that generates a quote number, then evaluates if the transaction type is Quote and runs underwriting rules on the yes branch."
3. The AI responds with a description and a generated HookConfig JSON block.
4. If the response includes a valid schema, a button "Apply to Canvas" appears in the chat.
5. Click "Apply to Canvas" to replace the current canvas with the generated workflow.

To modify an existing workflow:
- "Add a Publish Event post-hook to the current workflow."
- The AI receives the current schema alongside the message and modifies it accordingly.

## Configuration

The AI feature requires a Google Generative AI API key set in `.env`:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
```

If this variable is missing, the `/api/chat` route will throw an error when called.

## Limitations

- The AI may hallucinate function names not defined in `nodeTypes.ts`. The canvas will still render these as nodes of type `generateQuoteNumber` (the fallback type) with the schema's function name preserved in the data.
- The AI does not have access to real-time workflow state beyond what is explicitly sent in the current schema.
- JSON generation is not guaranteed to be syntactically correct on every response. If the parser fails to extract valid JSON, the response is shown as plain text only and no schema is applied.
- The streaming API has a timeout. Very long schema generations may be cut off. If this happens, ask the AI to continue or to generate a smaller schema.
