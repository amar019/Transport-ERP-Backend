import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
    {
        // Booking Information
        bookingNumber: {
            type: String,
            unique: true,
            trim: true,
        },

        bookingDate: {
            type: Date,
            default: Date.now,
        },


        sender: {
            name: String,
            mobile: String,
            address: String,
        },


        // Customer / Receiver
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
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

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Created by user is required"],
        },



        // Delivery Address
        deliveryAddress: {
            type: String,
            trim: true,
        },

        // Goods Information
        itemName: {
            type: String,
            required: true,
            trim: true,
        },

        quantity: {
            type: Number,
            default: 1,
            min: 1,
        },

        parcelCharge: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Charges
        crossing: {
            type: Number,
            default: 0,
            min: 0,
        },

        freight: {
            type: Number,
            default: 0,
            min: 0,
        },

        hamali: {
            type: Number,
            default: 0,
            min: 0,
        },

        biltyCharge: {
            type: Number,
            default: 5,
            min: 0,
        },

        otherCharges: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Total
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        // Payment Status
        paymentStatus: {
            type: String,
            enum: [
                "PENDING",
                "PARTIAL",
                "PAID",
                "CREDIT"
            ],
            default: "PENDING",
        },

        // When payment should be collected
        collectionType: {
            type: String,
            enum: [
                "PAID_AT_BOOKING",
                "TO_PAY"
            ],
            default: "TO_PAY",
        },


        paidAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        remainingAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Delivery Status
        status: {
            type: String,
            enum: [
                "BOOKED",
                "CANCELLED",
            ],
            default: "BOOKED",
        },


        delivery: {
            deliveryBoy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "DeliveryBoy",
                default: null,
            },

            status: {
                type: String,
                enum: [
                    "PENDING",
                    "OUT_FOR_DELIVERY",
                    "DELIVERED",
                    "FAILED",
                ],
                default: "PENDING",
            },

            assignedAt: {
                type: Date,
                default: null,
            },

            deliveredAt: {
                type: Date,
                default: null,
            },

            remarks: {
                type: String,
                trim: true,
                default: "",
            },
        },



        // Notes
        notes: {
            type: String,
            trim: true,
        },

        memo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Memo",
            default: null,
        }
    },
    {
        timestamps: true,
    }
);

// Indexes for fast querying
bookingSchema.index({ fromBranch: 1, createdAt: -1 });
bookingSchema.index({ toBranch: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ memo: 1 });
bookingSchema.index({ toBranch: 1, "delivery.status": 1 });
bookingSchema.index({ "delivery.deliveryBoy": 1, "delivery.status": 1 });

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;