import express from "express";

import {
    getCustomerLedgerController,
    getCustomerLedgerBalanceController,
    getCustomerOutstandingBookingsController,
    collectCustomerOutstandingPaymentController,
} from "./customerLedger.controller.js";

import authMiddleware from "../../middleware/auth.middleware.js";

const router = express.Router();

// Get complete customer ledger
router.get(
    "/customer/:customerId",
    authMiddleware,
    getCustomerLedgerController
);

// Get current customer balance
router.get(
    "/customer/:customerId/balance",
    authMiddleware,
    getCustomerLedgerBalanceController
);

// Get outstanding bookings for a customer
router.get(
    "/customer/:customerId/outstanding",
    authMiddleware,
    getCustomerOutstandingBookingsController
);

router.get(
    "/:customerId/outstanding",
    authMiddleware,
    getCustomerOutstandingBookingsController
);

// Collect payment for customer outstanding bookings
router.post(
    "/customer/:customerId/collect-payment",
    authMiddleware,
    collectCustomerOutstandingPaymentController
);

router.post(
    "/:customerId/collect-payment",
    authMiddleware,
    collectCustomerOutstandingPaymentController
);

export default router;