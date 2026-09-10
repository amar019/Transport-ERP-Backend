import mongoose from "mongoose";

const paymentTransactionSchema = new mongoose.Schema(
    {
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            default: null,
            index: true,
        },

        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            default: null,
            index: true,
        },

        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            required: true,
            index: true,
        },

        deliveryBoy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DeliveryBoy",
            default: null,
            index: true,
        },

        amount: {
            type: Number,
            required: true,
            min: 0,
        },

        type: {
            type: String,
            enum: [
                "CUSTOMER_COLLECTION",
                "DELIVERY_BOY_SETTLEMENT",
            ],
            required: true,
        },

        collectedBy: {
            type: String,
            enum: [
                "DELIVERY_BOY",
                "BRANCH_OWNER",
            ],
            default: null,
        },

        paymentMode: {
            type: String,
            enum: [
                "CASH",
                "UPI",
                "BANK_TRANSFER",
                "OTHER",
            ],
            default: "CASH",
        },

        transactionDate: {
            type: Date,
            default: Date.now,
        },

        remarks: {
            type: String,
            trim: true,
            default: "",
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const PaymentTransaction =
    mongoose.models.PaymentTransaction ||
    mongoose.model(
        "PaymentTransaction",
        paymentTransactionSchema
    );

export default PaymentTransaction;