import { Router } from "express";
import {
  createGroup,
  getMyGroups,
  addMember,
} from "../controllers/groupController";
import protect from "../middleware/authMiddleware";

const router = Router();

router.post("/", protect, createGroup);
router.get("/", protect, getMyGroups);
router.post("/:groupId/members", protect, addMember);

export default router;
