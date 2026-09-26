# Payment Methods Module — Specification

## 1. Purpose

Payment methods represent every instrument money moves through — UPI, a debit card, or a specific credit card product (e.g. "HDFC Swiggy CC", "CSB Edge CC"). Every transaction is tagged to one, and credit-kind payment methods double as the root entity for the `/cards` cycle-tracking module. Like Categories, this list is fully user-defined — no hardcoded set ships with the app.

## 2. Data Model

Table: `paymentMethods`

| Field | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | serial | PK |  |
| `name` | text | not null | e.g. "UPI", "HDFC Swiggy CC", "HDFC Premium Debit Card". Not globally unique — see §3 |
| `issuer` | text | nullable | "HDFC", "Axis", "CSB" — null for generic UPI or cash |
| `kind` | enum(`upi`, `debit`, `credit`, `cash`) | not null | Drives which fields are relevant and how `/cards` treats the row |
| `color` | text | nullable | Hex, drives the color dot in lists and any per-method chart breakdowns |
| `statementDay` | integer | nullable | Only meaningful when `kind = credit`; day of month the statement generates |
| `dueDay` | integer | nullable | Only meaningful when `kind = credit`; day of month payment is due |
| `sortOrder` | integer | not null, default 0 | Same rationale as Categories — user-controlled order, not alphabetical |
| `active` | boolean | not null, default true | See §3 for why this exists instead of deletion |

**Note:** `statementDay`/`dueDay` are stored but not enforced at the DB level for non-credit kinds — the API and UI are responsible for hiding/ignoring them, not a CHECK constraint. Simpler, and the cost of a stray value on a UPI row is zero.

## 3. Business Rules

- `name` is required, non-empty after trimming. **Not unique** — unlike categories, two payment methods could plausibly share a display name in edge cases (unlikely in practice, but nothing about "one card per issuer" is a hard rule someone self-hosting will always follow), so uniqueness isn't enforced at creation.
- `kind` is required at creation; it does not change after creation in the UI (changing a row from `credit` to `cash` would orphan its statement history) — if a user needs to fix a mis-set kind, they delete and recreate rather than edit in place. Worth exposing an explicit "Kind can't be changed after creation" note in the edit UI rather than just disabling the control silently.
- A payment method cannot be **hard deleted** while referenced by any `transactions` row or `creditCardStatements` row — same `409` pattern as Categories, but with two tables to check instead of one.
- Because credit cards often need to stop being used (closed, replaced) without losing their transaction history, `active` exists as a soft-disable: an inactive payment method is hidden from the transaction-entry picker and the Shortcut's method list, but stays fully visible in historical reports and `/cards`. This is the intended way to "retire" a card, not deletion.
- `statementDay`/`dueDay` accept `1–31`; no validation against actual days-in-month (e.g. `31` on a card that statements in February) — treated as approximate scheduling hints, not exact dates.

## 4. API

All routes require an authenticated dashboard session — payment methods are never created/edited from the Shortcut.

### `GET /api/payment-methods`

Returns all payment methods ordered by `sortOrder`. Accepts `?active=true` to filter to active-only (used by the transaction form and to build the Shortcut's method list).

```json
200 OK
[
  { "id": 1, "name": "UPI", "issuer": null, "kind": "upi", "color": "#A9CCE3", "statementDay": null, "dueDay": null, "sortOrder": 0, "active": true },
  { "id": 2, "name": "HDFC Swiggy CC", "issuer": "HDFC", "kind": "credit", "color": "#E8A87C", "statementDay": 1, "dueDay": 21, "sortOrder": 1, "active": true }
]
```

### `POST /api/payment-methods`

```json
// Request
{ "name": "HDFC Swiggy CC", "issuer": "HDFC", "kind": "credit", "color": "#E8A87C", "statementDay": 1, "dueDay": 21 }

// 201 Created — full row, including generated id, sortOrder, active: true

// 400 Bad Request
{ "error": "kind must be one of: upi, debit, credit, cash" }
```

### `PATCH /api/payment-methods/:id`

Partial update. `kind` is accepted by the schema but the route should reject a change to it with `400` once the row has any transaction or statement history — a fresh, unused row can still have its `kind` corrected.

```json
// 200 OK — updated row
// 400 Bad Request — attempted kind change on a row with history
{ "error": "Can't change kind on a payment method with existing transactions." }
```

### `PATCH /api/payment-methods/:id/toggle-active`

Dedicated endpoint for the soft-disable, rather than overloading PATCH — makes the "retire a card" action explicit in the API surface and in any audit logging later.

```json
{ "active": false }
// 200 OK — { "id": 2, "active": false }
```

### `PATCH /api/payment-methods/reorder`

Same shape as the Categories reorder endpoint.

```json
{ "order": [2, 1, 3] }
// 200 OK — { "updated": 3 }
```

### `DELETE /api/payment-methods/:id`

```json
// 200 OK — deleted (only possible if zero transactions AND zero statements reference it)
// 409 Conflict
{ "error": "Cannot delete — 340 transactions and 6 statements use this payment method." }
```

## 5. UI/UX

**Location:** `/settings`, "Payment Methods" tab.

**List view, per row:**

- Drag handle · color swatch (click → color picker) · name (inline text, autosave on blur) · Kind pill selector (UPI / Debit / Credit / Cash) · issuer (smaller, optional secondary field, greyed placeholder until filled) · trash icon
- When Kind = Credit: two additional small numeric fields reveal inline — Statement Day, Due Day. Collapsed entirely for the other three kinds.
- An inactive row renders visually muted (reduced opacity) with a "Reactivate" toggle in place of the trash icon, rather than disappearing from the list — you should still be able to find and re-enable a retired card without digging through a separate archive view.

**Retiring vs. deleting:**

- Trash icon always attempts a hard delete first; on `409` it's replaced inline with "Used by 340 transactions — retire instead?" with a one-click action that calls `toggle-active` rather than delete. This is the primary path most existing cards will take, since real usage means they'll almost always have history.

**Add flow:** same "+ Add payment method" pinned row pattern as Categories — inserting a blank row defaults `kind` to `upi` (the most common, fewest-fields case) so a new row is usable with just a name typed in.

**Empty state (first run):** "No payment methods yet" with the add-row control front and center. No "common starter set" offer here, unlike Categories — payment methods are specific enough (exact card products, exact bank) that a generic template offers little value and risks looking like the app is inventing accounts that don't exist.

## 6. Edge Cases

| Case | Behavior |
| --- | --- |
| Deleting a payment method with 0 transactions and 0 statements | Succeeds immediately |
| Attempting to change `kind` on a row with history | Rejected with `400`; delete-and-recreate is the escape hatch |
| Reactivating a payment method | Available anytime via the muted row's toggle — no data is lost by going inactive |
| Two payment methods with identical names | Allowed (not unique) — UI should still show `issuer` alongside `name` wherever both might otherwise look identical in a picker |
| `statementDay`/`dueDay` set on a non-credit kind | Stored if sent, but never rendered or used — dead data, not an error |

## 7. Out of Scope (v1)

- Bank/card sync or balance verification
- Multiple currencies per payment method
- Linking a payment method to a specific `holdings` bank account (e.g. tying a debit card to its underlying savings account row)