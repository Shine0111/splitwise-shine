import { Router } from "express";
import {
  confirmSettlement,
  createSettlement,
  getGroupSettlements,
  getPendingSettlements,
} from "../controllers/settlementController";
import protect from "../middleware/authMiddleware";

const router = Router();

router.post("/", protect, createSettlement);
router.get("/pending", protect, getPendingSettlements);
router.patch("/:settlementId/confirm", protect, confirmSettlement);
router.get("/:groupId", protect, getGroupSettlements);

export default router;
