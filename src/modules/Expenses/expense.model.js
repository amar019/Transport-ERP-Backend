import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
    {
        expenseDate: {
            type: Date,
            required: [true, "Expense date is required"],
            default: Date.now,
            index: true,
        },

        category: {
            type: String,
            required: [true, "Expense category is required"],
            enum: [
                "FUEL",
                "TOLL",
                "REPAIR",
                "MAINTENANCE",
                "DRIVER_EXPENSE",
                "LOADING",
                "OFFICE_EXPENSE",
                "OFFICE_RENT",
                "SALARY",
                "OTHER",
            ],
            trim: true,
        },

        amount: {
            type: Number,
            required: [true, "Expense amount is required"],
            min: [0, "Expense amount cannot be negative"],
        },

        description: {
            type: String,
            trim: true,
            maxlength: [500, "Description cannot exceed 500 characters"],
        },

        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            required: [true, "Branch is required"],
            index: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Created by user is required"],
        },

        status: {
            type: String,
            enum: ["ACTIVE", "CANCELLED"],
            default: "ACTIVE",
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Useful for expense reports
expenseSchema.index({
    branch: 1,
    expenseDate: -1,
});

expenseSchema.index({
    branch: 1,
    category: 1,
    expenseDate: -1,
});

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;