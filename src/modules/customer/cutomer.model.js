import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
    {
        // Unique Customer Identification
        customerCode: {
            type: String,
            unique: true,
            trim: true,
        },

        // Shop Information
        shopName: {
            type: String,
            required: true,
            trim: true,
        },

        ownerName: {
            type: String,
            required: true,
            trim: true,
        },


        // Contact Information
        mobile: {
            type: String,
            required: true,
            trim: true,
        },


        email: {
            type: String,
            trim: true,
            lowercase: true,
        },

        // Address
        address: {
            type: String,
            trim: true,
        },

        area: {
            type: String,
            trim: true,
        },

        city: {
            type: String,
            trim: true,
        },

        district: {
            type: String,
            trim: true,
        },

        state: {
            type: String,
            trim: true,
        },

        pincode: {
            type: String,
            trim: true,
        },


        // Transport Information
        deliveryAddress: {
            type: String,
            trim: true,
        },

        pickupAddress: {
            type: String,
            trim: true,
        },

        // Opening Balance
        openingBalance: {
            type: Number,
            default: 0,
            min: 0,
        },

        openingBalanceType: {
            type: String,
            enum: ["RECEIVABLE", "PAYABLE"],
            default: "RECEIVABLE",
        },

        // Additional Information
        notes: {
            type: String,
            trim: true,
        },

        // Status
        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE"],
            default: "ACTIVE",
        },
    },
    {
        timestamps: true,
    }
);

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;