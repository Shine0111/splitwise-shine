import { Router } from "express";
import { loginUser, registerUser } from "../controllers/authController";
import protect from "../middleware/authMiddleware";
import { getMe } from "../controllers/authController";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);

export default router;
