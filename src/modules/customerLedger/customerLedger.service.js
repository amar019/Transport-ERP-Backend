import CustomerLedger from "./customerLedger.model.js";

export const getCustomerLedgerService = async ({
    customerId,
    branchId,
}) => {
    const ledger = await CustomerLedger.find({
        customer: customerId,
        branch: branchId,
    })
        .populate("customer", "name mobile")
        .populate("booking", "bookingNumber bookingDate totalAmount")
        .populate("transaction", "amount type paymentMode transactionDate")
        .sort({ createdAt: -1 });

    return ledger;
};

export const getCustomerLedgerBalanceService = async ({
    customerId,
    branchId,
}) => {
    const latestLedger = await CustomerLedger.findOne({
        customer: customerId,
        branch: branchId,
    })
        .sort({ createdAt: -1 })
        .populate("customer", "name mobile");

    return {
        customer: latestLedger?.customer || null,
        balance: Number(latestLedger?.balance || 0),
    };
};