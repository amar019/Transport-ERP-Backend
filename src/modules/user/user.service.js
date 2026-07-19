import jwt from "jsonwebtoken";
import User from "./user.model.js";
import ApiError from "../../utils/ApiErrors.js";

/**
 * Login User
 */
const loginUser = async (username, password) => {
    const user = await User.findOne({
        username: username.toLowerCase(),
    }).select("+password");

    if (!user) {
        throw new ApiError(401, "Invalid username or password");
    }

    if (user.status !== "ACTIVE") {
        throw new ApiError(403, "Your account is inactive");
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid username or password");
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
        {
            id: user._id,
            username: user.username,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );

    user.password = undefined;

    return {
        token,
        user,
    };
};

/**
 * Get Current User
 */
const getCurrentUser = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return user;
};

/**
 * Change Password
 */
const changePassword = async (
    userId,
    currentPassword,
    newPassword
) => {
    const user = await User.findById(userId).select("+password");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect = await user.comparePassword(currentPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Current password is incorrect");
    }

    user.password = newPassword;

    await user.save();

    return true;
};

/**
 * Switch Branch
 */
const switchBranch = async (userId, currentBranch) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    user.currentBranch = currentBranch;

    await user.save();

    return user;
};

export default {
    loginUser,
    getCurrentUser,
    changePassword,
    switchBranch,
};