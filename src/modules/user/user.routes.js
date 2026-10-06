import { Router } from "express";

import {
    loginController,
    refreshTokenController,
    logout,
    getCurrentUserController,
    changePasswordController,
    updateProfileController,
    registerUserController,
    getAllUsersController,
} from "./user.controller.js";

import {
    loginValidation,
    changePasswordValidation,
    registerValidation,
} from "./user.validation.js";


import validate from "../../middleware/validate.middleware.js";
import auth from "../../middleware/auth.middleware.js";

const router = Router();




/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Login User
 *     description: Authenticate user and return JWT token.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: booking
 *               password:
 *                 type: string
 *                 example: booking123
 *     responses:
 *       200:
 *         description: Login successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     user:
 *                       type: object
 *       401:
 *         description: Invalid username or password.
 */
// Public Route
router.post("/login", loginValidation, validate, loginController);

/**
 * @swagger
 * /users/refresh-token:
 *   post:
 *     summary: Refresh Access Token
 *     description: Generate a new access token using a valid refresh token.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Refresh token is expired or invalid
 */
router.post("/refresh-token", refreshTokenController);



/**
 * @swagger
 * /users/logout:
 *   post:
 *     summary: Logout User
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
// Protected Routes
router.post("/logout", auth, logout);


/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get Current User
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user details
 */
router.get("/me", auth, getCurrentUserController);


/**
 * @swagger
 * /users/change-password:
 *   patch:
 *     summary: Change Password
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.patch(
    "/change-password",
    auth,
    changePasswordValidation,
    validate,
    changePasswordController
);

/**
 * Update Profile
 */
router.patch(
    "/update-profile",
    auth,
    updateProfileController
);

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register New User
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post(
    "/register",
    auth,
    registerValidation,
    validate,
    registerUserController
);


/**
 * Get All Users
 */
router.get(
    "/",
    auth,
    getAllUsersController
);

export default router;