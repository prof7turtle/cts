# Dynamic Workflow Builder — Complete Project Walkthrough

## 🏢 What is Cogitate and What Problem Does This Solve?

**Cogitate.us** is a company that builds insurance technology systems. They serve **multiple insurance companies** (clients), and each client requires a **customized insurance workflow** — meaning different processing steps for quotes, applications, policies, etc.

### The Problem
Currently, when a new insurance company onboards:
1. Cogitate developers manually write **custom code** for each client's workflow
2. They configure **pre hooks** (steps that run *before* a main operation) and **post hooks** (steps that run *after*)
3. This produces a **JSON configuration file** that their backend consumes
4. This is repetitive, error-prone, and time-consuming

### The Solution: Dynamic Workflow Builder
Your project is a **visual drag-and-drop workflow builder** (like [n8n](https://n8n.io)) where:
- Non-developers can **visually design** workflows by dragging hook nodes onto a canvas
- They connect nodes to define the **execution order**
- The system **automatically generates** the JSON configuration that the Cogitate backend expects
- This eliminates manual coding for every new client

---

## 🪝 Understanding Hooks (Pre & Post)

In Cogitate's system, a **hook** is a function that executes at a specific point in an insurance transaction:

### Pre Hooks — Run *BEFORE* the main operation
These prepare or validate data before the core business logic executes.

| Node Type | Function Name | What It Does |
|-----------|--------------|--------------|
| Validate Policy Data | `ValidatePolicyData` | Checks that all policy fields are correct |
| Calculate Insurance Price | `CalculateInsurancePrice` | Computes the insurance premium |
| Run Underwriting Rules | `ExecuteUnderwritingRules` | Applies risk assessment rules |
| Check Risk Score | `FetchExternalRiskScore` | Gets risk score from external APIs |
| Update Policy Status | `UpdatePolicyStatus` | Changes the policy's current state |

### Post Hooks — Run *AFTER* the main operation
These handle follow-up actions after the core logic completes.

| Node Type | Function Name | What It Does |
|-----------|--------------|--------------|
| Send for E-Signature | `SendForESignature` | Triggers e-sign document flow |
| Process Payment | `ProcessPayment` | Handles payment processing |
| Send Email Notification | `SendEmailNotification` | Sends emails to stakeholders |
| Send SMS Notification | `SendSMSNotification` | Sends SMS alerts |
| Create Policy Document | `GeneratePolicyPDF` | Generates the policy PDF |

### Flow & Decision Nodes (Control Flow)

| Node Type | Function Name | What It Does |
|-----------|--------------|--------------|
| Start | `Start` | Entry point of the workflow |
| End | `End` | Exit point of the workflow |
| Wait for Time | `WaitForTime` | Pauses execution for a duration |
| Send to Manual Review | `SendToManualReview` | Routes to human review |
| If / Else | `EvaluateCondition` | Conditional branching |

### The Output JSON Format
When a workflow is exported, it produces JSON like this:
```json
{
  "Client": "ACME_INSURANCE",
  "Hooks": {
    "Pre": [{
      "RequestName": "/Quote/Landing",
      "NeedCascading": true,
      "HookCallCascading": true,
      "StaticParams": {},
      "Actions": [
        {
          "FunctionName": "ValidatePolicyData",
          "ModuleName": "@cogitate/core-pos-components",
          "CallFunction": true,
          "isEndpoint": false,
          "Condition": "",
          "Path": ""
        },
        {
          "FunctionName": "CalculateInsurancePrice",
          "ModuleName": "@cogitate/core-pos-components",
          "CallFunction": true,
          "isEndpoint": false,
          "Condition": "",
          "Path": ""
        }
      ]
    }],
    "Post": [{
      "RequestName": "/Application/Summary",
      "NeedCascading": false,
      "StaticParams": {},
      "Actions": [
        {
          "FunctionName": "SendEmailNotification",
          "ModuleName": "@cogitate/core-pos-components",
          "CallFunction": true,
          "isEndpoint": false,
          "Condition": "",
          "Path": ""
        }
      ]
    }]
  }
}
```

---

## 📁 Project Structure

```
x:\cts\
├── app/
│   ├── api/graphql/route.ts          ← GraphQL API endpoint (Apollo Server)
│   ├── actions/workflow.ts           ← Next.js Server Actions (backend calls)
│   ├── components/
│   │   ├── WorkflowBuilder.tsx       ← Visual canvas editor (React Flow)
│   │   ├── WorkflowList.tsx          ← Workflow management UI
│   │   ├── NodesPanel.tsx            ← Sidebar with draggable nodes
│   │   ├── useWorkflow.ts            ← Custom hook for workflow state
│   │   ├── hookSchema.ts            ← ⭐ Canvas → JSON converter
│   │   └── nodes/
│   │       ├── nodeTypes.ts          ← Node definitions (Pre/Post hooks)
│   │       └── CustomNodes.tsx       ← React components for each node
│   ├── layout.tsx
│   ├── page.tsx                      ← Main app with tab navigation
│   └── globals.css
├── lib/graphql/
│   ├── schema.ts                     ← GraphQL type definitions
│   ├── resolvers.ts                  ← Query/mutation implementations
│   ├── store.ts                      ← In-memory data store (POC)
│   └── server.ts                     ← Apollo Server setup
├── Documentation/
│   ├── graphql-api.md                ← Complete API reference
│   ├── api.md & workflow.md          ← Additional docs
├── POC_SETUP.md                      ← POC overview
└── Workflow-Builder-Technical-Guide.pdf  ← Technical guide
```

---

## ✅ What Is Already Done (Current State)

### 1. Frontend — Visual Workflow Builder
- **React Flow canvas** where users drag & drop nodes
- **NodesPanel** sidebar showing all available hook types (Pre, Post, Flow, Decision)
- **Custom node components** with color-coded categories
- **WorkflowList** page with CRUD operations, statistics dashboard
- **Tab navigation** between "Workflows" list and "Builder" canvas

### 2. GraphQL API Layer
- **Full Apollo Server** setup at `/api/graphql`
- **Complete GraphQL schema** with types for [Workflow](file:///x:/cts/lib/graphql/store.ts#24-37), [WorkflowNode](file:///x:/cts/lib/graphql/store.ts#2-12), [WorkflowEdge](file:///x:/cts/lib/graphql/store.ts#13-23)
- **All CRUD resolvers** implemented (create, read, update, delete, publish, archive, duplicate, validate)
- **Pagination**, **search**, and **status filtering**

### 3. Server Actions
- **20+ server actions** in [app/actions/workflow.ts](file:///x:/cts/app/actions/workflow.ts) wrapping GraphQL calls
- Type-safe functions callable from client components

### 4. Data Store (POC)
- **In-memory [WorkflowStore](file:///x:/cts/lib/graphql/store.ts#38-483)** class with full CRUD operations
- Sample "Auto Insurance Rating Workflow" preloaded for testing
- Workflow validation logic (checks for START/END nodes, isolated nodes)

### 5. Hook Schema Conversion ⭐
- [hookSchema.ts](file:///x:/cts/app/components/hookSchema.ts) — The **core innovation**:
  - [canvasToHookSchema()](file:///x:/cts/app/components/hookSchema.ts#48-88) — Converts canvas nodes → Cogitate JSON format
  - [hookSchemaToCanvas()](file:///x:/cts/app/components/hookSchema.ts#98-149) — Converts Cogitate JSON → canvas nodes (for importing)
  - Automatically categorizes nodes into Pre/Post hooks based on `category`

### 6. Technology Stack
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16 | Full-stack React framework |
| React | 19 | UI components |
| TypeScript | 5.7 | Type safety |
| Apollo Server | 5 | GraphQL API server |
| @xyflow/react | 12.10 | Visual workflow editor (React Flow) |
| GraphQL | 16.8 | API query language |
| TailwindCSS | 4 | Styling |

---

## ❌ What Still Needs To Be Done (Your Backend Work)

Based on the POC setup doc and the "Future Enhancements" list, here's what's missing:

### 🔴 Critical Backend Tasks

| # | Task | Description |
|---|------|-------------|
| 1 | **Database Persistence** | Replace [lib/graphql/store.ts](file:///x:/cts/lib/graphql/store.ts) (in-memory) with a real database (MongoDB/PostgreSQL) |
| 2 | **User Authentication** | Add login/signup, JWT tokens, session management |
| 3 | **Authorization & Permissions** | Role-based access (admin, developer, viewer) |
| 4 | **Workflow Execution Engine** | Actually *run* workflows, not just design them |
| 5 | **GraphQL Subscriptions** | Real-time updates when workflows change (WebSocket) |

### 🟡 Important Backend Tasks

| # | Task | Description |
|---|------|-------------|
| 6 | **Workflow Versioning** | Track version history, rollback capability |
| 7 | **Execution Logs & Monitoring** | Log each workflow run, show results |
| 8 | **Error Handling & Recovery** | Graceful error recovery, retry logic, error boundaries |
| 9 | **Export/Import Workflows** | Download/upload workflow JSON configurations |
| 10 | **Workflow Templates** | Pre-built templates for common insurance workflows |

### 🟢 Nice-to-Have Backend Tasks

| # | Task | Description |
|---|------|-------------|
| 11 | **Caching Layer** | Add Redis for performance optimization |
| 12 | **API Rate Limiting** | Prevent abuse of the GraphQL endpoint |
| 13 | **Custom Node Types** | Allow users to define their own hook types |
| 14 | **Webhook Integration** | Trigger external services when workflows complete |
| 15 | **Audit Trail** | Full log of who changed what and when |

---

## 🔑 Key Files You'll Work With

| File | What You'll Do |
|------|---------------|
| [store.ts](file:///x:/cts/lib/graphql/store.ts) | Replace with database queries |
| [resolvers.ts](file:///x:/cts/lib/graphql/resolvers.ts) | Update to use DB instead of in-memory store |
| [schema.ts](file:///x:/cts/lib/graphql/schema.ts) | Extend with auth types, versioning, etc. |
| [hookSchema.ts](file:///x:/cts/app/components/hookSchema.ts) | May need to enhance for more complex hook configs |
| [nodeTypes.ts](file:///x:/cts/app/components/nodes/nodeTypes.ts) | Add new node types as needed |
| [app/actions/workflow.ts](file:///x:/cts/app/actions/workflow.ts) | Update server actions for new features |

---

## 🚀 How to Run the Project

```bash
cd x:\cts
npm install --legacy-peer-deps
npm run dev
```
Then open `http://localhost:3000` in your browser.

---

## Summary

You're building the **backend infrastructure** for a visual workflow builder that lets Cogitate's team configure insurance workflows visually instead of writing code. The frontend POC (visual canvas, drag-drop, basic CRUD) is largely done. Your job is to make it **production-ready** with database persistence, authentication, a workflow execution engine, and the other backend features listed above.
