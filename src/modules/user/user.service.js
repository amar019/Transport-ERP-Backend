import jwt from "jsonwebtoken";
import User from "./user.model.js";
import ApiError from "../../utils/ApiErrors.js";
import Branch from "../Branch/branch.model.js";

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

    await user.save();


    // Create JWT
    const token = jwt.sign(
        {
            id: user._id,
            username: user.username,
            branchId: user.branch._id,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );


    // Remove password
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


/* Logout User
   */
const logoutUser = async () => {

    // JWT based authentication is stateless.
    // Logout is mainly handled by removing    // the token from the client.

    return true;
};



export default {
    loginUser,
    getCurrentUser,
    changePassword,
    logoutUser
};