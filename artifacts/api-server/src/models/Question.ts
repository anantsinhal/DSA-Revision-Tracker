import mongoose, { Schema, Document } from "mongoose";


export type QuestionSource = "manual" | "leetcode";

export interface QuestionSourceMeta {
  externalId?: string;
  url?: string;
  importedAt?: Date;
}


export interface IQuestion extends Document {
  name: string;
  userId: mongoose.Types.ObjectId | string;
  platform: "LeetCode" | "GeeksForGeeks" | "Codeforces" | "Other";
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  approach: string;
  timeComplexity: string;
  spaceComplexity: string;

  source: QuestionSource;
  sourceMeta?: QuestionSourceMeta;

  confidenceLevel: 1 | 2 | 3 | 4 | 5;

  lastRevisedDate: string;

  nextRevisionDate: string;
  mistakeNotes: string;

  revisionFrequency?: number;

  revisionCount: number;

  createdAt: string;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    name: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    platform: {
      type: String,
      required: true,
      enum: ["LeetCode", "GeeksForGeeks", "Codeforces", "Other"],
    },
    difficulty: {
      type: String,
      required: true,
      enum: ["Easy", "Medium", "Hard"],
    },
    tags: { type: [String], default: [] },
    source: {
      type: String,
      enum: ["manual", "leetcode"],
      default: "manual",
    },
    sourceMeta: {
      externalId: { type: String, trim: true },
      url: { type: String, trim: true },
      importedAt: { type: Date },
    },
    approach: { type: String, default: "" },
    timeComplexity: { type: String, default: "" },
    spaceComplexity: { type: String, default: "" },
    confidenceLevel: { type: Number, required: true, min: 1, max: 5 },
    lastRevisedDate: { type: String, required: true },
    nextRevisionDate: { type: String, required: true },
    mistakeNotes: { type: String, default: "" },
    revisionFrequency: { type: Number },
    revisionCount: { type: Number, default: 0 },
    createdAt: { type: String, required: true },
  },
  {
    /**
     * toJSON transform: expose MongoDB's _id as "id" (string) and strip internal
     * fields (__v, _id) so the response matches the frontend Problem type exactly.
     */
    toJSON: {
      virtuals: false,
      transform(_doc: unknown, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);
// Prevent importing the same LeetCode problem twice for the same user.
QuestionSchema.index(
  { userId: 1, "sourceMeta.externalId": 1 },
  {
    unique: true,
    partialFilterExpression: {
      "sourceMeta.externalId": { $type: "string" },
    },
  }
);

export const Question = mongoose.model<IQuestion>("Question", QuestionSchema);
