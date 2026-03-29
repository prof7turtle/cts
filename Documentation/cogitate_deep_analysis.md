# What Cogitate Actually Wants — Deep Analysis

## 🎯 The Core Answer: It's JUST the JSON File

After reading every reference file Cogitate provided, here's the definitive answer:

> **Your Dynamic Workflow Builder needs to OUTPUT a JSON configuration file. That's the product.** The workflows do NOT run/execute from your app. They run inside **Cogitate's existing backend** (their GQL Service).

---

## 🏗️ How Cogitate's System Actually Works (From the Architecture Diagram)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    UI         │────▶│  Pre Hook(s) │────▶│ GQL Service  │────▶│ Post Hook(s) │
│ (Next.js)    │ GQL │ Gen Quote #  │     │              │     │ Gen Policy   │
│              │ Req │ Geocode Addr │     │  ┌────────┐  │     │ Send Emails  │
│              │     │ UW Rules     │     │  │CosmosDB│  │     │ etc.         │
│              │◀────│──────────────│◀────│  └────────┘  │◀────│──────────────│
└──────────────┘ GQL └──────────────┘     └──────────────┘     └──────────────┘
                Response                  (Policy Object)
```

### The Flow:
1. **UI** sends a GraphQL request (e.g., "rate this quote")
2. **Pre Hooks** run FIRST — functions like `GenerateQuoteNumber`, `getGeoCodeAddressHook`, `ExecuteUnderwritingRules`
3. **GQL Service** does the main operation (reads/writes to Cosmos DB)  
4. **Post Hooks** run AFTER — functions like `EmailHook`, `copyDocuments`, `generateForms`
5. **Response** goes back to the UI (usually the Policy Object)

### Where Does YOUR Project Fit?
**Your workflow builder creates the JSON config file that TELLS Cogitate's backend WHICH hooks to run, in what order, and with what conditions.** Today, developers write this JSON by hand. Your tool lets them drag-and-drop to build it visually.

---

## 📄 The Exact JSON Output Format

From [Sample-HookSchema.json](file:///x:/cts/Dynamic%20Workflow/Sample-HookSchema.json):

```json
{
    "Hooks": {
        "Pre": [
            {
                "RequestName": "/Quote/Landing",
                "NeedCascading": true,
                "HookCallCascading": true,
                "StaticParams": {},
                "Actions": [
                    {
                        "ModuleName": "@cogitate/core-pos-components",
                        "FunctionName": "GenerateQuoteNumber",
                        "CallFunction": true,
                        "isEndpoint": false,
                        "Condition": "Transaction.Type = 'Application'",
                        "Path": ""
                    }
                ]
            }
        ],
        "Post": [
            {
                "RequestName": "/Application/Summary",
                "NeedCascading": true,
                "HookCallCascading": true,
                "StaticParams": {},
                "Actions": [
                    {
                        "ModuleName": "@cogitate/core-pos-components",
                        "FunctionName": "EmailHook",
                        "CallFunction": true,
                        "isEndpoint": true,
                        "Condition": "",
                        "Path": ""
                    }
                ]
            }
        ]
    }
}
```

### Field-by-Field Meaning

From [HookSchema-Field-Descriptions.json](file:///x:/cts/Dynamic%20Workflow/HookSchema-Field-Descriptions.json):

| Field | Type | Meaning |
|-------|------|---------|
| `RequestName` | string | API endpoint this hook applies to (e.g., `/Quote/Landing`, `/Application/Summary`) |
| `NeedCascading` | boolean | Should this hook cascade to related operations? |
| `HookCallCascading` | boolean (optional) | Enable cascading for nested hook executions |
| `StaticParams` | object | Fixed configuration parameters for this hook |
| `Actions` | array | List of functions to execute |
| `FunctionName` | string | The actual function to call (e.g., `GenerateQuoteNumber`) |
| `ModuleName` | string | NPM package where the function lives (e.g., `@cogitate/core-pos-components`) |
| `CallFunction` | boolean | Whether to actually invoke this function |
| `isEndpoint` | boolean | Is this an HTTP/API endpoint call? |
| `Condition` | string | Expression that must be true to execute (e.g., `Transaction.Type = 'Application'`) |
| `Path` | string | File path for external script execution (e.g., `COGITATE/configs/Personal/HO3/hooksCall/property.js`) |

---

## 🔧 The 22 Real Functions Cogitate Has

From [Hooks-Action-Function-Struture.json](file:///x:/cts/Dynamic%20Workflow/Hooks-Action-Function-Struture.json), these are the REAL functions available:

### Pre Hook Functions (run before main operation)
| Function | What It Does |
|----------|-------------|
| `GenerateQuoteNumber` | Generates/increments quote numbers from product master |
| `getGeoCodeAddressHook` | Geocodes addresses using Google Maps API |
| `ExecuteUnderwritingRules` | Runs UW rules against policy model |
| `getRatingFromThirdParty` | Gets rating from external raters (e.g., Markel) |
| `invokeMultipleRaters` | Runs multiple raters concurrently |
| `getRaterKeyFromProductMaster` | Gets rater config from product master |
| `startTransaction` | Initiates a new policy transaction |
| `createNewQuoteVersion` | Creates new quote version for amendments |
| `getAIMInsuredId` | Fetches AIM Insured ID from external API |
| `getAIMSubmissionId` | Fetches AIM Quote ID from external API |
| `summaryOOS` | Generates Out-of-Sequence summary |
| `processOOS` | Processes Out-of-Sequence transactions |
| `ReinstatementUtilities` | Handles policy reinstatement workflow |

### Post Hook Functions (run after main operation)
| Function | What It Does |
|----------|-------------|
| `getEmailTemplateBody` | Retrieves email template for notifications |
| `generateForms` | Queues async web job for form generation |
| `generateFormsDraft` | Generates draft forms |
| `copyDocuments` | Copies documents via DMS API |
| `PublishEvent` | Publishes policy lifecycle events |
| `invokeAdaptiveAPI` | Calls Adaptive Form API for documents |
| `executeAdaptiveApiRequest` | Executes Adaptive API with policy data |
| `deleteQuoteVersionsOnBind` | Cleans up quote versions after binding |
| `getMarkelForms` | Gets forms from Markel rater response |

---

## 📋 What `initialData (1).json` Is

This is the **Policy Object** — the massive data structure (1300+ lines) that flows through Cogitate's entire system. It contains:

- **Policy Info**: QuoteNumber, PolicyNumber, PolicyStatus, EffectiveDate
- **Agency/Agent/Underwriter**: Contact info, addresses, commissions
- **InsuredAccount**: Policyholder details, communications, business info
- **Transaction**: Type, status, verification, OOS flags
- **Coverages**: Coverage A-F (Dwelling, Other Structures, Personal Property, Loss of Use, Liability, Medical Payments)
- **Premium**: BasicPremium, Surcharge, Discount, AnnualPremium, Fees & Taxes
- **Risks**: Properties with coverages, qualifiers, additional coverages

> This is **NOT** something your workflow builder generates. This is the data that the hooks **process**. Your builder doesn't touch this — it just defines WHICH hooks process it.

---

## 🔑 What Cogitate's Backend Already Has (resolvers-schema.json)

Cogitate already has a complete GQL backend with **40+ resolvers**:

### Queries (read operations)
`authenticateUser`, `loadMasters`, `getByPagination`, `getById`, `getByQuery`, [getAll](file:///x:/cts/lib/graphql/store.ts#153-168), `getAnalytics`, `getTemplate`, `getAgents`, `getAgencies`, `getUnderwriters`, etc.

### Mutations (write operations)  
`rateNewQuote`, `bindNewBusiness`, `startEndorsement`, `bindEndorsement`, `startCancellation`, `bindCancellation`, `startReinstate`, `bindReinstate`, `updatePolicyStatus`, `processRenewal`, `executeRenewal`, `offerQuote`, `putItem`, `postItem`, `deleteItem`, etc.

> **Important**: These resolvers are in Cogitate's **existing backend**, NOT in your project. Your project's job is to define which hooks fire AROUND these resolvers.

---

## ✅ What You Actually Need to Build

### Your workflow builder needs to:

1. **Let users design workflows visually** (drag & drop) ← ✅ Already Done
2. **Map canvas nodes to real Cogitate functions** ← 🟡 Partly done (needs the 22 real functions)
3. **Output valid HookSchema JSON** matching the exact format above ← 🟡 Partly done ([hookSchema.ts](file:///x:/cts/app/components/hookSchema.ts))
4. **Let users configure each Action's fields:**
   - `RequestName` (which API endpoint)
   - `Condition` (when to run)
   - `ModuleName` (which npm package)
   - `isEndpoint` (is it an API call?)
   - `Path` (external script path)
   - `StaticParams` (fixed config params)
5. **Save/load/manage workflow configs** ← 🟡 Needs database
6. **Export the final JSON** that gets deployed to Cogitate's backend ← ❌ Not done

### What you DO NOT need to build:
- ❌ Workflow execution engine (Cogitate's backend does this)
- ❌ Policy data processing (Cogitate's GQL Service does this)
- ❌ Integration with Cosmos DB for policies (that's Cogitate's backend)

---

## 🔴 Gaps in Current Implementation

### 1. Node types don't match real functions
Current [nodeTypes.ts](file:///x:/cts/app/components/nodes/nodeTypes.ts) has generic names like `ValidatePolicyData`, `CalculateInsurancePrice`. These need to be replaced with the **22 real functions** from Cogitate's [Hooks-Action-Function-Struture.json](file:///x:/cts/Dynamic%20Workflow/Hooks-Action-Function-Struture.json).

### 2. [hookSchema.ts](file:///x:/cts/app/components/hookSchema.ts) output is incomplete
Current output is simplified. The real output needs:
- `RequestName` per hook entry (not hardcoded)
- `isEndpoint` flag per action
- `Condition` expressions (e.g., `Transaction.Type = 'Application'`)
- `Path` for external scripts
- `StaticParams` per hook entry
- `ModuleName` per action (varies between packages)

### 3. No UI for configuring Action-level properties
Users need a sidebar/panel to configure:
- Which API endpoint (`RequestName`) each hook applies to
- Conditions for each action
- Whether it's a function call or endpoint
- Module name and path

### 4. No JSON export/download feature
No button to download the final HookSchema JSON file.

### 5. Multiple RequestNames per hook type
A single workflow can have MULTIPLE Pre hook entries and Post hook entries, each for a different `RequestName` (endpoint). Currently [hookSchema.ts](file:///x:/cts/app/components/hookSchema.ts) hardcodes just one entry each.
