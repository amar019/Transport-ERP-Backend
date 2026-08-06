import { body } from "express-validator";

const createMemoValidation = [
    body("from")
        .trim()
        .notEmpty()
        .withMessage("From is required."),

    body("to")
        .trim()
        .notEmpty()
        .withMessage("To is required."),

    body("bookings")
        .isArray({ min: 1 })
        .withMessage("At least one booking is required."),

    body("notes")
        .optional()
        .trim(),
];

export {
    createMemoValidation,
};