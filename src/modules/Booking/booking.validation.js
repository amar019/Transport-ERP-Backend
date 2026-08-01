import { body } from "express-validator";

export const createBookingValidation = [
    // Sender
    body("sender.name")
        .trim()
        .notEmpty()
        .withMessage("Sender name is required"),

    body("sender.mobile")
        .optional()
        .trim()
        .isMobilePhone("any")
        .withMessage("Please enter a valid sender mobile number"),

    body("sender.address")
        .optional()
        .trim(),

    // Customer / Receiver
    body("customer")
        .trim()
        .notEmpty()
        .withMessage("Customer is required")
        .isMongoId()
        .withMessage("Invalid customer ID"),

    // Delivery Address
    body("deliveryAddress")
        .optional()
        .trim(),

    // Goods Information
    body("itemName")
        .trim()
        .notEmpty()
        .withMessage("Item name is required"),

    body("quantity")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Quantity must be at least 1"),

    // Charges
    body("crossing")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Crossing must be a positive number"),

    body("freight")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Freight must be a positive number"),

    body("hamali")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Hamali must be a positive number"),

    body("biltyCharge")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Bilty charge must be a positive number"),

    body("otherCharges")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Other charges must be a positive number"),

    // Total
    body("totalAmount")
        .notEmpty()
        .withMessage("Total amount is required")
        .isFloat({ min: 0 })
        .withMessage("Total amount must be a positive number"),

    // Payment
    body("paymentStatus")
        .optional()
        .isIn(["PAID", "TO_PAY", "PENDING"])
        .withMessage("Invalid payment status"),

    body("paidAmount")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Paid amount must be a positive number"),

    body("remainingAmount")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Remaining amount must be a positive number"),

    // Notes
    body("notes")
        .optional()
        .trim(),
];