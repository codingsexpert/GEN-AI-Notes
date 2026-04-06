import {
  buildCompressionOptions,
  createOptimizationJob,
  getProcessedFilePath,
  saveUploadedPdf,
} from "../services/pdf.service.js";
import { AppError, asyncHandler } from "../utils/error.js";
import { sendSuccess } from "../utils/response.js";

export const getCompressionOptions = (_req, res) => {
  const options = buildCompressionOptions();

  return sendSuccess(res, {
    message: "Compression options fetched successfully.",
    data: options,
  });
};

export const uploadPdf = asyncHandler(async (req, res) => {
  const uploadedFiles = [...(req.files?.file || []), ...(req.files?.files || [])];

  if (!uploadedFiles.length) {
    throw new AppError("At least one PDF file is required.", 400);
  }

  const uploadedFileData = await Promise.all(uploadedFiles.map((file) => saveUploadedPdf(file)));

  return sendSuccess(res, {
    message: "PDF upload completed successfully.",
    statusCode: 201,
    data: {
      files: uploadedFileData,
      count: uploadedFileData.length,
    },
  });
});

export const compressPdf = asyncHandler(async (req, res) => {
  const job = await createOptimizationJob(req.body);

  return sendSuccess(res, {
    message: "PDF compression completed successfully.",
    data: job,
  });
});

export const downloadProcessedPdf = asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const filePath = await getProcessedFilePath(filename);

  return res.download(filePath, filename);
});
