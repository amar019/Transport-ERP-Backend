import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        transactionNumber: {
            type: String,
            unique: true,
            trim: true,
        },
        transactionDate: {
            type: Date,
            default: Date.now,
            index: true,
        },
        type: {
            type: String,
            enum: ["INFLOW", "OUTFLOW"],
            required: [true, "Payment type is required"],
            index: true,
        },
        category: {
            type: String,
            enum: [
                "BOOKING_PAYMENT",
                "MEMO_SETTLEMENT",
                "EXPENSE_PAYOUT",
                "REFUND",
            ],
            required: [true, "Payment category is required"],
            index: true,
        },
        amount: {
            type: Number,
            required: [true, "Payment amount is required"],
            min: [0, "Amount cannot be negative"],
        },
        paymentMode: {
            type: String,
            enum: ["CASH", "UPI", "BANK_TRANSFER", "CHEQUE"],
            required: [true, "Payment mode is required"],
        },
        referenceNumber: {
            type: String,
            trim: true,
            default: null,
        },
        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            required: [true, "Branch is required"],
            index: true,
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            default: null,
        },
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            default: null,
        },
        memo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Memo",
            default: null,
        },
        expense: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Expense",
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Created by user is required"],
        },
        remarks: {
            type: String,
            trim: true,
            maxlength: [500, "Remarks cannot exceed 500 characters"],
        },
        status: {
            type: String,
            enum: ["ACTIVE", "REVERSED"],
            default: "ACTIVE",
            index: true,
        },
        reversedAt: {
            type: Date,
            default: null,
        },
        reversalReason: {
            type: String,
            trim: true,
            maxlength: [500, "Reversal reason cannot exceed 500 characters"],
        },
    },
    {
        timestamps: true,
    }
);

paymentSchema.index({ branch: 1, transactionDate: -1 });
paymentSchema.index({ branch: 1, category: 1, transactionDate: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
