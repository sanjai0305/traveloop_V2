import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
    additionalInfo: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      default: "",
    },
    googleId: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: "",
    },
    authProvider: {
      type: String,
      default: "email",
    },
    xp: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    streak: {
      type: Number,
      default: 0,
    },
    acceptedTerms: {
      type: Boolean,
      default: false,
    },
    termsAcceptedAt: {
      type: Date,
      default: null,
    },
    termsVersion: {
      type: String,
      default: "",
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    firebaseUid: {
      type: String,
      default: "",
    },
    pin: {
      type: String,
      default: "",
    },
    achievements: {
      type: [String],
      default: [],
    },
    lastActiveDate: {
      type: String,
      default: "",
    },
    upiId: {
      type: String,
      default: "",
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      default: "",
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    referredBy: {
      type: String,
      default: "",
    },
    referralCodeUsed: {
      type: String,
      default: "",
    },
    referralVerified: {
      type: Boolean,
      default: false,
    },
    rewardUnlocked: {
      type: Boolean,
      default: false,
    },
    referralCount: {
      type: Number,
      default: 0,
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
    referralDiscount: {
      type: Number,
      default: 0,
    },
    referralCoins: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
      default: "",
    },
    couponPercentage: {
      type: Number,
      default: 0,
    },
    couponStatus: {
      type: String,
      enum: ["Unused", "Used", "Expired"],
      default: "Unused",
    },
    rewardClaimed: {
      type: Boolean,
      default: false,
    },
    rewardExpiry: {
      type: Date,
      default: null,
    },
    scratchCards: [
      {
        cardId: {
          type: String,
          default: () => `SC-${Math.floor(100000 + Math.random() * 900000)}`,
        },
        cardType: {
          type: String,
          enum: ["Bronze", "Silver", "Gold", "Diamond"],
          default: "Bronze",
        },
        rewardType: {
          type: String,
          enum: ["percentage_discount", "flat_discount", "coins", "free_upgrade"],
          default: "percentage_discount",
        },
        rewardValue: {
          type: String,
          default: "",
        },
        scratched: {
          type: Boolean,
          default: false,
        },
        claimed: {
          type: Boolean,
          default: false,
        },
        used: {
          type: Boolean,
          default: false,
        },
        couponCode: {
          type: String,
          default: "",
        },
        claimedAt: {
          type: Date,
          default: null,
        },
        expiresAt: {
          type: Date,
          default: null,
        },
      }
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to automatically generate unique referral code
userSchema.pre("save", async function () {
  if (!this.referralCode) {
    const cleanName = (this.firstName || "USER").replace(/[^a-zA-Z]/g, "").toUpperCase();
    let codeUnique = false;
    let attempts = 0;
    while (!codeUnique && attempts < 10) {
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const testCode = `TLP-${cleanName}-${randNum}`;
      const existing = await mongoose.models.User.findOne({ referralCode: testCode });
      if (!existing) {
        this.referralCode = testCode;
        codeUnique = true;
      }
      attempts++;
    }
    // Fallback if name is empty or we hit conflicts
    if (!this.referralCode) {
      this.referralCode = `TLP-USER-${Math.floor(10000 + Math.random() * 90000)}`;
    }
  }
});

// Index for fast lookups
userSchema.index({ firebaseUid: 1 }, { sparse: true });
userSchema.index({ referralCode: 1 }, { sparse: true });

const User = mongoose.model("User", userSchema);
export default User;