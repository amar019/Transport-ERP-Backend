import express from "express";

import {
    createBranchController,
    getAllBranchesController,
    getBranchByIdController,
    updateBranchController,
    deactivateBranchController,
} from "./branch.controller.js";



import verifyJWT from "../../middleware/auth.middleware.js";


const router = express.Router();


/**
 * Create Branch
 */
router.post(
    "/",

    createBranchController
);


/**
 * Get All Branches
 */
router.get(
    "/",

    getAllBranchesController
);


/**
 * Get Branch By ID
 */
router.get(
    "/:branchId",
    verifyJWT,
    getBranchByIdController
);


/**
 * Update Branch
 */
router.patch(
    "/:branchId",
    verifyJWT,
    updateBranchController
);


/**
 * Deactivate Branch
 */
router.patch(
    "/:branchId/deactivate",
    verifyJWT,
    deactivateBranchController
);


export default router;