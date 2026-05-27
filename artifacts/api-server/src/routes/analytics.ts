import { Router } from "express";
import { authenticate, AuthRequest } from "../middlewares/auth";
import { getSummary, getTopics, getActivity } from "../services/analytics";

const router = Router();
router.use(authenticate as any);

router.get("/summary", async (req: AuthRequest, res) => {
  try {
    const data = await getSummary(req.user!.userId);
    return res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to get analytics summary");
    return res.status(500).json({ error: "Failed to get summary" });
  }
});

router.get("/topics", async (req: AuthRequest, res) => {
  try {
    const data = await getTopics(req.user!.userId);
    return res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to get analytics topics");
    return res.status(500).json({ error: "Failed to get topics" });
  }
});

router.get("/activity", async (req: AuthRequest, res) => {
  try {
    const data = await getActivity(req.user!.userId);
    return res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to get analytics activity");
    return res.status(500).json({ error: "Failed to get activity" });
  }
});

export default router;
