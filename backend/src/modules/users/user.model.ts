import { Schema, model, type Types } from 'mongoose';

/** A person who can sign in. Belongs to organisations through memberships. */
const userSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    passwordHash: { type: String, required: true },
    // Brute-force protection: consecutive wrong passwords and a temporary lock.
    failedSignIns: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastSignInAt: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

// One account per email address.
userSchema.index({ email: 1 }, { unique: true });

export interface UserDocument {
  _id: Types.ObjectId;
  email: string;
  name: string;
  passwordHash: string;
  failedSignIns: number;
  lockedUntil: Date | null;
  lastSignInAt: Date | null;
  createdAt: Date;
}

export const UserModel = model('User', userSchema);
