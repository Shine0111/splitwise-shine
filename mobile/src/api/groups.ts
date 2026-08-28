import apiClient from "./client";

export interface Group {
  _id: string;
  name: string;
  creator: { _id: string; name: string; email: string };
  members: { _id: string; name: string; email: string }[];
  createdAt: string;
}

export const getMyGroupsRequest = async (): Promise<Group[]> => {
  const response = await apiClient.get<Group[]>("/groups");
  return response.data;
};

export const createGroupRequest = async (name: string): Promise<Group> => {
  const response = await apiClient.post<Group>("/groups", { name });
  return response.data;
};
