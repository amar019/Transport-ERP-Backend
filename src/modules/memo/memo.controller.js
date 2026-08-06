import asyncHandler from "../../utils/asyncHandler.js";
import {
    createMemoService, getAllMemosService, getMemoByIdService,
    updateMemoService, deleteMemoService, markMemoOnRouteService,
    updateMemoCollectionService
} from "./memo.service.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiErrors from "../../utils/ApiErrors.js";


const createMemoController = asyncHandler(async (req, res) => {
    const memo = await createMemoService(req.body);

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

    const memo = await getAllMemosService();

    return res.status(200).json(new ApiResponse(200, memo, "Memos fetched successfully."));
});


/**
 * Get Memo By Id
 * GET /api/memos/:memoId
 */
const getMemoByIdController = asyncHandler(async (req, res) => {

    const { memoId } = req.params;

    const memo = await getMemoByIdService(memoId);

    return res.status(200).json({
        statusCode: 200,
        data: memo,
        message: "Memo fetched successfully.",
        success: true,
    });

});

const updateMemoController = asyncHandler(async (req, res) => {
    const { memoId } = req.params;

    const memo = await updateMemoService(memoId, req.body);

    return res.status(200).json({
        statusCode: 200,
        data: memo,
        message: "Memo updated successfully.",
        success: true,
    });
})


/**
 * Delete Memo
 */
const deleteMemoController = asyncHandler(
    async (req, res) => {

        const { memoId } = req.params;

        await deleteMemoService(memoId);

        return res.status(200).json(
            new ApiResponse(
                200,
                null,
                "Memo deleted successfully."
            )
        );

    }
);


/**
 * Mark Memo On Route
 */
const markMemoOnRouteController = asyncHandler(
    async (req, res) => {

        const { memoId } = req.params;

        const memo = await markMemoOnRouteService(memoId);

        return res.status(200).json(
            new ApiResponse(
                200,
                memo,
                "Memo marked as On Route successfully."
            )
        );

    }
);


/**
 * Mark Memo Received
 */
const markMemoReceivedController = asyncHandler(
    async (req, res) => {

        const { memoId } = req.params;

        const memo = await markMemoReceivedService(memoId);

        return res.status(200).json(
            new ApiResponse(
                200,
                memo,
                "Memo marked as Received successfully."
            )
        );

    }
);

const updateMemoCollectionController = asyncHandler(
    async (req, res) => {

        const { memoId } = req.params;

        const { amountReceived } = req.body;

        const memo =
            await updateMemoCollectionService(
                memoId,
                amountReceived
            );

        return res.status(200).json(
            new ApiResponse(
                200,
                memo,
                "Memo collection updated successfully."
            )
        );
    }
);


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


