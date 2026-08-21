import { Router } from "express";

import verifyJWT from "../../middleware/auth.middleware.js";
import allowBranch from "../../middleware/branch.middleware.js";
import validate from "../../middleware/validate.middleware.js";

import {
    createMemoValidation,
    updateMemoCollectionValidation,
} from "./memo.validation.js";

import {
    createMemoController,
    getAllMemosController,
    getMemoByIdController,
    updateMemoController,
    deleteMemoController,
    markMemoOnRouteController,
    markMemoReceivedController,
    updateMemoCollectionController
} from "./memo.controller.js";

const router = Router();

/**
 * Create Memo (Draft)
 * POST /api/memos
 * Role: BOOKING branch only
 */
router.post(
    "/",
    verifyJWT,
    allowBranch("BOOKING"),
    createMemoValidation,
    validate,
    createMemoController
);

/**
 * Get All Memos
 * GET /api/memos
 * Role: BOOKING (outgoing) & DELIVERY (incoming) branches
 */
router.get(
    "/",
    verifyJWT,
    allowBranch("BOOKING", "DELIVERY"),
    getAllMemosController
);

/**
 * Get Memo By ID
 * GET /api/memos/:memoId
 * Role: BOOKING & DELIVERY branches (scoped to involved branches)
 */
router.get(
    "/:memoId",
    verifyJWT,
    allowBranch("BOOKING", "DELIVERY"),
    getMemoByIdController
);

/**
 * Update Draft Memo
 * PATCH /api/memos/:memoId
 * Role: BOOKING branch only (origin branch before dispatch)
 */
router.patch(
    "/:memoId",
    verifyJWT,
    allowBranch("BOOKING"),
    updateMemoController
);

/**
 * Delete Draft Memo
 * DELETE /api/memos/:memoId
 * Role: BOOKING branch only (origin branch before dispatch)
 */
router.delete(
    "/:memoId",
    verifyJWT,
    allowBranch("BOOKING"),
    deleteMemoController
);

/**
 * Mark Memo On Route / Dispatched
 * PATCH /api/memos/:memoId/on-route
 * Role: BOOKING branch only (origin branch)
 */
router.patch(
    "/:memoId/on-route",
    verifyJWT,
    allowBranch("BOOKING"),
    markMemoOnRouteController
);

/**
 * Mark Memo Received
 * PATCH /api/memos/:memoId/received
 * Role: DELIVERY branch only (destination branch)
 */
router.patch(
    "/:memoId/received",
    verifyJWT,
    allowBranch("DELIVERY"),
    markMemoReceivedController
);

/**
 * Record Memo Collection / Settlement
 * PATCH /api/memos/:memoId/collection
 * Role: BOOKING branch only (origin branch receiving payment from delivery branch)
 */
router.patch(
    "/:memoId/collection",
    verifyJWT,
    allowBranch("BOOKING"),
    updateMemoCollectionValidation,
    validate,
    updateMemoCollectionController
);

export default router;