import { Response } from "express";
import Settlement from "../models/Settlement";
import Group from "../models/Group";
import { AuthRequest } from "../middleware/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";
import {
  ForbiddenError,
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
  ConflictError,
} from "../utils/errors";

export const createSettlement = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { groupId, to, amount } = req.body;

    if (!groupId || !to || !amount) {
      throw new BadRequestError("groupId, to, and amount are required");
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      throw new BadRequestError("Amount must be a positive whole number");
    }

    if (!req.user) {
      throw new UnauthorizedError("Not authorized");
    }

    const group = await Group.findById(groupId);
    if (!group) {
      throw new NotFoundError("Group not found");
    }

    const isMember = group.members.some(
      (memberId) => memberId.toString() === req.user!._id.toString(),
    );
    if (!isMember) {
      throw new ForbiddenError("You are not a member of this group");
    }

    const settlement = await Settlement.create({
      group: groupId,
      from: req.user._id,
      to,
      amount,
    });

    const populated = await Settlement.findById(settlement._id)
      .populate("from", "name email")
      .populate("to", "name email");

    res.status(201).json(populated);
  },
);

export const getGroupSettlements = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { groupId } = req.params;

    if (!req.user) {
      throw new UnauthorizedError("Not authorized");
    }

    const group = await Group.findById(groupId);
    if (!group) {
      throw new NotFoundError("Group not found");
    }

    const isMember = group.members.some(
      (memberId) => memberId.toString() === req.user!._id.toString(),
    );
    if (!isMember) {
      throw new ForbiddenError("You are not a member of this group");
    }

    const settlements = await Settlement.find({ group: groupId })
      .populate("from", "name email")
      .populate("to", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(settlements);
  },
);

export const confirmSettlement = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const settlementId = req.params.settlementId;
    const action = req.body.action;

    if (!req.user) {
      throw new UnauthorizedError("Not authorized");
    }

    if (action !== "confirm" && action !== "reject") {
      throw new BadRequestError("Action must be 'confirm' or 'reject'");
    }

    const settlement = await Settlement.findById(settlementId);
    if (!settlement) {
      throw new NotFoundError("Settlement not found");
    }

    const isRecipient = settlement.to.toString() === req.user?._id.toString();
    if (!isRecipient) {
      throw new ForbiddenError(
        "Only the recipient can confirm this settlement",
      );
    }

    if (settlement.status !== "pending") {
      throw new ConflictError("Settlement has already been resolved");
    }

    settlement.status = action === "confirm" ? "confirmed" : "rejected";
    await settlement.save();

    const populated = await Settlement.findById(settlement._id)
      .populate("from", "name email")
      .populate("to", "name email");

    res.status(200).json(populated);
  },
);

export const getPendingSettlements = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new UnauthorizedError("Not authorized");
    }

    const settlements = await Settlement.find({
      to: req.user._id,
      status: "pending",
    })
      .populate("from", "name email")
      .populate("to", "name email")
      .populate("group", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(settlements);
  },
);
