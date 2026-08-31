import apiClient from "./client";

export interface Settlement {
  _id: string;
  group: string;
  from: { _id: string; name: string; email: string };
  to: { _id: string; name: string; email: string };
  amount: number;
  createdAt: string;
}

export const createSettlementRequest = async (
  groupId: string,
  to: string,
  amount: number,
): Promise<Settlement> => {
  const response = await apiClient.post<Settlement>("/settlements", {
    groupId,
    to,
    amount,
  });
  return response.data;
};
