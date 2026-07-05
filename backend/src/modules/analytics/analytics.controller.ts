import type {
    FastifyReply,
    FastifyRequest,
} from "fastify";

import { analyticsService } from "./analytics.service";
import { analyticsQuerySchema } from "./analytics.schema";

export class AnalyticsController {
    async getAnalytics(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const query = analyticsQuerySchema.parse(
            request.query,
        );

        const analytics =
            await analyticsService.getAnalytics(
                request.user.sub,
                query,
            );

        return reply.send({
            success: true,
            message: "Analytics fetched successfully.",
            data: analytics,
        });
    }
}

export const analyticsController =
    new AnalyticsController();