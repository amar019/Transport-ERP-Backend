import DeliveryBoy from "./deliveryBoy.model.js";

/**
 * Create Delivery Boy
 */
export const createDeliveryBoyService = async (data) => {
    const { name, mobile, branch } = data;
    const branchId = branch?._id || branch;

    // Check duplicate mobile within branch
    const existingDeliveryBoy = await DeliveryBoy.findOne({
        mobile,
        branch: branchId,
    });

    if (existingDeliveryBoy) {
        throw new Error(
            "Delivery boy with this mobile number already exists in this branch"
        );
    }

    const deliveryBoy = await DeliveryBoy.create({
        name,
        mobile,
        branch: branchId,
    });

    return deliveryBoy;
};


/**
 * Get All Delivery Boys
 */
export const getAllDeliveryBoysService = async (branchId, queryParams = {}) => {
    const filter = {};
    const actualBranchId = branchId?._id || branchId;

    // If branchId is provided, only return that branch's delivery boys
    if (actualBranchId) {
        filter.branch = actualBranchId;
    }

    if (queryParams.status) {
        filter.status = queryParams.status;
    }

    return await DeliveryBoy.find(filter)
        .populate("branch", "name code")
        .sort({ createdAt: -1 });
};


/**
 * Get Delivery Boy By ID
 */
export const getDeliveryBoyByIdService = async (id) => {
    const deliveryBoy = await DeliveryBoy.findById(id)
        .populate("branch", "name code");

    if (!deliveryBoy) {
        throw new Error("Delivery boy not found");
    }

    return deliveryBoy;
};


/**
 * Update Delivery Boy
 */
export const updateDeliveryBoyService = async (id, branchId, data) => {
    const actualBranchId = branchId?._id || branchId;
    const deliveryBoy = await DeliveryBoy.findOne({
        _id: id,
        branch: actualBranchId,
    });

    if (!deliveryBoy) {
        throw new Error("Delivery boy not found");
    }

    if (data.mobile && data.mobile !== deliveryBoy.mobile) {
        const existingDeliveryBoy = await DeliveryBoy.findOne({
            mobile: data.mobile,
            branch: actualBranchId,
            _id: { $ne: id },
        });

        if (existingDeliveryBoy) {
            throw new Error(
                "Delivery boy with this mobile number already exists in this branch"
            );
        }
    }

    if (data.name !== undefined) {
        deliveryBoy.name = data.name;
    }

    if (data.mobile !== undefined) {
        deliveryBoy.mobile = data.mobile;
    }

    if (data.status !== undefined) {
        deliveryBoy.status = data.status;
    }

    await deliveryBoy.save();

    return deliveryBoy;
};


/**
 * Deactivate Delivery Boy
 */
export const deactivateDeliveryBoyService = async (id) => {
    const deliveryBoy = await DeliveryBoy.findById(id);

    if (!deliveryBoy) {
        throw new Error("Delivery boy not found");
    }

    deliveryBoy.status = "INACTIVE";

    await deliveryBoy.save();

    return deliveryBoy;
};