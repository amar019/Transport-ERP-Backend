import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import userService from "./user.service.js";


/**
 * Login
 */
export const loginController = asyncHandler(
    async (req, res) => {

        const {
            username,
            password,
        } = req.body;


        const result =
            await userService.loginUser(
                username,
                password
            );


        return res.status(200).json(
            new ApiResponse(
                200,
                result,
                "Login successful"
            )
        );
    }
);


/**
 * Get Current User
 */
export const getCurrentUserController =
    asyncHandler(
        async (req, res) => {

            const user =
                await userService.getCurrentUser(
                    req.user.id
                );


            return res.status(200).json(
                new ApiResponse(
                    200,
                    user,
                    "User fetched successfully"
                )
            );
        }
    );


/**
 * Change Password
 */
export const changePasswordController =
    asyncHandler(
        async (req, res) => {

            const {
                currentPassword,
                newPassword,
            } = req.body;


            await userService.changePassword(
                req.user.id,
                currentPassword,
                newPassword
            );


            return res.status(200).json(
                new ApiResponse(
                    200,
                    null,
                    "Password changed successfully"
                )
            );
        }
    );



/**
* Logout User
*/
export const logout = asyncHandler(
    async (req, res) => {

        await userService.logoutUser();

        return res.status(200).json(
            new ApiResponse(
                200,
                null,
                "Logout successful"
            )
        );
    }
);

/**
 * Update Profile
 */
export const updateProfileController = asyncHandler(
    async (req, res) => {

        const updatedUser = await userService.updateProfile(
            req.user.id || req.user._id,
            req.body
        );

        return res.status(200).json(
            new ApiResponse(
                200,
                updatedUser,
                "User profile updated successfully"
            )
        );
    }
);