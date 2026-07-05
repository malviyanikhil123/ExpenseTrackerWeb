import type {
    FastifyReply,
    FastifyRequest,
} from "fastify";

import { dashboardService } from "./dashboard.service";
import { dashboardQuerySchema } from "./dashboard.schema";

export class DashboardController {
    async getDashboard(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        const query = dashboardQuerySchema.parse(
            request.query,
        );

        const dashboard =
            await dashboardService.getDashboard(
                request.user.sub,
                query,
            );

        return reply.send({
            success: true,
            message: "Dashboard fetched successfully.",
            data: dashboard,
        });
    }
}

export const dashboardController =
    new DashboardController();