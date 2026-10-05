import { Router } from "express";
import { getDeliveryDashboardController } from "./dashboard.controller.js";
import auth from "../../middleware/auth.middleware.js";

const router = Router();

/**
 * GET /api/dashboard/delivery
 * Access: Protected (Requires Auth)
 */
router.get("/delivery", auth, getDeliveryDashboardController);

export default router;
