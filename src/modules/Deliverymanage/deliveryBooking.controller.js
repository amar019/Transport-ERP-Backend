import {
    getDeliveryBookingsService,
    getDeliveryBookingByIdService,
    assignDeliveryBoyService,
    startDeliveryService,
    markDeliveredService,
    markDeliveryFailedService,
    updatePaymentService,
} from "./deliveryBooking.service.js";

/*
|--------------------------------------------------------------------------
| GET ALL DELIVERY BOOKINGS
|--------------------------------------------------------------------------
| GET /api/delivery/bookings
|--------------------------------------------------------------------------
*/
export const getDeliveryBookingsController = async (
    req,
    res
) => {
    try {
        const branchId = req.user.branch;

        const bookings =
            await getDeliveryBookingsService(
                branchId,
                req.query
            );

        return res.status(200).json({
            success: true,
            message:
                "Delivery bookings fetched successfully",
            data: bookings,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


/*
|--------------------------------------------------------------------------
| GET SINGLE DELIVERY BOOKING
|--------------------------------------------------------------------------
| GET /api/delivery/bookings/:id
|--------------------------------------------------------------------------
*/
export const getDeliveryBookingByIdController =
    async (req, res) => {
        try {
            const { id } = req.params;
            const branchId = req.user.branch;

            const booking =
                await getDeliveryBookingByIdService(
                    id,
                    branchId
                );

            return res.status(200).json({
                success: true,
                message:
                    "Delivery booking fetched successfully",
                data: booking,
            });
        } catch (error) {
            return res.status(404).json({
                success: false,
                message: error.message,
            });
        }
    };


/*
|--------------------------------------------------------------------------
| ASSIGN DELIVERY BOY
|--------------------------------------------------------------------------
| PATCH /api/delivery/bookings/:id/assign
|--------------------------------------------------------------------------
| Body:
| {
|     "deliveryBoyId": "..."
| }
|--------------------------------------------------------------------------
*/
export const assignDeliveryBoyController =
    async (req, res) => {
        try {
            const { id } = req.params;
            const { deliveryBoyId } = req.body;
            const branchId = req.user.branch;

            if (!deliveryBoyId) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Delivery boy is required",
                });
            }

            const booking =
                await assignDeliveryBoyService(
                    id,
                    branchId,
                    deliveryBoyId
                );

            return res.status(200).json({
                success: true,
                message:
                    "Delivery boy assigned successfully",
                data: booking,
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    };


/*
|--------------------------------------------------------------------------
| START DELIVERY
|--------------------------------------------------------------------------
| PATCH /api/delivery/bookings/:id/out-for-delivery
|--------------------------------------------------------------------------
*/
export const startDeliveryController =
    async (req, res) => {
        try {
            const { id } = req.params;
            const branchId = req.user.branch;

            const booking =
                await startDeliveryService(
                    id,
                    branchId
                );

            return res.status(200).json({
                success: true,
                message:
                    "Booking marked as out for delivery",
                data: booking,
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    };


/*
|--------------------------------------------------------------------------
| MARK DELIVERED
|--------------------------------------------------------------------------
| PATCH /api/delivery/bookings/:id/deliver
|--------------------------------------------------------------------------
| Body:
| {
|     "remarks": "Delivered successfully"
| }
|--------------------------------------------------------------------------
*/
export const markDeliveredController =
    async (req, res) => {
        try {
            const { id } = req.params;
            const { remarks } = req.body;
            const branchId = req.user.branch;

            const booking =
                await markDeliveredService(
                    id,
                    branchId,
                    remarks
                );

            return res.status(200).json({
                success: true,
                message:
                    "Booking marked as delivered",
                data: booking,
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    };


/*
|--------------------------------------------------------------------------
| MARK DELIVERY FAILED
|--------------------------------------------------------------------------
| PATCH /api/delivery/bookings/:id/failed
|--------------------------------------------------------------------------
| Body:
| {
|     "remarks": "Customer was unavailable"
| }
|--------------------------------------------------------------------------
*/
export const markDeliveryFailedController =
    async (req, res) => {
        try {
            const { id } = req.params;
            const { remarks } = req.body;
            const branchId = req.user.branch;

            const booking =
                await markDeliveryFailedService(
                    id,
                    branchId,
                    remarks
                );

            return res.status(200).json({
                success: true,
                message:
                    "Delivery marked as failed",
                data: booking,
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    };


/*
|--------------------------------------------------------------------------
| UPDATE PAYMENT
|--------------------------------------------------------------------------
| PATCH /api/delivery/bookings/:id/payment
|--------------------------------------------------------------------------
| Body:
| {
|     "paidAmount": 500
| }
|--------------------------------------------------------------------------
*/
export const updatePaymentController =
    async (req, res) => {
        try {
            const { id } = req.params;
            const { paidAmount } = req.body;
            const branchId = req.user.branch;

            if (
                paidAmount === undefined ||
                paidAmount === null
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Paid amount is required",
                });
            }

            const booking =
                await updatePaymentService(
                    id,
                    branchId,
                    paidAmount
                );

            return res.status(200).json({
                success: true,
                message:
                    "Payment updated successfully",
                data: booking,
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    };




export const collectCustomerPaymentController =
    async (req, res) => {
        try {
            const { id } = req.params;

            const {
                amount,
                collectedBy,
                paymentMode,
                remarks,
            } = req.body;

            const branchId =
                req.user.branch;

            const createdBy =
                req.user._id || req.user.id;

            if (
                amount === undefined ||
                amount === null
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Payment amount is required",
                });
            }

            if (!collectedBy) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Collected by is required",
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
                message:
                    "Customer payment collected successfully",
                data: result,
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    };