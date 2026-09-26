# Categories Module — Specification

## 1. Purpose

Categories classify every transaction (Grocery, Electricity Bill, Sibling Education, etc.) and drive the dashboard's category chart, filters, and Fixed/Variable defaulting. This module is fully user-defined — no hardcoded list ships with the app; each self-hosted instance maintains its own.

## 2. Data Model

Table: `categories`

| Field | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | serial | PK |  |
| `name` | text | unique, not null | Trimmed before save |
| `defaultType` | enum(`fixed`, `variable`) | not null, default `variable` | Suggestion only — pre-fills a transaction's Fixed/Variable toggle, does not constrain it |
| `color` | text | nullable | Hex string, drives the color dot in lists and the category chart legend |
| `sortOrder` | integer | not null, default 0 | User-controlled display order via drag-and-drop — categories are grouped deliberately (bills, then family/support, then lifestyle), not alphabetical |
| `createdAt` | timestamp | not null, default now |  |

**Implementation Note:** `sortOrder` is added to the database schema, indexed for ordering, and backed by migration `drizzle/0002_dark_shinko_yamashiro.sql`. Drag-and-drop reorder is handled via `PATCH /api/categories/reorder`.

## 3. Business Rules

- Name is required, non-empty after trimming, and unique (case-sensitive at the DB level; consider a case-insensitive unique index if "Grocery" and "grocery" should collide).
- A category cannot be deleted while any transaction references it — deletion returns `409 Conflict`, not a cascade or null-out.
- `defaultType` and `color` are optional at creation but `defaultType` always has a value (defaults to `variable`) since the transaction form needs something to pre-fill.
- No limit on category count.
- No built-in category "groups" or nesting — flat list only, ordering via `sortOrder` is the only structure.

## 4. API

All routes require an authenticated dashboard session (not the Shortcuts token — categories are never created/edited from the Shortcut itself).

### `GET /api/categories`

Returns all categories ordered by `sortOrder`.

```json
200 OK
[
  { "id": 1, "name": "Grocery", "defaultType": "variable", "color": "#F5D97A", "sortOrder": 0 },
  { "id": 2, "name": "Electricity Bill", "defaultType": "fixed", "color": "#F5D97A", "sortOrder": 1 }
]
```

### `POST /api/categories`

```json
// Request
{ "name": "Grocery", "defaultType": "variable", "color": "#F5D97A" }

// 201 Created
{ "id": 1, "name": "Grocery", "defaultType": "variable", "color": "#F5D97A", "sortOrder": 0 }

// 409 Conflict — name already exists
{ "error": "A category named \"Grocery\" already exists." }

// 400 Bad Request — validation failure
{ "error": "name is required" }
```

### `PATCH /api/categories/:id`

Same body shape as POST, every field optional. Used for inline edits (rename, recolor, retype) and for `sortOrder` updates when a row is dragged.

```json
// 200 OK — updated row
// 404 Not Found — id doesn't exist
```

### `PATCH /api/categories/reorder`

Bulk endpoint for drag-and-drop — avoids N individual PATCH calls when a whole list is reshuffled.

```json
// Request
{ "order": [3, 1, 2] }  // array of category ids in new order

// 200 OK
{ "updated": 3 }
```

### `DELETE /api/categories/:id`

```json
// 200 OK — deleted
// 409 Conflict
{ "error": "Cannot delete — 12 transactions use this category." }
```

## 5. UI/UX

**Location:** `/settings`, "Categories" tab (sibling to "Payment Methods").

**List view:**

- One row per category: drag handle · color swatch (click → color picker) · name (inline text input, autosaves on blur) · Fixed/Variable segmented toggle · trash icon
- Order reflects `sortOrder`, editable by dragging
- "+ Add category" row pinned at the bottom, always visible; clicking inserts a blank editable row and focuses the name field immediately

**Delete interaction:**

- Click trash → optimistic attempt → on `409`, the row stays in place and the trash icon area is replaced inline with "Used by N transactions" (no modal, no navigation away)
- On success, row is removed from the list immediately

**Empty state (first run, zero categories):**

- Centered message: "No categories yet"
- Primary action: the same "+ Add category" affordance, front and center
- Secondary, skippable action: "Start with common categories" — batch-creates a generic starter set (e.g. Groceries, Transport, Bills, Entertainment, Shopping, Misc) that the user can then freely edit or delete

**Color picker:** a small fixed palette (8–10 swatches) rather than a full color wheel — matches the sheet's existing use of a handful of repeated colors per group, and keeps the chart legend visually coherent rather than accumulating dozens of near-identical hues over time.

## 6. Edge Cases

| Case | Behavior |
| --- | --- |
| Renaming a category already used by transactions | Allowed — transactions keep referencing the same `id`, so historical rows display the new name retroactively (matches how the sheet's dropdown editing already works) |
| Deleting a category with 0 transactions | Succeeds immediately, no confirmation dialog needed |
| Two categories with the same name (case difference) | Currently allowed unless a case-insensitive unique index is added — flagged in §3 |
| Reorder request with an id that doesn't exist | `400 Bad Request`, entire reorder rejected rather than partially applied |

## 7. Out of Scope (v1)

- Category groups/nesting
- Merging two categories into one
- Per-category budgets or spending limits
- Icons beyond the color dot