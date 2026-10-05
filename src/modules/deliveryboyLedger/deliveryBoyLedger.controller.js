import {
  getDeliveryBoyLedgerService,
  getDeliveryBoyLedgerBalanceService,
  settleDeliveryBoyLedgerService,
  getDeliveryBoyDailyReportService,
  getOutstandingCollectionsService,
  settleSelectedDeliveryBoyLedgerService
} from "./deliveryBoyLedger.service.js";

export const getDeliveryBoyLedgerController = async (
  req,
  res
) => {
  try {
    const { deliveryBoyId } = req.params;
    const branchId = req.user.branch;

    const ledger = await getDeliveryBoyLedgerService({
      deliveryBoyId,
      branchId,
    });

    return res.status(200).json({
      success: true,
      message:
        "Delivery boy ledger fetched successfully",
      data: ledger,
    });
  } catch (error) {
    console.error(
      "Get delivery boy ledger error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getDeliveryBoyLedgerBalanceController =
  async (req, res) => {
    try {
      const { deliveryBoyId } = req.params;
      const branchId = req.user.branch;

      const result =
        await getDeliveryBoyLedgerBalanceService({
          deliveryBoyId,
          branchId,
        });

      return res.status(200).json({
        success: true,
        message:
          "Delivery boy ledger balance fetched successfully",
        data: result,
      });
    } catch (error) {
      console.error(
        "Get delivery boy ledger balance error:",
        error
      );

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };


export const settleDeliveryBoyLedgerController = async (req, res) => {
  try {
    const { deliveryBoyId } = req.params;
    const { amount, remarks } = req.body;

    const branchId = req.user.branch;
    const createdBy = req.user._id || req.user.id;

    if (amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: "Settlement amount is required",
      });
    }

    const result = await settleDeliveryBoyLedgerService({
      deliveryBoyId,
      branchId,
      amount,
      remarks,
      createdBy,
    });

    return res.status(200).json({
      success: true,
      message: "Delivery boy settlement recorded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Delivery boy settlement error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


export const getDeliveryBoyDailyReportController = async (
  req,
  res
) => {
  try {
    const { deliveryBoyId } = req.params;
    const { date } = req.query;

    const branchId = req.user.branch;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    const result =
      await getDeliveryBoyDailyReportService({
        deliveryBoyId,
        branchId,
        date,
      });

    return res.status(200).json({
      success: true,
      message:
        "Delivery boy daily report fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "Get delivery boy daily report error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


export const getOutstandingCollectionsController = async (
  req,
  res
) => {
  try {
    const { deliveryBoyId } = req.params;
    const branchId = req.user.branch;

    const result =
      await getOutstandingCollectionsService({
        deliveryBoyId,
        branchId,
      });

    return res.status(200).json({
      success: true,
      message:
        "Outstanding collections fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "Get outstanding collections error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const settleSelectedDeliveryBoyLedgerController = async (
  req,
  res
) => {
  try {
    const { deliveryBoyId } = req.params;
    const { ledgerIds, paymentMode, remarks } = req.body;
    const branchId = req.user.branch;
    const createdBy = req.user._id;

    if (!Array.isArray(ledgerIds) || ledgerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one collection entry must be selected",
      });
    }

    const result = await settleSelectedDeliveryBoyLedgerService({
      deliveryBoyId,
      branchId,
      ledgerIds,
      paymentMode,
      remarks,
      createdBy,
    });

    return res.status(200).json({
      success: true,
      message: "Selected collections settled successfully",
      data: result,
    });
  } catch (error) {
    console.error("Settle selected delivery boy ledger error:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};