import mongoose from "mongoose";

const exchangeRateCacheSchema = new mongoose.Schema({
  baseCurrency: { type: String, required: true, unique: true },
  rates: { type: Map, of: Number, required: true },
  lastUpdated: { type: Date, default: Date.now }
});

const ExchangeRateCache = mongoose.model("ExchangeRateCache", exchangeRateCacheSchema);

export default ExchangeRateCache;
