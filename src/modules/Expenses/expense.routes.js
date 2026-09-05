import { Router } from "express";
import expenseController from "./expense.controller.js";
import authMiddleware from "../../middleware/auth.middleware.js";
import {
    createExpenseValidation, updateExpenseValidation,
    expenseIdValidation,
    getExpensesValidation,
} from "./expense.validation.js"

const router = Router();

// All expense routes require authentication
router.use(authMiddleware);

// Create expense
router.post("/", createExpenseValidation, expenseController.createExpenseController);

// Get all expenses
router.get("/", getExpensesValidation, expenseController.getAllExpensesController);

// Get expense by ID
router.get("/:id", expenseIdValidation, expenseController.getExpenseByIdController);

// Update expense
router.patch("/:id", updateExpenseValidation, expenseController.updateExpenseController);

// Cancel expense
router.patch(
    "/:id/cancel",
    expenseController.cancelExpenseController
);

export default router;