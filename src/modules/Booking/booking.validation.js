import { body } from "express-validator";

export const createBookingValidation = [
    // Booking Information
    body("bookingDate")
        .optional()
        .isISO8601()
        .withMessage("Please enter a valid booking date"),

    // Sender
    body("sender.name")
        .trim()
        .notEmpty()
        .withMessage("Sender name is required"),

    body("sender.mobile")
        .optional({ checkFalsy: true })
        .trim()
        .isMobilePhone("any")
        .withMessage("Please enter a valid sender mobile number"),


    body("sender.address")
        .optional()
        .trim(),

    // Customer / Receiver
    body("customer")
        .optional({ checkFalsy: true })
        .trim()
        .isMongoId()
        .withMessage("Invalid customer ID"),

    body("isDirectEntry")
        .optional()
        .isBoolean()
        .withMessage("isDirectEntry must be a boolean"),

    body("receiver.shopName")
        .optional()
        .trim(),

    body("receiver.ownerName")
        .optional()
        .trim(),

    body("receiver.mobile")
        .optional()
        .trim(),

    // Destination Branch
    body("toBranch")
        .trim()
        .notEmpty()
        .withMessage("Destination branch is required")
        .isMongoId()
        .withMessage("Invalid destination branch ID"),

    body("from")
        .optional()
        .trim(),

    body("to")
        .optional()
        .trim(),

    // Delivery Information
    body("deliveryAddress")
        .optional()
        .trim(),

    // Goods Information
    body("itemName")
        .optional()
        .trim(),

    body("quantity")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Quantity must be at least 1"),

    body("items")
        .optional()
        .isArray()
        .withMessage("Items must be an array"),

    body("items.*.description")
        .optional()
        .trim(),

    body("items.*.quantity")
        .optional()
        .isInt({ min: 1 }),

    // Charges
    body("parcelCharge")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Parcel charge must be a valid number"),

    body("crossing")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Crossing must be a valid number"),

    body("freight")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Freight must be a valid number"),

    body("hamali")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Hamali must be a valid number"),

    body("biltyCharge")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Bilty charge must be a valid number"),

    body("otherCharges")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Other charges must be a valid number"),

    // Payment Collection Type
    body("collectionType")
        .optional()
        .isIn([
            "PAID_AT_BOOKING",
            "TO_PAY",
        ])
        .withMessage("Invalid collection type"),

    // Payment Status
    body("paymentStatus")
        .optional()
        .isIn([
            "PENDING",
            "PARTIAL",
            "PAID",
            "CREDIT",
        ])
        .withMessage("Invalid payment status"),

    // Paid Amount
    body("paidAmount")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Paid amount must be a valid number"),

    // Payment Mode
    body("paymentMode")
        .optional()
        .isIn(["CASH", "UPI", "BANK_TRANSFER", "CHEQUE"])
        .withMessage("Invalid payment mode"),

    // Invoice Number & Remark
    body("invoiceNo")
        .optional()
        .trim(),

    body("remark")
        .optional()
        .trim(),

    // Notes
    body("notes")
        .optional()
        .trim(),
];