import { body, param, query } from "express-validator";

const paymentModes = ["CASH", "UPI", "BANK_TRANSFER", "CHEQUE"];
const paymentTypes = ["INFLOW", "OUTFLOW"];
const paymentCategories = [
    "BOOKING_PAYMENT",
    "MEMO_SETTLEMENT",
    "EXPENSE_PAYOUT",
    "REFUND",
];

const paymentIdValidation = [
    param("id")
        .isMongoId()
        .withMessage("Invalid payment ID"),
];

const getPaymentsValidation = [
    query("type")
        .optional()
        .isIn(paymentTypes)
        .withMessage("Invalid payment type"),

    query("category")
        .optional()
        .isIn(paymentCategories)
        .withMessage("Invalid payment category"),

    query("paymentMode")
        .optional()
        .isIn(paymentModes)
        .withMessage("Invalid payment mode"),

    query("startDate")
        .optional()
        .isISO8601()
        .withMessage("Invalid start date"),

    query("endDate")
        .optional()
        .isISO8601()
        .withMessage("Invalid end date"),

    query("search")
        .optional()
        .trim(),
];

const reversePaymentValidation = [
    param("id")
        .isMongoId()
        .withMessage("Invalid payment ID"),

    body("reversalReason")
        .notEmpty()
        .withMessage("Reversal reason is required")
        .trim()
        .isLength({ max: 500 })
        .withMessage("Reversal reason cannot exceed 500 characters"),
];

const recordRefundValidation = [
    body("amount")
        .notEmpty()
        .withMessage("Refund amount is required")
        .isFloat({ min: 0.01 })
        .withMessage("Refund amount must be a positive number"),

    body("paymentMode")
        .notEmpty()
        .withMessage("Payment mode is required")
        .isIn(paymentModes)
        .withMessage("Invalid payment mode"),

    body("booking")
        .optional()
        .isMongoId()
        .withMessage("Invalid booking ID"),

    body("customer")
        .optional()
        .isMongoId()
        .withMessage("Invalid customer ID"),

    body("referenceNumber")
        .optional()
        .trim(),

    body("remarks")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Remarks cannot exceed 500 characters"),
];

export {
    paymentModes,
    paymentTypes,
    paymentCategories,
    paymentIdValidation,
    getPaymentsValidation,
    reversePaymentValidation,
    recordRefundValidation,
};
