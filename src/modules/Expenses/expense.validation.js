import { body, param, query } from "express-validator";

const expenseCategories = [
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
];

// Create Expense
const createExpenseValidation = [
    body("expenseDate")
        .optional()
        .isISO8601()
        .withMessage("Expense date must be a valid date"),

    body("category")
        .notEmpty()
        .withMessage("Expense category is required")
        .isIn(expenseCategories)
        .withMessage("Invalid expense category"),

    body("amount")
        .notEmpty()
        .withMessage("Expense amount is required")
        .isFloat({ min: 0 })
        .withMessage("Expense amount must be a valid positive number"),

    body("description")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Description cannot exceed 500 characters"),
];

// Update Expense
const updateExpenseValidation = [
    param("id")
        .isMongoId()
        .withMessage("Invalid expense ID"),

    body("expenseDate")
        .optional()
        .isISO8601()
        .withMessage("Expense date must be a valid date"),

    body("category")
        .optional()
        .isIn(expenseCategories)
        .withMessage("Invalid expense category"),

    body("amount")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Expense amount must be a valid positive number"),

    body("description")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Description cannot exceed 500 characters"),
];

// Expense ID validation
const expenseIdValidation = [
    param("id")
        .isMongoId()
        .withMessage("Invalid expense ID"),
];

// Get All Expenses
const getExpensesValidation = [
    query("category")
        .optional()
        .isIn(expenseCategories)
        .withMessage("Invalid expense category"),

    query("startDate")
        .optional()
        .isISO8601()
        .withMessage("Invalid start date"),

    query("endDate")
        .optional()
        .isISO8601()
        .withMessage("Invalid end date"),
];

export {
    createExpenseValidation,
    updateExpenseValidation,
    expenseIdValidation,
    getExpensesValidation,
};