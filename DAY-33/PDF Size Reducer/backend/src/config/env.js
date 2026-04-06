import "dotenv/config";

export const env = {
  port: process.env.PORT || 5000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  fileRetentionHours: Number(process.env.FILE_RETENTION_HOURS || 1),
  cleanupIntervalMinutes: Number(process.env.CLEANUP_INTERVAL_MINUTES || 15),
};
