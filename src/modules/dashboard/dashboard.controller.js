import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiErrors.js";
import dashboardService from "./dashboard.service.js";

/**
 * GET /api/dashboard/delivery
 * Fetch Delivery Branch Dashboard Data
 */
export const getDeliveryDashboardController = asyncHandler(async (req, res) => {
  const branchId = req.user?.branch?._id || req.user?.branch;

  if (!branchId) {
    throw new ApiError(400, "User branch context is missing");
  }

  const { period, selectedMonth } = req.query;

  const dashboardData = await dashboardService.getDeliveryDashboardService(branchId, {
    period,
    selectedMonth,
  });

  return res.status(200).json(
    new ApiResponse(200, dashboardData, "Delivery dashboard fetched successfully")
  );
});

export default {
  getDeliveryDashboardController,
};
