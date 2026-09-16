import { Router } from "express";
import { registerPushToken } from "../controllers/pushTokenController";
import protect from "../middleware/authMiddleware";

const router = Router();

router.post("/", protect, registerPushToken);

export default router;
