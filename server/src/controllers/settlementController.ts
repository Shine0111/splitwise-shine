import { Response } from "express";
import Settlement from "../models/Settlement";
import Expense from "../models/Expense";
import Group from "../models/Group";
import { AuthRequest } from "../middleware/authMiddleware";

export const createSettlement = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, to, amount } = req.body;

    if (!groupId || !to || !amount) {
      return res
        .status(400)
        .json({ message: "groupId, to, and amount are required" });
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      return res
        .status(400)
        .json({ message: "Amount must be a positive whole number" });
    }

    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some(
      (memberId) => memberId.toString() === req.user!._id.toString(),
    );
    if (!isMember) {
      return res
        .status(403)
        .json({ message: "You are not a member of this group" });
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
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getGroupSettlements = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some(
      (memberId) => memberId.toString() === req.user!._id.toString(),
    );
    if (!isMember) {
      return res
        .status(403)
        .json({ message: "You are not a member of this group" });
    }

    const settlements = await Settlement.find({ group: groupId })
      .populate("from", "name email")
      .populate("to", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(settlements);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const confirmSettlement = async (req: AuthRequest, res: Response) => {
  try {
    const settlementId = req.params.id;
    const action = req.body.action;

    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (action !== "confirm" && action !== "reject") {
      return res
        .status(400)
        .json({ message: "Action must be 'confirm' or 'reject'" });
    }

    const settlement = await Settlement.findById(settlementId);
    if (!settlement) {
      return res.status(404).json({ message: "Settlement not found" });
    }

    const isRecipient = settlement.to.toString() === req.user?._id.toString();
    if (!isRecipient) {
      return res
        .status(403)
        .json({ message: "Only the recipient can confirm this settlement" });
    }

    if (settlement.status !== "pending") {
      return res
        .status(409)
        .json({ message: "Settlement has already been resolved" });
    }

    settlement.status = action === "confirm" ? "confirmed" : "rejected";
    await settlement.save();

    const populated = await Settlement.findById(settlement._id)
      .populate("from", "name email")
      .populate("to", "name email");

    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
