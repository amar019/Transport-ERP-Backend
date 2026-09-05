import Expense from "./expense.model.js";
import ApiError from "../../utils/ApiErrors.js"



// Create Expense
const createExpense = async (expenseData, userId) => {
    const expense = await Expense.create({
        ...expenseData,
        createdBy: userId
    });

    return expense;

}

const getAllExpenses = async (branchId, filters = {}) => {

    const query = {
        branch: branchId,
        status: "ACTIVE",
    }

    //filter by categoery
    if (filters.category) {
        query.category = filters.category;
    }



    // Filter by date range
    if (filters.startDate || filters.endDate) {
        query.expenseDate = {};

        if (filters.startDate) {
            query.expenseDate.$gte = new Date(filters.startDate);
        }

        if (filters.endDate) {
            const endDate = new Date(filters.endDate);

            // Include the complete end date
            endDate.setHours(23, 59, 59, 999);

            query.expenseDate.$lte = endDate;
        }
    }

    const expenses = await Expense.find(query).populate({ path: "createdBy", select: "name username" }).populate({
        path: "branch",
        select: "name type",
    })
        .sort({ expenseDate: -1, createdAt: -1 });

    return expenses;


}


// Get Expense By ID
const getExpenseById = async (expenseId, branchId) => {
    const expense = await Expense.findOne({
        _id: expenseId,
        branch: branchId,
        status: "ACTIVE",
    })
        .populate({
            path: "createdBy",
            select: "name username",
        })
        .populate({
            path: "branch",
            select: "name type",
        });

    if (!expense) {
        throw new ApiError(404, "Expense not found");
    }

    return expense;
};

// Update Expense
const updateExpense = async (expenseId, branchId, updateData) => {
    const expense = await Expense.findOneAndUpdate(
        {
            _id: expenseId,
            branch: branchId,
            status: "ACTIVE",
        },
        {
            $set: updateData,
        },
        {
            new: true,
            runValidators: true,
        }
    );

    if (!expense) {
        throw new ApiError(404, "Expense not found");
    }

    return expense;
};
// Cancel Expense
const cancelExpense = async (expenseId, branchId) => {
    const expense = await Expense.findOneAndUpdate(
        {
            _id: expenseId,
            branch: branchId,
            status: "ACTIVE",
        },
        {
            $set: {
                status: "CANCELLED",
            },
        },
        {
            new: true,
        }
    );

    if (!expense) {
        throw new ApiError(404, "Expense not found");
    }

    return expense;
};

export default {
    createExpense,
    getAllExpenses,
    getExpenseById,
    updateExpense,
    cancelExpense,
};
