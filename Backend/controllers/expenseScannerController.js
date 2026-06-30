// Backend/controllers/expenseScannerController.js
// OCR-powered receipt scanner — runs entirely on backend, no external API key needed

import { createWorker } from "tesseract.js";
import fs from "fs";
import path from "path";
import os from "os";
import Trip from "../models/Trip.js";

// ── Category detection from OCR text ──
const detectCategory = (text) => {
  const t = text.toLowerCase();

  const CATEGORY_RULES = [
    {
      category: "accommodation",
      keywords: [
        "hotel", "resort", "inn", "hostel", "motel", "lodge", "guesthouse",
        "bed & breakfast", "b&b", "airbnb", "room charge", "check-in", "check out",
        "stay", "accommodation", "suite", "villa", "serviced apartment",
      ],
    },
    {
      category: "food",
      keywords: [
        "restaurant", "cafe", "coffee", "bistro", "diner", "food court",
        "kitchen", "eatery", "bakery", "pizza", "burger", "sushi", "chinese",
        "thai", "indian restaurant", "waiter", "table no", "cover charge",
        "breakfast", "lunch", "dinner", "meal", "beverage", "drinks",
        "swiggy", "zomato", "domino", "kfc", "mcdonald", "subway", "starbucks",
        "chai", "lassi", "thali",
      ],
    },
    {
      category: "transport",
      keywords: [
        "uber", "ola", "rapido", "taxi", "cab", "auto", "rickshaw", "bus",
        "metro", "railway", "train", "flight", "airline", "airport", "fuel",
        "petrol", "diesel", "toll", "parking", "rental", "car hire",
        "transport", "travel", "journey", "ride", "driver", "irctc",
      ],
    },
    {
      category: "activities",
      keywords: [
        "museum", "gallery", "theme park", "amusement", "zoo", "safari",
        "adventure", "trek", "hiking", "tour", "sightseeing", "ticket",
        "entry fee", "pass", "show", "concert", "cinema", "theatre", "event",
        "experience", "activity", "excursion", "boat", "diving",
      ],
    },
    {
      category: "shopping",
      keywords: [
        "mall", "store", "shop", "market", "bazaar", "retail", "boutique",
        "clothing", "fashion", "electronics", "pharmacy", "supermarket",
        "grocery", "amazon", "flipkart", "myntra", "souvenirs", "gifts",
        "accessories", "shoes", "books",
      ],
    },
  ];

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => t.includes(kw))) {
      return rule.category;
    }
  }
  return "shopping"; // Default fallback
};

// ── Amount extraction from OCR text ──
const extractAmount = (text) => {
  // Patterns: ₹1,234.56 | Rs 1234 | 1234.00 | Total: 1,500 | Amount: 2500
  const patterns = [
    /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)/gi,
    /(?:total|amount|grand\s*total|net\s*amount|subtotal|bill\s*amount|payable|due)\s*:?\s*(?:₹|rs\.?)?\s*([\d,]+(?:\.\d{1,2})?)/gi,
    /(?:₹|rs\.?)\s*([\d,]+(?:\.\d{1,2})?)/gi,
    /\b([\d]{3,6}(?:\.\d{1,2})?)\b/g, // Fallback: any standalone number 100-999999
  ];

  const candidates = [];

  for (const pattern of patterns) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(text)) !== null) {
      const raw = match[1]?.replace(/,/g, "");
      const num = parseFloat(raw);
      if (!isNaN(num) && num >= 10 && num <= 9999999) {
        candidates.push(num);
      }
    }
    if (candidates.length > 0) break;
  }

  if (candidates.length === 0) return null;

  // Return the highest plausible amount (most likely to be the total)
  return Math.max(...candidates);
};

// ── Vendor/Merchant extraction ──
const extractVendor = (text) => {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && l.length < 60);

  // The vendor name is usually in the first few non-numeric lines
  for (const line of lines.slice(0, 6)) {
    // Skip lines that are mostly numbers, dates, or single chars
    if (/^\d[\d\s:/-]+$/.test(line)) continue;
    if (/^(invoice|receipt|bill|tax|gst|hsn|qty|amount)/i.test(line)) continue;
    if (line.split(" ").length > 8) continue; // Too many words = probably an address
    return line;
  }
  return "Unknown Merchant";
};

// ── Date extraction ──
const extractDate = (text) => {
  const patterns = [
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/,
    /(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(\d{2,4})/i,
    /date\s*:?\s*(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Return as ISO date string, defaulting to today on any ambiguity
      try {
        const raw = match[0].replace(/date\s*:?\s*/i, "").trim();
        const parsed = new Date(raw);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString().split("T")[0];
        }
      } catch {}
    }
  }
  return new Date().toISOString().split("T")[0];
};

// ── Calculate OCR confidence ──
const calculateConfidence = (amount, vendor, rawText) => {
  let score = 0;
  if (amount !== null) score += 50;
  if (vendor !== "Unknown Merchant") score += 30;
  if (rawText.length > 50) score += 10;
  if (/(?:₹|rs\.?|inr|total|amount)/i.test(rawText)) score += 10;
  return Math.min(score, 100);
};

// ── Main controller ──
export const scanReceipt = async (req, res) => {
  let tempFile = null;

  try {
    // Verify trip ownership if tripId provided
    if (req.body.tripId) {
      const trip = await Trip.findById(req.body.tripId);
      if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
      }
      if (trip.user && trip.user.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
    }

    // Accept base64 image from request body (avoids multer file system complexity)
    const { imageBase64, mimeType = "image/jpeg" } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, message: "imageBase64 is required" });
    }

    // Validate image size (max ~5MB base64 ≈ 3.75MB raw)
    if (imageBase64.length > 7 * 1024 * 1024) {
      return res.status(413).json({ success: false, message: "Image too large. Please use a smaller photo." });
    }

    // Write to temp file for Tesseract
    const ext = mimeType.includes("png") ? ".png" : ".jpg";
    tempFile = path.join(os.tmpdir(), `receipt_${Date.now()}${ext}`);
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
    fs.writeFileSync(tempFile, Buffer.from(base64Data, "base64"));

    // Run Tesseract OCR
    const worker = await createWorker("eng", 1, {
      logger: () => {}, // Suppress verbose logs
    });

    const { data } = await worker.recognize(tempFile);
    await worker.terminate();

    const rawText = data.text || "";

    if (!rawText.trim()) {
      return res.status(422).json({
        success: false,
        message: "Could not read text from the image. Please try a clearer photo.",
      });
    }

    // Extract fields
    const amount   = extractAmount(rawText);
    const vendor   = extractVendor(rawText);
    const category = detectCategory(rawText);
    const date     = extractDate(rawText);
    const confidence = calculateConfidence(amount, vendor, rawText);

    // Clean up temp file
    fs.unlinkSync(tempFile);
    tempFile = null;

    return res.status(200).json({
      success: true,
      result: {
        amount,
        vendor,
        category,
        date,
        confidence,
        rawText: rawText.substring(0, 500), // First 500 chars for debug display
      },
    });
  } catch (error) {
    // Cleanup on error
    if (tempFile) {
      try { fs.unlinkSync(tempFile); } catch {}
    }

    console.error("Expense scanner error:", error);

    if (error.message?.includes("memory")) {
      return res.status(503).json({ success: false, message: "OCR service temporarily unavailable. Try again." });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to process receipt. Please try again with a clearer image.",
    });
  }
};
