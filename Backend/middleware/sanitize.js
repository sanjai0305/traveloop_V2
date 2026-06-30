// Backend/middleware/sanitize.js

import { sanitizeObject } from "../utils/validators.js";

/**
 * Express middleware that sanitizes all string fields in req.body.
 * Prevents XSS and injection attacks on all endpoints.
 */
const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  next();
};

export default sanitizeInput;
