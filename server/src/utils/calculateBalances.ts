import { Types } from "mongoose";

interface SplitInput {
  user: Types.ObjectId;
  amount: number;
}

interface ExpenseInput {
  paidBy: Types.ObjectId;
  amount: number;
  splits: SplitInput[];
}

export const calculateNetBalances = (
  expenses: ExpenseInput[],
): Map<string, number> => {
  const balances = new Map<string, number>();

  const adjust = (userId: string, delta: number) => {
    const current = balances.get(userId) || 0;
    balances.set(userId, current + delta);
  };

  for (const expense of expenses) {
    adjust(expense.paidBy.toString(), expense.amount);

    for (const split of expense.splits) {
      adjust(split.user.toString(), -split.amount);
    }
  }

  return balances;
};
