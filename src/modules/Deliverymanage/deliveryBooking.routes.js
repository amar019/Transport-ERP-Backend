import express from "express";

import {
    getDeliveryBookingsController,
    getDeliveryBookingByIdController,
    assignDeliveryBoyController,
    counterDeliveryController,
    markDeliveredController,
    markDeliveryFailedController,
} from "./deliveryBooking.controller.js";

import {
    collectCustomerPaymentController,
} from "../paymentTransactions/paymentTransaction.controller.js";

import authMiddleware from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get(
    "/",
    authMiddleware,
    getDeliveryBookingsController
);

router.get(
    "/:id",
    authMiddleware,
    getDeliveryBookingByIdController
);

router.patch(
    "/:id/assign",
    authMiddleware,
    assignDeliveryBoyController
);

router.post(
    "/:id/counter-delivery",
    authMiddleware,
    counterDeliveryController
);

router.patch(
    "/:id/deliver",
    authMiddleware,
    markDeliveredController
);

router.patch(
    "/:id/failed",
    authMiddleware,
    markDeliveryFailedController
);

// Customer payment collection
router.post(
    "/:id/collect-payment",
    authMiddleware,
    collectCustomerPaymentController
);

export default router;