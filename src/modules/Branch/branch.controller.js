import {
    createBranchService,
    getAllBranchesService,
    getBranchByIdService,
    updateBranchService,
    deactivateBranchService,
} from "./branch.service.js";

import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";


/**
 * Create Branch
 */
export const createBranchController = asyncHandler(
    async (req, res) => {

        const branch =
            await createBranchService(
                req.body
            );

        return res.status(201).json(
            new ApiResponse(
                201,
                branch,
                "Branch created successfully."
            )
        );
    }
);


/**
 * Get All Branches
 */
export const getAllBranchesController =
    asyncHandler(
        async (req, res) => {

            const branches =
                await getAllBranchesService();

            return res.status(200).json(
                new ApiResponse(
                    200,
                    branches,
                    "Branches fetched successfully."
                )
            );
        }
    );


/**
 * Get Branch By ID
 */
export const getBranchByIdController =
    asyncHandler(
        async (req, res) => {

            const { branchId } =
                req.params;

            const branch =
                await getBranchByIdService(
                    branchId
                );

            return res.status(200).json(
                new ApiResponse(
                    200,
                    branch,
                    "Branch fetched successfully."
                )
            );
        }
    );


/**
 * Update Branch
 */
export const updateBranchController =
    asyncHandler(
        async (req, res) => {

            const { branchId } =
                req.params;

            const branch =
                await updateBranchService(
                    branchId,
                    req.body
                );

            return res.status(200).json(
                new ApiResponse(
                    200,
                    branch,
                    "Branch updated successfully."
                )
            );
        }
    );


/**
 * Deactivate Branch
 */
export const deactivateBranchController =
    asyncHandler(
        async (req, res) => {

            const { branchId } =
                req.params;

            const branch =
                await deactivateBranchService(
                    branchId
                );

            return res.status(200).json(
                new ApiResponse(
                    200,
                    branch,
                    "Branch deactivated successfully."
                )
            );
        }
    );