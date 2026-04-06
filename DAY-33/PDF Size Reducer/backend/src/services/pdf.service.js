import fs from "fs/promises";
import { execFile } from "child_process";
import path from "path";
import { promisify } from "util";
import { fileURLToPath } from "url";

import { AppError } from "../utils/error.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..", "..");

const uploadsDirectory = path.join(backendRoot, "uploads");
const outputDirectory = path.join(backendRoot, "output");

const compressionLevels = ["low", "medium", "high"];
const compressionLevelMap = {
  low: "/screen",
  medium: "/ebook",
  high: "/printer",
};
const execFileAsync = promisify(execFile);

const ensureWorkingDirectories = async () => {
  await fs.mkdir(uploadsDirectory, { recursive: true });
  await fs.mkdir(outputDirectory, { recursive: true });
};

export const buildCompressionOptions = () => {
  return {
    levels: compressionLevels,
    supportsTargetSize: true,
    supportsBatchUpload: true,
    modes: ["manual", "target-size"],
  };
};

const countMatches = (content, pattern) => {
  const matches = content.match(pattern);
  return matches ? matches.length : 0;
};

const analyzePdfFile = async (filePath, fileSize) => {
  const buffer = await fs.readFile(filePath);
  const content = buffer.toString("latin1");
  const imageMarkers = countMatches(content, /\/Subtype\s*\/Image/g);
  const textBlockMarkers = countMatches(content, /\bBT\b/g);
  const pageMarkers = countMatches(content, /\/Type\s*\/Page\b/g);

  let documentType = "mixed";

  if (imageMarkers >= textBlockMarkers * 1.5) {
    documentType = "image-heavy";
  } else if (textBlockMarkers >= Math.max(imageMarkers * 1.5, 2)) {
    documentType = "text-heavy";
  }

  const recommendedCompressionLevel =
    documentType === "image-heavy" ? "medium" : documentType === "text-heavy" ? "low" : "medium";

  return {
    documentType,
    recommendedCompressionLevel,
    pageCountEstimate: pageMarkers || null,
    signals: {
      imageMarkers,
      textBlockMarkers,
    },
    sizeInBytes: fileSize,
  };
};

const chooseCompressionLevel = ({ compressionLevel, targetSizeMb, analysis, sourceSizeInBytes }) => {
  if (compressionLevel) {
    return compressionLevel;
  }

  if (!targetSizeMb) {
    return analysis.recommendedCompressionLevel;
  }

  const targetBytes = Number(targetSizeMb) * 1024 * 1024;

  if (!Number.isFinite(targetBytes) || targetBytes <= 0) {
    throw new AppError("targetSizeMb must be a positive number.", 400);
  }

  const ratio = targetBytes / sourceSizeInBytes;

  if (ratio >= 0.85) {
    return "high";
  }

  if (ratio >= 0.5) {
    return analysis.documentType === "image-heavy" ? "medium" : "high";
  }

  return analysis.documentType === "text-heavy" ? "medium" : "low";
};

export const saveUploadedPdf = async (file) => {
  await ensureWorkingDirectories();
  const filePath = path.join(uploadsDirectory, file.filename);
  const analysis = await analyzePdfFile(filePath, file.size);

  return {
    fileId: file.filename,
    filename: file.filename,
    originalName: file.originalname,
    sizeInBytes: file.size,
    analysis,
  };
};

export const createOptimizationJob = async (payload = {}) => {
  const { fileId, filename, compressionLevel, targetSizeMb = null } = payload;
  const sourceFileName = fileId || filename;

  if (!sourceFileName) {
    throw new AppError("fileId or filename is required.", 400);
  }

  await ensureWorkingDirectories();

  const sourceFilePath = path.join(uploadsDirectory, path.basename(sourceFileName));

  try {
    await fs.access(sourceFilePath);
  } catch {
    throw new AppError("Uploaded PDF not found.", 404);
  }

  const sourceStats = await fs.stat(sourceFilePath);
  const analysis = await analyzePdfFile(sourceFilePath, sourceStats.size);
  const resolvedCompressionLevel = chooseCompressionLevel({
    compressionLevel,
    targetSizeMb,
    analysis,
    sourceSizeInBytes: sourceStats.size,
  });

  if (!compressionLevels.includes(resolvedCompressionLevel)) {
    throw new AppError("compressionLevel must be low, medium, or high.", 400);
  }

  const fileBaseName = path.basename(sourceFileName, path.extname(sourceFileName));
  const outputFileName = `${fileBaseName}-${resolvedCompressionLevel}-${Date.now()}.pdf`;
  const outputFilePath = path.join(outputDirectory, outputFileName);

  try {
    console.log(
      `[pdf-service] Starting Ghostscript compression for ${sourceFileName} with level ${resolvedCompressionLevel}`
    );

    await execFileAsync("gs", [
      "-sDEVICE=pdfwrite",
      "-dCompatibilityLevel=1.4",
      `-dPDFSETTINGS=${compressionLevelMap[resolvedCompressionLevel]}`,
      "-dNOPAUSE",
      "-dQUIET",
      "-dBATCH",
      `-sOutputFile=${outputFilePath}`,
      sourceFilePath,
    ]);

    console.log(`[pdf-service] Compression complete: ${outputFileName}`);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new AppError(
        "Ghostscript is not installed or 'gs' is not available in PATH. Please install Ghostscript to enable PDF compression.",
        500
      );
    }

    throw new AppError("Failed to compress PDF with Ghostscript.", 500);
  }

  let outputStats;

  try {
    outputStats = await fs.stat(outputFilePath);
  } catch {
    throw new AppError("Compressed PDF was not generated.", 500);
  }

  return {
    id: `job_${Date.now()}`,
    status: "completed",
    originalFile: path.basename(sourceFileName),
    outputFilename: outputFileName,
    compressionLevel: resolvedCompressionLevel,
    requestedCompressionLevel: compressionLevel || null,
    targetSizeMb,
    originalSizeInBytes: sourceStats.size,
    outputSizeInBytes: outputStats.size,
    analysis,
  };
};

export const getProcessedFilePath = async (filename) => {
  await ensureWorkingDirectories();

  const safeFilename = path.basename(filename);
  const filePath = path.join(outputDirectory, safeFilename);

  try {
    await fs.access(filePath);
    return filePath;
  } catch {
    throw new AppError("Processed PDF not found.", 404);
  }
};
