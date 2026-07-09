CREATE TABLE "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"icon" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_methods_code_unique" UNIQUE("code")
);
--> statement-breakpoint
INSERT INTO "payment_methods" ("name", "code", "icon", "is_active") VALUES
('Cash', 'CASH', 'Wallet', true),
('Google Pay', 'GOOGLE_PAY', 'Smartphone', true),
('PhonePe', 'PHONEPE', 'Smartphone', true),
('Paytm', 'PAYTM', 'Smartphone', true),
('BHIM', 'BHIM', 'Smartphone', true),
('Debit Card', 'DEBIT_CARD', 'CreditCard', true),
('Credit Card', 'CREDIT_CARD', 'CreditCard', true),
('Net Banking', 'NET_BANKING', 'Globe', true)
ON CONFLICT DO NOTHING;
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "payment_method_id" uuid;
--> statement-breakpoint
UPDATE "transactions" SET "payment_method_id" = (SELECT "id" FROM "payment_methods" WHERE "code" = 'CASH' LIMIT 1);
--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "payment_method_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "transactions_payment_method_id_idx" ON "transactions" USING btree ("payment_method_id");