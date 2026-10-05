import mongoose from "mongoose";
import Payment from "./payment.model.js";
import ApiError from "../../utils/ApiErrors.js";
import { generateTransactionNumber } from "./payment.helper.js";

/**
 * Get All Payments (Scoped by Branch)
 */
export const getPaymentsService = async (branch, queryParams = {}) => {
    const filter = {
        branch: branch._id,
    };

    if (queryParams.status) {
        filter.status = queryParams.status;
    } else {
        filter.status = "ACTIVE"; // Default to active payments
    }

    if (queryParams.type) {
        filter.type = queryParams.type;
    }

    if (queryParams.category) {
        filter.category = queryParams.category;
    }

    if (queryParams.paymentMode) {
        filter.paymentMode = queryParams.paymentMode;
    }

    // Date range filter
    if (queryParams.startDate || queryParams.endDate) {
        filter.transactionDate = {};
        if (queryParams.startDate) {
            const start = new Date(queryParams.startDate);
            start.setHours(0, 0, 0, 0);
            filter.transactionDate.$gte = start;
        }
        if (queryParams.endDate) {
            const end = new Date(queryParams.endDate);
            end.setHours(23, 59, 59, 999);
            filter.transactionDate.$lte = end;
        }
    }

    if (queryParams.search) {
        filter.$or = [
            { transactionNumber: { $regex: queryParams.search, $options: "i" } },
            { referenceNumber: { $regex: queryParams.search, $options: "i" } },
            { remarks: { $regex: queryParams.search, $options: "i" } },
        ];
    }

    const payments = await Payment.find(filter)
        .populate("branch", "name type status")
        .populate("customer", "customerCode shopName ownerName mobile")
        .populate("booking", "bookingNumber totalAmount paymentStatus collectionType")
        .populate("memo", "memoNumber totalAmount collectionStatus status")
        .populate("expense", "category description amount")
        .populate("createdBy", "name username")
        .sort({ transactionDate: -1, createdAt: -1 });

    return payments;
};

/**
 * Get Payment By ID
 */
export const getPaymentByIdService = async (paymentId, branch) => {
    const payment = await Payment.findById(paymentId)
        .populate("branch", "name type status")
        .populate("customer", "customerCode shopName ownerName mobile email address")
        .populate("booking", "bookingNumber totalAmount paymentStatus collectionType fromBranch toBranch")
        .populate("memo", "memoNumber totalAmount receivedAmount pendingAmount status")
        .populate("expense", "category description amount expenseDate")
        .populate("createdBy", "name username");

    if (!payment) {
        throw new ApiError(404, "Payment transaction not found");
    }

    if (payment.branch._id.toString() !== branch._id.toString()) {
        throw new ApiError(403, "You do not have access to this payment transaction");
    }

    return payment;
};

/**
 * Get Payment Financial Summary for Branch
 */
export const getPaymentSummaryService = async (branch, queryParams = {}) => {
    const branchObjectId = new mongoose.Types.ObjectId(
        (branch._id || branch.id || branch).toString()
    );

    // 1. Today's start and end timestamps
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Today Inflow
    const todayInflowResult = await Payment.aggregate([
        {
            $match: {
                branch: branchObjectId,
                status: "ACTIVE",
                type: "INFLOW",
                transactionDate: { $gte: todayStart, $lte: todayEnd },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$amount" },
            },
        },
    ]);

    // Today Outflow
    const todayOutflowResult = await Payment.aggregate([
        {
            $match: {
                branch: branchObjectId,
                status: "ACTIVE",
                type: "OUTFLOW",
                transactionDate: { $gte: todayStart, $lte: todayEnd },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$amount" },
            },
        },
    ]);

    // All-time / filtered range aggregate
    const dateFilter = {};
    if (queryParams.startDate || queryParams.endDate) {
        if (queryParams.startDate) {
            const start = new Date(queryParams.startDate);
            start.setHours(0, 0, 0, 0);
            dateFilter.$gte = start;
        }
        if (queryParams.endDate) {
            const end = new Date(queryParams.endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter.$lte = end;
        }
    }

    const rangeMatch = { branch: branchObjectId, status: "ACTIVE" };
    if (Object.keys(dateFilter).length > 0) {
        rangeMatch.transactionDate = dateFilter;
    }

    const rangeInflowResult = await Payment.aggregate([
        { $match: { ...rangeMatch, type: "INFLOW" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const rangeOutflowResult = await Payment.aggregate([
        { $match: { ...rangeMatch, type: "OUTFLOW" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const todayInflow = todayInflowResult[0]?.total || 0;
    const todayOutflow = todayOutflowResult[0]?.total || 0;
    const todayNetMovement = todayInflow - todayOutflow;

    const periodInflow = rangeInflowResult[0]?.total || 0;
    const periodOutflow = rangeOutflowResult[0]?.total || 0;
    const periodNetMovement = periodInflow - periodOutflow;

    return {
        todayInflow,
        todayOutflow,
        todayNetMovement,
        periodInflow,
        periodOutflow,
        periodNetMovement,
    };
};

/**
 * Reverse a Payment Transaction
 */
export const reversePaymentService = async (paymentId, reversalReason, branch, user) => {
    const payment = await Payment.findById(paymentId);

    if (!payment) {
        throw new ApiError(404, "Payment transaction not found");
    }

    if (payment.branch.toString() !== branch._id.toString()) {
        throw new ApiError(403, "You do not have authorization to reverse this payment");
    }

    if (payment.status === "REVERSED") {
        throw new ApiError(400, "This payment transaction is already reversed");
    }

    payment.status = "REVERSED";
    payment.reversedAt = new Date();
    payment.reversalReason = reversalReason;

    await payment.save();

    return payment;
};

/**
 * Record a Manual Refund Outflow
 */
export const recordRefundService = async (refundData, branch, user, session = null) => {
    const transactionNumber = await generateTransactionNumber(session);

    const paymentOptions = session ? { session } : {};

    const [payment] = await Payment.create(
        [
            {
                transactionNumber,
                type: "OUTFLOW",
                category: "REFUND",
                amount: Number(refundData.amount),
                paymentMode: refundData.paymentMode,
                referenceNumber: refundData.referenceNumber || null,
                branch: branch._id,
                customer: refundData.customer || null,
                booking: refundData.booking || null,
                createdBy: user._id || user.id,
                remarks: refundData.remarks || "Refund payout",
                status: "ACTIVE",
            },
        ],
        paymentOptions
    );

    return payment;
};
