// Formatting Utilities

/**
 * Formats a number as INR Currency (e.g. ₹3,500)
 */
export const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
};

/**
 * Formats a date string (YYYY-MM-DD or ISO) into human readable format (e.g. 15 Jul 2026)
 */
export const formatDate = (dateStr: string | Date | undefined): string => {
  if (!dateStr) return "N/A";
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr);
    
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return String(dateStr);
  }
};
