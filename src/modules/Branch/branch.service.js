import Branch from "./branch.model.js";
import ApiError from "../../utils/ApiErrors.js";

/**
 * Create Branch
 */
export const createBranchService = async (branchData) => {

    const { name, type } = branchData;

    // Check duplicate branch
    const existingBranch = await Branch.findOne({
        name,
    });

    if (existingBranch) {
        throw new ApiError(
            409,
            "Branch already exists."
        );
    }

    const branch = await Branch.create({
        name,
        type,
    });

    return branch;
};


/**
 * Get All Branches
 */
export const getAllBranchesService = async () => {

    const branches = await Branch.find()
        .sort({ createdAt: -1 })
        .lean();

    return branches;
};


/**
 * Get Branch By ID
 */
export const getBranchByIdService = async (
    branchId
) => {

    const branch = await Branch.findById(
        branchId
    ).lean();

    if (!branch) {
        throw new ApiError(
            404,
            "Branch not found."
        );
    }

    return branch;
};


/**
 * Update Branch
 */
export const updateBranchService = async (
    branchId,
    branchData
) => {

    const branch = await Branch.findById(
        branchId
    );

    if (!branch) {
        throw new ApiError(
            404,
            "Branch not found."
        );
    }

    if (branchData.name) {
        branch.name = branchData.name;
    }

    if (branchData.type) {
        branch.type = branchData.type;
    }

    if (branchData.status) {
        branch.status = branchData.status;
    }

    await branch.save();

    return branch;
};


/**
 * Deactivate Branch
 */
export const deactivateBranchService = async (
    branchId
) => {

    const branch = await Branch.findById(
        branchId
    );

    if (!branch) {
        throw new ApiError(
            404,
            "Branch not found."
        );
    }

    branch.status = "INACTIVE";

    await branch.save();

    return branch;
};