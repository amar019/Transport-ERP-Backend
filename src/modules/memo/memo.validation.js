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
    body().custom((value, { req }) => {
        const amt = req.body.amountReceived !== undefined ? req.body.amountReceived : req.body.amount;
        if (amt === undefined || amt === null || amt === "") {
            throw new Error("Received amount is required.");
        }
        const num = Number(amt);
        if (isNaN(num) || num <= 0) {
            throw new Error("Please enter a valid positive received amount.");
        }
        return true;
    }),
];

export {
    createMemoValidation,
    updateMemoCollectionValidation,
};