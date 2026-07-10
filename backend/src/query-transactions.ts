import { db } from "./db";
import { transactions } from "./db/schema/transactions";
import { eq, and, isNull, desc } from "drizzle-orm";

async function main() {
    const userId = "230ada33-8e07-4502-a8bd-470304401272";
    const txs = await db
        .select({
            id: transactions.id,
            note: transactions.note,
            transactionDate: transactions.transactionDate,
        })
        .from(transactions)
        .where(and(eq(transactions.userId, userId), isNull(transactions.deletedAt)))
        .orderBy(desc(transactions.transactionDate));

    console.log("=== TRANSACTIONS FROM DB ORDERED BY transactionDate DESC ===");
    console.log(JSON.stringify(txs, null, 2));
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
