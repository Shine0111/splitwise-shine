import { Router } from "express";
import {
  createSettlement,
  getGroupSettlements,
} from "../controllers/settlementController";
import protect from "../middleware/authMiddleware";

const router = Router();

router.post("/", protect, createSettlement);
router.get("/:groupId", protect, getGroupSettlements);

export default router;
