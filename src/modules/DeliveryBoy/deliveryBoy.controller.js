import {
    createDeliveryBoyService,
    getAllDeliveryBoysService,
    getDeliveryBoyByIdService,
    updateDeliveryBoyService,
    deactivateDeliveryBoyService,
} from "./deliveryBoy.service.js";


/**
 * Create Delivery Boy
 * POST /delivery-boys
 */
export const createDeliveryBoyController = async (req, res) => {
    try {
        const { name, mobile } = req.body;

        if (!name || !mobile) {
            return res.status(400).json({
                success: false,
                message: "Name and mobile are required",
            });
        }

        // Get branch from logged-in user
        const branchId = req.user.branch;

        const deliveryBoy = await createDeliveryBoyService({
            name,
            mobile,
            branch: branchId,
        });

        return res.status(201).json({
            success: true,
            message: "Delivery boy created successfully",
            data: deliveryBoy,
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};


/**
 * Get All Delivery Boys
 * GET /delivery-boys
 */
export const getAllDeliveryBoysController = async (req, res) => {
    try {
        const branchId = req.user.branch;

        const deliveryBoys =
            await getAllDeliveryBoysService(branchId);

        return res.status(200).json({
            success: true,
            message: "Delivery boys fetched successfully",
            data: deliveryBoys,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


/**
 * Get Delivery Boy By ID
 * GET /delivery-boys/:id
 */
export const getDeliveryBoyByIdController = async (req, res) => {
    try {
        const { id } = req.params;

        const deliveryBoy =
            await getDeliveryBoyByIdService(id);

        // Security: make sure delivery boy belongs to user's branch
        if (
            deliveryBoy.branch &&
            deliveryBoy.branch._id.toString() !==
            req.user.branch.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this delivery boy",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Delivery boy fetched successfully",
            data: deliveryBoy,
        });

    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message,
        });
    }
};


/**
 * Update Delivery Boy
 * PATCH /delivery-boys/:id
 */
export const updateDeliveryBoyController = async (req, res) => {
    try {
        const { id } = req.params;
        const branchId = req.user.branch;

        const updatedDeliveryBoy =
            await updateDeliveryBoyService(
                id,
                branchId,
                req.body
            );

        return res.status(200).json({
            success: true,
            message: "Delivery boy updated successfully",
            data: updatedDeliveryBoy,
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};


/**
 * Deactivate Delivery Boy
 * PATCH /delivery-boys/:id/deactivate
 */
export const deactivateDeliveryBoyController = async (req, res) => {
    try {
        const { id } = req.params;

        const deliveryBoy =
            await getDeliveryBoyByIdService(id);

        // Security check
        if (
            deliveryBoy.branch &&
            deliveryBoy.branch._id.toString() !==
            req.user.branch.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to deactivate this delivery boy",
            });
        }

        const deactivatedDeliveryBoy =
            await deactivateDeliveryBoyService(id);

        return res.status(200).json({
            success: true,
            message: "Delivery boy deactivated successfully",
            data: deactivatedDeliveryBoy,
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};