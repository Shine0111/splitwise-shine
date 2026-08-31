import { Response } from "express";
import Expense from "../models/Expense";
import Group from "../models/Group";
import { AuthRequest } from "../middleware/authMiddleware";
import { calculateEqualSplit } from "../utils/calculateSplits";
import User from "../models/User";
import {
  calculateNetBalances,
  simplifyDebts,
} from "../utils/calculateBalances";
import Settlement from "../models/Settlement";

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

export const getGroupExpenses = async (req: AuthRequest, res: Response) => {
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

    const expenses = await Expense.find({ group: groupId })
      .populate("paidBy", "name email")
      .populate("splits.user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getGroupBalances = async (req: AuthRequest, res: Response) => {
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

    const expenses = await Expense.find({ group: groupId });
    const settlements = await Settlement.find({ group: groupId });

    const netBalances = calculateNetBalances(expenses, settlements);
    const transactions = simplifyDebts(netBalances);

    const userIds = transactions.flatMap((t) => [t.from, t.to]);
    const uniqueUserIds = [...new Set(userIds)];

    const users = await User.find({ _id: { $in: uniqueUserIds } }).select(
      "name email",
    );
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const resolvedTransactions = transactions.map((t) => ({
      from: userMap.get(t.from),
      to: userMap.get(t.to),
      amount: t.amount,
    }));

    res.status(200).json({ transactions: resolvedTransactions });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response) => {
  try {
    const { expenseId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const isPayer = expense.paidBy.toString() === req.user._id.toString();
    if (!isPayer) {
      return res
        .status(403)
        .json({ message: "Only the person who paid can delete this expense" });
    }

    await Expense.findByIdAndDelete(expenseId);

    res.status(200).json({ message: "Expense deleted", id: expenseId });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
