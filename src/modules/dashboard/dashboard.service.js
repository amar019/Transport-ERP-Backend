import mongoose from "mongoose";
import Branch from "../Branch/branch.model.js";
import Booking from "../Booking/booking.model.js";
import DeliveryBoy from "../DeliveryBoy/deliveryBoy.model.js";
import PaymentTransaction from "../paymentTransactions/models/paymentTransaction.model.js";
import DeliveryBoyLedger from "../deliveryboyLedger/deliveryboyLedger.model.js";
import CustomerLedger from "../customerLedger/customerLedger.model.js";
import ApiError from "../../utils/ApiErrors.js";

/**
 * Calculate India (+05:30) date range for filtering
 */
const getISTDateRange = (period = "TODAY", selectedMonth = null) => {
  const now = new Date();
  // Adjust to IST timezone (+05:30)
  const istNow = new Date(now.getTime() + (330 + now.getTimezoneOffset()) * 60000);

  const year = istNow.getFullYear();
  const month = String(istNow.getMonth() + 1).padStart(2, "0");
  const day = String(istNow.getDate()).padStart(2, "0");

  const periodUpper = (period || "TODAY").toUpperCase();

  let startDate, endDate;

  if (periodUpper === "TODAY") {
    startDate = new Date(`${year}-${month}-${day}T00:00:00.000+05:30`);
    endDate = new Date(`${year}-${month}-${day}T23:59:59.999+05:30`);
  } else if (periodUpper === "THIS_WEEK" || periodUpper === "WEEK") {
    const dayOfWeek = istNow.getDay(); // 0 is Sunday
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(istNow);
    monday.setDate(istNow.getDate() - distanceToMonday);
    const mYear = monday.getFullYear();
    const mMonth = String(monday.getMonth() + 1).padStart(2, "0");
    const mDay = String(monday.getDate()).padStart(2, "0");

    startDate = new Date(`${mYear}-${mMonth}-${mDay}T00:00:00.000+05:30`);
    endDate = new Date(`${year}-${month}-${day}T23:59:59.999+05:30`);
  } else if (periodUpper === "CUSTOM_MONTH" && selectedMonth) {
    const [cYear, cMonth] = selectedMonth.split("-");
    const lastDayObj = new Date(Number(cYear), Number(cMonth), 0);
    const lastDay = String(lastDayObj.getDate()).padStart(2, "0");

    startDate = new Date(`${cYear}-${cMonth}-01T00:00:00.000+05:30`);
    endDate = new Date(`${cYear}-${cMonth}-${lastDay}T23:59:59.999+05:30`);
  } else {
    // THIS_MONTH / MONTH
    const lastDayObj = new Date(year, istNow.getMonth() + 1, 0);
    const lastDay = String(lastDayObj.getDate()).padStart(2, "0");

    startDate = new Date(`${year}-${month}-01T00:00:00.000+05:30`);
    endDate = new Date(`${year}-${month}-${lastDay}T23:59:59.999+05:30`);
  }

  return { startDate, endDate, period: periodUpper };
};

/**
 * Fetch Delivery Branch Dashboard Aggregations
 */
export const getDeliveryDashboardService = async (branchId, queryParams = {}) => {
  if (!branchId) {
    throw new ApiError(400, "Branch ID is required");
  }

  const { period = "TODAY", selectedMonth = null } = queryParams;
  const { startDate, endDate, period: resolvedPeriod } = getISTDateRange(period, selectedMonth);

  // 1. Fetch Branch info
  const branchInfo = await Branch.findById(branchId).select("name code type status");
  if (!branchInfo) {
    throw new ApiError(404, "Branch not found");
  }

  const branchObjectId = new mongoose.Types.ObjectId(branchId);

  // Base query for bookings belonging to this delivery branch
  const baseBookingQuery = {
    toBranch: branchId,
    status: { $ne: "CANCELLED" },
  };

  // 2. Operational Metrics (Summary Counts)
  const [
    shipmentsArrived,
    pendingAssignmentCount,
    outForDeliveryCount,
    deliveredCount,
    failedCount,
  ] = await Promise.all([
    // Total arrived shipments for this delivery branch within period
    Booking.countDocuments({
      ...baseBookingQuery,
      createdAt: { $gte: startDate, $lte: endDate },
    }),

    // Pending assignment (live queue)
    Booking.countDocuments({
      ...baseBookingQuery,
      $or: [
        { "delivery.status": { $exists: false } },
        { "delivery.status": "PENDING" },
        { "delivery.status": "BOOKED" },
        { "delivery.status": null },
      ],
    }),

    // Out for delivery (currently active)
    Booking.countDocuments({
      ...baseBookingQuery,
      "delivery.status": "OUT_FOR_DELIVERY",
    }),

    // Delivered in selected period
    Booking.countDocuments({
      ...baseBookingQuery,
      "delivery.status": "DELIVERED",
      updatedAt: { $gte: startDate, $lte: endDate },
    }),

    // Failed in selected period
    Booking.countDocuments({
      ...baseBookingQuery,
      "delivery.status": "FAILED",
      updatedAt: { $gte: startDate, $lte: endDate },
    }),
  ]);

  // 3. Financial Metrics
  // A. TO PAY Outstanding for current branch
  const toPayBookings = await Booking.find({
    ...baseBookingQuery,
    collectionType: "TO_PAY",
    paymentStatus: { $ne: "PAID" },
  }).select("totalAmount paidAmount remainingAmount");

  const toPayOutstanding = toPayBookings.reduce((sum, b) => {
    const rem = b.remainingAmount !== undefined && b.remainingAmount !== null
      ? Number(b.remainingAmount)
      : Number(b.totalAmount || 0) - Number(b.paidAmount || 0);
    return sum + Math.max(0, rem);
  }, 0);

  // B. Customer Collections in Period
  const collectionsAgg = await PaymentTransaction.aggregate([
    {
      $match: {
        branch: branchObjectId,
        type: "CUSTOMER_COLLECTION",
        transactionDate: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]);
  const collectedToday = collectionsAgg[0]?.total || 0;

  // C. Delivery Boys Outstanding (Sum of current ledger balance across active boys)
  const deliveryBoysList = await DeliveryBoy.find({ branch: branchId }).select("name mobile status");

  const deliveryBoysWithStats = await Promise.all(
    deliveryBoysList.map(async (boy) => {
      // 1. Currently assigned (out for delivery)
      const assignedCount = await Booking.countDocuments({
        toBranch: branchId,
        status: { $ne: "CANCELLED" },
        "delivery.deliveryBoy": boy._id,
        "delivery.status": "OUT_FOR_DELIVERY",
      });

      // 2. Delivered in period
      const boyDeliveredCount = await Booking.countDocuments({
        toBranch: branchId,
        status: { $ne: "CANCELLED" },
        "delivery.deliveryBoy": boy._id,
        "delivery.status": "DELIVERED",
        updatedAt: { $gte: startDate, $lte: endDate },
      });

      // 3. Collections in period
      const boyCollectionsAgg = await PaymentTransaction.aggregate([
        {
          $match: {
            branch: branchObjectId,
            deliveryBoy: boy._id,
            type: "CUSTOMER_COLLECTION",
            collectedBy: "DELIVERY_BOY",
            transactionDate: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]);
      const collectionAmount = boyCollectionsAgg[0]?.total || 0;

      // 4. Latest ledger balance for delivery boy
      const latestLedger = await DeliveryBoyLedger.findOne({
        deliveryBoy: boy._id,
        branch: branchId,
      }).sort({ createdAt: -1 });

      const toSettleAmount = Number(latestLedger?.balance || 0);

      return {
        _id: boy._id,
        name: boy.name,
        mobile: boy.mobile,
        status: boy.status,
        assignedCount,
        deliveredCount: boyDeliveredCount,
        collectionAmount,
        toSettleAmount,
      };
    })
  );

  const deliveryBoyOutstanding = deliveryBoysWithStats.reduce(
    (sum, boy) => sum + Number(boy.toSettleAmount || 0),
    0
  );

  // 4. Pending Assignment Queue (Top 5 items)
  const pendingAssignments = await Booking.find({
    ...baseBookingQuery,
    $or: [
      { "delivery.status": { $exists: false } },
      { "delivery.status": "PENDING" },
      { "delivery.status": "BOOKED" },
      { "delivery.status": null },
    ],
  })
    .populate("customer", "shopName ownerName name mobile address")
    .populate("fromBranch", "name code")
    .sort({ createdAt: -1 })
    .limit(5);

  // 5. Recent Delivery Activity (Top 6 items)
  const recentDeliveries = await Booking.find({
    ...baseBookingQuery,
    "delivery.status": { $in: ["OUT_FOR_DELIVERY", "DELIVERED", "FAILED"] },
  })
    .populate("customer", "shopName ownerName name mobile")
    .populate("delivery.deliveryBoy", "name mobile")
    .sort({ updatedAt: -1 })
    .limit(6);

  // 6. Recent Collections (Top 6 PaymentTransaction entries)
  const recentCollections = await PaymentTransaction.find({
    branch: branchId,
    type: "CUSTOMER_COLLECTION",
  })
    .populate("booking", "bookingNumber bookingDate totalAmount")
    .populate("customer", "shopName ownerName name mobile")
    .populate("deliveryBoy", "name mobile")
    .sort({ transactionDate: -1, createdAt: -1 })
    .limit(6);

  return {
    branch: branchInfo,
    period: {
      type: resolvedPeriod,
      from: startDate.toISOString(),
      to: endDate.toISOString(),
    },
    summary: {
      shipmentsArrived,
      pendingAssignment: pendingAssignmentCount,
      outForDelivery: outForDeliveryCount,
      delivered: deliveredCount,
      failed: failedCount,
    },
    payments: {
      toPayOutstanding,
      collectedToday,
      deliveryBoyOutstanding,
      customerOutstanding: toPayOutstanding,
    },
    pendingAssignments,
    deliveryBoys: deliveryBoysWithStats,
    recentDeliveries,
    recentCollections,
  };
};

export default {
  getDeliveryDashboardService,
};
