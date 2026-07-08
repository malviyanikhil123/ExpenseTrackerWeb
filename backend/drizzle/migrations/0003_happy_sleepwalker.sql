ALTER TYPE "public"."transaction_type" ADD VALUE 'TRANSFER';--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "category_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "credit_limit" numeric(12, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "statement_date" integer;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "due_date" integer;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "linked_bank_account_id" uuid;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "destination_account_id" uuid;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_linked_bank_account_id_accounts_id_fk" FOREIGN KEY ("linked_bank_account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_destination_account_id_accounts_id_fk" FOREIGN KEY ("destination_account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE cascade;