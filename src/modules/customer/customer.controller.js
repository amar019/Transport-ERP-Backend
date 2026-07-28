
import {
    createCustomer,
    getAllCustomers,
    getCustomerById,
    updateCustomer,
    deactivateCustomer,
} from "./customer.service.js";

import asyncHandler from "../../utils/asyncHandler.js";
import ApiErrors from "../../utils/ApiErrors.js";
import ApiResponse from "../../utils/ApiResponse.js";



/**
 * Create Customer
 */
export const createCustomerController = asyncHandler(async (req, res, next) => {

    const customer = await createCustomer(req.body);

    return res.status(201).json(new ApiResponse(201, customer, "Customer created successfully"));

});

// Get All Customers
export const getAllCustomersController = asyncHandler(
    async (req, res) => {
        const customers = await getAllCustomers();

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    customers,
                    "Customers fetched successfully"
                )
            );
    }
);


// Get Customer By ID
export const getCustomerByIdController = asyncHandler(
    async (req, res) => {
        const customer = await getCustomerById(req.params.id);

        if (!customer) {
            throw new ApiErrors(
                404,
                "Customer not found"
            );
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    customer,
                    "Customer fetched successfully"
                )
            );
    }
);

// Update Customer
export const updateCustomerController = asyncHandler(
    async (req, res) => {
        const customer = await updateCustomer(
            req.params.id,
            req.body
        );

        if (!customer) {
            throw new ApiErrors(
                404,
                "Customer not found"
            );
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    customer,
                    "Customer updated successfully"
                )
            );
    }
);

// Deactivate Customer
export const deactivateCustomerController = asyncHandler(
    async (req, res) => {
        const customer = await deactivateCustomer(
            req.params.id
        );

        if (!customer) {
            throw new ApiErrors(
                404,
                "Customer not found"
            );
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    customer,
                    "Customer deactivated successfully"
                )
            );
    }
);