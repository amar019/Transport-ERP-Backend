import ApiError from "../utils/ApiErrors.js";
import User from "../modules/user/user.model.js";
import Branch from "../modules/Branch/branch.model.js";
import asyncHandler from "../utils/asyncHandler.js";

const allowBranch = (...allowedBranches) => {
    return asyncHandler(async (req, res, next) => {
        if (!req.user) {
            throw new ApiError(401, "Authentication required");
        }

        const user = await User.findById(req.user.id).populate({
            path: "branch",
            select: "name type status",
        });

        if (!user) {
            throw new ApiError(401, "User not found");
        }

        if (user.status !== "ACTIVE") {
            throw new ApiError(403, "User account is inactive");
        }

        if (!user.branch) {
            throw new ApiError(403, "No branch assigned to user");
        }

        if (user.branch.status !== "ACTIVE") {
            throw new ApiError(403, "Branch is inactive");
        }

        if (!allowedBranches.includes(user.branch.type)) {
            throw new ApiError(
                403,
                `You do not have access to this branch (${user.branch.type}). Allowed: ${allowedBranches.join(", ")}`
            );
        }

        // Store branch information
        req.branch = user.branch;

        next();
    });
};

export default allowBranch;