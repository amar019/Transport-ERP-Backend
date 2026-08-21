import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiErrors.js";
import asyncHandler from "../utils/asyncHandler.js";

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

        // Store logged-in user information
        req.user = decoded;

        next();
    } catch (error) {
        throw new ApiError(401, "Invalid or expired token");
    }
});

export default authMiddleware;