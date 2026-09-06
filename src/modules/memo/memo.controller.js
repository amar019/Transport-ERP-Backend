import asyncHandler from "../../utils/asyncHandler.js";
import {
    createMemoService,
    getAllMemosService,
    getMemoByIdService,
    updateMemoService,
    deleteMemoService,
    markMemoOnRouteService,
    markMemoReceivedService,
    updateMemoCollectionService
} from "./memo.service.js";
import ApiResponse from "../../utils/ApiResponse.js";

/**
 * Create Memo
 * POST /api/memos
 */
const createMemoController = asyncHandler(async (req, res) => {
    const memo = await createMemoService(req.body, req.branch, req.user);

    return res.status(201).json(
        new ApiResponse(
            201,
            memo,
            "Memo created successfully."
        )
    );
});

/**
 * Get All Memos
 * GET /api/memos
 */
const getAllMemosController = asyncHandler(async (req, res) => {
    const memos = await getAllMemosService(req.branch, req.query);

    return res.status(200).json(
        new ApiResponse(200, memos, "Memos fetched successfully.")
    );
});

/**
 * Get Memo By ID
 * GET /api/memos/:memoId
 */
const getMemoByIdController = asyncHandler(async (req, res) => {
    const { memoId } = req.params;

    const memo = await getMemoByIdService(memoId, req.branch);

    return res.status(200).json(
        new ApiResponse(200, memo, "Memo fetched successfully.")
    );
});

/**
 * Update Draft Memo
 * PATCH /api/memos/:memoId
 */
const updateMemoController = asyncHandler(async (req, res) => {
    const { memoId } = req.params;

    const memo = await updateMemoService(memoId, req.body, req.branch);

    return res.status(200).json(
        new ApiResponse(200, memo, "Memo updated successfully.")
    );
});

/**
 * Delete Draft Memo
 * DELETE /api/memos/:memoId
 */
const deleteMemoController = asyncHandler(async (req, res) => {
    const { memoId } = req.params;

    await deleteMemoService(memoId, req.branch);

    return res.status(200).json(
        new ApiResponse(
            200,
            null,
            "Memo deleted successfully."
        )
    );
});

/**
 * Mark Memo On Route (Dispatch)
 * PATCH /api/memos/:memoId/on-route
 */
const markMemoOnRouteController = asyncHandler(async (req, res) => {
    const { memoId } = req.params;

    const memo = await markMemoOnRouteService(memoId, req.branch);

    return res.status(200).json(
        new ApiResponse(
            200,
            memo,
            "Memo marked as On Route successfully."
        )
    );
});

/**
 * Mark Memo Received
 * PATCH /api/memos/:memoId/received
 */
const markMemoReceivedController = asyncHandler(async (req, res) => {
    const { memoId } = req.params;

    const memo = await markMemoReceivedService(memoId, req.branch, req.user);

    return res.status(200).json(
        new ApiResponse(
            200,
            memo,
            "Memo marked as Received successfully."
        )
    );
});

/**
 * Record Memo Collection / Settlement
 * PATCH /api/memos/:memoId/collection
 */
const updateMemoCollectionController = asyncHandler(async (req, res) => {
    const { memoId } = req.params;

    const memo = await updateMemoCollectionService(
        memoId,
        req.body,
        req.branch,
        req.user
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            memo,
            "Memo settlement recorded successfully."
        )
    );
});

export {
    createMemoController,
    getAllMemosController,
    getMemoByIdController,
    updateMemoController,
    deleteMemoController,
    markMemoOnRouteController,
    markMemoReceivedController,
    updateMemoCollectionController
};
