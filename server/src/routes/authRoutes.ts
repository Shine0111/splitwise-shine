import { Router } from "express";
import { loginUser, registerUser } from "../controllers/authController";
import protect from "../middleware/authMiddleware";
import { getMe, logoutUser } from "../controllers/authController";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", protect, logoutUser);
router.get("/me", protect, getMe);

export default router;
