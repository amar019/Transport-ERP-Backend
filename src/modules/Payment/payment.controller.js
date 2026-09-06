import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiErrors.js";
import { validationResult } from "express-validator";

import {
    getPaymentsService,
    getPaymentByIdService,
    getPaymentSummaryService,
    reversePaymentService,
    recordRefundService,
} from "./payment.service.js";

// Helper to check express-validator errors
const handleValidationErrors = (req) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((err) => err.msg);
        throw new ApiError(400, errorMessages[0] || "Validation failed", errorMessages);
    }
};

/**
 * Get All Payments
 */
const getPaymentsController = asyncHandler(async (req, res) => {
    handleValidationErrors(req);

    const branch = req.branch || req.user?.branch;
    if (!branch) {
        throw new ApiError(400, "Branch context is required to view payments");
    }

    const payments = await getPaymentsService(branch, req.query);

    return res
        .status(200)
        .json(new ApiResponse(200, payments, "Payments retrieved successfully"));
});

/**
 * Get Payment By ID
 */
const getPaymentByIdController = asyncHandler(async (req, res) => {
    handleValidationErrors(req);

    const branch = req.branch || req.user?.branch;
    if (!branch) {
        throw new ApiError(400, "Branch context is required");
    }

    const payment = await getPaymentByIdService(req.params.id, branch);

    return res
        .status(200)
        .json(new ApiResponse(200, payment, "Payment retrieved successfully"));
});

/**
 * Get Payment Summary Metrics
 */
const getPaymentSummaryController = asyncHandler(async (req, res) => {
    handleValidationErrors(req);

    const branch = req.branch || req.user?.branch;
    if (!branch) {
        throw new ApiError(400, "Branch context is required");
    }

    const summary = await getPaymentSummaryService(branch, req.query);

    return res
        .status(200)
        .json(new ApiResponse(200, summary, "Payment summary retrieved successfully"));
});

/**
 * Reverse Payment Transaction
 */
const reversePaymentController = asyncHandler(async (req, res) => {
    handleValidationErrors(req);

    const branch = req.branch || req.user?.branch;
    const user = req.user;

    const payment = await reversePaymentService(
        req.params.id,
        req.body.reversalReason,
        branch,
        user
    );

    return res
        .status(200)
        .json(new ApiResponse(200, payment, "Payment transaction reversed successfully"));
});

/**
 * Record Refund Outflow
 */
const recordRefundController = asyncHandler(async (req, res) => {
    handleValidationErrors(req);

    const branch = req.branch || req.user?.branch;
    const user = req.user;

    const refund = await recordRefundService(req.body, branch, user);

    return res
        .status(201)
        .json(new ApiResponse(201, refund, "Refund recorded successfully"));
});

export {
    getPaymentsController,
    getPaymentByIdController,
    getPaymentSummaryController,
    reversePaymentController,
    recordRefundController,
};
