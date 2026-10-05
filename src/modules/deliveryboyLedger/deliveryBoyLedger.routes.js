import express from "express";

import {
    getDeliveryBoyLedgerController,
    getDeliveryBoyLedgerBalanceController,
    settleDeliveryBoyLedgerController,
    getDeliveryBoyDailyReportController,
    getOutstandingCollectionsController,
    settleSelectedDeliveryBoyLedgerController

} from "./deliveryBoyLedger.controller.js";

import authMiddleware from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get(
    "/:deliveryBoyId/outstanding-collections",
    authMiddleware,
    getOutstandingCollectionsController
);

router.post(
    "/:deliveryBoyId/settle-selected",
    authMiddleware,
    settleSelectedDeliveryBoyLedgerController
);

router.get(
    "/:deliveryBoyId/daily-report",
    authMiddleware,
    getDeliveryBoyDailyReportController
);


// Get current delivery boy balance
router.get(
    "/:deliveryBoyId/balance",
    authMiddleware,
    getDeliveryBoyLedgerBalanceController
);

// Settlement
router.post(
    "/:deliveryBoyId/settle",
    authMiddleware,
    settleDeliveryBoyLedgerController
);

// Get complete delivery boy ledger
router.get(
    "/:deliveryBoyId",
    authMiddleware,
    getDeliveryBoyLedgerController
);





export default router;