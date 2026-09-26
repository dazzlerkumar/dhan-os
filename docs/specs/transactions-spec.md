# Transactions Module — Specification

## 1. Purpose

The ledger itself — every income and expense row, plus the aggregation endpoints the dashboard needs to reproduce what the sheet currently computes by hand (monthly totals, category breakdown, Fixed/Variable split).

## 2. Data Model

Table: `transactions` (as finalized earlier, with one addition below)

| Field | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | serial | PK |  |
| `date` | date | not null |  |
| `description` | text | not null |  |
| `amount` | numeric(12,2) | not null | Always positive; `flow` carries direction |
| `flow` | enum(`income`, `expense`) | not null, default `expense` |  |
| `isFixed` | boolean | not null, default false | Pre-filled from category's `defaultType` at creation, freely editable after |
| `categoryId` | FK → categories | nullable | Null for income rows |
| `paymentMethodId` | FK → payment_methods | nullable |  |
| `recurringTemplateId` | FK → recurring_templates | nullable | **New** — set only when the row was created via "log this month's X"; lets a template's typical amount be refined from what actually got logged, and lets the UI show "from your SIP template" provenance if useful later |
| `note` | text | nullable |  |
| `source` | enum(`web`, `shortcut`) | not null, default `web` | The `shortcut` value exists in the schema now; nothing in this spec's endpoints sets it yet |
| `createdAt` / `updatedAt` | timestamp | not null, default now |  |

Indexes: `date`, `categoryId`, `paymentMethodId` (already decided).

**Months are not a stored entity.** Which months have data, for tab/jump-to population, is derived from `DISTINCT date_trunc('month', date)` — see §4.2. No `months` table, nothing to keep in sync.

## 3. Business Rules

- `amount` must be `> 0`; enforce at the validation layer, not just the DB.
- `flow` defaults to `expense`; income rows are created the same way with `flow: "income"` and typically `categoryId: null` (income doesn't need a category, though the field isn't hard-blocked from being set if a user wants to categorize income sources later).
- `isFixed` is set by the client at creation time (pre-filled from the chosen category's `defaultType`, but the request can override it) — the server does not re-derive or overwrite it from the category server-side.
- Any transaction is editable indefinitely — no locked/closed-month concept (per the earlier "continuous ledger" decision). `updatedAt` diverging from `createdAt` is the only record that an edit happened.
- Deleting a category or payment method that's referenced by any transaction is blocked upstream (409, per those modules' specs) — so a transaction's `categoryId`/`paymentMethodId` should never go stale or dangle in practice. No orphan-handling logic needed here as a result.
- `recurringTemplateId` is set once, at creation, by the "log this month's X" action — never editable afterward via the normal transaction PATCH (changing it would misrepresent where the row came from).

## 4. API

All routes require an authenticated dashboard session.

### 4.1 `GET /api/transactions`

Scoped to a month by default — with years of history, an unscoped "give me everything" query is the wrong default.

Query params: `month` (required, `YYYY-MM`), `categoryId`, `paymentMethodId`, `flow`, `isFixed`, `search` (matches `description`, case-insensitive), all optional filters on top of the month scope.

```json
GET /api/transactions?month=2026-09&categoryId=3

200 OK
[
  {
    "id": 101, "date": "2026-09-14", "description": "Instamart",
    "amount": "444.00", "flow": "expense", "isFixed": false,
    "categoryId": 3, "paymentMethodId": 5, "recurringTemplateId": null,
    "note": null, "source": "web"
  }
]
```

### 4.2 `GET /api/transactions/months`

Returns every month that has at least one transaction, for populating whatever tab/jump-to control the UI ends up using. Always includes the current calendar month even if empty, per the earlier decision.

```json
200 OK
{ "months": ["2026-09", "2026-08", "2026-07", "...", "2023-01"] }
```

### 4.3 `GET /api/transactions/summary`

Reproduces the sheet's summary block for one month.

```json
GET /api/transactions/summary?month=2026-09

200 OK
{
  "income": "50000.00",
  "fixedExpenses": "12869.00",
  "variableExpenses": "28736.00",
  "creditSpend": "22035.00",
  "debitSpend": "19570.00",
  "cashbacks": "2511.00",
  "savings": "10906.00"
}
```

Computation:

- `income` = `SUM(amount) WHERE flow='income' AND month=?`
- `fixedExpenses` / `variableExpenses` = `SUM(amount) WHERE flow='expense' AND isFixed=?` for that month
- `creditSpend` / `debitSpend` = `SUM(amount) WHERE flow='expense'`, joined to `paymentMethods.kind` (credit → creditSpend; debit/upi/cash → debitSpend, matching how the sheet lumps non-credit together)
- `cashbacks` = `SUM(creditCardStatements.rewards) WHERE cycleMonth=?`
- `savings` = `income - fixedExpenses - variableExpenses + cashbacks`

### 4.4 `GET /api/transactions/category-breakdown`

Powers the bar chart.

```json
GET /api/transactions/category-breakdown?month=2026-09

200 OK
[
  { "categoryId": 3, "name": "Grocery", "color": "#F5D97A", "total": "17575.00" },
  { "categoryId": 7, "name": "Sibling Education", "color": "#A9CCE3", "total": "10000.00" }
]
```

`SUM(amount) GROUP BY categoryId WHERE flow='expense' AND month=?`, ordered descending by total.

### 4.5 `POST /api/transactions`

```json
// Request
{
  "date": "2026-09-14", "description": "Instamart", "amount": 444,
  "flow": "expense", "isFixed": false, "categoryId": 3, "paymentMethodId": 5, "note": null
}

// 201 Created — full row including id, createdAt, updatedAt, source: "web"

// 400 Bad Request
{ "error": "amount must be greater than 0" }
```

### 4.6 `GET /api/transactions/:id`

Single row, full detail — used when opening an existing transaction for edit.

### 4.7 `PATCH /api/transactions/:id`

Partial update, same validation as POST. `recurringTemplateId` and `source` are not accepted in the body — both are set only at creation time and ignored (not errored) if present in a PATCH payload.

### 4.8 `DELETE /api/transactions/:id`

Hard delete, no soft-delete/undo in v1. `200 OK` on success.

## 5. Recurring Templates — Logging Endpoint

Ties directly into this module: logging a template's occurrence for the current month creates an ordinary transaction row.

### `POST /api/recurring-templates/:id/log`

```json
// Request — amount optional; omit to use the template's stored amount,
// include to override for this month (e.g. Electricity varies)
{ "date": "2026-09-13", "amount": 2570 }

// 201 Created — a normal transaction row, with recurringTemplateId set
{
  "id": 210, "date": "2026-09-13", "description": "Electricity",
  "amount": "2570.00", "flow": "expense", "isFixed": true,
  "categoryId": 4, "paymentMethodId": 1, "recurringTemplateId": 6,
  "source": "web"
}
```

`description`, `categoryId`, `paymentMethodId`, and `isFixed` are copied from the template; only `amount` (and optionally `date`, defaulting to today) are supplied per-call.

## 6. Validation Summary

| Field | Rule |
| --- | --- |
| `date` | required, valid date |
| `description` | required, non-empty after trim |
| `amount` | required, numeric, `> 0` |
| `flow` | required, one of `income`/`expense` |
| `isFixed` | required, boolean |
| `categoryId` | optional; if present, must reference an existing category |
| `paymentMethodId` | optional; if present, must reference an existing payment method |
| `note` | optional, free text |

## 7. Edge Cases

| Case | Behavior |
| --- | --- |
| Income row with a `categoryId` set | Allowed, not blocked — some users may want to categorize income sources later even though the sheet's model doesn't |
| Editing a transaction from 8 months ago | Allowed without restriction — continuous ledger, no locked months |
| `recurring-templates/:id/log` called twice in the same month | Not deduplicated automatically — creates two transactions. Preventing accidental double-logging is a UI concern (e.g. disabling the prompt once used), not enforced server-side |
| `month` query param missing on `GET /api/transactions` | `400 Bad Request` — scope is mandatory, no accidental full-table fetch |
| Deleted transaction that was the source of a `recurringTemplateId` link | No cascade concern — deleting a transaction never touches the template it came from |

## 8. Explicitly Deferred

- Apple Shortcuts-facing create endpoint (bearer-token auth, `source: "shortcut"`) — separate spec later
- All UI/UX