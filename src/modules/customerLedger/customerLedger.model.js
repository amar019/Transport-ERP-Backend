import mongoose from "mongoose";

const customerLedgerSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
            index: true,
        },

        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            default: null,
            index: true,
        },

        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            required: true,
            index: true,
        },

        transaction: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PaymentTransaction",
            default: null,
        },

        type: {
            type: String,
            enum: [
                "BOOKING_DEBIT",
                "PAYMENT_CREDIT",
                "ADJUSTMENT",
            ],
            required: true,
        },

        debit: {
            type: Number,
            default: 0,
            min: 0,
        },

        credit: {
            type: Number,
            default: 0,
            min: 0,
        },

        balance: {
            type: Number,
            required: true,
            min: 0,
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

const CustomerLedger =
    mongoose.models.CustomerLedger ||
    mongoose.model(
        "CustomerLedger",
        customerLedgerSchema
    );

export default CustomerLedger;