import { Router } from "express";

import {
    createBookingController,
    getAllBookingsController,
    getBookingByIdController,
    updateBookingController,
    cancelBookingController,
    generateBookingPdfController,
    deleteBookingController
} from "./booking.controller.js";

import {
    createBookingValidation,
} from "./booking.validation.js";

import validate from "../../middleware/validate.middleware.js";
import authMiddleware from "../../middleware/auth.middleware.js";
import allowBranch from "../../middleware/branch.middleware.js";

const router = Router();

/**
 * Create Booking
 * POST /api/bookings
 * Role: BOOKING branch only
 */
router.post(
    "/",
    authMiddleware,
    allowBranch("BOOKING"),
    createBookingValidation,
    validate,
    createBookingController
);

/**
 * Get All Bookings
 * GET /api/bookings
 * Role: BOOKING & DELIVERY branches (scoped to branch in service)
 */
router.get(
    "/",
    authMiddleware,
    allowBranch("BOOKING", "DELIVERY"),
    getAllBookingsController
);

/**
 * Generate Single Booking PDF
 * GET /api/bookings/:id/pdf
 * Role: BOOKING & DELIVERY branches (scoped to branch in service)
 */
router.get(
    "/:id/pdf",
    authMiddleware,
    allowBranch("BOOKING", "DELIVERY"),
    generateBookingPdfController
);

/**
 * Get Booking By ID
 * GET /api/bookings/:id
 * Role: BOOKING & DELIVERY branches (scoped to branch in service)
 */
router.get(
    "/:id",
    authMiddleware,
    allowBranch("BOOKING", "DELIVERY"),
    getBookingByIdController
);

/**
 * Update Booking
 * PATCH /api/bookings/:id
 * Role: BOOKING branch only (origin branch before dispatch)
 */
router.patch(
    "/:id",
    authMiddleware,
    allowBranch("BOOKING"),
    updateBookingController
);

/**
 * Delete Booking
 * DELETE /api/bookings/:id
 * Role: BOOKING branch only (origin branch before dispatch)
 */
router.delete(
    "/:id",
    authMiddleware,
    allowBranch("BOOKING"),
    deleteBookingController
);

/**
 * Cancel Booking
 * PATCH /api/bookings/:id/cancel
 * Role: BOOKING branch only (origin branch before dispatch)
 */
router.patch(
    "/:id/cancel",
    authMiddleware,
    allowBranch("BOOKING"),
    cancelBookingController
);

export default router;