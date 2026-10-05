import express from "express";

import {
    collectCustomerPaymentController,
    getPaymentTransactionsController,
} from "./paymentTransaction.controller.js";

import authMiddleware from "../../middleware/auth.middleware.js";

const router = express.Router();

// Collect payment for a booking
router.post(
    "/collect/:id",
    authMiddleware,
    collectCustomerPaymentController
);

// Get all payment transactions
router.get(
    "/",
    authMiddleware,
    getPaymentTransactionsController
);

export default router;