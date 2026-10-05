import mongoose from "mongoose";
import PaymentTransaction from "./models/paymentTransaction.model.js";
import Booking from "../Booking/booking.model.js";
import DeliveryBoy from "../deliveryBoy/deliveryBoy.model.js";
import CustomerLedger from "../customerLedger/customerLedger.model.js";
import DeliveryBoyLedger from "../deliveryboyLedger/deliveryboyLedger.model.js";



// ======================================================
// COLLECT CUSTOMER PAYMENT
// ======================================================

export const collectCustomerPaymentService = async ({
    bookingId,
    branchId,
    amount,
    collectedBy,
    paymentMode,
    remarks,
    createdBy,
}) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // ------------------------------------------------
        // 1. Validate amount
        // ------------------------------------------------

        const paymentAmount = Number(amount);

        if (
            !Number.isFinite(paymentAmount) ||
            paymentAmount <= 0
        ) {
            throw new Error(
                "Payment amount must be greater than 0"
            );
        }

        // ------------------------------------------------
        // 2. Find booking
        // ------------------------------------------------

        const booking = await Booking.findOne({
            _id: bookingId,
            toBranch: branchId,
        }).session(session);

        if (!booking) {
            throw new Error(
                "Booking not found in this branch"
            );
        }

        // ------------------------------------------------
        // 3. Validate collection type
        // ------------------------------------------------

        if (booking.collectionType !== "TO_PAY") {
            throw new Error(
                "Payment collection is allowed only for TO_PAY bookings"
            );
        }

        // ------------------------------------------------
        // 4. Validate booking status
        // ------------------------------------------------

        if (booking.status !== "BOOKED") {
            throw new Error(
                "Payment cannot be collected for this booking"
            );
        }

        // ------------------------------------------------
        // 5. Calculate remaining amount
        // ------------------------------------------------

        const currentPaidAmount =
            Number(booking.paidAmount || 0);

        const totalAmount =
            Number(booking.totalAmount || 0);

        const currentRemainingAmount =
            Number(
                booking.remainingAmount ??
                totalAmount - currentPaidAmount
            );

        if (currentRemainingAmount <= 0) {
            throw new Error(
                "No payment is remaining for this booking"
            );
        }

        if (paymentAmount > currentRemainingAmount) {
            throw new Error(
                `Payment amount cannot exceed remaining amount of ₹${currentRemainingAmount}`
            );
        }

        // ------------------------------------------------
        // 6. Delivery boy validation
        // ------------------------------------------------

        let deliveryBoy = null;

        if (collectedBy === "DELIVERY_BOY") {
            if (!booking.delivery?.deliveryBoy) {
                throw new Error(
                    "No delivery boy is assigned to this booking"
                );
            }

            deliveryBoy = await DeliveryBoy.findOne({
                _id: booking.delivery.deliveryBoy,
                branch: branchId,
                status: "ACTIVE",
            }).session(session);

            if (!deliveryBoy) {
                throw new Error(
                    "Delivery boy not found or inactive"
                );
            }
        }

        // ------------------------------------------------
        // 7. Update booking payment information
        // ------------------------------------------------

        const newPaidAmount =
            currentPaidAmount + paymentAmount;

        const newRemainingAmount =
            currentRemainingAmount - paymentAmount;

        let newPaymentStatus = "PARTIAL";

        if (newRemainingAmount === 0) {
            newPaymentStatus = "PAID";
        }

        booking.paidAmount = newPaidAmount;
        booking.remainingAmount = newRemainingAmount;
        booking.paymentStatus = newPaymentStatus;

        await booking.save({ session });

        // ------------------------------------------------
        // 8. Create Payment Transaction
        // ------------------------------------------------

        const [paymentTransaction] =
            await PaymentTransaction.create(
                [
                    {
                        booking: booking._id,
                        customer: booking.customer,
                        branch: branchId,

                        deliveryBoy:
                            collectedBy === "DELIVERY_BOY"
                                ? deliveryBoy._id
                                : null,

                        amount: paymentAmount,

                        type: "CUSTOMER_COLLECTION",

                        collectedBy,

                        paymentMode:
                            paymentMode || "CASH",

                        transactionDate: new Date(),

                        remarks:
                            remarks?.trim() ||
                            "Payment collected from customer",

                        createdBy,
                    },
                ],
                { session }
            );

        // ------------------------------------------------
        // 9. Customer Ledger - PAYMENT CREDIT
        // ------------------------------------------------

        const previousCustomerLedger =
            await CustomerLedger.findOne({
                customer: booking.customer,
                branch: branchId,
            })
                .sort({ createdAt: -1 })
                .session(session);

        const previousCustomerBalance =
            Number(
                previousCustomerLedger?.balance || 0
            );

        const newCustomerBalance =
            Math.max(
                0,
                previousCustomerBalance -
                paymentAmount
            );

        await CustomerLedger.create(
            [
                {
                    customer: booking.customer,

                    booking: booking._id,

                    branch: branchId,

                    transaction:
                        paymentTransaction._id,

                    type: "PAYMENT_CREDIT",

                    debit: 0,

                    credit: paymentAmount,

                    balance: newCustomerBalance,

                    remarks:
                        remarks?.trim() ||
                        `Payment received for ${booking.bookingNumber}`,

                    createdBy,
                },
            ],
            { session }
        );

        // ------------------------------------------------
        // 10. Delivery Boy Ledger
        // ------------------------------------------------
        // Only create this when the DELIVERY BOY
        // actually collected the customer's money.
        //
        // BRANCH_OWNER / COUNTER does NOT create this entry.
        // ------------------------------------------------

        if (
            collectedBy === "DELIVERY_BOY"
        ) {
            const previousDeliveryBoyLedger =
                await DeliveryBoyLedger.findOne({
                    deliveryBoy:
                        deliveryBoy._id,

                    branch: branchId,
                })
                    .sort({ createdAt: -1 })
                    .session(session);

            const previousDeliveryBoyBalance =
                Number(
                    previousDeliveryBoyLedger?.balance ||
                    0
                );

            const newDeliveryBoyBalance =
                previousDeliveryBoyBalance +
                paymentAmount;

            await DeliveryBoyLedger.create(
                [
                    {
                        deliveryBoy:
                            deliveryBoy._id,

                        booking: booking._id,

                        paymentTransaction:
                            paymentTransaction._id,

                        branch: branchId,

                        type:
                            "CUSTOMER_COLLECTION",

                        debit: paymentAmount,

                        credit: 0,

                        balance:
                            newDeliveryBoyBalance,

                        remarks:
                            remarks?.trim() ||
                            "Cash collected from customer",

                        createdBy,
                    },
                ],
                { session }
            );
        }

        // ------------------------------------------------
        // 11. Commit transaction
        // ------------------------------------------------

        await session.commitTransaction();

        return {
            booking,
            paymentTransaction,
            paidAmount: newPaidAmount,
            remainingAmount: newRemainingAmount,
            paymentStatus: newPaymentStatus,
        };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }
};


// ======================================================
// GET PAYMENT TRANSACTIONS
// ======================================================

export const getPaymentTransactionsService = async ({
    branchId,
    type,
    collectedBy,
    deliveryBoyId,
    customerId,
    bookingId,
}) => {
    const filter = {
        branch: branchId,
    };

    // ------------------------------------------------
    // Optional filters
    // ------------------------------------------------

    if (type) {
        filter.type = type;
    }

    if (collectedBy) {
        filter.collectedBy = collectedBy;
    }

    if (deliveryBoyId) {
        filter.deliveryBoy = deliveryBoyId;
    }

    if (customerId) {
        filter.customer = customerId;
    }

    if (bookingId) {
        filter.booking = bookingId;
    }

    // ------------------------------------------------
    // Fetch transactions
    // ------------------------------------------------

    const transactions =
        await PaymentTransaction.find(filter)
            .populate(
                "booking",
                "bookingNumber bookingDate totalAmount"
            )
            .populate(
                "customer",
                "name mobile"
            )
            .populate(
                "deliveryBoy",
                "name mobile"
            )
            .populate(
                "branch",
                "name type"
            )
            .populate(
                "createdBy",
                "name username"
            )
            .sort({
                transactionDate: -1,
            });

    return transactions;
};