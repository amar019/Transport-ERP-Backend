import mongoose from "mongoose";
import Booking from "./booking.model.js";
import ApiError from "../../utils/ApiErrors.js";
import PDFDocument from "pdfkit";
import { drawBilty } from "./booking.pdf.js";
import Customer from "../customer/cutomer.model.js";
import Branch from "../Branch/branch.model.js";
import { calculatePaymentDetails } from "../../utils/payment.helper.js";
import Payment from "../Payment/payment.model.js";
import { generateTransactionNumber } from "../Payment/payment.helper.js";
import CustomerLedger from "../customerLedger/customerLedger.model.js";

/**
 * Generate PDF Service
 */
export const generateBookingPdfService = async (bookingId, branch) => {
    // 1. Find booking
    const booking = await Booking.findById(bookingId)
        .populate(
            "customer",
            "customerCode shopName ownerName mobile email address area city district state pincode"
        )
        .populate("fromBranch", "name type status")
        .populate("toBranch", "name type status")
        .populate("createdBy", "name username");

    // 2. Check booking exists
    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    // 3. Cross-branch access check
    const fromBranchId = booking.fromBranch?._id?.toString() || booking.fromBranch?.toString();
    const toBranchId = booking.toBranch?._id?.toString() || booking.toBranch?.toString();
    const currentBranchId = branch._id.toString();

    if (fromBranchId !== currentBranchId && toBranchId !== currentBranchId) {
        throw new ApiError(403, "You do not have access to generate PDF for this booking");
    }

    // 4. Convert MongoDB document to plain object
    const bookingData = booking.toObject();

    // 5. Generate PDF buffer using pdfkit
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: "A4", margin: 40 });
        const buffers = [];

        doc.on("data", (chunk) => buffers.push(chunk));
        doc.on("end", () => {
            const pdfBuffer = Buffer.concat(buffers);
            resolve({
                pdfBuffer,
                bookingNumber: booking.bookingNumber || "Bilty",
            });
        });
        doc.on("error", (err) => reject(err));

        drawBilty(doc, bookingData);
        doc.end();
    });
};

/**
 * Generate next booking number
 * Example: BK-0001, BK-0002
 */
const generateBookingNumber = async (session = null) => {
    const query = Booking.findOne()
        .sort({ createdAt: -1 })
        .select("bookingNumber");

    if (session) {
        query.session(session);
    }

    const lastBooking = await query;

    if (!lastBooking || !lastBooking.bookingNumber) {
        return "BK-0001";
    }

    const lastNumber = parseInt(
        lastBooking.bookingNumber.replace("BK-", ""),
        10
    );

    const nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;

    return `BK-${String(nextNumber).padStart(4, "0")}`;
};

/**
 * Create Booking
 * - Origin branch (fromBranch) is strictly set from authenticated user's branch
 * - Creator (createdBy) is strictly set from authenticated user
 * - Auto-creates INFLOW Payment if collectionType is PAID_AT_BOOKING
 */
export const createBooking = async (bookingData, branch, user) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // 1. Validate Customer exists
        const customer = await Customer.findById(bookingData.customer).session(session);
        if (!customer) {
            throw new ApiError(404, "Customer not found");
        }

        // 2. Validate Destination Branch (toBranch) exists and is active
        const toBranch = await Branch.findById(bookingData.toBranch).session(session);
        if (!toBranch) {
            throw new ApiError(404, "Destination branch not found");
        }

        if (toBranch.status !== "ACTIVE") {
            throw new ApiError(400, "Destination branch is inactive");
        }

        // 3. Generate booking number
        const bookingNumber = await generateBookingNumber(session);

        // 4. Calculate charges
        const parcelCharge = Number(bookingData.parcelCharge || 0);
        const crossing = Number(bookingData.crossing || 0);
        const freight = Number(bookingData.freight || 0);
        const hamali = Number(bookingData.hamali || 0);
        const biltyCharge = Number(bookingData.biltyCharge || 0);
        const otherCharges = Number(bookingData.otherCharges || 0);

        const totalAmount =
            parcelCharge +
            crossing +
            freight +
            hamali +
            biltyCharge +
            otherCharges;

        const payment = calculatePaymentDetails(
            bookingData.collectionType,
            totalAmount
        );

        // 5. Create booking with enforced origin branch and createdBy
        const [booking] = await Booking.create(
            [
                {
                    ...bookingData,
                    fromBranch: branch._id,
                    toBranch: toBranch._id,
                    createdBy: user._id || user.id,
                    bookingNumber,
                    totalAmount,
                    ...payment,
                },
            ],
            { session }
        );


        // 6. Create Customer Ledger entry for TO_PAY booking
        if (booking.collectionType === "TO_PAY") {
            const previousCustomerLedger =
                await CustomerLedger.findOne({
                    customer: customer._id,
                    branch: toBranch._id,
                })
                    .sort({ createdAt: -1 })
                    .session(session);

            const previousCustomerBalance =
                Number(previousCustomerLedger?.balance || 0);

            const newCustomerBalance =
                previousCustomerBalance + totalAmount;

            await CustomerLedger.create(
                [
                    {
                        customer: customer._id,

                        booking: booking._id,

                        branch: toBranch._id,

                        transaction: null,

                        type: "BOOKING_DEBIT",

                        debit: totalAmount,

                        credit: 0,

                        balance: newCustomerBalance,

                        remarks: `Bilty ${booking.bookingNumber} - Amount due`,

                        createdBy: user._id || user.id,
                    },
                ],
                { session }
            );
        }

        // 6. If PAID_AT_BOOKING, auto-create INFLOW Payment transaction
        if (bookingData.collectionType === "PAID_AT_BOOKING") {
            const transactionNumber = await generateTransactionNumber(session);
            await Payment.create(
                [
                    {
                        transactionNumber,
                        transactionDate: booking.bookingDate || Date.now(),
                        type: "INFLOW",
                        category: "BOOKING_PAYMENT",
                        amount: totalAmount,
                        paymentMode: bookingData.paymentMode || "CASH",
                        branch: branch._id,
                        customer: customer._id,
                        booking: booking._id,
                        createdBy: user._id || user.id,
                        remarks: `Upfront payment for Bilty ${bookingNumber}`,
                        status: "ACTIVE",
                    },
                ],
                { session }
            );
        }

        await session.commitTransaction();

        return await Booking.findById(booking._id)
            .populate("customer", "customerCode shopName ownerName mobile email address area city district state pincode deliveryAddress")
            .populate("fromBranch", "name type status")
            .populate("toBranch", "name type status")
            .populate("createdBy", "name username");
    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        throw error;
    } finally {
        await session.endSession();
    }
};

/**
 * Get All Bookings (Role- and Branch-scoped)
 * - BOOKING branch: returns bookings where fromBranch = branch._id
 * - DELIVERY branch: returns bookings where toBranch = branch._id
 */
export const getAllBookings = async (branch, queryParams = {}) => {
    const filter = {};

    // Branch scoping
    if (branch.type === "BOOKING") {
        filter.fromBranch = branch._id;
    } else if (branch.type === "DELIVERY") {
        filter.toBranch = branch._id;
    }

    // Optional query filters
    if (queryParams.status) {
        filter.status = queryParams.status;
    }

    if (queryParams.paymentStatus) {
        filter.paymentStatus = queryParams.paymentStatus;
    }

    if (queryParams.collectionType) {
        filter.collectionType = queryParams.collectionType;
    }

    if (queryParams.customer) {
        filter.customer = queryParams.customer;
    }

    if (queryParams.search) {
        filter.$or = [
            { bookingNumber: { $regex: queryParams.search, $options: "i" } },
            { "sender.name": { $regex: queryParams.search, $options: "i" } },
            { itemName: { $regex: queryParams.search, $options: "i" } },
        ];
    }

    const bookings = await Booking.find(filter)
        .populate(
            "customer",
            "customerCode shopName ownerName mobile email address area city district state pincode deliveryAddress"
        )
        .populate("fromBranch", "name type status")
        .populate("toBranch", "name type status")
        .populate("createdBy", "name username")
        .populate("memo", "memoNumber status memoDate")
        .sort({ createdAt: -1 });

    return bookings;
};

/**
 * Get Booking By ID
 * - Validates that the booking is in scope for the user's branch
 */
export const getBookingById = async (bookingId, branch) => {
    const booking = await Booking.findById(bookingId)
        .populate(
            "customer",
            "customerCode shopName ownerName mobile email address area city district state pincode"
        )
        .populate("fromBranch", "name type status")
        .populate("toBranch", "name type status")
        .populate("createdBy", "name username")
        .populate("memo", "memoNumber status memoDate");

    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    // Branch scope check
    const fromBranchId = booking.fromBranch?._id?.toString() || booking.fromBranch?.toString();
    const toBranchId = booking.toBranch?._id?.toString() || booking.toBranch?.toString();
    const currentBranchId = branch._id.toString();

    if (fromBranchId !== currentBranchId && toBranchId !== currentBranchId) {
        throw new ApiError(403, "You do not have access to this booking");
    }

    return booking;
};

/**
 * Update Booking
 * - Only the origin BOOKING branch can update
 * - Cannot update if already assigned to a memo or cancelled
 */
export const updateBooking = async (bookingId, bookingData, branch) => {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    // 1. Branch ownership check
    const fromBranchId = booking.fromBranch?.toString();
    if (fromBranchId !== branch._id.toString()) {
        throw new ApiError(403, "You are not allowed to modify this booking");
    }

    // 2. Immutability / Memo check
    if (booking.memo) {
        throw new ApiError(
            400,
            "Booking cannot be modified because it is already assigned to a memo"
        );
    }

    // 3. Status check
    if (booking.status === "CANCELLED") {
        throw new ApiError(400, "Cancelled bookings cannot be modified");
    }

    // 4. If destination branch is being changed, validate it
    if (bookingData.toBranch) {
        const toBranch = await Branch.findById(bookingData.toBranch);
        if (!toBranch || toBranch.status !== "ACTIVE") {
            throw new ApiError(400, "Invalid or inactive destination branch");
        }
    }

    // 5. Prevent altering immutable security fields
    delete bookingData.fromBranch;
    delete bookingData.createdBy;
    delete bookingData.bookingNumber;
    delete bookingData.memo;

    // 6. Recalculate charges if provided
    const parcelCharge = bookingData.parcelCharge !== undefined
        ? Number(bookingData.parcelCharge)
        : booking.parcelCharge;

    const crossing = bookingData.crossing !== undefined
        ? Number(bookingData.crossing)
        : booking.crossing;

    const freight = bookingData.freight !== undefined
        ? Number(bookingData.freight)
        : booking.freight;

    const hamali = bookingData.hamali !== undefined
        ? Number(bookingData.hamali)
        : booking.hamali;

    const biltyCharge = bookingData.biltyCharge !== undefined
        ? Number(bookingData.biltyCharge)
        : booking.biltyCharge;

    const otherCharges = bookingData.otherCharges !== undefined
        ? Number(bookingData.otherCharges)
        : booking.otherCharges;

    const totalAmount =
        parcelCharge +
        crossing +
        freight +
        hamali +
        biltyCharge +
        otherCharges;

    const collectionType = bookingData.collectionType || booking.collectionType;

    const payment = calculatePaymentDetails(
        collectionType,
        totalAmount
    );

    booking.set({
        ...bookingData,
        totalAmount,
        ...payment,
    });

    await booking.save();

    return await Booking.findById(booking._id)
        .populate("customer", "customerCode shopName ownerName mobile email address area city district state pincode deliveryAddress")
        .populate("fromBranch", "name type status")
        .populate("toBranch", "name type status")
        .populate("createdBy", "name username");
};

/**
 * Cancel Booking
 * - Only the origin BOOKING branch can cancel
 * - Cannot cancel if already assigned to a memo or already cancelled
 */
export const cancelBooking = async (bookingId, branch) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const booking = await Booking.findById(bookingId).session(session);

        if (!booking) {
            throw new ApiError(404, "Booking not found");
        }

        // 1. Branch ownership check
        const fromBranchId = booking.fromBranch?.toString();
        if (fromBranchId !== branch._id.toString()) {
            throw new ApiError(403, "You are not allowed to cancel this booking");
        }

        // 2. Memo check
        if (booking.memo) {
            throw new ApiError(
                400,
                "Booking cannot be cancelled because it is already assigned to a memo"
            );
        }

        // 3. Status check
        if (booking.status === "CANCELLED") {
            throw new ApiError(400, "Booking is already cancelled");
        }

        booking.status = "CANCELLED";
        await booking.save({ session });

        // Reverse associated Payment transaction if any
        await Payment.updateMany(
            { booking: booking._id, status: "ACTIVE" },
            {
                $set: {
                    status: "REVERSED",
                    reversedAt: new Date(),
                    reversalReason: "Booking cancelled",
                },
            },
            { session }
        );

        await session.commitTransaction();
        return booking;
    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        throw error;
    } finally {
        await session.endSession();
    }
};

/**
 * Delete Booking
 * - Only the origin BOOKING branch can delete
 * - Allowed only if BOOKED or CANCELLED and not attached to a memo
 */
export const deleteBooking = async (bookingId, branch) => {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    // 1. Branch ownership check
    const fromBranchId = booking.fromBranch?.toString();
    if (fromBranchId !== branch._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this booking");
    }

    // 2. Memo check
    if (booking.memo) {
        throw new ApiError(
            400,
            "Booking cannot be deleted because it is assigned to a memo"
        );
    }

    // 3. Allow deletion only for BOOKED or CANCELLED bookings
    if (
        booking.status !== "BOOKED" &&
        booking.status !== "CANCELLED"
    ) {
        throw new ApiError(
            400,
            `Booking cannot be deleted because its current status is ${booking.status}`
        );
    }

    await Booking.findByIdAndDelete(bookingId);

    return booking;
};