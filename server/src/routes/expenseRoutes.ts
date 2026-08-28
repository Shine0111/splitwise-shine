import { Router } from "express";
import {
  createExpense,
  getGroupExpenses,
  getGroupBalances,
} from "../controllers/expenseController";
import protect from "../middleware/authMiddleware";

const router = Router();

router.post("/", protect, createExpense);
router.get("/:groupId/balances", protect, getGroupBalances);
router.get("/:groupId", protect, getGroupExpenses);

export default router;
