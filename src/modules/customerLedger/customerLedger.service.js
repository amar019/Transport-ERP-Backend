import mongoose from "mongoose";
import CustomerLedger from "./customerLedger.model.js";
import Customer from "../customer/cutomer.model.js";
import Booking from "../Booking/booking.model.js";
import PaymentTransaction from "../paymentTransactions/models/paymentTransaction.model.js";

export const getCustomerLedgerService = async ({
    customerId,
    branchId,
}) => {
    const ledger = await CustomerLedger.find({
        customer: customerId,
        branch: branchId,
    })
        .populate("customer", "name mobile shopName ownerName")
        .populate("booking", "bookingNumber bookingDate totalAmount")
        .populate("transaction", "amount type paymentMode transactionDate")
        .sort({ createdAt: -1 });

    return ledger;
};

export const getCustomerLedgerBalanceService = async ({
    customerId,
    branchId,
}) => {
    const latestLedger = await CustomerLedger.findOne({
        customer: customerId,
        branch: branchId,
    })
        .sort({ createdAt: -1 })
        .populate("customer", "name mobile shopName ownerName");

    return {
        customer: latestLedger?.customer || null,
        balance: Number(latestLedger?.balance || 0),
    };
};

/**
 * Fetch outstanding TO_PAY bookings for a specific customer in the current destination branch
 */
export const getCustomerOutstandingBookingsService = async ({
    customerId,
    branchId,
}) => {
    const customer = await Customer.findById(customerId).select(
        "shopName ownerName mobile customerCode"
    );

    if (!customer) {
        throw new Error("Customer not found");
    }

    const bookings = await Booking.find({
        customer: customerId,
        toBranch: branchId,
        status: "BOOKED",
        collectionType: "TO_PAY",
        remainingAmount: { $gt: 0 },
    })
        .select(
            "bookingNumber bookingDate totalAmount paidAmount remainingAmount paymentStatus collectionType status delivery"
        )
        .sort({ createdAt: 1 });

    const totalOutstanding = bookings.reduce(
        (sum, b) => sum + Number(b.remainingAmount || 0),
        0
    );

    return {
        customer: {
            _id: customer._id,
            shopName: customer.shopName,
            ownerName: customer.ownerName,
            mobile: customer.mobile,
            customerCode: customer.customerCode,
        },
        totalOutstanding,
        bookings,
    };
};

/**
 * Collect payment for customer outstanding bookings (Branch Owner collection)
 * Uses MongoDB session transaction to process each booking atomically
 */
export const collectCustomerOutstandingPaymentService = async ({
    customerId,
    branchId,
    payments,
    paymentMode = "CASH",
    remarks = "",
    createdBy,
}) => {
    if (!Array.isArray(payments) || payments.length === 0) {
        throw new Error("Payments array must contain at least one booking payment");
    }

    const validModes = ["CASH", "UPI", "BANK_TRANSFER", "OTHER"];
    if (!validModes.includes(paymentMode)) {
        throw new Error(`Invalid payment mode. Must be one of: ${validModes.join(", ")}`);
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const customer = await Customer.findById(customerId).session(session);
        if (!customer) {
            throw new Error("Customer not found");
        }

        const processedPayments = [];

        for (const item of payments) {
            const { bookingId, amount } = item;
            const paymentAmount = Number(amount);

            if (!bookingId) {
                throw new Error("bookingId is required for each payment entry");
            }

            if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
                throw new Error("Payment amount must be greater than 0");
            }

            const booking = await Booking.findOne({
                _id: bookingId,
                toBranch: branchId,
                customer: customerId,
            }).session(session);

            if (!booking) {
                throw new Error("Booking not found in this branch for this customer");
            }

            if (booking.status !== "BOOKED") {
                throw new Error(`Payment cannot be collected for cancelled booking ${booking.bookingNumber}`);
            }

            if (booking.collectionType !== "TO_PAY") {
                throw new Error(`Payment collection is allowed only for TO_PAY bookings (${booking.bookingNumber})`);
            }

            const currentPaidAmount = Number(booking.paidAmount || 0);
            const totalAmount = Number(booking.totalAmount || 0);
            const currentRemainingAmount = Number(
                booking.remainingAmount ?? (totalAmount - currentPaidAmount)
            );

            if (currentRemainingAmount <= 0) {
                throw new Error(`No payment is remaining for booking ${booking.bookingNumber}`);
            }

            if (paymentAmount > currentRemainingAmount) {
                throw new Error(
                    `Payment amount ₹${paymentAmount} cannot exceed remaining amount of ₹${currentRemainingAmount} for booking ${booking.bookingNumber}`
                );
            }

            const newPaidAmount = currentPaidAmount + paymentAmount;
            const newRemainingAmount = currentRemainingAmount - paymentAmount;
            const newPaymentStatus = newRemainingAmount === 0 ? "PAID" : "PARTIAL";

            booking.paidAmount = newPaidAmount;
            booking.remainingAmount = newRemainingAmount;
            booking.paymentStatus = newPaymentStatus;

            await booking.save({ session });

            const [paymentTransaction] = await PaymentTransaction.create(
                [
                    {
                        booking: booking._id,
                        customer: customerId,
                        branch: branchId,
                        deliveryBoy: null,
                        amount: paymentAmount,
                        type: "CUSTOMER_COLLECTION",
                        collectedBy: "BRANCH_OWNER",
                        paymentMode,
                        transactionDate: new Date(),
                        remarks: remarks?.trim() || `Payment received for ${booking.bookingNumber}`,
                        createdBy,
                    },
                ],
                { session }
            );

            const previousCustomerLedger = await CustomerLedger.findOne({
                customer: customerId,
                branch: branchId,
            })
                .sort({ createdAt: -1 })
                .session(session);

            const previousCustomerBalance = Number(
                previousCustomerLedger?.balance || 0
            );

            const newCustomerBalance = Math.max(
                0,
                previousCustomerBalance - paymentAmount
            );

            const [ledgerEntry] = await CustomerLedger.create(
                [
                    {
                        customer: customerId,
                        booking: booking._id,
                        branch: branchId,
                        transaction: paymentTransaction._id,
                        type: "PAYMENT_CREDIT",
                        debit: 0,
                        credit: paymentAmount,
                        balance: newCustomerBalance,
                        remarks: remarks?.trim() || `Payment received for ${booking.bookingNumber}`,
                        createdBy,
                    },
                ],
                { session }
            );

            processedPayments.push({
                bookingId: booking._id,
                bookingNumber: booking.bookingNumber,
                amountCollected: paymentAmount,
                newRemainingAmount,
                newPaymentStatus,
                transactionId: paymentTransaction._id,
                ledgerId: ledgerEntry._id,
            });
        }

        await session.commitTransaction();

        return {
            customer: {
                _id: customer._id,
                shopName: customer.shopName,
                ownerName: customer.ownerName,
            },
            paymentsCount: processedPayments.length,
            totalAmountCollected: processedPayments.reduce((sum, p) => sum + p.amountCollected, 0),
            processedPayments,
        };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }
};