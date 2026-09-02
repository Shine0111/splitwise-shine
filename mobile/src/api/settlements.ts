import apiClient from "./client";

export interface Settlement {
  _id: string;
  group: { _id: string; name: string };
  from: { _id: string; name: string; email: string };
  to: { _id: string; name: string; email: string };
  amount: number;
  status: "pending" | "confirmed" | "rejected";
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

export const getPendingSettlementsRequest = async (): Promise<Settlement[]> => {
  const response = await apiClient.get<Settlement[]>("/settlements/pending");
  return response.data;
};

export const confirmSettlementRequest = async (
  settlementId: string,
  action: "confirm" | "reject",
): Promise<Settlement> => {
  const response = await apiClient.patch<Settlement>(
    `/settlements/${settlementId}/confirm`,
    { action },
  );
  return response.data;
};

export const getGroupSettlementsRequest = async (
  groupId: string,
): Promise<Settlement[]> => {
  const response = await apiClient.get<Settlement[]>(`/settlements/${groupId}`);
  return response.data;
};
