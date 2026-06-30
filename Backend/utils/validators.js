// Backend/utils/validators.js

/**
 * Validates email format using RFC 5322 simplified regex.
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return emailRegex.test(email.trim().toLowerCase());
};

/**
 * Validates phone — must be numeric, 7–15 digits (allows leading +).
 * @param {string} phone
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== "string") return false;
  const phoneRegex = /^\+?[0-9]{7,15}$/;
  return phoneRegex.test(phone.trim().replace(/[\s\-().]/g, ""));
};

/**
 * Validates password strength:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * @param {string} password
 * @returns {{ valid: boolean, message: string }}
 */
export const isStrongPassword = (password) => {
  if (!password || typeof password !== "string") {
    return { valid: false, message: "Password is required." };
  }

  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long." };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter." };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter." };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number." };
  }

  return { valid: true, message: "Password is strong." };
};

/**
 * Sanitizes a string by trimming whitespace and removing dangerous HTML characters.
 * @param {string} str
 * @returns {string}
 */
export const sanitizeString = (str) => {
  if (!str || typeof str !== "string") return "";
  return str
    .trim()
    .replace(/[<>'"`;]/g, "") // strip common injection chars
    .replace(/\0/g, "");       // strip null bytes
};

/**
 * Sanitizes an object's string values recursively.
 * @param {object} obj
 * @returns {object}
 */
export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizeString(value);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }
  return result;
};
