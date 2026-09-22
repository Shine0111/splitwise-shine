import DevicePushToken from "../models/DevicePushToken";
import { Types } from "mongoose";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

type NotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

type ExpoTicket = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: {
    error?: string;
    [key: string]: unknown;
  };
};

type ExpoResponse = {
  data?: ExpoTicket[];
  errors?: Array<{
    code?: string;
    message?: string;
  }>;
};

const isExpoPushToken = (token: string) =>
  token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken[");

export const sendPushNotification = async (
  userIds: Types.ObjectId[],
  notification: NotificationPayload,
): Promise<void> => {
  if (userIds.length === 0) {
    return;
  }

  const tokens = await DevicePushToken.find({
    user: { $in: userIds },
    enabled: true,
  }).select("expoPushToken");

  const validTokens = tokens
    .map((token) => token.expoPushToken.trim())
    .filter(isExpoPushToken);

  if (validTokens.length === 0) {
    return;
  }

  // Expo accepts up to 100 messages per request.
  for (let i = 0; i < validTokens.length; i += 100) {
    const batch = validTokens.slice(i, i + 100);

    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        batch.map((to) => ({
          to,
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: "default",
          priority: "high",
        })),
      ),
    });

    const result = (await response.json()) as ExpoResponse;

    if (!response.ok) {
      console.error("Expo push request failed", {
        status: response.status,
        errors: result.errors,
      });
      continue;
    }

    for (const [index, ticket] of (result.data ?? []).entries()) {
      if (
        ticket.status === "error" &&
        ticket.details?.error === "DeviceNotRegistered"
      ) {
        await DevicePushToken.updateOne(
          { expoPushToken: batch[index] },
          { $set: { enabled: false } },
        );
      }
    }

    const failedTickets = (result.data ?? []).filter(
      (ticket) => ticket.status === "error",
    );

    if (failedTickets.length > 0) {
      console.error("Some Expo push tickets failed", failedTickets);
    }
  }
};
