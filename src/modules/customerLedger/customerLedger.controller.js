import {
  getCustomerLedgerService,
  getCustomerLedgerBalanceService,
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