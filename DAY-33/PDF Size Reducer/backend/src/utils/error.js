import multer from "multer";

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

export const asyncHandler = (handler) => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

export const notFoundHandler = (_req, _res, next) => {
  next(new AppError("Route not found.", 404));
};

export const errorHandler = (error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || "Something went wrong.";

  return res.status(statusCode).json({
    success: false,
    message,
  });
};
