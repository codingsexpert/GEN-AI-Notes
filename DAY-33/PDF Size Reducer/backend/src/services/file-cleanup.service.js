import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import { env } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..", "..");

const managedDirectories = [path.join(backendRoot, "uploads"), path.join(backendRoot, "output")];

const removeExpiredFiles = async () => {
  const retentionMs = env.fileRetentionHours * 60 * 60 * 1000;
  const expiryTime = Date.now() - retentionMs;

  for (const directory of managedDirectories) {
    await fs.mkdir(directory, { recursive: true });
    const entries = await fs.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile() || entry.name === ".gitkeep") {
        continue;
      }

      const filePath = path.join(directory, entry.name);
      const stats = await fs.stat(filePath);

      if (stats.mtimeMs < expiryTime) {
        await fs.unlink(filePath);
        console.log(`[cleanup] Deleted expired file: ${entry.name}`);
      }
    }
  }
};

export const startFileCleanupScheduler = () => {
  removeExpiredFiles().catch((error) => {
    console.error("[cleanup] Initial cleanup failed:", error.message);
  });

  const intervalMs = env.cleanupIntervalMinutes * 60 * 1000;

  setInterval(() => {
    removeExpiredFiles().catch((error) => {
      console.error("[cleanup] Scheduled cleanup failed:", error.message);
    });
  }, intervalMs);
};
