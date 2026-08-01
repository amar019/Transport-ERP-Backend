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

const router = Router();

/**
 * Create Booking
 * POST /api/bookings
 */
router.post(
    "/",
    authMiddleware,
    createBookingValidation,
    validate,
    createBookingController
);

/**
 * Get All Bookings
 * GET /api/bookings
 */
router.get(
    "/",
    authMiddleware,
    getAllBookingsController
);



/**
 * Generate Single Booking PDF
 * GET /api/bookings/:id/pdf
 */
// router.get(
//     "/:id/pdf",
//     authMiddleware,
//     generateBookingPdfController
// );





/**
 * Get Booking By ID
 * GET /api/bookings/:id
 */
router.get(
    "/:id",
    authMiddleware,
    getBookingByIdController
);

/**
 * Update Booking
 * PATCH /api/bookings/:id
 */
router.patch(
    "/:id",
    authMiddleware,
    updateBookingController
);



/**
 * Delete Booking
 * DELETE /api/bookings/:id
 */
router.delete(
    "/:id",
    authMiddleware,
    deleteBookingController
);


/**
 * Cancel Booking
 * PATCH /api/bookings/:id/cancel
 */
router.patch(
    "/:id/cancel",
    authMiddleware,
    cancelBookingController
);

export default router;