import { Router } from "express";

import verifyJWT from "../../middleware/auth.middleware.js";
import validate from "../../middleware/validate.middleware.js";

import {
    createMemoValidation,
} from "./memo.validation.js";

import {
    createMemoController, getAllMemosController,
    getMemoByIdController, updateMemoController,
    deleteMemoController, markMemoOnRouteController,
    markMemoReceivedController, updateMemoCollectionController
} from "./memo.controller.js";

const router = Router();

router.post(
    "/",
    verifyJWT,
    createMemoValidation,
    validate,
    createMemoController
);

router.get("/", verifyJWT, getAllMemosController);

router.get(
    "/:memoId",
    verifyJWT,
    getMemoByIdController
);

router.patch(
    "/:memoId",
    verifyJWT,
    validate,
    updateMemoController
);


router.delete(
    "/:memoId",
    verifyJWT,
    validate,
    deleteMemoController
);


router.patch(
    "/:memoId/on-route",
    verifyJWT,
    markMemoOnRouteController
);


router.patch(
    "/:memoId/received",
    verifyJWT,
    validate,
    markMemoReceivedController
);

router.patch(
    "/:memoId/collection",
    verifyJWT,
    validate,
    updateMemoCollectionController
);




export default router;