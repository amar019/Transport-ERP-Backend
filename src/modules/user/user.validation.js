import { body } from "express-validator";

/**
 * Login Validation
 */
export const loginValidation = [
    body("username")
        .trim()
        .notEmpty()
        .withMessage("Username is required"),

    body("password")
        .notEmpty()
        .withMessage("Password is required"),
];

/**
 * Change Password Validation
 */
export const changePasswordValidation = [
    body("currentPassword")
        .notEmpty()
        .withMessage("Current password is required"),

    body("newPassword")
        .isLength({ min: 6 })
        .withMessage("New password must be at least 6 characters"),

    body("confirmPassword")
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error("Confirm password does not match");
            }
            return true;
        }),
];

/**
 * Switch Branch Validation
 */
export const switchBranchValidation = [
    body("currentBranch")
        .isIn(["BOOKING", "DELIVERY"])
        .withMessage("Invalid branch"),
];