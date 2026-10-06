import jwt from "jsonwebtoken";
import User from "./user.model.js";
import ApiError from "../../utils/ApiErrors.js";
import Branch from "../Branch/branch.model.js";

/**
 * Helper to generate Access and Refresh Tokens
 */
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
        const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY || "15m";

        const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || (process.env.JWT_SECRET + "_refresh");
        const refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY || "1h";

        const accessToken = jwt.sign(
            {
                id: user._id,
                username: user.username,
                branchId: user.branch,
            },
            accessTokenSecret,
            {
                expiresIn: accessTokenExpiry,
            }
        );

        const refreshToken = jwt.sign(
            {
                id: user._id,
            },
            refreshTokenSecret,
            {
                expiresIn: refreshTokenExpiry,
            }
        );

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            500,
            "Something went wrong while generating access and refresh token"
        );
    }
};

/**
 * Login User
 */
const loginUser = async (username, password) => {

    const user = await User.findOne({
        username: username.toLowerCase(),
    })
        .select("+password")
        .populate({
            path: "branch",
            select: "name type status",
        });


    if (!user) {
        throw new ApiError(
            401,
            "Invalid username or password"
        );
    }


    // Check user account
    if (user.status !== "ACTIVE") {
        throw new ApiError(
            403,
            "Your account is inactive"
        );
    }


    // Check branch assigned
    if (!user.branch) {
        throw new ApiError(
            400,
            "No branch is assigned to this user"
        );
    }


    // Check branch status
    if (user.branch.status !== "ACTIVE") {
        throw new ApiError(
            403,
            "Your assigned branch is inactive"
        );
    }


    // Check password
    const isPasswordCorrect =
        await user.comparePassword(password);


    if (!isPasswordCorrect) {
        throw new ApiError(
            401,
            "Invalid username or password"
        );
    }


    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });


    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);


    // Remove password and refreshToken
    user.password = undefined;
    user.refreshToken = undefined;


    return {
        accessToken,
        refreshToken,
        token: accessToken, // for backwards compatibility
        user,
    };
};


/**
 * Refresh Access Token
 */
const refreshAccessToken = async (incomingRefreshToken) => {
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is required");
    }

    try {
        const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || (process.env.JWT_SECRET + "_refresh");
        const decoded = jwt.verify(incomingRefreshToken, refreshTokenSecret);

        const user = await User.findById(decoded?.id).select("+refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or has been used");
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

        return {
            accessToken,
            refreshToken: newRefreshToken,
            token: accessToken,
        };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(401, error?.message || "Invalid or expired refresh token");
    }
};


/**
 * Get Current User
 */
const getCurrentUser = async (userId) => {

    const user = await User.findById(userId)
        .populate({
            path: "branch",
            select: "name type status",
        });


    if (!user) {
        throw new ApiError(
            404,
            "User not found"
        );
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

    const user = await User.findById(userId)
        .select("+password");


    if (!user) {
        throw new ApiError(
            404,
            "User not found"
        );
    }


    const isPasswordCorrect =
        await user.comparePassword(
            currentPassword
        );


    if (!isPasswordCorrect) {
        throw new ApiError(
            400,
            "Current password is incorrect"
        );
    }


    user.password = newPassword;

    await user.save();

    return true;
};


/**
 * Logout User
 */
const logoutUser = async (userId) => {
    if (userId) {
        await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    refreshToken: null,
                },
            },
            {
                new: true,
            }
        );
    }

    return true;
};

/**
 * Update User Profile
 */
const updateProfile = async (userId, updateData) => {
    const { name, username, branch } = updateData;

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (username && username.toLowerCase() !== user.username) {
        const existing = await User.findOne({ username: username.toLowerCase() });
        if (existing) {
            throw new ApiError(409, "Username is already taken");
        }
        user.username = username.toLowerCase();
    }

    if (name) user.name = name;
    if (branch) user.branch = branch;

    await user.save();

    const updatedUser = await User.findById(userId).populate({
        path: "branch",
        select: "name type status",
    });

    return updatedUser;
};

/**
 * Register User
 */
const registerUser = async (userData) => {
    const { name, username, password, branch, status } = userData;

    if (!name || !username || !password || !branch) {
        throw new ApiError(400, "Name, username, password, and branch are required");
    }

    const existingUser = await User.findOne({
        username: username.toLowerCase().trim(),
    });

    if (existingUser) {
        throw new ApiError(409, "Username already exists");
    }

    const branchExists = await Branch.findById(branch);
    if (!branchExists) {
        throw new ApiError(404, "Selected branch does not exist");
    }

    const user = await User.create({
        name: name.trim(),
        username: username.toLowerCase().trim(),
        password,
        branch,
        status: status || "ACTIVE",
    });

    const createdUser = await User.findById(user._id).populate({
        path: "branch",
        select: "name type status",
    });

    return createdUser;
};

/**
 * Get All Users
 */
const getAllUsers = async () => {
    const users = await User.find()
        .populate({
            path: "branch",
            select: "name type status",
        })
        .select("-password")
        .sort({ createdAt: -1 })
        .lean();

    return users;
};

export default {
    loginUser,
    generateAccessAndRefreshTokens,
    refreshAccessToken,
    getCurrentUser,
    changePassword,
    logoutUser,
    updateProfile,
    registerUser,
    getAllUsers,
};