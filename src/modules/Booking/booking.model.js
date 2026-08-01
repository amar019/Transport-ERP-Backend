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



        // Notes
        notes: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;