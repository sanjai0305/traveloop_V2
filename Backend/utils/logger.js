import dotenv from "dotenv";

dotenv.config();

const ENV = process.env.NODE_ENV || "production";

/**
 * Structured Logging Utility
 * ──────────────────────────
 * Standardized JSON logging output for production visibility and error tracking.
 */
export const logger = {
  info: (message, context = {}) => {
    log("info", message, context);
  },
  warn: (message, context = {}) => {
    log("warn", message, context);
  },
  error: (message, context = {}) => {
    log("error", message, context);
  },
  debug: (message, context = {}) => {
    if (ENV !== "production") {
      log("debug", message, context);
    }
  }
};

const log = (level, message, context = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    environment: ENV,
    message: typeof message === "object" ? message.message || JSON.stringify(message) : message,
    ...context
  };

  if (level === "error" && message instanceof Error) {
    logEntry.error = {
      message: message.message,
      stack: message.stack
    };
  }

  console.log(JSON.stringify(logEntry));
};

export default logger;
