import { Router, type IRouter } from "express";
import healthRouter from "./health";
import questionsRouter from "./questions";
import authRouter from "./auth";
import analyticsRouter from "./analytics";
import integrationsRouter from "./integrations";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use(questionsRouter);
router.use("/analytics", analyticsRouter);
router.use("/integrations", integrationsRouter);

export default router;
