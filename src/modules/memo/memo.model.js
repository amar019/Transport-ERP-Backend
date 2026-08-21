import mongoose from "mongoose";

const memoSchema = new mongoose.Schema(
    {
        memoNumber: {
            type: String,
            unique: true,
            trim: true,
        },
        memoDate: {
            type: Date,
            default: Date.now,
        },

        // Branch Information
        fromBranch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            required: [true, "Origin branch is required"],
            index: true,
        },

        toBranch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            required: [true, "Destination branch is required"],
            index: true,
        },

        // Audit Users
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Created by user is required"],
        },

        receivedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        // Selected Bookings
        bookings: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Booking",
                },
            ],
            required: true,
            validate: {
                validator: (value) => Array.isArray(value) && value.length > 0,
                message: "At least one booking is required.",
            },
        },

        // Collection Summary (Calculated from TO_PAY bookings)
        totalAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        receivedAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        pendingAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        collectionStatus: {
            type: String,
            enum: ["PENDING", "PARTIAL", "COMPLETED"],
            default: "PENDING",
            index: true,
        },

        // Memo Lifecycle Status
        status: {
            type: String,
            enum: ["CREATED", "ON_ROUTE", "RECEIVED"],
            default: "CREATED",
            index: true,
        },

        dispatchedAt: {
            type: Date,
            default: null,
        },

        receivedAt: {
            type: Date,
            default: null,
        },

        notes: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
memoSchema.index({ fromBranch: 1, createdAt: -1 });
memoSchema.index({ toBranch: 1, createdAt: -1 });
memoSchema.index({ memoDate: -1 });

const Memo = mongoose.model("Memo", memoSchema);

export default Memo;
