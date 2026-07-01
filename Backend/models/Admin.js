import mongoose from "../config/mongooseMock.js";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      default: "Admin User",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ["Super Admin", "Finance Admin", "Support Admin", "Operations Admin"],
      default: "Super Admin",
    },
    twoFactorEnabled: {
      type: Boolean,
      default: true,
    },
    twoFactorSecret: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: null,
    }
  },
  {
    timestamps: true,
  }
);

// Method to compare passwords
adminSchema.methods.matchPassword = async function(enteredPassword) {
  const hashToCompare = this.passwordHash || this.password;
  if (!hashToCompare) return false;
  return await bcrypt.compare(enteredPassword, hashToCompare);
};

// Hook to hash password before saving
adminSchema.pre("save", async function() {
  // If we have password but no passwordHash, migrate it
  if (this.password && !this.passwordHash) {
    if (this.password.startsWith("$2a$") || this.password.startsWith("$2b$")) {
      this.passwordHash = this.password;
    } else {
      const salt = await bcrypt.genSalt(10);
      this.passwordHash = await bcrypt.hash(this.password, salt);
    }
    this.password = undefined;
  }

  // If password field is present and modified, compute passwordHash
  if (this.isModified("password") && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.password, salt);
    this.password = undefined; // clear out cleartext password
  }
});

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
