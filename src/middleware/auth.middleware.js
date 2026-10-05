import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiErrors.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../modules/user/user.model.js";

const authMiddleware = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    } else if (req.cookies?.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        throw new ApiError(401, "Authentication required");
    }

    try {
        const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
        const decoded = jwt.verify(token, secret);

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