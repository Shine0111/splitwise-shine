import "./src/notifications/notificationHandler";
import * as Notifications from "expo-notifications";
import { AuthProvider } from "./src/context/AuthContext";
import RootNavigator from "./src/navigation/RootNavigator";
import NotificationPermissionPrompt from "./src/notifications/NotificationPermissionPrompt";
import { handleNotificationResponse } from "./src/notifications/notificationHandler";
import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

    const handleInitialNotification = async () => {
      const response = await Notifications.getLastNotificationResponseAsync();

      if (response) {
        handleNotificationResponse(response);
      }
    };

    void handleInitialNotification();

    return () => {
      subscription.remove();
    };
  }, []);
  return (
    <AuthProvider>
      <NotificationPermissionPrompt />
      <RootNavigator />
    </AuthProvider>
  );
}
