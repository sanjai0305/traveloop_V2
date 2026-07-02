import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
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
      required: true,
    },
    role: {
      type: String,
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
    },
  },
  {
    timestamps: true,
  }
);

// Method to check passwords
adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Hook to hash password before saving if it is new/modified
adminSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) {
    // If the caller sets a plain text 'password' field, hash it and set passwordHash
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.passwordHash = await bcrypt.hash(this.password, salt);
      this.password = undefined;
    }
  }
  next();
});

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
