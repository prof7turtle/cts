# CTS Codebase — Dead Code & Cleanup Audit

> **Rule used:** nothing active in the app is touched. Only code with zero live callers or zero purpose is listed.

---

## 🔴 VERY SAFE TO DELETE — Zero usage, zero callers

### 1. `app/components/useWorkflow.ts` (10.5 KB)
**Why:** This is a full React hook wrapping every GraphQL workflow action (fetchWorkflow, saveWorkflow, addNode, removeNode, addEdge, etc.). **Not imported anywhere** — not by WorkflowBuilder, not by WorkflowList, not by any page. WorkflowList calls `workflowActions.*` directly. WorkflowBuilder does everything in-memory.

### 2. `app/components/CustomHookModal.tsx` (5 KB)
**Why:** Exports `CustomHookModal` — a modal for creating custom hooks inline. **Never imported anywhere** in the codebase. The custom hook creation UI lives instead at the `/custom-hooks/new` page route, which replaced this modal.

### 3. `hooks/custom/` (empty directory)
**Why:** Completely empty directory. The `/hooks` folder at root only contains this one empty subdirectory. Zero files, zero purpose.

### 4. `app/api/hooks/custom/` (empty directory) + `app/api/hooks/custom/[id]/` (empty directory)
**Why:** Both are empty — no `route.ts` inside. Registered as API routes but serve nothing. Safe to delete the whole `app/api/hooks/` tree.

### 5. `app/custom-hooks/[id]/` (empty directory)
**Why:** No `page.tsx` inside. The dynamic route `[id]` was scaffolded but never implemented. Only `/custom-hooks/new` has a real page.

### 6. `lib/utils.ts`
**Why:** Contains only the `cn()` (classnames + tailwind-merge) helper. **Never imported anywhere** — confirmed by grep across all `.tsx`/`.ts` files. The codebase uses vanilla CSS classes, not Tailwind utilities.

### 7. `initialData (1).json` (root, 30 KB)
**Why:** A large JSON file sitting at the project root. No import or reference exists anywhere in the codebase. Appears to be a leftover data dump from early development.

---

## 🟡 SAFE TO DELETE — Orphaned CSS rules in `globals.css`

### 8. `.ai-fab { display: none !important; }` 
**Line in CSS:** Present with a comment `/* .ai-fab removed — replaced by toolbar-ai-btn */`
This class no longer exists in any JSX. The rule is dead and the comment confirms it was intentionally replaced.

### 9. CSS comment-only stubs
Two comment lines left behind:
- `/* schema-panel styles moved to bottom — see .schema-sidebar */`
- `/* nodes-panel, library-search, ... all moved to bottom of file */`

These are orphaned "moved" comments with no practical value. Safe to delete.

---

## 🟠 BORDERLINE — Used but questionable

### 10. `lib/graphql/` — entire folder (4 files, ~30 KB)
**What it is:** A full in-memory GraphQL backend — Apollo server, schema, resolvers, and a `WorkflowStore` class.
**Situation:** This IS actively used — `app/api/graphql/route.ts` imports `lib/graphql/server.ts`, and `app/actions/workflow.ts` calls the GraphQL endpoint. `WorkflowList` uses these actions.
**Concern:** The store is purely **in-memory** (resets on every server restart), and the GraphQL layer is only used by `WorkflowList` for CRUD workflows (not by the actual builder canvas which is fully local-state). If the Workflow List feature were ever decoupled or the backend replaced with a real DB, this entire layer would go.
> ✅ **Do NOT delete now** — it's live and used by WorkflowList.

### 11. `app/actions/workflow.ts` (490 lines, 10 KB)
**Situation:** Used by `WorkflowList.tsx` for all its CRUD. But note that ~8 of the exported functions (`createNode`, `updateNode`, `deleteNode`, `createEdge`, `deleteEdge`, `validateWorkflow`) are **never called anywhere** — only `WorkflowList` calls the workflow-level functions (create, fetch, publish, archive, duplicate, delete workflow, fetchStats).
**Safe partial cleanup:** Remove the unused exports: `createNode`, `updateNode`, `deleteNode`, `createEdge`, `deleteEdge`, `validateWorkflow`, and the `fetchWorkflowById` function (no caller).

### 12. `components/ui/` — 6 shadcn/ui components (button, card, dropdown-menu, input, separator, switch)
**Situation:** Never imported anywhere in the codebase. The app uses vanilla CSS, not shadcn components.
> ✅ **Safe to delete** — but keep `components.json` if you plan to add shadcn components in future, or delete that too.

---

## 📁 REFERENCE/DOCS — Non-code, no impact

### 13. `Documentation/` folder
Contains: `walkthrough.md` (86 KB!), `graphql-api.md`, `project_walkthrough.md`, `cogitate_deep_analysis.md`, `api.md`, `workflow.md`, `Workflow-Builder-Technical-Guide.pdf`
**Action:** Not code — harmless. Delete if you want to reduce repo size. The two stub files (`api.md` = 55 bytes, `workflow.md` = 46 bytes) are essentially empty.

### 14. `Dynamic Workflow/` folder
Contains reference JSONs and architecture diagrams used for understanding the domain, not by the app.
**Action:** Not imported by anything. Harmless reference material — delete or move to Documentation.

### 15. `.codex-recovery/` (root)
**Action:** AI-session recovery folder from Codex. Safe to delete from the project — not part of the app.

---

## Summary Table

| Item | Size | Risk | Action |
|---|---|---|---|
| `useWorkflow.ts` | 10.5 KB | 🔴 Zero | Delete |
| `CustomHookModal.tsx` | 5 KB | 🔴 Zero | Delete |
| `hooks/custom/` | empty | 🔴 Zero | Delete |
| `app/api/hooks/` | empty dirs | 🔴 Zero | Delete |
| `app/custom-hooks/[id]/` | empty | 🔴 Zero | Delete |
| `lib/utils.ts` | 0.2 KB | 🔴 Zero | Delete |
| `initialData (1).json` | 30 KB | 🔴 Zero | Delete |
| `.ai-fab` CSS rule | ~1 line | 🟡 Zero | Delete from globals.css |
| `components/ui/` (6 files) | ~18 KB | 🟡 Zero | Delete |
| Unused exports in `workflow.ts` | ~200 lines | 🟠 Low | Trim |
| `Documentation/` stubs (`api.md`, `workflow.md`) | tiny | 🟡 Low | Delete |
| `.codex-recovery/` | varies | 🟡 None | Delete |
