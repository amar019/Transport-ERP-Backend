import mongoose from "mongoose";
import DeliveryBoyLedger from "./deliveryBoyLedger.model.js";
import DeliveryBoy from "../DeliveryBoy/deliveryBoy.model.js";
import PaymentTransaction from "../paymentTransactions/models/paymentTransaction.model.js";


export const getDeliveryBoyLedgerService = async ({
    deliveryBoyId,
    branchId,
}) => {
    const ledger = await DeliveryBoyLedger.find({
        deliveryBoy: deliveryBoyId,
        branch: branchId,
    })
        .populate("deliveryBoy", "name mobile")
        .populate(
            "booking",
            "bookingNumber bookingDate totalAmount"
        )
        .populate(
            "paymentTransaction",
            "amount type paymentMode transactionDate"
        )
        .sort({ createdAt: -1 });

    return ledger;
};

export const getDeliveryBoyLedgerBalanceService = async ({
    deliveryBoyId,
    branchId,
}) => {
    const latestLedger = await DeliveryBoyLedger.findOne({
        deliveryBoy: deliveryBoyId,
        branch: branchId,
    })
        .sort({ createdAt: -1 })
        .populate("deliveryBoy", "name mobile");

    return {
        deliveryBoy: latestLedger?.deliveryBoy || null,
        balance: Number(latestLedger?.balance || 0),
    };
};

/*payment settlement*/

export const settleDeliveryBoyLedgerService = async ({
    deliveryBoyId,
    branchId,
    amount,
    remarks,
    createdBy,
}) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // 1. Validate amount
        const settlementAmount = Number(amount);

        if (!Number.isFinite(settlementAmount) || settlementAmount <= 0) {
            throw new Error("Settlement amount must be greater than 0");
        }

        // 2. Check delivery boy belongs to this branch
        const deliveryBoy = await DeliveryBoy.findOne({
            _id: deliveryBoyId,
            branch: branchId,
        }).session(session);

        if (!deliveryBoy) {
            throw new Error("Delivery boy not found in this branch");
        }

        // 3. Get latest ledger entry
        const latestLedger = await DeliveryBoyLedger.findOne({
            deliveryBoy: deliveryBoyId,
            branch: branchId,
        })
            .sort({ createdAt: -1 })
            .session(session);

        const currentBalance = Number(latestLedger?.balance || 0);

        // 4. Cannot settle more than delivery boy owes
        if (settlementAmount > currentBalance) {
            throw new Error(
                `Settlement amount cannot exceed current balance of ₹${currentBalance}`
            );
        }

        // 5. Calculate new balance
        const newBalance = currentBalance - settlementAmount;

        // 6. Create settlement ledger entry
        // 1. Create central payment transaction
        const [paymentTransaction] =
            await PaymentTransaction.create(
                [
                    {
                        booking: null,
                        customer: null,
                        branch: branchId,
                        deliveryBoy: deliveryBoyId,
                        amount: settlementAmount,
                        type: "DELIVERY_BOY_SETTLEMENT",
                        collectedBy: null,
                        paymentMode: "CASH",
                        transactionDate: new Date(),
                        remarks:
                            remarks?.trim() ||
                            "Cash settlement received from delivery boy",
                        createdBy,
                    },
                ],
                { session }
            );

        // 2. Create delivery boy ledger entry linked to transaction
        const [settlementEntry] =
            await DeliveryBoyLedger.create(
                [
                    {
                        deliveryBoy: deliveryBoyId,
                        booking: null,
                        paymentTransaction:
                            paymentTransaction._id,
                        branch: branchId,
                        type: "SETTLEMENT",
                        debit: 0,
                        credit: settlementAmount,
                        balance: newBalance,
                        remarks:
                            remarks?.trim() ||
                            "Cash settlement received",
                        createdBy,
                    },
                ],
                { session }
            );

        await session.commitTransaction();

        return {
            paymentTransaction,
            settlement: settlementEntry,
            previousBalance: currentBalance,
            settledAmount: settlementAmount,
            remainingBalance: newBalance,
        };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }
};

export const getDeliveryBoyDailyReportService = async ({
    deliveryBoyId,
    branchId,
    date,
}) => {
    // Date validation
    if (!date) {
        throw new Error("Date is required");
    }

    const startDate = new Date(`${date}T00:00:00.000+05:30`);
    const endDate = new Date(`${date}T23:59:59.999+05:30`);

    if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime())
    ) {
        throw new Error("Invalid date");
    }

    // Verify delivery boy belongs to this branch
    const deliveryBoy = await DeliveryBoy.findOne({
        _id: deliveryBoyId,
        branch: branchId,
    }).select("name mobile status");

    if (!deliveryBoy) {
        throw new Error(
            "Delivery boy not found in this branch"
        );
    }

    // Get actual customer collections for the day
    const collections =
        await DeliveryBoyLedger.find({
            deliveryBoy: deliveryBoyId,
            branch: branchId,
            type: "CUSTOMER_COLLECTION",
            createdAt: {
                $gte: startDate,
                $lte: endDate,
            },
        })
            .populate(
                "booking",
                "bookingNumber bookingDate totalAmount freight deliveryAddress"
            )
            .populate({
                path: "paymentTransaction",
                select: "amount paymentMode transactionDate customer",
                populate: {
                    path: "customer",
                    select: "shopName",
                },
            })
            .sort({ createdAt: 1 });

    // Calculate totals
    const totalCollections = collections.length;

    const totalAmountCollected =
        collections.reduce(
            (total, entry) =>
                total + Number(entry.debit || 0),
            0
        );

    return {
        deliveryBoy,
        date,
        summary: {
            totalCollections,
            totalAmountCollected,
        },
        collections,
    };
};


export const getOutstandingCollectionsService = async ({
    deliveryBoyId,
    branchId,
}) => {
    const deliveryBoy = await DeliveryBoy.findOne({
        _id: deliveryBoyId,
        branch: branchId,
    }).select("name mobile status");

    if (!deliveryBoy) {
        throw new Error("Delivery boy not found in this branch");
    }

    const collections = await DeliveryBoyLedger.find({
        deliveryBoy: deliveryBoyId,
        branch: branchId,
        type: "CUSTOMER_COLLECTION",
    })
        .populate(
            "booking",
            "bookingNumber bookingDate totalAmount freight deliveryAddress"
        )
        .populate({
            path: "paymentTransaction",
            select: "amount paymentMode transactionDate customer",
            populate: {
                path: "customer",
                select: "shopName",
            },
        })
        .sort({ createdAt: -1 });

    const totalOutstanding = collections
        .filter((entry) => !entry.settlementTransaction)
        .reduce((total, entry) => total + Number(entry.debit || 0), 0);

    const formattedCollections = collections.map((entry) => {
        const doc = entry.toObject ? entry.toObject() : entry;
        return {
            ...doc,
            status: doc.settlementTransaction ? "PAID" : "UNPAID",
        };
    });

    return {
        deliveryBoy,
        totalOutstanding,
        collections: formattedCollections,
    };
};

export const settleSelectedDeliveryBoyLedgerService = async ({
    deliveryBoyId,
    branchId,
    ledgerIds,
    paymentMode = "CASH",
    remarks,
    createdBy,
}) => {
    // 1. Validate & Deduplicate ledger IDs
    const uniqueLedgerIds = [
        ...new Set((ledgerIds || []).map((id) => id?.toString())),
    ].filter(Boolean);

    if (uniqueLedgerIds.length === 0) {
        throw new Error("At least one collection entry must be selected");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 2. Verify delivery boy belongs to this branch
        const deliveryBoy = await DeliveryBoy.findOne({
            _id: deliveryBoyId,
            branch: branchId,
        }).session(session);

        if (!deliveryBoy) {
            throw new Error("Delivery boy not found in this branch");
        }

        // 3. Fetch selected pending collection entries
        const collections = await DeliveryBoyLedger.find({
            _id: { $in: uniqueLedgerIds },
            deliveryBoy: deliveryBoyId,
            branch: branchId,
            type: "CUSTOMER_COLLECTION",
            settlementTransaction: null,
        }).session(session);

        if (collections.length !== uniqueLedgerIds.length) {
            throw new Error(
                "One or more selected collections are invalid, do not belong to this delivery boy/branch, or have already been settled"
            );
        }

        // 4. Calculate total settlement amount
        const settlementAmount = collections.reduce(
            (total, entry) => total + Number(entry.debit || 0),
            0
        );

        if (settlementAmount <= 0) {
            throw new Error("Settlement amount must be greater than 0");
        }

        // 5. Get current balance
        const latestLedger = await DeliveryBoyLedger.findOne({
            deliveryBoy: deliveryBoyId,
            branch: branchId,
        })
            .sort({ createdAt: -1 })
            .session(session);

        const currentBalance = Number(latestLedger?.balance || 0);

        if (settlementAmount > currentBalance) {
            throw new Error(
                `Settlement amount (₹${settlementAmount}) cannot exceed current balance of ₹${currentBalance}`
            );
        }

        const newBalance = currentBalance - settlementAmount;

        // 6. Create PaymentTransaction for SETTLEMENT
        const [paymentTransaction] = await PaymentTransaction.create(
            [
                {
                    booking: null,
                    customer: null,
                    branch: branchId,
                    deliveryBoy: deliveryBoyId,
                    amount: settlementAmount,
                    type: "DELIVERY_BOY_SETTLEMENT",
                    collectedBy: null,
                    paymentMode: paymentMode || "CASH",
                    transactionDate: new Date(),
                    remarks:
                        remarks?.trim() ||
                        `Bill-wise cash settlement for ${collections.length} selected collections`,
                    createdBy,
                },
            ],
            { session }
        );

        // 7. Create DeliveryBoyLedger SETTLEMENT entry
        const [settlementEntry] = await DeliveryBoyLedger.create(
            [
                {
                    deliveryBoy: deliveryBoyId,
                    booking: null,
                    paymentTransaction: paymentTransaction._id,
                    branch: branchId,
                    type: "SETTLEMENT",
                    debit: 0,
                    credit: settlementAmount,
                    balance: newBalance,
                    remarks:
                        remarks?.trim() ||
                        `Bill-wise cash settlement for ${collections.length} collections`,
                    createdBy,
                },
            ],
            { session }
        );

        // 8. Link settlementTransaction to all selected collection entries
        const updateResult = await DeliveryBoyLedger.updateMany(
            {
                _id: { $in: uniqueLedgerIds },
                deliveryBoy: deliveryBoyId,
                branch: branchId,
                type: "CUSTOMER_COLLECTION",
                settlementTransaction: null,
            },
            {
                $set: {
                    settlementTransaction: paymentTransaction._id,
                },
            },
            { session }
        );

        console.log("Settlement ledger IDs:", uniqueLedgerIds);
        console.log("Collections found:", collections.length);
        console.log("Settlement transaction:", paymentTransaction._id);
        console.log("Settlement update result:", updateResult);

        const matchedCount = updateResult.matchedCount ?? updateResult.nMatched ?? 0;
        const modifiedCount = updateResult.modifiedCount ?? updateResult.nModified ?? 0;

        if (
            matchedCount !== uniqueLedgerIds.length ||
            modifiedCount !== uniqueLedgerIds.length
        ) {
            throw new Error(
                `Failed to update settlementTransaction for all selected collections. Matched: ${matchedCount}, Modified: ${modifiedCount}, Expected: ${uniqueLedgerIds.length}`
            );
        }

        await session.commitTransaction();

        return {
            paymentTransaction,
            settlement: settlementEntry,
            previousBalance: currentBalance,
            settledAmount: settlementAmount,
            remainingBalance: newBalance,
            settledCount: collections.length,
        };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }
};