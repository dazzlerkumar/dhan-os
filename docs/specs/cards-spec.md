# Cards Module — Specification

## 1. Purpose

Track credit card billing cycles — spend, statement amount, paid date, rewards — reproducing the sheet's Credit Cards table. A "card" is not a new root entity: it's a `paymentMethods` row where `kind = 'credit'`. This module adds cycle-level history (`creditCardStatements`) on top of that existing table.

## 2. Data Model

No new tables beyond what's already in `schema.ts`:

- **`paymentMethods`** (`kind = 'credit'` rows only, for this module's purposes) — `statementDay` and `dueDay` drive all cycle math below.
- **`creditCardStatements`** — one row per billing cycle: `paymentMethodId`, `cycleMonth`, `spend`, `generatedAmount`, `paidDate`, `rewards`. Unique on `(paymentMethodId, cycleMonth)`.

**Cycle boundary definition** (this needed pinning down — worth reading before building the queries below):

`cycleMonth` is the calendar month in which the statement *generates* — i.e., the month containing `statementDay`. The spend window for that cycle is `[previous cycle's statementDay, this cycle's statementDay − 1 day]`. Example: `statementDay = 1` → the cycle generating on Sep 1 covers spend from Aug 1 to Aug 31, and is stored as `cycleMonth = 2026-09-01`.

**Important cross-module note:** this cycle window is independent of the calendar-month scoping used by `GET /api/transactions?month=`. Your sheet's own monthly tabs already mix the two — the "Sep 26" tab's Credit Cards table aggregates spend from transactions dated across July–August, because it's reporting the *cycle* that bills in September, not September's calendar transactions. This module's queries run directly against `transactions` using the computed cycle date range, not through the month-scoped Transactions endpoint — so there's no actual conflict, but it's worth knowing these two "month" concepts (calendar month vs. billing cycle) are genuinely different things in this app, same as they were in the sheet.

## 3. Business Rules

- A payment method needs both `statementDay` and `dueDay` set for automatic cycle computation to work. If either is missing, the card still appears in `/cards`, but with `cyclesConfigured: false` and no computed current-cycle spend — flagging "set a statement day" is a UI concern, but the API needs to expose that missing state.
- `spend` on a `creditCardStatements` row is **auto-computed and frozen at creation time** — `SUM(transactions.amount) WHERE paymentMethodId = ? AND flow = 'expense' AND date BETWEEN <cycle start> AND <cycle end>` — but the request body can override it, for the rare case a manual correction is needed (a transaction logged after the fact into a cycle that's already been statemented, say).
- Only one statement per `(paymentMethodId, cycleMonth)` — attempting to create a second returns `409`; corrections go through `PATCH`, not a second `POST`.
- `rewards` defaults to `0`, not null — every statement has a reward value even if it's zero, matching the sheet's own "₹0" rows rather than blank cells.
- An inactive (`active: false`) payment method is excluded from "needs a statement" checks but its statement history remains fully queryable — retiring a card doesn't erase its record.

## 4. API

All routes require an authenticated dashboard session.

### 4.1 `GET /api/cards`

Lists every `kind = 'credit'` payment method with its current (open, not-yet-statemented) cycle spend computed live, plus its most recent logged statement.

```json
200 OK
[
  {
    "id": 2, "name": "HDFC Swiggy CC", "issuer": "HDFC", "active": true,
    "statementDay": 1, "dueDay": 21, "cyclesConfigured": true,
    "currentCycleSpend": "6120.00",
    "currentCycleWindow": { "start": "2026-09-01", "end": "2026-09-30" },
    "lastStatement": {
      "cycleMonth": "2026-09-01", "spend": "7846.00",
      "generatedAmount": "7228.00", "paidDate": "2026-09-01", "rewards": "618.00"
    },
    "pendingStatement": false
  }
]
```

`pendingStatement: true` when today's date is past the most recent `statementDay` occurrence and no `creditCardStatements` row exists yet for that `cycleMonth` — signals a statement is due to be logged.

### 4.2 `GET /api/cards/:id`

Full statement history for one card, ordered by `cycleMonth` descending — powers whatever per-card detail view the UI ends up building (trend of spend/rewards over time, etc.).

```json
200 OK
{
  "id": 2, "name": "HDFC Swiggy CC", "issuer": "HDFC",
  "statementDay": 1, "dueDay": 21,
  "statements": [
    { "cycleMonth": "2026-09-01", "spend": "7846.00", "generatedAmount": "7228.00", "paidDate": "2026-09-01", "rewards": "618.00" },
    { "cycleMonth": "2026-08-01", "spend": "6910.00", "generatedAmount": "6910.00", "paidDate": "2026-08-01", "rewards": "540.00" }
  ]
}
```

### 4.3 `POST /api/cards/:id/statements`

```json
// Request — spend omitted, so it's auto-computed from transactions
{ "cycleMonth": "2026-10-01", "generatedAmount": "8102.00", "paidDate": "2026-10-01", "rewards": "701.00" }

// 201 Created
{ "cycleMonth": "2026-10-01", "spend": "8102.00", "generatedAmount": "8102.00", "paidDate": "2026-10-01", "rewards": "701.00" }

// 409 Conflict — statement already exists for this cycle
{ "error": "A statement for October 2026 already exists on this card." }
```

### 4.4 `PATCH /api/cards/:id/statements/:cycleMonth`

Partial update — for correcting `generatedAmount`, `paidDate`, `rewards`, or manually overriding `spend`.

### 4.5 `DELETE /api/cards/:id/statements/:cycleMonth`

Removes a mistakenly logged statement. No effect on the underlying transactions — this only deletes the cycle-level rollup row.

## 5. Interaction with Transactions Summary

`GET /api/transactions/summary` (from the Transactions spec) reads `SUM(creditCardStatements.rewards) WHERE cycleMonth = ?` for its `cashbacks` figure, and splits `creditSpend` vs. `debitSpend` by joining `transactions.paymentMethodId → paymentMethods.kind`. Both already account for this module's data — no changes needed there, just confirming the two specs agree with each other.

## 6. Edge Cases

| Case | Behavior |
| --- | --- |
| Card has no `statementDay`/`dueDay` set | `cyclesConfigured: false`, `currentCycleSpend` omitted, no `pendingStatement` check performed |
| A transaction is logged into a cycle that already has a statement | Allowed — doesn't retroactively update the frozen `spend` value; a manual `PATCH` is how you'd correct it if it matters |
| Deleting a card (payment method) with statement history | Blocked at the Payment Methods layer (409) — same rule as transactions; retire (`active: false`) instead |
| `POST .../statements` for a `cycleMonth` in the future | Allowed — nothing stops logging ahead of time, though it's an unusual case |
| Card's `statementDay` changed mid-history (e.g. bank moved the billing date) | Existing `creditCardStatements` rows are untouched (they're frozen historical records); only future cycle-window calculations use the new day — can create an odd-length "transition" cycle once, which is expected and not specially handled |

## 7. Out of Scope (v1)

- Auto-reminders/notifications for `pendingStatement`
- Interest/late-fee tracking
- Multi-currency cards