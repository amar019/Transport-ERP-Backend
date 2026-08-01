import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiErrors.js";

import {
    createBooking,
    getAllBookings,
    getBookingById,
    updateBooking,
    cancelBooking,
    generateBookingPdfService,
    deleteBooking
} from "./booking.service.js";



export const generateBookingPdfController =
    asyncHandler(
        async (req, res) => {
            const {
                pdfBuffer,
                bookingNumber,
            } =
                await generateBookingPdfService(
                    req.params.id
                );

            console.log(
                "PDF Buffer:",
                pdfBuffer
            );

            console.log(
                "PDF Buffer Length:",
                pdfBuffer.length
            );

            console.log(
                "Booking Number:",
                bookingNumber
            );


            res.setHeader(
                "Content-Type",
                "application/pdf"
            );

            res.setHeader(
                "Content-Disposition",
                `inline; filename="Bilty-${bookingNumber}.pdf"`
            );

            res.status(200).send(
                Buffer.from(pdfBuffer)
            );
        }
    );
/**
 * Create Booking
 */
export const createBookingController = asyncHandler(
    async (req, res) => {
        const booking = await createBooking(req.body);

        if (!booking) {
            throw new ApiError(
                500,
                "Failed to create booking"
            );
        }

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    booking,
                    "Booking created successfully"
                )
            );
    }
);


/**
 * Get All Bookings
 */
export const getAllBookingsController = asyncHandler(
    async (req, res) => {
        const bookings = await getAllBookings();

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    bookings,
                    "Bookings fetched successfully"
                )
            );
    }
);


/**
 * Get Booking By ID
 */
export const getBookingByIdController = asyncHandler(
    async (req, res) => {
        const { id } = req.params;

        if (!id) {
            throw new ApiError(
                400,
                "Booking ID is required"
            );
        }

        const booking =
            await getBookingById(id);

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    booking,
                    "Booking fetched successfully"
                )
            );
    }
);


/**
 * Update Booking
 */
export const updateBookingController = asyncHandler(
    async (req, res) => {
        const { id } = req.params;

        if (!id) {
            throw new ApiError(
                400,
                "Booking ID is required"
            );
        }

        const booking =
            await updateBooking(
                id,
                req.body
            );

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    booking,
                    "Booking updated successfully"
                )
            );
    }
);


/**
 * Cancel Booking
 */
export const cancelBookingController = asyncHandler(
    async (req, res) => {
        const { id } = req.params;

        if (!id) {
            throw new ApiError(
                400,
                "Booking ID is required"
            );
        }

        const booking =
            await cancelBooking(id);

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    booking,
                    "Booking cancelled successfully"
                )
            );
    }
);



/**
 * Delete Booking
 */
export const deleteBookingController = asyncHandler(
    async (req, res) => {
        const { id } = req.params;

        if (!id) {
            throw new ApiError(
                400,
                "Booking ID is required"
            );
        }

        const booking = await deleteBooking(id);

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    booking,
                    "Booking deleted successfully"
                )
            );
    }
);