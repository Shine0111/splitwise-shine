import apiClient from "./client";

export interface ExpenseSplit {
  user: { _id: string; name: string; email: string };
  amount: number;
}

export interface Expense {
  _id: string;
  group: string;
  paidBy: { _id: string; name: string; email: string };
  description: string;
  amount: number;
  splits: ExpenseSplit[];
  createdAt: string;
}

export interface BalanceTransaction {
  from: { _id: string; name: string; email: string };
  to: { _id: string; name: string; email: string };
  amount: number;
}

export const getGroupExpensesRequest = async (
  groupId: string,
): Promise<Expense[]> => {
  const response = await apiClient.get<Expense[]>(`/expenses/${groupId}`);
  return response.data;
};

export const getGroupBalancesRequest = async (
  groupId: string,
): Promise<BalanceTransaction[]> => {
  const response = await apiClient.get<{ transactions: BalanceTransaction[] }>(
    `/expenses/${groupId}/balances`,
  );
  return response.data.transactions;
};

export const createExpenseRequest = async (
  groupId: string,
  description: string,
  amount: number,
): Promise<Expense> => {
  const response = await apiClient.post<Expense>("/expenses", {
    groupId,
    description,
    amount,
  });
  return response.data;
};

export const deleteExpenseRequest = async (
  expenseId: string,
): Promise<void> => {
  await apiClient.delete(`/expenses/${expenseId}`);
};
