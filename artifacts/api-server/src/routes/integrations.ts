import { Router } from "express";
import { authenticate, AuthRequest } from "../middlewares/auth";
import { User } from "../models/User";
import {
  LeetCodeRateLimitError,
  LeetCodeUpstreamError,
  LeetCodeUserNotFoundError,
  syncProblems,
} from "../services/leetcode";

const router = Router();
router.use(authenticate as any);

router.patch("/leetcode/username", async (req: AuthRequest, res) => {
  try {
    const raw = req.body?.leetcodeUsername;
    if (typeof raw !== "string") {
      return res.status(400).json({ error: "leetcodeUsername must be a string" });
    }

    const leetcodeUsername = raw.trim();

    if (leetcodeUsername.length > 64) {
      return res.status(400).json({ error: "leetcodeUsername is too long" });
    }

    // LeetCode usernames allow alphanumerics, underscores, hyphens, and dots.
    if (leetcodeUsername.length > 0 && !/^[a-zA-Z0-9._-]+$/.test(leetcodeUsername)) {
      return res.status(400).json({ error: "LeetCode username contains invalid characters. Only letters, numbers, dots, hyphens, and underscores are allowed." });
    }

    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      {
        $set: {
          leetcodeUsername: leetcodeUsername.length === 0 ? undefined : leetcodeUsername,
        },
      },
      { new: true, runValidators: true },
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user.toJSON());
  } catch (err) {
    req.log.error({ err }, "Failed to update LeetCode username");
    return res.status(500).json({ error: "Failed to update LeetCode username" });
  }
});

router.post("/leetcode/sync", async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const username = (user as any).leetcodeUsername as string | undefined;
    if (!username || username.trim().length === 0) {
      return res.status(400).json({ error: "LeetCode username not set" });
    }

    const result = await syncProblems({
      userId: req.user!.userId,
      username,
      logger: req.log,
    });

    return res.json(result);
  } catch (err: any) {
    if (err instanceof LeetCodeUserNotFoundError) {
      return res.status(400).json({ error: "Invalid LeetCode username" });
    }

    if (err instanceof LeetCodeRateLimitError) {
      return res.status(429).json({ error: "LeetCode rate limit reached. Try again later." });
    }

    if (err instanceof LeetCodeUpstreamError) {
      req.log.error({ err }, "LeetCode upstream error");
      return res.status(502).json({ error: "LeetCode service error. Try again later." });
    }

    req.log.error({ err }, "Failed to sync LeetCode problems");
    return res.status(500).json({ error: "Failed to sync LeetCode problems" });
  }
});

export default router;
