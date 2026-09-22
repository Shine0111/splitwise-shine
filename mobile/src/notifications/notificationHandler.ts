import * as Notifications from "expo-notifications";
import { navigateToGroup } from "../navigation/navigationRef";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type NotificationData = {
  type?: string;
  groupId?: string;
  expenseId?: string;
  settlementId?: string;
};

export function handleNotificationResponse(
  response: Notifications.NotificationResponse,
) {
  const data = response.notification.request.content.data as NotificationData;

  if (!data.type) {
    return;
  }

  switch (data.type) {
    case "expense_created":
    case "settlement_created":
    case "settlement_confirmed":
    case "settlement_rejected":
    case "member_added":
      if (data.groupId) {
        navigateToGroup(data.groupId);
      }
      break;

    default:
      break;
  }
}
