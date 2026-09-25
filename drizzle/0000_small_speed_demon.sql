CREATE TYPE "public"."asset_class" AS ENUM('savings', 'fd_rd', 'mutual_fund', 'stock');--> statement-breakpoint
CREATE TYPE "public"."category_type" AS ENUM('fixed', 'variable');--> statement-breakpoint
CREATE TYPE "public"."flow" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TYPE "public"."payment_kind" AS ENUM('upi', 'debit', 'credit', 'cash');--> statement-breakpoint
CREATE TYPE "public"."tx_source" AS ENUM('web', 'shortcut');--> statement-breakpoint
CREATE TABLE "api_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"token_hash" text NOT NULL,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"default_type" "category_type" DEFAULT 'variable' NOT NULL,
	"color" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "credit_card_statements" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_method_id" integer NOT NULL,
	"cycle_month" date NOT NULL,
	"spend" numeric(12, 2),
	"generated_amount" numeric(12, 2),
	"paid_date" date,
	"rewards" numeric(12, 2) DEFAULT '0'
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"target_amount" numeric(14, 2) NOT NULL,
	"target_date" date NOT NULL,
	"inflation_rate" numeric(5, 2) DEFAULT '6.00',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "holdings" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_class" "asset_class" NOT NULL,
	"institution" text NOT NULL,
	"instrument" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "net_worth_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"month" date NOT NULL,
	"savings_total" numeric(14, 2) NOT NULL,
	"fd_rd_total" numeric(14, 2) NOT NULL,
	"mf_total" numeric(14, 2) NOT NULL,
	"stocks_total" numeric(14, 2) NOT NULL,
	"total" numeric(14, 2) NOT NULL,
	CONSTRAINT "net_worth_snapshots_month_unique" UNIQUE("month")
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"issuer" text,
	"kind" "payment_kind" NOT NULL,
	"color" text,
	"statement_day" integer,
	"due_day" integer,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(12, 2),
	"category_id" integer,
	"payment_method_id" integer,
	"is_fixed" boolean DEFAULT true NOT NULL,
	"day_of_month" integer,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"flow" "flow" DEFAULT 'expense' NOT NULL,
	"is_fixed" boolean DEFAULT false NOT NULL,
	"category_id" integer,
	"payment_method_id" integer,
	"note" text,
	"source" "tx_source" DEFAULT 'web' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "credit_card_statements" ADD CONSTRAINT "credit_card_statements_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_templates" ADD CONSTRAINT "recurring_templates_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_templates" ADD CONSTRAINT "recurring_templates_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_card_cycle" ON "credit_card_statements" USING btree ("payment_method_id","cycle_month");--> statement-breakpoint
CREATE INDEX "tx_date_idx" ON "transactions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "tx_category_idx" ON "transactions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "tx_payment_method_idx" ON "transactions" USING btree ("payment_method_id");