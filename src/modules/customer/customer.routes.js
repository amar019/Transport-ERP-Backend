import { Router } from "express";

import {
    createCustomerController,
    getAllCustomersController,
    getCustomerByIdController,
    updateCustomerController,
    deactivateCustomerController,
} from "./customer.controller.js";

import {
    createCustomerValidation,
    updateCustomerValidation,
    customerIdValidation,
} from "./customer.validation.js";

import validate from "../../middleware/validate.middleware.js";
import authMiddleware from "../../middleware/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 65cf2d89b14c3e1234567890
 *         customerCode:
 *           type: string
 *           example: CUS-0001
 *         shopName:
 *           type: string
 *           example: Mahakal Traders
 *         ownerName:
 *           type: string
 *           example: Ramesh Kumar
 *         mobile:
 *           type: string
 *           example: 9876543210
 *         email:
 *           type: string
 *           example: ramesh@mahakal.com
 *         address:
 *           type: string
 *           example: 123 Main Street
 *         area:
 *           type: string
 *           example: Market Yard
 *         city:
 *           type: string
 *           example: Pune
 *         district:
 *           type: string
 *           example: Pune
 *         state:
 *           type: string
 *           example: Maharashtra
 *         pincode:
 *           type: string
 *           example: 411001
 *         deliveryAddress:
 *           type: string
 *           example: Warehouse 4, Market Yard, Pune
 *         pickupAddress:
 *           type: string
 *           example: Shop 12, Market Yard, Pune
 *         notes:
 *           type: string
 *           example: Preferred delivery time afternoon
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *           example: ACTIVE
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CustomerInput:
 *       type: object
 *       required:
 *         - shopName
 *         - ownerName
 *         - mobile
 *       properties:
 *         shopName:
 *           type: string
 *           example: Mahakal Traders
 *         ownerName:
 *           type: string
 *           example: Ramesh Kumar
 *         mobile:
 *           type: string
 *           example: 9876543210
 *         email:
 *           type: string
 *           example: ramesh@mahakal.com
 *         address:
 *           type: string
 *           example: 123 Main Street
 *         area:
 *           type: string
 *           example: Market Yard
 *         city:
 *           type: string
 *           example: Pune
 *         district:
 *           type: string
 *           example: Pune
 *         state:
 *           type: string
 *           example: Maharashtra
 *         pincode:
 *           type: string
 *           example: 411001
 *         deliveryAddress:
 *           type: string
 *           example: Warehouse 4, Market Yard, Pune
 *         pickupAddress:
 *           type: string
 *           example: Shop 12, Market Yard, Pune
 *         notes:
 *           type: string
 *           example: Preferred delivery time afternoon
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *           example: ACTIVE
 */

/**
 * @swagger
 * /customers:
 *   post:
 *     summary: Create a new customer
 *     description: Add a new customer record to the system with auto-generated customer code.
 *     tags:
 *       - Customers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerInput'
 *     responses:
 *       201:
 *         description: Customer created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 201
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 *                 message:
 *                   type: string
 *                   example: Customer created successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 */
router.post(
    "/",
    authMiddleware,
    createCustomerValidation,
    validate,
    createCustomerController
);

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Get all customers
 *     description: Retrieve a list of all registered customers.
 *     tags:
 *       - Customers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customers fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Customer'
 *                 message:
 *                   type: string
 *                   example: Customers fetched successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized.
 */
router.get(
    "/",
    authMiddleware,
    getAllCustomersController
);

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     description: Retrieve details of a specific customer using Mongo ID.
 *     tags:
 *       - Customers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer Mongo ID
 *     responses:
 *       200:
 *         description: Customer fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 *                 message:
 *                   type: string
 *                   example: Customer fetched successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid ID format.
 *       404:
 *         description: Customer not found.
 *       401:
 *         description: Unauthorized.
 */
router.get(
    "/:id",
    authMiddleware,
    customerIdValidation,
    validate,
    getCustomerByIdController
);

/**
 * @swagger
 * /customers/{id}:
 *   patch:
 *     summary: Update customer
 *     description: Update specific fields of an existing customer by ID.
 *     tags:
 *       - Customers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer Mongo ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shopName:
 *                 type: string
 *               ownerName:
 *                 type: string
 *               mobile:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *               area:
 *                 type: string
 *               city:
 *                 type: string
 *               district:
 *                 type: string
 *               state:
 *                 type: string
 *               pincode:
 *                 type: string
 *               deliveryAddress:
 *                 type: string
 *               pickupAddress:
 *                 type: string
 *               notes:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: Customer updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 *                 message:
 *                   type: string
 *                   example: Customer updated successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Validation error or invalid ID format.
 *       404:
 *         description: Customer not found.
 *       401:
 *         description: Unauthorized.
 */
router.patch(
    "/:id",
    authMiddleware,
    updateCustomerValidation,
    validate,
    updateCustomerController
);

/**
 * @swagger
 * /customers/{id}/deactivate:
 *   patch:
 *     summary: Deactivate customer
 *     description: Mark a customer status as INACTIVE.
 *     tags:
 *       - Customers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer Mongo ID
 *     responses:
 *       200:
 *         description: Customer deactivated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 *                 message:
 *                   type: string
 *                   example: Customer deactivated successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid ID format.
 *       404:
 *         description: Customer not found.
 *       401:
 *         description: Unauthorized.
 */
router.patch(
    "/:id/deactivate",
    authMiddleware,
    customerIdValidation,
    validate,
    deactivateCustomerController
);

export default router;