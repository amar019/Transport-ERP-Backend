import Payment from "./payment.model.js";

/**
 * Generate sequential transaction number
 * Format: PAY-000001, PAY-000002
 */
export const generateTransactionNumber = async (session = null) => {
    const query = Payment.findOne()
        .sort({ createdAt: -1 })
        .select("transactionNumber");

    if (session) {
        query.session(session);
    }

    const lastPayment = await query;

    if (!lastPayment || !lastPayment.transactionNumber) {
        return "PAY-000001";
    }

    const parts = lastPayment.transactionNumber.split("-");
    const lastNumber = parseInt(parts[1], 10);
    const nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;

    return `PAY-${String(nextNumber).padStart(6, "0")}`;
};
