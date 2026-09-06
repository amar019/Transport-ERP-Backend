import { Router } from "express";
import authMiddleware from "../../middleware/auth.middleware.js";
import allowBranch from "../../middleware/branch.middleware.js";

import {
    getPaymentsController,
    getPaymentByIdController,
    getPaymentSummaryController,
    reversePaymentController,
    recordRefundController,
} from "./payment.controller.js";

import {
    paymentIdValidation,
    getPaymentsValidation,
    reversePaymentValidation,
    recordRefundValidation,
} from "./payment.validation.js";

const router = Router();

// All payment routes require authentication and branch context
router.use(authMiddleware);
router.use(allowBranch("BOOKING", "DELIVERY"));

// GET /api/payments - List all payments for branch
router.get("/", getPaymentsValidation, getPaymentsController);

// GET /api/payments/summary - Today's Inflow, Outflow, Net Movement summary metrics
router.get("/summary", getPaymentsValidation, getPaymentSummaryController);

// GET /api/payments/:id - Get single payment details
router.get("/:id", paymentIdValidation, getPaymentByIdController);

// POST /api/payments/:id/reverse - Reverse payment transaction
router.post("/:id/reverse", reversePaymentValidation, reversePaymentController);

// POST /api/payments/refund - Record manual refund outflow
router.post("/refund", recordRefundValidation, recordRefundController);

export default router;
