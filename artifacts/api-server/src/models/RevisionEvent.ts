import mongoose, { Schema, Document } from "mongoose";

export interface IRevisionEvent extends Document {
  userId: mongoose.Types.ObjectId | string;
  problemId: mongoose.Types.ObjectId | string;
  revisedAt: Date;
  confidenceBefore: 1 | 2 | 3 | 4 | 5;
  confidenceAfter: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  createdAt: Date;
}

const RevisionEventSchema = new Schema<IRevisionEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    problemId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    revisedAt: { type: Date, default: Date.now },
    confidenceBefore: { type: Number, required: true, min: 1, max: 5 },
    confidenceAfter: { type: Number, required: true, min: 1, max: 5 },
    notes: { type: String },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Indexes are critical for efficient analytics grouping by date and user
RevisionEventSchema.index({ userId: 1, revisedAt: -1 });
RevisionEventSchema.index({ problemId: 1, revisedAt: -1 });

export const RevisionEvent = mongoose.model<IRevisionEvent>(
  "RevisionEvent",
  RevisionEventSchema
);
