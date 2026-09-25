import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  numeric,
  timestamp,
  boolean,
  date,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ────────────────────────────────────────────────────────────
// Enums
// ────────────────────────────────────────────────────────────

export const categoryTypeEnum = pgEnum("category_type", ["fixed", "variable"]);
export const paymentKindEnum = pgEnum("payment_kind", [
  "upi",
  "debit",
  "credit",
  "cash",
]);
export const flowEnum = pgEnum("flow", ["income", "expense", "invest"]);
export const assetClassEnum = pgEnum("asset_class", [
  "savings",
  "fd_rd",
  "mutual_fund",
  "stock",
]);
export const txSourceEnum = pgEnum("tx_source", ["web", "shortcut"]);

// ────────────────────────────────────────────────────────────
// Categories
// `defaultType` is a SUGGESTION only — pre-fills the Fixed/Variable
// toggle when a transaction is created, but doesn't decide it. Real
// usage shows the same category (e.g. Entertainment: Spotify vs. a
// one-off movie) can be either, so the transaction itself carries
// the final flag, not the category.
// ────────────────────────────────────────────────────────────

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // "Grocery", "Electricity Bill", "Sibling Education"...
  defaultType: categoryTypeEnum("default_type").notNull().default("variable"),
  color: text("color"), // hex, matches the color-dot list in settings + chart legend
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

// ────────────────────────────────────────────────────────────
// Payment Methods
// One row per actual instrument, not per bank — "HDFC" alone isn't
// enough since you hold several HDFC-issued cards for different
// purposes (Swiggy CC, UPI CC, Paytm CC) plus a plain debit card.
// ────────────────────────────────────────────────────────────

export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "UPI", "HDFC Swiggy CC", "CSB Edge CC", "HDFC Premium Debit Card"
  issuer: text("issuer"), // "HDFC", "Axis", "CSB" — null for generic UPI
  kind: paymentKindEnum("kind").notNull(),
  color: text("color"), // hex, matches the color-dot list in settings
  statementDay: integer("statement_day"), // credit cards only, nullable otherwise
  dueDay: integer("due_day"),
  active: boolean("active").notNull().default(true),
});

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type NewPaymentMethod = typeof paymentMethods.$inferInsert;

// ────────────────────────────────────────────────────────────
// Credit Card Statements
// One row per billing cycle, mirroring your sheet's Credit Cards
// table (Spend / Generated / Paid Date / Rewards). `spend` can be
// computed live by summing transactions for that card + cycle, but
// it's stored here too — billing cycles rarely line up with calendar
// months, so a real cycle boundary needs to be recorded, not assumed.
// `generatedAmount`, `paidDate`, `rewards` stay manual — no bank sync.
// ────────────────────────────────────────────────────────────

export const creditCardStatements = pgTable(
  "credit_card_statements",
  {
    id: serial("id").primaryKey(),
    paymentMethodId: integer("payment_method_id")
      .notNull()
      .references(() => paymentMethods.id),
    cycleMonth: date("cycle_month").notNull(), // first of the month the cycle is attributed to
    spend: numeric("spend", { precision: 12, scale: 2 }),
    generatedAmount: numeric("generated_amount", { precision: 12, scale: 2 }),
    paidDate: date("paid_date"),
    rewards: numeric("rewards", { precision: 12, scale: 2 }).default("0"),
  },
  (t) => ({
    uniqCycle: uniqueIndex("uniq_card_cycle").on(
      t.paymentMethodId,
      t.cycleMonth,
    ),
  }),
);

// ────────────────────────────────────────────────────────────
// Transactions
// Income and expense share one table (flow: income | expense).
// `isFixed` lives HERE, not on the category — it's pre-filled from
// the chosen category's `defaultType` at creation time but fully
// editable, since the same category can be either depending on the
// specific transaction (Entertainment: Spotify vs. a movie ticket).
// `source` tags whether it came from the dashboard or the Shortcut.
//
// Editability: any month stays open indefinitely — this is a
// continuous ledger, not a closed-books-per-month model like the
// sheet's tabs. `updatedAt` exists so the UI can quietly flag "edited"
// on a row whose `updatedAt` differs from `createdAt`, in case you
// ever want to notice a stale month got touched — worth revisiting
// if that turns out to matter less than assumed here.
//
// Indexes: `date` and `categoryId` are the two things every dashboard
// query filters on (a month's transactions, a category's spend), so
// both get an index; `paymentMethodId` backs the /cards cycle-spend
// rollup. UUIDv7's time-ordered layout keeps these indexes tight on
// insert instead of fragmenting the way v4 PKs would at this row count.
// ────────────────────────────────────────────────────────────

export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    description: text("description").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(), // always positive; `flow` carries direction
    flow: flowEnum("flow").notNull().default("expense"),
    isFixed: boolean("is_fixed").notNull().default(false),
    categoryId: integer("category_id").references(() => categories.id), // null for income rows
    paymentMethodId: integer("payment_method_id").references(
      () => paymentMethods.id,
    ),
    note: text("note"),
    source: txSourceEnum("source").notNull().default("web"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    dateIdx: index("tx_date_idx").on(t.date),
    categoryIdx: index("tx_category_idx").on(t.categoryId),
    paymentMethodIdx: index("tx_payment_method_idx").on(t.paymentMethodId),
  }),
);

// ────────────────────────────────────────────────────────────
// Recurring Templates
// Your FIXED section (SIP, Electricity, Wifi, Spotify...) gets
// retyped every month by hand today. A template stores the shape of
// a recurring line so the dashboard can offer "log this month's SIP"
// as a one-tap action instead of a blank form. `amount` is nullable
// since some (Electricity) vary each month and some (Spotify) don't.
// ────────────────────────────────────────────────────────────

export const recurringTemplates = pgTable("recurring_templates", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(), // "SIP", "Electricity", "Spotify"
  amount: numeric("amount", { precision: 12, scale: 2 }), // null if it varies month to month
  categoryId: integer("category_id").references(() => categories.id),
  paymentMethodId: integer("payment_method_id").references(
    () => paymentMethods.id,
  ),
  isFixed: boolean("is_fixed").notNull().default(true),
  dayOfMonth: integer("day_of_month"), // for a reminder, not auto-posting
  active: boolean("active").notNull().default(true),
});

// ────────────────────────────────────────────────────────────
// Holdings
// Current balance per account/instrument, grouped by asset class —
// direct match for your sheet's SAVINGS ACC / FD-RD / MF / STOCKS
// blocks. This is manually updated by design; there's no bank sync,
// so `updatedAt` is the "last time I typed this in" timestamp.
// ────────────────────────────────────────────────────────────

export const holdings = pgTable("holdings", {
  id: serial("id").primaryKey(),
  assetClass: assetClassEnum("asset_class").notNull(),
  institution: text("institution").notNull(), // "HDFC", "Zerodha", "Nippon India"
  instrument: text("instrument").notNull(), // account no. / fund name / ticker
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ────────────────────────────────────────────────────────────
// Net Worth Snapshots
// A frozen monthly rollup — matches your sheet's Month/Growth/Diff
// table. Stored rather than always-live so August's ₹770,204 doesn't
// silently change if you later correct a holding's value. `diff`
// isn't stored — it's just this row's total minus the previous row's,
// computed at query time.
// ────────────────────────────────────────────────────────────

export const netWorthSnapshots = pgTable("net_worth_snapshots", {
  id: serial("id").primaryKey(),
  month: date("month").notNull().unique(), // first of month
  savingsTotal: numeric("savings_total", { precision: 14, scale: 2 }).notNull(),
  fdRdTotal: numeric("fd_rd_total", { precision: 14, scale: 2 }).notNull(),
  mfTotal: numeric("mf_total", { precision: 14, scale: 2 }).notNull(),
  stocksTotal: numeric("stocks_total", { precision: 14, scale: 2 }).notNull(),
  total: numeric("total", { precision: 14, scale: 2 }).notNull(),
});

// ────────────────────────────────────────────────────────────
// Goals (phase 2 — net-new, no equivalent in the sheet)
// ────────────────────────────────────────────────────────────

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  targetAmount: numeric("target_amount", { precision: 14, scale: 2 }).notNull(),
  targetDate: date("target_date").notNull(),
  inflationRate: numeric("inflation_rate", { precision: 5, scale: 2 }).default(
    "6.00",
  ),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ────────────────────────────────────────────────────────────
// API Tokens
// Auth for the Shortcuts endpoint, entirely separate from the
// dashboard's session login — the Shortcut never "logs in", it just
// sends a bearer token checked against tokenHash on every POST.
// ────────────────────────────────────────────────────────────

export const apiTokens = pgTable("api_tokens", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(), // "iPhone Back Tap"
  tokenHash: text("token_hash").notNull(),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
