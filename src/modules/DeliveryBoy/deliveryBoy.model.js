import mongoose from "mongoose";

const deliveryBoySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Delivery boy name is required"],
            trim: true,
        },

        mobile: {
            type: String,
            required: [true, "Mobile number is required"],
            trim: true,
        },

        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            required: [true, "Branch is required"],
            index: true,
        },

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

const DeliveryBoy =
    mongoose.models.DeliveryBoy ||
    mongoose.model("DeliveryBoy", deliveryBoySchema);

export default DeliveryBoy;