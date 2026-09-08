import express from "express";

import {
    createDeliveryBoyController,
    getAllDeliveryBoysController,
    getDeliveryBoyByIdController,
    updateDeliveryBoyController,
    deactivateDeliveryBoyController,
} from "./deliveryBoy.controller.js";

import authMiddleware from "../../middleware/auth.middleware.js";

const router = express.Router();


// Create Delivery Boy
router.post(
    "/",
    authMiddleware,
    createDeliveryBoyController
);


// Get All Delivery Boys
router.get(
    "/",
    authMiddleware,
    getAllDeliveryBoysController
);


// Get Delivery Boy By ID
router.get(
    "/:id",
    authMiddleware,
    getDeliveryBoyByIdController
);


// Update Delivery Boy
router.patch(
    "/:id",
    authMiddleware,
    updateDeliveryBoyController
);


// Deactivate Delivery Boy
router.patch(
    "/:id/deactivate",
    authMiddleware,
    deactivateDeliveryBoyController
);


export default router;