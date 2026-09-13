import {
  getCustomerLedgerService,
  getCustomerLedgerBalanceService,
  getCustomerOutstandingBookingsService,
  collectCustomerOutstandingPaymentService,
} from "./customerLedger.service.js";

export const getCustomerLedgerController = async (req, res) => {
  try {
    const { customerId } = req.params;
    const branchId = req.user.branch;

    const ledger = await getCustomerLedgerService({
      customerId,
      branchId,
    });

    return res.status(200).json({
      success: true,
      message: "Customer ledger fetched successfully",
      data: ledger,
    });
  } catch (error) {
    console.error("Get customer ledger error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCustomerLedgerBalanceController = async (
  req,
  res
) => {
  try {
    const { customerId } = req.params;
    const branchId = req.user.branch;

    const result =
      await getCustomerLedgerBalanceService({
        customerId,
        branchId,
      });

    return res.status(200).json({
      success: true,
      message: "Customer ledger balance fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "Get customer ledger balance error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCustomerOutstandingBookingsController = async (req, res) => {
  try {
    const { customerId } = req.params;
    const branchId = req.user.branch;

    const result = await getCustomerOutstandingBookingsService({
      customerId,
      branchId,
    });

    return res.status(200).json({
      success: true,
      message: "Customer outstanding bookings fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Get customer outstanding bookings error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const collectCustomerOutstandingPaymentController = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { payments, paymentMode, remarks } = req.body;
    const branchId = req.user.branch;
    const createdBy = req.user._id || req.user.id;

    const result = await collectCustomerOutstandingPaymentService({
      customerId,
      branchId,
      payments,
      paymentMode,
      remarks,
      createdBy,
    });

    return res.status(200).json({
      success: true,
      message: "Customer outstanding payment collected successfully",
      data: result,
    });
  } catch (error) {
    console.error("Collect customer outstanding payment error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};