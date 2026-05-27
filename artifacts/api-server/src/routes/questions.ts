import { Router } from "express";
import mongoose from "mongoose";
import { Question } from "../models/Question";
import { RevisionEvent } from "../models/RevisionEvent";
import { authenticate, AuthRequest } from "../middlewares/auth";

/**
 * REST API routes for DSA Questions.
 *
 * GET    /api/questions       — Fetch all questions (newest first)
 * POST   /api/questions       — Create a new question
 * PUT    /api/questions/:id   — Update an existing question by MongoDB ObjectId
 * DELETE /api/questions/:id   — Delete a question by MongoDB ObjectId
 */
const router = Router();
router.use(authenticate as any);

function toIsoDateOnly(date: Date): string {
  return date.toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return toIsoDateOnly(next);
}

function daysForConfidence(confidenceLevel: 1 | 2 | 3 | 4 | 5): number {
  switch (confidenceLevel) {
    case 1:
      return 1;
    case 2:
      return 3;
    case 3:
      return 7;
    case 4:
      return 14;
    case 5:
      return 30;
  }
}

// GET /api/questions — return all stored questions, sorted newest first
router.get("/questions", async (req: AuthRequest, res) => {
  try {
    const questions = await Question.find({ userId: req.user?.userId }).sort({ createdAt: -1 });
    return res.json(questions.map((q) => q.toJSON()));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch questions");
    return res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// POST /api/questions — create a new question; MongoDB generates the _id
router.post("/questions", async (req: AuthRequest, res) => {
  try {
    // Strip any client-supplied "id" field — MongoDB generates its own _id
    const { id: _clientId, source: _source, sourceMeta: _sourceMeta, ...body } = req.body;
    const question = await Question.create({
      ...body,
      userId: req.user?.userId,
      source: "manual",
    });
    return res.status(201).json(question.toJSON());
  } catch (err) {
    req.log.error({ err }, "Failed to create question");
    return res.status(400).json({ error: "Failed to create question" });
  }
});

// PUT /api/questions/:id — update question fields; returns updated document
router.put("/questions/:id", async (req: AuthRequest, res) => {
  try {
    // Strip any "id" in the body to prevent overwriting MongoDB's _id
    const { id: _bodyId, ...updates } = req.body;
    const question = await Question.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.userId },
      updates,
      {
        new: true,          // return the updated document
        runValidators: true, // re-validate enum constraints on update
      }
    );
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    return res.json(question.toJSON());
  } catch (err) {
    req.log.error({ err }, "Failed to update question");
    return res.status(400).json({ error: "Failed to update question" });
  }
});

// DELETE /api/questions/:id — permanently remove a question
router.delete("/questions/:id", async (req: AuthRequest, res) => {
  try {
    const question = await Question.findOneAndDelete({
      _id: req.params.id,
      userId: req.user?.userId,
    });
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete question");
    return res.status(500).json({ error: "Failed to delete question" });
  }
});

/**
 * POST /api/problems/:id/revise
 * POST /api/questions/:id/revise
 *
 * Marks a problem as revised today.
 * - increments revisionCount
 * - sets lastRevisedDate to today
 * - computes nextRevisionDate using confidence→days mapping
 */
router.post(["/problems/:id/revise", "/questions/:id/revise"], async (req: AuthRequest, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    const question = await Question.findOne({ _id: id, userId: req.user?.userId });
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    const bodyConfidence = (req.body?.confidenceLevel ?? undefined) as
      | 1
      | 2
      | 3
      | 4
      | 5
      | undefined;

    if (
      bodyConfidence !== undefined &&
      bodyConfidence !== 1 &&
      bodyConfidence !== 2 &&
      bodyConfidence !== 3 &&
      bodyConfidence !== 4 &&
      bodyConfidence !== 5
    ) {
      return res.status(400).json({ error: "Invalid confidenceLevel" });
    }

    const confidenceBefore = question.confidenceLevel as 1 | 2 | 3 | 4 | 5;
    const confidenceLevel = bodyConfidence ?? confidenceBefore;
    const today = toIsoDateOnly(new Date());
    const nextRevisionDate = addDays(today, daysForConfidence(confidenceLevel));

    question.confidenceLevel = confidenceLevel;
    question.revisionCount = (question.revisionCount ?? 0) + 1;
    question.lastRevisedDate = today;
    question.nextRevisionDate = nextRevisionDate;

    await question.save();

    // Store the Revision Event reliably in MongoDB to track activity/streaks over time
    await RevisionEvent.create({
      userId: req.user?.userId,
      problemId: question._id,
      revisedAt: new Date(),
      confidenceBefore,
      confidenceAfter: confidenceLevel,
      notes: req.body?.notes, // Optional notes passed from client
    });

    return res.json(question.toJSON());
  } catch (err) {
    req.log.error({ err }, "Failed to revise question");
    return res.status(500).json({ error: "Failed to revise question" });
  }
});

export default router;
