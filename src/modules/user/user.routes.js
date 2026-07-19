import { Router } from "express";

import {
    login,
    logout,
    getCurrentUser,
    changePassword,
    switchBranch,
} from "./user.controller.js";

import {
    loginValidation,
    changePasswordValidation,
    switchBranchValidation,
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
 *                     token:
 *                       type: string
 *                     user:
 *                       type: object
 *       401:
 *         description: Invalid username or password.
 */
// Public Route
router.post("/login", loginValidation, validate, login);



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
router.get("/me", auth, getCurrentUser);


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
    changePassword
);

/**
 * @swagger
 * /users/switch-branch:
 *   patch:
 *     summary: Switch Branch
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Branch switched successfully
 */
router.patch(
    "/switch-branch",
    auth,
    switchBranchValidation,
    validate,
    switchBranch
);

export default router;