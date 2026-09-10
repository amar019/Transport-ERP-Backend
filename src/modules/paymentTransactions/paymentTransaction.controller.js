import {
    collectCustomerPaymentService,
    getPaymentTransactionsService,
} from "./paymentTransaction.service.js";


export const collectCustomerPaymentController = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const {
            amount,
            collectedBy,
            paymentMode,
            remarks,
        } = req.body;

        const branchId = req.user.branch;
        const createdBy =
            req.user._id || req.user.id;

        if (amount === undefined || amount === null) {
            return res.status(400).json({
                success: false,
                message: "Payment amount is required",
            });
        }

        if (!collectedBy) {
            return res.status(400).json({
                success: false,
                message: "Collected by is required",
            });
        }

        if (
            ![
                "DELIVERY_BOY",
                "BRANCH_OWNER",
            ].includes(collectedBy)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Collected by must be DELIVERY_BOY or BRANCH_OWNER",
            });
        }

        const result =
            await collectCustomerPaymentService({
                bookingId: id,
                branchId,
                amount,
                collectedBy,
                paymentMode,
                remarks,
                createdBy,
            });

        return res.status(200).json({
            success: true,
            message: "Payment collected successfully",
            data: result,
        });
    } catch (error) {
        console.error(
            "Collect customer payment error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};


export const getPaymentTransactionsController = async (
    req,
    res
) => {
    try {
        const {
            type,
            collectedBy,
            deliveryBoyId,
            customerId,
            bookingId,
        } = req.query;

        const branchId = req.user.branch;

        const transactions =
            await getPaymentTransactionsService({
                branchId,
                type,
                collectedBy,
                deliveryBoyId,
                customerId,
                bookingId,
            });

        return res.status(200).json({
            success: true,
            message:
                "Payment transactions fetched successfully",
            data: transactions,
        });
    } catch (error) {
        console.error(
            "Get payment transactions error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};