import { Router } from "express";
import {
  createExpense,
  getGroupExpenses,
  getGroupBalances,
  deleteExpense,
} from "../controllers/expenseController";
import protect from "../middleware/authMiddleware";

const router = Router();

router.post("/", protect, createExpense);
router.get("/:groupId/balances", protect, getGroupBalances);
router.get("/:groupId", protect, getGroupExpenses);
router.delete("/:expenseId", protect, deleteExpense);

export default router;
