import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import userService from "./user.service.js";

/**
 * Login
 */
export const login = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    const data = await userService.loginUser(username, password);

    return res
        .status(200)
        .json(new ApiResponse(200, data, "Login successful"));
});

/**
 * Get Current User
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await userService.getCurrentUser(req.user._id);

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User fetched successfully"));
});

/**
 * Change Password
 */
export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    await userService.changePassword(
        req.user._id,
        currentPassword,
        newPassword
    );

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Password changed successfully"));
});

/**
 * Switch Branch
 */
export const switchBranch = asyncHandler(async (req, res) => {
    const { currentBranch } = req.body;

    const user = await userService.switchBranch(
        req.user._id,
        currentBranch
    );

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Branch switched successfully"));
});

/**
 * Logout
 */
export const logout = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, null, "Logout successful"));
});