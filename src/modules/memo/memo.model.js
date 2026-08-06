import mongoose from "mongoose";

const memoSchema = new mongoose.Schema({


    memoNumber: {
        type: String,
        unique: true,
        trim: true
    },
    memoDate: {
        type: Date,
        default: Date.now,
    },

    // Route
    from: {
        type: String,
        required: true,
        trim: true,
    },

    to: {
        type: String,
        required: true,
        trim: true,
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
            validator: (value) => value.length > 0,
            message: "At least one booking is required.",
        },
    },


    // Collection Summary
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
        enum: [
            "PENDING",
            "PARTIAL",
            "COMPLETED",
        ],
        default: "PENDING",
    },

    // Memo Status
    status: {
        type: String,
        enum: [
            "CREATED",
            "ON_ROUTE",
            "RECEIVED",
        ],
        default: "CREATED",
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
memoSchema.index({ memoDate: -1 });
memoSchema.index({ memoNumber: 1 });
memoSchema.index({ status: 1 });

const Memo = mongoose.model("Memo", memoSchema);


export default Memo;

