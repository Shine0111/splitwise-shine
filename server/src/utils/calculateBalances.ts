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

interface Transaction {
  from: string;
  to: string;
  amount: number;
}

interface SettlementInput {
  from: Types.ObjectId;
  to: Types.ObjectId;
  amount: number;
}

export const calculateNetBalances = (
  expenses: ExpenseInput[],
  settlements: SettlementInput[],
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

  for (const settlement of settlements) {
    adjust(settlement.from.toString(), settlement.amount);
    adjust(settlement.to.toString(), -settlement.amount);
  }

  return balances;
};

// The greedy transaction algorithm

export const simplifyDebts = (balances: Map<string, number>): Transaction[] => {
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  for (const [userId, balance] of balances.entries()) {
    if (balance > 0) {
      creditors.push({ id: userId, amount: balance });
    } else if (balance < 0) {
      debtors.push({ id: userId, amount: -balance });
    }
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions: Transaction[] = [];

  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const settledAmount = Math.min(creditor.amount, debtor.amount);

    transactions.push({
      from: debtor.id,
      to: creditor.id,
      amount: settledAmount,
    });

    creditor.amount -= settledAmount;
    debtor.amount -= settledAmount;

    if (creditor.amount === 0) i++;
    if (debtor.amount === 0) j++;
  }

  return transactions;
};
