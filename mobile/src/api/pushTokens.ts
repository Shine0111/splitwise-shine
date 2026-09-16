import { Platform } from "react-native";
import apiClient from "./client";

export const registerPushToken = async (
  expoPushToken: string,
): Promise<void> => {
  const platform = Platform.OS;

  if (platform !== "ios" && platform !== "android") {
    throw new Error("Push notifications are only supported on iOS and Android");
  }

  await apiClient.post("/push-tokens", {
    expoPushToken,
    platform,
  });
};
