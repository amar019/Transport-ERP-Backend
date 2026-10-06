import { body, param } from "express-validator";

// Create Customer Validation
export const createCustomerValidation = [
    body("shopName")
        .trim()
        .notEmpty()
        .withMessage("Shop name is required"),

    body("ownerName")
        .optional({ values: "falsy" })
        .trim(),

    body("mobile")
        .optional({ values: "falsy" })
        .trim()
        .isMobilePhone("en-IN")
        .withMessage("Please enter a valid mobile number"),

    body("email")
        .optional({ values: "falsy" })
        .isEmail()
        .withMessage("Please enter a valid email address"),

    body("pincode")
        .optional({ values: "falsy" })
        .isLength({ min: 6, max: 6 })
        .isNumeric()
        .withMessage("Please enter a valid 6-digit pincode"),


    body("openingBalance")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Opening balance must be a valid positive amount"),

    body("openingBalanceType")
        .optional()
        .isIn(["RECEIVABLE", "PAYABLE"])
        .withMessage("Opening balance type must be RECEIVABLE or PAYABLE"),

    body("status")
        .optional()
        .isIn(["ACTIVE", "INACTIVE"])
        .withMessage("Status must be ACTIVE or INACTIVE"),
];

// Update Customer Validation
export const updateCustomerValidation = [
    param("id")
        .isMongoId()
        .withMessage("Invalid customer ID"),

    body("shopName")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Shop name cannot be empty"),

    body("ownerName")
        .optional({ values: "falsy" })
        .trim(),

    body("mobile")
        .optional({ values: "falsy" })
        .trim()
        .isMobilePhone("en-IN")
        .withMessage("Please enter a valid mobile number"),

    body("email")
        .optional({ values: "falsy" })
        .isEmail()
        .withMessage("Please enter a valid email address"),

    body("pincode")
        .optional({ values: "falsy" })
        .isLength({ min: 6, max: 6 })
        .isNumeric()
        .withMessage("Please enter a valid 6-digit pincode"),

    body("openingBalance")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Opening balance must be a valid positive amount"),

    body("openingBalanceType")
        .optional()
        .isIn(["RECEIVABLE", "PAYABLE"])
        .withMessage("Opening balance type must be RECEIVABLE or PAYABLE"),

    body("status")
        .optional()
        .isIn(["ACTIVE", "INACTIVE"])
        .withMessage("Status must be ACTIVE or INACTIVE"),
];

// Customer ID Validation
export const customerIdValidation = [
    param("id")
        .isMongoId()
        .withMessage("Invalid customer ID"),
];