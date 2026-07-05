import logger from "../utils/logger.js";

/**
 * Global Express Error Middleware
 * ──────────────────────────────
 * Formats uncaught application exceptions into structured JSON log files.
 */
export const errorLogger = (err, req, res, next) => {
  logger.error(err.message || "An unhandled server error occurred", {
    route: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    error: err
  });

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    code: err.code || "INTERNAL_SERVER_ERROR",
  });
};

export default errorLogger;
