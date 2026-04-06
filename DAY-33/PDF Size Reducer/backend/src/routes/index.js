import { Router } from "express";

import pdfRoutes from "./pdf.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "API is healthy.",
  });
});

router.use("/", pdfRoutes);

export default router;
