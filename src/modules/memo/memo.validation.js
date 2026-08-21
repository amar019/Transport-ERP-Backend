import { body } from "express-validator";

/**
 * Validation for Creating a Memo
 */
const createMemoValidation = [
    body("toBranch")
        .trim()
        .notEmpty()
        .withMessage("Destination branch is required.")
        .isMongoId()
        .withMessage("Invalid destination branch ID."),

    body("bookings")
        .isArray({ min: 1 })
        .withMessage("At least one booking is required."),

    body("bookings.*")
        .isMongoId()
        .withMessage("Each booking must be a valid booking ID."),

    body("notes")
        .optional()
        .trim(),
];

/**
 * Validation for Updating Memo Collection / Settlement
 */
const updateMemoCollectionValidation = [
    body("amountReceived")
        .notEmpty()
        .withMessage("Received amount is required.")
        .isFloat({ min: 0.01 })
        .withMessage("Please enter a valid positive received amount."),
];

export {
    createMemoValidation,
    updateMemoCollectionValidation,
};