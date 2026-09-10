import mongoose from "mongoose";
import DeliveryBoy from "../DeliveryBoy/deliveryBoy.model.js";

const deliveryBoyLedgerSchema = new mongoose.Schema(
    {
        deliveryBoy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DeliveryBoy",
            required: true,
            index: true,
        },

        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            default: null,
            index: true,
        },

        paymentTransaction: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PaymentTransaction",
            default: null,
        },

        settlementTransaction: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PaymentTransaction",
            default: null,
            index: true,
        },

        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            required: true,
            index: true,
        },

        type: {
            type: String,
            enum: [
                "CUSTOMER_COLLECTION",
                "SETTLEMENT",
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

const DeliveryBoyLedger =
    mongoose.models.DeliveryBoyLedger ||
    mongoose.model(
        "DeliveryBoyLedger",
        deliveryBoyLedgerSchema
    );

export default DeliveryBoyLedger;