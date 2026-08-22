import mongoose from "mongoose";

import Memo from "./memo.model.js";
import Booking from "../Booking/booking.model.js";
import Branch from "../Branch/branch.model.js";
import ApiError from "../../utils/ApiErrors.js";

/**
 * Generate next Memo Number
 * Example: MEM-0001, MEM-0002
 */
const generateMemoNumber = async (session) => {
    const query = Memo.findOne().sort({ createdAt: -1 }).select("memoNumber");
    if (session) query.session(session);

    const lastMemo = await query;

    if (!lastMemo || !lastMemo.memoNumber) {
        return "MEM-0001";
    }

    const parts = lastMemo.memoNumber.split("-");
    const lastNumber = parseInt(parts[1], 10);
    const nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;

    return `MEM-${String(nextNumber).padStart(4, "0")}`;
};

/**
 * Create Memo (Draft)
 * Role: BOOKING branch only
 * Enforces:
 * - fromBranch = current user's branch
 * - toBranch = valid active destination branch
 * - All selected bookings belong to fromBranch AND toBranch
 * - All selected bookings are in BOOKED status and not yet assigned to any memo
 */
const createMemoService = async (memoData, branch, user) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const { toBranch: toBranchId, bookings, notes } = memoData;

        // 1. Validate destination branch exists and is active
        const toBranch = await Branch.findById(toBranchId).session(session);
        if (!toBranch) {
            throw new ApiError(404, "Destination branch not found.");
        }

        if (toBranch.status !== "ACTIVE") {
            throw new ApiError(400, "Destination branch is inactive.");
        }

        if (toBranch._id.toString() === branch._id.toString()) {
            throw new ApiError(400, "Origin and destination branch cannot be the same.");
        }

        // 2. Validate bookings
        if (!bookings || bookings.length === 0) {
            throw new ApiError(400, "Please select at least one booking.");
        }

        // Prevent duplicate bookings in request
        const uniqueBookings = [...new Set(bookings)];
        if (uniqueBookings.length !== bookings.length) {
            throw new ApiError(400, "Duplicate bookings are not allowed in the same memo.");
        }

        // Fetch booking documents
        const bookingDocs = await Booking.find({
            _id: { $in: bookings },
        }).session(session);

        if (bookingDocs.length !== bookings.length) {
            throw new ApiError(404, "One or more selected bookings were not found.");
        }

        // Validate each booking's status and route consistency
        for (const booking of bookingDocs) {
            if (booking.status !== "BOOKED") {
                throw new ApiError(
                    400,
                    `Booking ${booking.bookingNumber} is not eligible for memo (current status: ${booking.status}).`
                );
            }

            if (booking.memo) {
                throw new ApiError(
                    400,
                    `Booking ${booking.bookingNumber} is already assigned to another memo.`
                );
            }

            const bookingFromBranch = booking.fromBranch?.toString();
            const bookingToBranch = booking.toBranch?.toString();

            if (bookingFromBranch !== branch._id.toString()) {
                throw new ApiError(
                    400,
                    `Booking ${booking.bookingNumber} belongs to a different origin branch.`
                );
            }

            if (bookingToBranch !== toBranch._id.toString()) {
                throw new ApiError(
                    400,
                    `Booking ${booking.bookingNumber} destination branch does not match the memo destination branch.`
                );
            }
        }

        // 3. Calculate collection amount (Only TO_PAY bookings)
        let totalAmount = 0;
        bookingDocs.forEach((booking) => {
            if (booking.collectionType === "TO_PAY") {
                totalAmount += Number(booking.remainingAmount || 0);
            }
        });

        // 4. Generate Memo Number
        const memoNumber = await generateMemoNumber(session);

        // 5. Create Memo
        const [memo] = await Memo.create(
            [
                {
                    memoNumber,
                    fromBranch: branch._id,
                    toBranch: toBranch._id,
                    createdBy: user._id || user.id,
                    bookings,
                    totalAmount,
                    pendingAmount: totalAmount,
                    receivedAmount: 0,
                    collectionStatus: "PENDING",
                    status: "CREATED",
                    notes,
                },
            ],
            { session }
        );

        // 6. Update bookings with memo reference
        await Booking.updateMany(
            { _id: { $in: bookings } },
            { $set: { memo: memo._id } },
            { session }
        );

        await session.commitTransaction();

        return await Memo.findById(memo._id)
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
 * Get All Memos (Role- and Branch-scoped)
 * - BOOKING branch: returns memos where fromBranch = branch._id
 * - DELIVERY branch: returns memos where toBranch = branch._id
 */
const getAllMemosService = async (branch, queryParams = {}) => {
    const filter = {};

    if (branch.type === "BOOKING") {
        filter.fromBranch = branch._id;
    } else if (branch.type === "DELIVERY") {
        filter.toBranch = branch._id;
    }

    if (queryParams.status) {
        filter.status = queryParams.status;
    }

    if (queryParams.collectionStatus) {
        filter.collectionStatus = queryParams.collectionStatus;
    }

    if (queryParams.search) {
        filter.memoNumber = { $regex: queryParams.search, $options: "i" };
    }

    const memos = await Memo.find(filter)
        .populate("fromBranch", "name type status")
        .populate("toBranch", "name type status")
        .populate("createdBy", "name username")
        .populate("receivedBy", "name username")
        .populate({
            path: "bookings",
            select: "quantity totalAmount collectionType remainingAmount",
        })
        .sort({ createdAt: -1 })
        .lean();

    return memos.map((memo) => {
        const bookings = Array.isArray(memo.bookings) ? memo.bookings : [];
        const totalPackages = bookings.reduce((sum, b) => sum + Number(b.quantity || 1), 0);
        const bookingsCount = bookings.length;

        // Calculate Gross Total (All bilties), To-Pay Total, and Paid Total
        let totalMoney = 0;
        let totalToPay = 0;
        let totalPaid = 0;

        bookings.forEach((b) => {
            const bAmount = Number(b.totalAmount || 0);
            totalMoney += bAmount;
            if (b.collectionType === "TO_PAY") {
                totalToPay += Number(b.remainingAmount !== undefined ? b.remainingAmount : bAmount);
            } else if (b.collectionType === "PAID_AT_BOOKING") {
                totalPaid += bAmount;
            }
        });

        // If totalMoney was not calculated from populated bookings, fallback to memo.totalAmount
        if (totalMoney === 0 && memo.totalAmount) {
            totalToPay = Number(memo.totalAmount || 0);
            totalMoney = totalToPay;
        }

        return {
            _id: memo._id,
            memoNumber: memo.memoNumber,
            memoDate: memo.memoDate,
            date: memo.memoDate,
            fromBranch: memo.fromBranch,
            toBranch: memo.toBranch,
            createdBy: memo.createdBy,
            receivedBy: memo.receivedBy,
            totalMoney, // एकूण (Gross Total)
            totalPaid, // Paid at booking
            totalToPay: totalToPay || memo.totalAmount || 0, // एकूण TO_PAY येणे रक्कम
            totalAmount: memo.totalAmount || totalToPay,
            receivedAmount: memo.receivedAmount || 0,
            totalCollected: memo.receivedAmount || 0,
            pendingAmount: memo.pendingAmount !== undefined ? memo.pendingAmount : (totalToPay - (memo.receivedAmount || 0)),
            collectionStatus: memo.collectionStatus,
            status: memo.status,
            dispatchedAt: memo.dispatchedAt,
            receivedAt: memo.receivedAt,
            bookingsCount,
            totalBookings: bookingsCount,
            totalPackages,
            notes: memo.notes,
            createdAt: memo.createdAt,
        };
    });
};

/**
 * Get Memo By ID
 * - Validates that the memo is in scope for the user's branch
 */
const getMemoByIdService = async (memoId, branch) => {
    const memo = await Memo.findById(memoId)
        .populate("fromBranch", "name type status")
        .populate("toBranch", "name type status")
        .populate("createdBy", "name username")
        .populate("receivedBy", "name username")
        .populate({
            path: "bookings",
            select: `
                bookingNumber
                bookingDate
                customer
                sender
                itemName
                quantity
                totalAmount
                freight
                crossing
                hamali
                biltyCharge
                otherCharges
                collectionType
                paymentStatus
                paidAmount
                remainingAmount
                fromBranch
                toBranch
            `,
            populate: {
                path: "customer",
                select: "customerCode shopName ownerName mobile city area address deliveryAddress",
            },
        });

    if (!memo) {
        throw new ApiError(404, "Memo not found.");
    }

    // Branch scope check
    const fromBranchId = memo.fromBranch?._id?.toString() || memo.fromBranch?.toString();
    const toBranchId = memo.toBranch?._id?.toString() || memo.toBranch?.toString();
    const currentBranchId = branch._id.toString();

    if (fromBranchId !== currentBranchId && toBranchId !== currentBranchId) {
        throw new ApiError(403, "You do not have access to this memo.");
    }

    return memo;
};

/**
 * Update Draft Memo
 * - Only origin BOOKING branch can update
 * - Only CREATED memos can be updated
 */
const updateMemoService = async (memoId, memoData, branch) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const memo = await Memo.findById(memoId).session(session);

        if (!memo) {
            throw new ApiError(404, "Memo not found.");
        }

        // 1. Branch ownership check
        if (memo.fromBranch.toString() !== branch._id.toString()) {
            throw new ApiError(403, "You are not allowed to modify this memo.");
        }

        // 2. Status check
        if (memo.status !== "CREATED") {
            throw new ApiError(400, "Only created (draft) memos can be updated.");
        }

        const { toBranch: toBranchId, bookings, notes } = memoData;

        // 3. If destination branch is being changed, validate it
        let targetToBranchId = memo.toBranch;
        if (toBranchId) {
            const toBranch = await Branch.findById(toBranchId).session(session);
            if (!toBranch || toBranch.status !== "ACTIVE") {
                throw new ApiError(400, "Invalid or inactive destination branch.");
            }
            if (toBranch._id.toString() === branch._id.toString()) {
                throw new ApiError(400, "Origin and destination branch cannot be the same.");
            }
            targetToBranchId = toBranch._id;
            memo.toBranch = targetToBranchId;
        }

        // 4. Update bookings if provided
        if (bookings) {
            if (!Array.isArray(bookings) || bookings.length === 0) {
                throw new ApiError(400, "Please select at least one booking.");
            }

            const uniqueBookings = [...new Set(bookings)];
            if (uniqueBookings.length !== bookings.length) {
                throw new ApiError(400, "Duplicate bookings are not allowed.");
            }

            const oldBookings = memo.bookings.map((id) => id.toString());
            const newBookings = uniqueBookings.map((id) => id.toString());

            const addedBookings = newBookings.filter((id) => !oldBookings.includes(id));
            const removedBookings = oldBookings.filter((id) => !newBookings.includes(id));

            // Validate added bookings
            if (addedBookings.length > 0) {
                const addedBookingDocs = await Booking.find({
                    _id: { $in: addedBookings },
                }).session(session);

                if (addedBookingDocs.length !== addedBookings.length) {
                    throw new ApiError(404, "One or more added bookings were not found.");
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

                    if (booking.fromBranch?.toString() !== branch._id.toString()) {
                        throw new ApiError(
                            400,
                            `Booking ${booking.bookingNumber} belongs to a different origin branch.`
                        );
                    }

                    if (booking.toBranch?.toString() !== targetToBranchId.toString()) {
                        throw new ApiError(
                            400,
                            `Booking ${booking.bookingNumber} destination does not match memo destination.`
                        );
                    }
                }
            }

            // Remove memo reference from removed bookings
            if (removedBookings.length > 0) {
                await Booking.updateMany(
                    { _id: { $in: removedBookings } },
                    { $set: { memo: null } },
                    { session }
                );
            }

            // Assign memo reference to added bookings
            if (addedBookings.length > 0) {
                await Booking.updateMany(
                    { _id: { $in: addedBookings } },
                    { $set: { memo: memo._id } },
                    { session }
                );
            }

            // Recalculate collection amount for all current bookings
            const allBookingDocs = await Booking.find({
                _id: { $in: newBookings },
            })
                .select("collectionType remainingAmount")
                .session(session);

            const totalAmount = allBookingDocs.reduce((total, booking) => {
                if (booking.collectionType === "TO_PAY") {
                    total += Number(booking.remainingAmount || 0);
                }
                return total;
            }, 0);

            memo.bookings = newBookings;
            memo.totalAmount = totalAmount;
            memo.pendingAmount = Math.max(totalAmount - memo.receivedAmount, 0);
        }

        if (notes !== undefined) memo.notes = notes;

        await memo.save({ session });
        await session.commitTransaction();

        return await Memo.findById(memo._id)
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
 * Delete Draft Memo
 * - Only origin BOOKING branch can delete
 * - Only CREATED memos can be deleted
 */
const deleteMemoService = async (memoId, branch) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const memo = await Memo.findById(memoId).session(session);

        if (!memo) {
            throw new ApiError(404, "Memo not found.");
        }

        // 1. Branch ownership check
        if (memo.fromBranch.toString() !== branch._id.toString()) {
            throw new ApiError(403, "You are not allowed to delete this memo.");
        }

        // 2. Status check
        if (memo.status !== "CREATED") {
            throw new ApiError(400, "Only created (draft) memos can be deleted.");
        }

        // 3. Remove memo reference from bookings
        await Booking.updateMany(
            { _id: { $in: memo.bookings } },
            { $set: { memo: null } },
            { session }
        );

        // 4. Delete memo
        await memo.deleteOne({ session });

        await session.commitTransaction();
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
 * Mark Memo On Route / Dispatched
 * - Only origin BOOKING branch can dispatch
 * - Only CREATED memos can be dispatched
 */
const markMemoOnRouteService = async (memoId, branch) => {
    const memo = await Memo.findById(memoId);

    if (!memo) {
        throw new ApiError(404, "Memo not found.");
    }

    // Branch ownership check
    if (memo.fromBranch.toString() !== branch._id.toString()) {
        throw new ApiError(403, "You are not allowed to dispatch this memo.");
    }

    // Status check
    if (memo.status !== "CREATED") {
        throw new ApiError(400, "Only created memos can be marked as On Route.");
    }

    memo.status = "ON_ROUTE";
    memo.dispatchedAt = new Date();

    await memo.save();

    return await Memo.findById(memo._id)
        .populate("fromBranch", "name type status")
        .populate("toBranch", "name type status")
        .populate("createdBy", "name username");
};

/**
 * Mark Memo Received
 * - Only destination DELIVERY branch can mark received
 * - Only ON_ROUTE memos can be received
 */
const markMemoReceivedService = async (memoId, branch, user) => {
    const memo = await Memo.findById(memoId);

    if (!memo) {
        throw new ApiError(404, "Memo not found.");
    }

    // Destination branch check
    if (memo.toBranch.toString() !== branch._id.toString()) {
        throw new ApiError(403, "Only the destination delivery branch can mark this memo as received.");
    }

    // Status check
    if (memo.status !== "ON_ROUTE") {
        throw new ApiError(400, "Only On Route memos can be marked as Received.");
    }

    memo.status = "RECEIVED";
    memo.receivedAt = new Date();
    memo.receivedBy = user._id || user.id;

    await memo.save();

    return await Memo.findById(memo._id)
        .populate("fromBranch", "name type status")
        .populate("toBranch", "name type status")
        .populate("createdBy", "name username")
        .populate("receivedBy", "name username");
};

/**
 * Record Memo Collection / Settlement
 * - Only origin BOOKING branch records payment received from delivery branch
 * - Memo must be dispatched or received (status !== "CREATED")
 */
const updateMemoCollectionService = async (memoId, amountReceived, branch) => {
    const memo = await Memo.findById(memoId);

    if (!memo) {
        throw new ApiError(404, "Memo not found.");
    }

    // Origin branch check
    if (memo.fromBranch.toString() !== branch._id.toString()) {
        throw new ApiError(
            403,
            "Only the origin booking branch can record memo collection / settlement."
        );
    }

    // Cannot collect on un-dispatched draft memo
    if (memo.status === "CREATED") {
        throw new ApiError(400, "Dispatch the memo before recording collection settlement.");
    }

    amountReceived = Number(amountReceived);

    if (isNaN(amountReceived) || amountReceived <= 0) {
        throw new ApiError(400, "Please enter a valid received amount.");
    }

    // Prevent over-collection
    if (memo.receivedAmount + amountReceived > memo.totalAmount) {
        throw new ApiError(
            400,
            `Received amount (${amountReceived}) exceeds pending memo amount (${memo.pendingAmount}).`
        );
    }

    // Update collection
    memo.receivedAmount += amountReceived;
    memo.pendingAmount = memo.totalAmount - memo.receivedAmount;

    // Update collection status
    if (memo.pendingAmount === 0) {
        memo.collectionStatus = "COMPLETED";
    } else {
        memo.collectionStatus = "PARTIAL";
    }

    await memo.save();

    return await Memo.findById(memo._id)
        .populate("fromBranch", "name type status")
        .populate("toBranch", "name type status")
        .populate("createdBy", "name username")
        .populate("receivedBy", "name username");
};

export {
    createMemoService,
    getAllMemosService,
    getMemoByIdService,
    updateMemoService,
    deleteMemoService,
    markMemoOnRouteService,
    markMemoReceivedService,
    updateMemoCollectionService,
};