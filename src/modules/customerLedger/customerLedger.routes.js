import express from "express";

import {
    getCustomerLedgerController,
    getCustomerLedgerBalanceController,
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

export default router;