import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentTrip",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

wishlistSchema.index({ user: 1 });
wishlistSchema.index({ trip: 1 });

const Wishlist = mongoose.model("Wishlist", wishlistSchema);
export default Wishlist;
