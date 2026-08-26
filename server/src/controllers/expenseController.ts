import { Response } from "express";
import Expense from "../models/Expense";
import Group from "../models/Group";
import { AuthRequest } from "../middleware/authMiddleware";
import { calculateEqualSplit } from "../utils/calculateSplits";

export const createExpense = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, description, amount, paidBy } = req.body;

    if (!groupId || !description || !amount) {
      return res
        .status(400)
        .json({ message: "groupId, description, and amount are required" });
    }

    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(401).json({ message: "Group not found" });
    }

    const isMember = group.members.some(
      (memberId) => memberId.toString() === req.user!._id.toString(),
    );

    if (!isMember) {
      return res
        .status(403)
        .json({ message: "You are not a member of this group" });
    }

    const payerId = paidBy || req.user._id;

    const splits = calculateEqualSplit(amount, group.members);

    const expense = await Expense.create({
      group: groupId,
      paidBy: payerId,
      description,
      amount,
      splits,
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate("paidBy", "name email")
      .populate("splits.user", "name email");

    res.status(201).json(populatedExpense);
  } catch (error) {
    if (error instanceof Error && error.message.includes("whole number")) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error });
  }
};
