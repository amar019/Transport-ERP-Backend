import mongoose from "mongoose";

const branchSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Branch name is required"],
            trim: true,
        },

        type: {
            type: String,
            enum: ["BOOKING", "DELIVERY"],
            required: [true, "Branch type is required"],
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

const Branch = mongoose.model("Branch", branchSchema);

export default Branch;