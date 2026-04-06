import dotenv from "dotenv";

import app from "./app.js";
import { env } from "./config/env.js";
import { startFileCleanupScheduler } from "./services/file-cleanup.service.js";

dotenv.config();

app.listen(env.port, () => {
  console.log(`Backend server running on http://localhost:${env.port}`);
  startFileCleanupScheduler();
});
