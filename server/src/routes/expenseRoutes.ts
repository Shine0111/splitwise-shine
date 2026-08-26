import { Router } from "express";
import { createExpense } from "../controllers/expenseController";
import protect from "../middleware/authMiddleware";

const router = Router();

router.post("/", protect, createExpense);

export default router;
