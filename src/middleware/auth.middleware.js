import jwt from "jsonwebtoken";
import User from "../modules/user/user.model.js";
import ApiError from "../utils/ApiErrors.js";
import asyncHandler from "../utils/asyncHandler.js";

const auth = asyncHandler(async (req, res, next) => {
    // Get token from Authorization header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "Access denied. Token not found.");
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.id);

    if (!user) {
        throw new ApiError(401, "Invalid token.");
    }

    // Attach user to request
    req.user = user;

    next();
});

export default auth;