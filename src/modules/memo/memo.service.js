import mongoose from "mongoose"


import Memo from "./memo.model.js";
import Booking from "../Booking/booking.model.js";

import ApiError from "../../utils/ApiErrors.js";

/**
 * Create Memo
 */
const createMemoService = async (memoData) => {

    const session = await mongoose.startSession();

    try {

        session.startTransaction();

        const {
            from,
            to,
            bookings,
            notes,
        } = memoData;

        // Validate bookings
        if (!bookings || bookings.length === 0) {
            throw new ApiError(400, "Please select at least one booking.");
        }

        // Fetch booking documents
        const bookingDocs = await Booking.find({
            _id: { $in: bookings }
        }).session(session);

        // Validate all bookings exist
        if (bookingDocs.length !== bookings.length) {
            throw new ApiError(404, "One or more bookings not found.");
        }

        // Validate bookings
        for (const booking of bookingDocs) {

            if (booking.status !== "BOOKED") {
                throw new ApiError(
                    400,
                    `Booking ${booking.bookingNumber} is not eligible for memo.`
                );
            }

            if (booking.memo) {
                throw new ApiError(
                    400,
                    `Booking ${booking.bookingNumber} is already assigned to another memo.`
                );
            }
        }

        // Calculate collection amount (Only TO_PAY)
        let totalAmount = 0;

        bookingDocs.forEach((booking) => {
            if (booking.collectionType === "TO_PAY") {
                totalAmount += booking.remainingAmount;
            }
        });

        // Generate Memo Number
        const lastMemo = await Memo.findOne()
            .sort({ createdAt: -1 })
            .session(session);

        let memoNumber = "MEM-0001";

        if (lastMemo) {
            const lastNumber = parseInt(
                lastMemo.memoNumber.split("-")[1],
                10
            );

            memoNumber = `MEM-${String(lastNumber + 1).padStart(4, "0")}`;
        }

        // Create Memo
        const [memo] = await Memo.create(
            [{
                memoNumber,
                from,
                to,
                bookings,
                totalAmount,
                pendingAmount: totalAmount,
                receivedAmount: 0,
                notes,
            }],
            { session }
        );

        // Update bookings with memo reference
        await Booking.updateMany(
            {
                _id: {
                    $in: bookings,
                },
            },
            {
                $set: {
                    memo: memo._id,
                },
            },
            {
                session,
            }
        );

        await session.commitTransaction();

        return memo;

    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        throw error;
    } finally {
        await session.endSession();

    }
};





//getAllMemos
const getAllMemosService = async () => {

    const memos = await Memo.find()
        .sort({ createdAt: -1 })
        .lean();

    return memos.map((memo) => ({
        _id: memo._id,
        memoNumber: memo.memoNumber,
        memoDate: memo.memoDate,
        from: memo.from,
        to: memo.to,
        totalAmount: memo.totalAmount,
        collectionStatus: memo.collectionStatus,
        status: memo.status,
        bookingsCount: memo.bookings.length,
    }));
}

/**
 * Get Memo By Id
 */
const getMemoByIdService = async (memoId) => {

    const memo = await Memo.findById(memoId)
        .populate({
            path: "bookings",
            select: `
                bookingNumber
                customer
                itemName
                quantity
                totalAmount
                collectionType
                paymentStatus
                remainingAmount
            `,
            populate: {
                path: "customer",
                select: `
                    shopName
                    mobile
                    city
                `,
            },
        });

    if (!memo) {
        throw new ApiError(
            404,
            "Memo not found."
        );
    }

    return memo;
};



const updateMemoService = async (memoId, memoData) => {

    const session = await mongoose.startSession();

    try {

        session.startTransaction();

        const memo = await Memo.findById(memoId).session(session);

        if (!memo) {
            throw new ApiError(
                404,
                "Memo not found."
            );
        }

        // Only editable before dispatch
        if (memo.status !== "CREATED") {
            throw new ApiError(
                400,
                "Only created memos can be updated."
            );
        }

        const {
            from,
            to,
            bookings,
            notes,
        } = memoData;

        // At least one booking required
        if (!bookings || bookings.length === 0) {
            throw new ApiError(
                400,
                "Please select at least one booking."
            );
        }

        // Prevent duplicate bookings
        const uniqueBookings = [...new Set(bookings)];

        if (uniqueBookings.length !== bookings.length) {
            throw new ApiError(
                400,
                "Duplicate bookings are not allowed."
            );
        }

        // Current memo bookings
        const oldBookings = memo.bookings.map(id => id.toString());

        // Updated bookings
        const newBookings = bookings.map(id => id.toString());

        // Find newly added bookings
        const addedBookings = newBookings.filter(
            id => !oldBookings.includes(id)
        );

        // Find removed bookings
        const removedBookings = oldBookings.filter(
            id => !newBookings.includes(id)
        );

        /**
         * Validate Added Bookings
         */
        const addedBookingDocs = await Booking.find({
            _id: {
                $in: addedBookings,
            },
        }).session(session);

        if (addedBookingDocs.length !== addedBookings.length) {
            throw new ApiError(
                404,
                "One or more bookings not found."
            );
        }

        for (const booking of addedBookingDocs) {

            if (booking.status !== "BOOKED") {
                throw new ApiError(
                    400,
                    `Booking ${booking.bookingNumber} is not eligible for memo.`
                );
            }

            if (booking.memo) {
                throw new ApiError(
                    400,
                    `Booking ${booking.bookingNumber} is already assigned to another memo.`
                );
            }

        }

        /**
         * Remove memo reference
         */
        if (removedBookings.length > 0) {

            await Booking.updateMany(
                {
                    _id: {
                        $in: removedBookings,
                    },
                },
                {
                    $set: {
                        memo: null,
                    },
                },
                {
                    session,
                }
            );

        }

        /**
         * Assign memo reference
         */
        if (addedBookings.length > 0) {

            await Booking.updateMany(
                {
                    _id: {
                        $in: addedBookings,
                    },
                },
                {
                    $set: {
                        memo: memo._id,
                    },
                },
                {
                    session,
                }
            );

        }

        /**
         * Recalculate Collection Amount
         */
        const bookingDocs = await Booking.find({
            _id: {
                $in: bookings,
            },
        })
            .select("collectionType remainingAmount")
            .session(session);

        if (bookingDocs.length !== bookings.length) {
            throw new ApiError(
                404,
                "One or more bookings not found."
            );
        }

        const totalAmount = bookingDocs.reduce(
            (total, booking) => {

                if (booking.collectionType === "TO_PAY") {
                    total += booking.remainingAmount;
                }

                return total;

            },
            0
        );

        /**
         * Update Memo
         */
        if (from !== undefined) memo.from = from;
        if (to !== undefined) memo.to = to;
        if (notes !== undefined) memo.notes = notes;

        memo.bookings = bookings;

        memo.totalAmount = totalAmount;

        memo.pendingAmount = Math.max(
            totalAmount - memo.receivedAmount,
            0
        );

        await memo.save({ session });

        await session.commitTransaction();

        return memo;

    } catch (error) {

        await session.abortTransaction();
        throw error;

    } finally {

        await session.endSession();

    }

};


/**
 * Delete Memo
 */
const deleteMemoService = async (memoId) => {

    const session = await mongoose.startSession();

    try {

        session.startTransaction();

        // Find Memo
        const memo = await Memo.findById(memoId)
            .session(session);

        if (!memo) {
            throw new ApiError(
                404,
                "Memo not found."
            );
        }

        // Only CREATED memos can be deleted
        if (memo.status !== "CREATED") {
            throw new ApiError(
                400,
                "Only created memos can be deleted."
            );
        }

        // Remove memo reference from bookings
        await Booking.updateMany(
            {
                _id: {
                    $in: memo.bookings,
                },
            },
            {
                $set: {
                    memo: null,
                },
            },
            {
                session,
            }
        );

        // Delete memo
        await memo.deleteOne({
            session,
        });

        await session.commitTransaction();

    } catch (error) {

        await session.abortTransaction();
        throw error;

    } finally {

        await session.endSession();

    }

};



/**
 * Mark Memo On Route
 */
const markMemoOnRouteService = async (memoId) => {

    // Find Memo
    const memo = await Memo.findById(memoId);

    if (!memo) {
        throw new ApiError(
            404,
            "Memo not found."
        );
    }

    // Only CREATED memos can be dispatched
    if (memo.status !== "CREATED") {
        throw new ApiError(
            400,
            "Only created memos can be marked as On Route."
        );
    }

    // Update status
    memo.status = "ON_ROUTE";
    memo.dispatchedAt = new Date();

    await memo.save();

    return memo;
};


/**
 * Mark Memo Received
 */
const markMemoReceivedService = async (memoId) => {

    // Find Memo
    const memo = await Memo.findById(memoId);

    if (!memo) {
        throw new ApiError(
            404,
            "Memo not found."
        );
    }

    // Only ON_ROUTE memos can be received
    if (memo.status !== "ON_ROUTE") {
        throw new ApiError(
            400,
            "Only On Route memos can be marked as Received."
        );
    }

    // Update status
    memo.status = "RECEIVED";
    memo.receivedAt = new Date();

    await memo.save();

    return memo;
};


const updateMemoCollectionService = async (
    memoId,
    amountReceived
) => {

    const memo = await Memo.findById(memoId);

    if (!memo) {
        throw new ApiError(
            404,
            "Memo not found."
        );
    }

    // Cannot collect on draft memo
    if (memo.status === "CREATED") {
        throw new ApiError(
            400,
            "Dispatch the memo before updating collection."
        );
    }

    amountReceived = Number(amountReceived);

    if (
        isNaN(amountReceived) ||
        amountReceived <= 0
    ) {
        throw new ApiError(
            400,
            "Please enter a valid received amount."
        );
    }

    // Prevent over collection
    if (
        memo.receivedAmount + amountReceived >
        memo.totalAmount
    ) {
        throw new ApiError(
            400,
            "Received amount cannot exceed total memo amount."
        );
    }

    // Update collection
    memo.receivedAmount += amountReceived;

    memo.pendingAmount =
        memo.totalAmount -
        memo.receivedAmount;

    // Update collection status
    if (memo.pendingAmount === 0) {
        memo.collectionStatus = "COMPLETED";
    } else {
        memo.collectionStatus = "PARTIAL";
    }

    await memo.save();

    return memo;
};


export {
    createMemoService,
    getAllMemosService,
    getMemoByIdService,
    updateMemoService,
    deleteMemoService,
    markMemoOnRouteService,
    markMemoReceivedService,
    updateMemoCollectionService

};