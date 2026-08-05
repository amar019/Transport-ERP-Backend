export const calculatePaymentDetails = (collectionType, totalAmount) => {

    if (collectionType === "PAID_AT_BOOKING") {
        return {
            paymentStatus: "PAID",
            paidAmount: totalAmount,
            remainingAmount: 0,
        };
    }

    return {
        paymentStatus: "PENDING",
        paidAmount: 0,
        remainingAmount: totalAmount,
    };
};

