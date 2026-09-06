import mongoose from "mongoose";
import Expense from "./expense.model.js";
import Payment from "../Payment/payment.model.js";
import { generateTransactionNumber } from "../Payment/payment.helper.js";
import ApiError from "../../utils/ApiErrors.js";

// Create Expense
const createExpense = async (expenseData, userId) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const [expense] = await Expense.create(
            [
                {
                    ...expenseData,
                    createdBy: userId,
                },
            ],
            { session }
        );

        // Auto-create Payment record (OUTFLOW - EXPENSE_PAYOUT)
        const transactionNumber = await generateTransactionNumber(session);
        await Payment.create(
            [
                {
                    transactionNumber,
                    transactionDate: expense.expenseDate || Date.now(),
                    type: "OUTFLOW",
                    category: "EXPENSE_PAYOUT",
                    amount: expense.amount,
                    paymentMode: expense.paymentMode || "CASH",
                    branch: expense.branch,
                    expense: expense._id,
                    createdBy: userId,
                    remarks: expense.description || `Expense payout: ${expense.category}`,
                    status: "ACTIVE",
                },
            ],
            { session }
        );

        await session.commitTransaction();

        return await Expense.findById(expense._id)
            .populate("createdBy", "name username")
            .populate("branch", "name type");
    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        throw error;
    } finally {
        await session.endSession();
    }
};

const getAllExpenses = async (branchId, filters = {}) => {
    const query = {
        branch: branchId,
        status: "ACTIVE",
    };

    // Filter by category
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
            endDate.setHours(23, 59, 59, 999);
            query.expenseDate.$lte = endDate;
        }
    }

    const expenses = await Expense.find(query)
        .populate({ path: "createdBy", select: "name username" })
        .populate({
            path: "branch",
            select: "name type",
        })
        .sort({ expenseDate: -1, createdAt: -1 });

    return expenses;
};

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
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

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
                session,
            }
        );

        if (!expense) {
            throw new ApiError(404, "Expense not found");
        }

        // Reverse associated Payment transaction
        await Payment.updateMany(
            { expense: expense._id, status: "ACTIVE" },
            {
                $set: {
                    status: "REVERSED",
                    reversedAt: new Date(),
                    reversalReason: "Expense cancelled",
                },
            },
            { session }
        );

        await session.commitTransaction();
        return expense;
    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        throw error;
    } finally {
        await session.endSession();
    }
};

export default {
    createExpense,
    getAllExpenses,
    getExpenseById,
    updateExpense,
    cancelExpense,
};
