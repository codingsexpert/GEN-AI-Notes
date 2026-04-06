import { Router } from "express";

import {
  compressPdf,
  downloadProcessedPdf,
  getCompressionOptions,
  uploadPdf,
} from "../controllers/pdf.controller.js";
import { uploadPdfMiddleware } from "../config/multer.js";

const router = Router();

router.get("/options", getCompressionOptions);
router.post(
  "/upload",
  uploadPdfMiddleware.fields([
    { name: "file", maxCount: 1 },
    { name: "files", maxCount: 10 },
  ]),
  uploadPdf
);
router.post("/compress", compressPdf);
router.get("/download/:filename", downloadProcessedPdf);

export default router;
