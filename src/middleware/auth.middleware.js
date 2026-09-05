import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiErrors.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../modules/User/user.model.js";

const authMiddleware = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Check Authorization header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new ApiError(401, "Authentication required");
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id)
            .populate({
                path: "branch",
                select: "name type status",
            });

        if (!user) {
            throw new ApiError(401, "User not found");
        }

        if (user.status !== "ACTIVE") {
            throw new ApiError(403, "Your account is inactive");
        }

        if (!user.branch) {
            throw new ApiError(403, "No branch is assigned to this user");
        }

        if (user.branch.status !== "ACTIVE") {
            throw new ApiError(403, "Your assigned branch is inactive");
        }

        // Store complete user
        req.user = user;

        next();
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        throw new ApiError(401, "Invalid or expired token");
    }
});

export default authMiddleware;