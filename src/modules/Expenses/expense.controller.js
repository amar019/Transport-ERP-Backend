import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiErrors.js";
import expenseService from "./expense.service.js";


// Create Expense
const createExpenseController = asyncHandler(async (req, res) => {
    const expense = await expenseService.createExpense(
        {
            ...req.body,
            branch: req.user.branch._id,
        },
        req.user._id
    );

    return res
        .status(201)
        .json(new ApiResponse(201, expense, "Expense created successfully"));
});


// Get All Expenses
const getAllExpensesController = asyncHandler(async (req, res) => {
    const branchId = req.user?.branch?._id;
    if (!branchId) {
        throw new ApiError(400, "Branch information is required");
    }

    const expenses = await expenseService.getAllExpenses(
        branchId,
        req.query
    );

    return res
        .status(200)
        .json(new ApiResponse(200, expenses, "Expenses fetched successfully"));
});

// Get Expense By ID
const getExpenseByIdController = asyncHandler(async (req, res) => {
    const expense = await expenseService.getExpenseById(
        req.params.id,
        req.user.branch._id
    );

    return res
        .status(200)
        .json(new ApiResponse(200, expense, "Expense fetched successfully"));
});

// Update Expense
const updateExpenseController = asyncHandler(async (req, res) => {
    const expense = await expenseService.updateExpense(
        req.params.id,
        req.user.branch._id,
        req.body
    );

    return res
        .status(200)
        .json(new ApiResponse(200, expense, "Expense updated successfully"));
});

// Cancel Expense
const cancelExpenseController = asyncHandler(async (req, res) => {
    const expense = await expenseService.cancelExpense(
        req.params.id,
        req.user.branch._id
    );

    return res
        .status(200)
        .json(new ApiResponse(200, expense, "Expense cancelled successfully"));
});

export default {
    createExpenseController,
    getAllExpensesController,
    getExpenseByIdController,
    updateExpenseController,
    cancelExpenseController,
};