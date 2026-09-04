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
import { asyncHandler } from "../utils/asyncHandler";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} from "../utils/errors";

export const createExpense = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { groupId, description, amount, paidBy } = req.body;

    if (!groupId || !description || !amount) {
      throw new BadRequestError(
        "groupId, description, and amount are required",
      );
    }

    if (!req.user) {
      throw new UnauthorizedError();
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
  },
);

export const getGroupExpenses = asyncHandler(
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
      return res
        .status(403)
        .json({ message: "You are not a member of this group" });
    }

    const expenses = await Expense.find({ group: groupId })
      .populate("paidBy", "name email")
      .populate("splits.user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(expenses);
  },
);

export const getGroupBalances = asyncHandler(
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

    const expenses = await Expense.find({ group: groupId });
    const settlements = await Settlement.find({
      group: groupId,
      status: "confirmed",
    });

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
  },
);

export const deleteExpense = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { expenseId } = req.params;

    if (!req.user) {
      throw new UnauthorizedError("Not authorized");
    }

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      throw new NotFoundError("Expense not found");
    }

    const isPayer = expense.paidBy.toString() === req.user._id.toString();
    if (!isPayer) {
      throw new ForbiddenError(
        "Only the person who paid can delete this expense",
      );
    }

    await Expense.findByIdAndDelete(expenseId);

    res.status(200).json({ message: "Expense deleted", id: expenseId });
  },
);
