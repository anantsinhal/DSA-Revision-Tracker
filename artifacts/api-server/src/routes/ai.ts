import { Router } from "express";
import OpenAI from "openai";
import { authenticate, AuthRequest } from "../middlewares/auth";

const router = Router();
router.use(authenticate as any);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

router.post("/analyze-mistake", async (req: AuthRequest, res) => {
  const { problemName, difficulty, tags, approach, mistakeNotes, codeAttempt } = req.body;

  if (!problemName) {
    return res.status(400).json({ error: "problemName is required" });
  }

  const systemPrompt = `You are an expert DSA coach and learning assistant. Your job is to help students understand their mistakes and learn patterns — NOT to give away full solutions.

When analyzing code or mistakes:
- Identify the type of error (logic, edge case, complexity, pattern mismatch)
- Suggest the right algorithmic pattern without writing the full solution
- Point out specific lines or concepts that are wrong
- Give a hint toward the fix
- Highlight what patterns to study

Format your response as JSON with these fields:
- errorType: string (e.g. "Logic Error", "Edge Case Missed", "Wrong Pattern", "Complexity Issue", "Boundary Condition")
- patternSuggestion: string (e.g. "This looks like a Sliding Window problem")
- keyIssues: string[] (list of specific problems found, max 4)
- hint: string (a nudge toward the solution without revealing it)
- studyTopics: string[] (what to review, max 3)
- severity: "minor" | "moderate" | "major"`;

  const userPrompt = `Problem: ${problemName}
Difficulty: ${difficulty || "Unknown"}
Tags: ${tags?.join(", ") || "None"}
My approach: ${approach || "Not provided"}
Mistake notes: ${mistakeNotes || "None"}
${codeAttempt ? `\nMy code attempt:\n\`\`\`\n${codeAttempt}\n\`\`\`` : ""}

Analyze my mistakes and help me understand what went wrong and what pattern to study.`;

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: true,
      response_format: { type: "json_object" },
    });

    let fullResponse = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    return void res.end();
  } catch (err: any) {
    req.log.error({ err }, "AI analyze-mistake failed");
    if (!res.headersSent) {
      return res.status(500).json({ error: "AI analysis failed. Please try again." });
    }
    res.write(`data: ${JSON.stringify({ error: "AI analysis failed" })}\n\n`);
    return void res.end();
  }
});

export default router;
