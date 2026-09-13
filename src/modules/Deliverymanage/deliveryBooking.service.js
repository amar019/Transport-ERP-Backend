import Booking from "../Booking/booking.model.js";
import DeliveryBoy from "../DeliveryBoy/deliveryBoy.model.js";

/*
|--------------------------------------------------------------------------
| GET DELIVERY BOOKINGS
|--------------------------------------------------------------------------
| Fetch bookings that belong to the logged-in Delivery Branch.
*/
export const getDeliveryBookingsService = async (
    branchId,
    filters = {}
) => {
    const query = {};

    if (branchId) {
        query.$or = [
            { toBranch: branchId },
            { fromBranch: branchId },
        ];
    }

    // Optional filters
    if (filters.deliveryStatus) {
        query["delivery.status"] = filters.deliveryStatus;
    }

    if (filters.paymentStatus) {
        query.paymentStatus = filters.paymentStatus;
    }

    if (filters.status) {
        query.status = filters.status;
    }

    const bookings = await Booking.find(query)
        .populate("customer", "shopName ownerName name mobile address customerCode")
        .populate(
            "delivery.deliveryBoy",
            "name mobile status"
        )
        .populate("fromBranch", "name code")
        .populate("toBranch", "name code")
        .populate("memo", "memoNumber memoDate")
        .sort({ createdAt: -1 });

    return bookings;
};


/*
|--------------------------------------------------------------------------
| GET SINGLE DELIVERY BOOKING
|--------------------------------------------------------------------------
*/
export const getDeliveryBookingByIdService = async (
    bookingId,
    branchId
) => {
    const booking = await Booking.findOne({
        _id: bookingId,
        toBranch: branchId,
    })
        .populate("customer", "name mobile address")
        .populate(
            "delivery.deliveryBoy",
            "name mobile status"
        )
        .populate("fromBranch", "name code")
        .populate("toBranch", "name code")
        .populate("memo", "memoNumber memoDate");

    if (!booking) {
        throw new Error("Booking not found");
    }

    return booking;
};


/*
|--------------------------------------------------------------------------
| ASSIGN DELIVERY BOY
|--------------------------------------------------------------------------
| Automatically starts delivery (sets status to OUT_FOR_DELIVERY)
|--------------------------------------------------------------------------
*/
export const assignDeliveryBoyService = async (
    bookingId,
    branchId,
    deliveryBoyId
) => {
    // Find booking inside current branch
    const booking = await Booking.findOne({
        _id: bookingId,
        toBranch: branchId,
        status: "BOOKED",
    });

    if (!booking) {
        throw new Error("Booking not found");
    }

    // Check delivery boy belongs to same branch
    const deliveryBoy = await DeliveryBoy.findOne({
        _id: deliveryBoyId,
        branch: branchId,
        status: "ACTIVE",
    });

    if (!deliveryBoy) {
        throw new Error(
            "Delivery boy not found or inactive"
        );
    }

    // Cannot reassign completed or failed delivery
    if (
        booking.delivery.status === "DELIVERED" ||
        booking.delivery.status === "FAILED"
    ) {
        throw new Error(
            "Delivery cannot be reassigned after completion or failure"
        );
    }

    // Assign delivery boy and automatically start delivery
    booking.delivery.deliveryBoy = deliveryBoy._id;
    booking.delivery.status = "OUT_FOR_DELIVERY";
    booking.delivery.assignedAt = new Date();

    await booking.save();

    return await getDeliveryBookingByIdService(
        booking._id,
        branchId
    );
};


/*
|--------------------------------------------------------------------------
| COUNTER DELIVERY SERVICE
|--------------------------------------------------------------------------
| Directly completes delivery at counter for PENDING bookings
|--------------------------------------------------------------------------
*/
export const counterDeliveryService = async ({
    bookingId,
    branchId,
    amount = 0,
    paymentMode = "CASH",
    remarks = "",
    createdBy,
}) => {
    const booking = await Booking.findOne({
        _id: bookingId,
        toBranch: branchId,
        status: "BOOKED",
    });

    if (!booking) {
        throw new Error("Booking not found");
    }

    if (
        booking.delivery.status === "DELIVERED" ||
        booking.delivery.status === "FAILED"
    ) {
        throw new Error(
            "Delivery cannot be completed after completion or failure"
        );
    }

    const paymentAmount = Number(amount || 0);

    if (paymentAmount > 0) {
        await collectCustomerPaymentService({
            bookingId,
            branchId,
            amount: paymentAmount,
            collectedBy: "BRANCH_OWNER",
            paymentMode,
            remarks: remarks || "Counter delivery collection",
            createdBy,
        });
    }

    const updatedBooking = await Booking.findOne({
        _id: bookingId,
        toBranch: branchId,
    });

    if (updatedBooking) {
        updatedBooking.delivery.status = "DELIVERED";
        updatedBooking.delivery.deliveredAt = new Date();
        updatedBooking.delivery.deliveryBoy = null;
        updatedBooking.delivery.deliveredBy = null;
        if (remarks) {
            updatedBooking.delivery.remarks = remarks;
        }
        await updatedBooking.save();
    }

    return await getDeliveryBookingByIdService(
        bookingId,
        branchId
    );
};


/*
|--------------------------------------------------------------------------
| MARK DELIVERED
|--------------------------------------------------------------------------
| OUT_FOR_DELIVERY → DELIVERED
|--------------------------------------------------------------------------
*/
export const markDeliveredService = async (
    bookingId,
    branchId,
    remarks = ""
) => {
    const booking = await Booking.findOne({
        _id: bookingId,
        toBranch: branchId,
        status: "BOOKED",
    });

    if (!booking) {
        throw new Error("Booking not found");
    }

    if (
        booking.delivery.status === "DELIVERED"
    ) {
        throw new Error(
            "Booking is already marked as delivered"
        );
    }

    booking.delivery.status = "DELIVERED";
    booking.delivery.deliveredAt = new Date();
    booking.delivery.deliveredBy = booking.delivery.deliveryBoy || null;

    if (remarks) {
        booking.delivery.remarks = remarks;
    }

    await booking.save();

    return await getDeliveryBookingByIdService(
        booking._id,
        branchId
    );
};


/*
|--------------------------------------------------------------------------
| MARK DELIVERY FAILED
|--------------------------------------------------------------------------
| OUT_FOR_DELIVERY → FAILED
|--------------------------------------------------------------------------
*/
export const markDeliveryFailedService = async (
    bookingId,
    branchId,
    remarks
) => {
    const booking = await Booking.findOne({
        _id: bookingId,
        toBranch: branchId,
        status: "BOOKED",
    });

    if (!booking) {
        throw new Error("Booking not found");
    }

    if (
        booking.delivery.status !==
        "OUT_FOR_DELIVERY"
    ) {
        throw new Error(
            "Booking must be out for delivery first"
        );
    }

    if (!remarks || !remarks.trim()) {
        throw new Error(
            "Failure reason is required"
        );
    }

    booking.delivery.status =
        "FAILED";

    booking.delivery.remarks =
        remarks.trim();

    await booking.save();

    return await getDeliveryBookingByIdService(
        booking._id,
        branchId
    );
};


/*
|--------------------------------------------------------------------------
| UPDATE PAYMENT
|--------------------------------------------------------------------------
| Handles PAID / PARTIAL / PENDING / CREDIT
|--------------------------------------------------------------------------
*/
export const updatePaymentService = async (
    bookingId,
    branchId,
    paidAmount
) => {
    const booking = await Booking.findOne({
        _id: bookingId,
        toBranch: branchId,
        status: "BOOKED",
    });

    if (!booking) {
        throw new Error("Booking not found");
    }

    const amount = Number(paidAmount);

    if (isNaN(amount)) {
        throw new Error(
            "Paid amount must be a valid number"
        );
    }

    if (amount < 0) {
        throw new Error(
            "Paid amount cannot be negative"
        );
    }

    if (amount > booking.totalAmount) {
        throw new Error(
            "Paid amount cannot be greater than total amount"
        );
    }

    /*
    |--------------------------------------------------------------------------
    | PAID AT BOOKING
    |--------------------------------------------------------------------------
    */
    if (
        booking.collectionType ===
        "PAID_AT_BOOKING"
    ) {
        throw new Error(
            "Payment is already collected at booking"
        );
    }

    booking.paidAmount = amount;

    booking.remainingAmount =
        booking.totalAmount - amount;

    /*
    |--------------------------------------------------------------------------
    | PAYMENT STATUS
    |--------------------------------------------------------------------------
    */

    if (amount === 0) {
        booking.paymentStatus =
            "PENDING";
    } else if (
        amount < booking.totalAmount
    ) {
        booking.paymentStatus =
            "PARTIAL";
    } else {
        booking.paymentStatus =
            "PAID";
        booking.remainingAmount = 0;
    }

    await booking.save();

    return await getDeliveryBookingByIdService(
        booking._id,
        branchId
    );
};




