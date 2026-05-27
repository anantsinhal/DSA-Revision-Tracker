import mongoose, { Schema, Document } from "mongoose";

export type LeetCodeSyncStatus = "idle" | "success" | "partial" | "failed";

export interface ILeetCodeSync {
  lastSyncAt?: Date;
  importedProblemsCount?: number;
  status: LeetCodeSyncStatus;
  lastError?: string;
}

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  leetcodeUsername?: string;
  leetcodeSync?: ILeetCodeSync;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    leetcodeUsername: {
      type: String,
      trim: true,
    },
    leetcodeSync: {
      lastSyncAt: { type: Date },
      importedProblemsCount: { type: Number, min: 0 },
      status: {
        type: String,
        enum: ["idle", "success", "partial", "failed"],
        default: "idle",
      },
      lastError: { type: String },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: false,
      transform(_doc: unknown, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash; // Don't expose password hashes!
      },
    },
  }
);

export const User = mongoose.model<IUser>("User", UserSchema);
