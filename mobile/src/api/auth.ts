import apiClient from "./client";
import { AuthResponse } from "../types";

export const loginRequest = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>("/auth/login", {
    email,
    password,
  });

  return response.data;
};

export const registerRequest = async (
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>("/auth/register", {
    name,
    email,
    password,
  });
  return response.data;
};
