# Contributing

This document describes the contribution process, code standards, and conventions used in this project. Read it before making changes.

## Before You Start

1. Read [getting-started.md](./getting-started.md) to set up your local environment.
2. Read [architecture.md](./architecture.md) to understand how the system is structured.
3. Read [node-reference.md](./node-reference.md) if your change involves node types.

## Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Stable production-ready code |
| `feat/<short-description>` | New features |
| `fix/<short-description>` | Bug fixes |
| `docs/<short-description>` | Documentation changes only |
| `refactor/<short-description>` | Code restructuring without behavior change |

Create a branch from `main` for every change. Branch names should be lowercase with hyphens.

```bash
git checkout -b feat/add-new-node-type
```

## Commit Messages

Use the Conventional Commits format:

```
<type>(<scope>): <short description>

[optional body]
```

Types: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`

Examples:
```
feat(nodes): add ReinstatementUtilities node type
fix(schema): preserve HookCallCascading when exporting multiple columns
docs(architecture): add data flow diagram section
refactor(hookSchema): extract condition resolution into separate function
```

Keep the short description under 72 characters. Write in the imperative mood: "add", "fix", "update", not "added", "fixed", "updated".

## Code Standards

### TypeScript

- All files are TypeScript. Do not add `.js` files to `app/` or `lib/`.
- Avoid `any` where possible. Use specific types or `unknown` with type guards.
- Export only what is needed. Prefer named exports over default exports except for page and layout components (which Next.js requires as default exports).
- Use `interface` for object shapes. Use `type` for unions and utility types.

### React

- Functional components only. No class components.
- Co-locate component state with the component that owns it. Do not lift state higher than necessary.
- Use `useCallback` for functions passed as props or used in `useEffect` dependency arrays.
- Use `useMemo` for derived values that are computationally expensive or used as React Flow node/edge arrays.
- Prefer early returns over deeply nested conditionals in render functions.

### CSS

- All styles go in `app/globals.css`. Do not create separate CSS files.
- Use CSS custom properties (variables) defined in `:root` for colors, radii, shadows, and transitions.
- Use descriptive class names. Follow the BEM-adjacent naming pattern already in use: `component-name`, `component-name-element`, `component-name--modifier`.
- Do not use inline styles unless you are working around a CSS specificity conflict that cannot be resolved otherwise. Document the reason in a comment.
- Do not use Tailwind utility classes. The project does not use Tailwind utilities in component markup.

### File Organization

- One primary export per file where practical.
- Place utilities used by a single component in the same file or a sibling file.
- Place utilities used by multiple components in the nearest common ancestor directory.
- Do not create new directories without a clear reason. Check if an existing directory fits first.

## Testing

There is currently no automated test suite. When adding a new feature:

1. Manually verify the feature works as intended.
2. Export and re-import a schema that exercises the new feature and confirm it round-trips correctly.
3. Run the execution engine on a canvas that uses the new feature to confirm it does not break traversal.
4. Run `npm run build` and confirm there are no TypeScript errors.

## Adding a New Node Type

1. Open `app/components/nodes/nodeTypes.ts`.
2. Add a new `NodeDefinition` object to the `nodeDefinitions` array. Follow the existing format exactly.
3. Choose a `type` string that is unique, camelCase, and descriptive (e.g., `executeRatingEngine`).
4. Set `functionName` to the exact value expected in the HookSchema's `FunctionName` field.
5. Set `defaultModuleName` to the correct npm package path.
6. Set `category` to match where the node should appear in the panel and whether it goes to Pre or Post hooks.
7. Run `npm run dev` and verify the node appears in the correct panel section.
8. Drag the node onto the canvas and export a schema. Verify the action appears in the correct `Pre` or `Post` array with the correct `FunctionName` and `ModuleName`.

No other files need to be changed for a basic new node type.

## Modifying the Schema Serializer

The serializer is `app/components/hookSchema.ts`. It is a critical file - changes here affect every schema export and import.

Before modifying it:

1. Understand the full flow documented in [canvas-to-schema.md](./canvas-to-schema.md).
2. Identify which of the two main functions (`canvasToHookSchema` or `hookSchemaToCanvas`) you need to change.
3. Make the smallest change that achieves the goal.
4. After your change, test the following scenarios:
   - A simple linear workflow (Start > Action > End) exports and imports correctly.
   - A workflow with an If/Else node with nodes on both branches exports and imports correctly.
   - A workflow with multiple columns (multiple Start nodes) exports and imports correctly.
   - A workflow with static params and HookCallCascading set exports and imports correctly.

## Pull Request Checklist

Before opening a pull request, verify:

- [ ] `npm run build` completes with no errors.
- [ ] `npm run lint` completes with no errors.
- [ ] All new node types appear correctly in the left panel.
- [ ] Schema export and import works for any affected workflow patterns.
- [ ] No console errors appear during normal use of the changed feature.
- [ ] The Documentation folder is updated if you changed any behavior described there.
- [ ] Commit messages follow the Conventional Commits format.

## Documentation Standards

- Write in plain, direct language. Avoid marketing language.
- Do not use emojis in any documentation file.
- Use tables for reference information that has multiple parallel fields.
- Use code blocks with language identifiers for all code samples.
- Write headings in title case for H1 and sentence case for H2 and below.
- Link to other documentation files using relative paths.

## Questions and Discussions

For questions about the codebase, open a GitHub Discussion or reach out to the team directly. Do not open issues for questions.

Open a GitHub Issue only for confirmed bugs or specific feature requests with a clear scope.
