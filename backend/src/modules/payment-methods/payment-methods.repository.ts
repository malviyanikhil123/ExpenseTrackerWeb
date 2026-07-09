import { and, eq } from "drizzle-orm";

import { db } from "../../db";
import { paymentMethods } from "../../db/schema/paymentMethods";

export class PaymentMethodsRepository {
    async findAll() {
        return db
            .select()
            .from(paymentMethods)
            .where(eq(paymentMethods.isActive, true));
    }

    async findById(id: string) {
        const [pm] = await db
            .select()
            .from(paymentMethods)
            .where(
                and(
                    eq(paymentMethods.id, id),
                    eq(paymentMethods.isActive, true)
                )
            )
            .limit(1);

        return pm ?? null;
    }
}

export const paymentMethodsRepository = new PaymentMethodsRepository();
