import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

import { AppError } from "../utils/error.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..", "..");
const uploadsDirectory = path.join(backendRoot, "uploads");

fs.mkdirSync(uploadsDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDirectory);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/\s+/g, "-");
    cb(null, `${timestamp}-${sanitizedName}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const isPdfMimeType = file.mimetype === "application/pdf";
  const hasPdfExtension = path.extname(file.originalname).toLowerCase() === ".pdf";

  if (isPdfMimeType && hasPdfExtension) {
    cb(null, true);
    return;
  }

  cb(new AppError("Only PDF files are allowed.", 400));
};

export const uploadPdfMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});
