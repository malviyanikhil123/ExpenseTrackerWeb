import { db } from "./db";
import { debts } from "./db/schema/debts";
import { eq, and, isNull } from "drizzle-orm";

async function main() {
    const userId = "230ada33-8e07-4502-a8bd-470304401272";
    const ds = await db.select().from(debts).where(and(eq(debts.userId, userId), isNull(debts.deletedAt)));
    console.log("=== CURRENT DEBTS IN DB ===");
    console.log(JSON.stringify(ds.map(d => ({ id: d.id, party: d.partyName, accountId: d.accountId, type: d.type })), null, 2));
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
