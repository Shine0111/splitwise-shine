import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import { getExpoPushToken } from "./registerForPushNotifications";
import { registerPushTokenRequest } from "../api/pushTokens";
import { getErrorMessage } from "../utils/errorMessage";

export default function NotificationPermissionPrompt() {
  const { user, loading } = useAuth();
  const hasCheckedPrompt = useRef(false);

  useEffect(() => {
    if (loading || !user || hasCheckedPrompt.current) {
      return;
    }

    const showPromptIfNeeded = async () => {
      const storageKey = `push-notification-prompt-shown:${user.id}`;
      const hasShownPrompt = await AsyncStorage.getItem(storageKey);

      if (hasShownPrompt) {
        return;
      }

      hasCheckedPrompt.current = true;
      await AsyncStorage.setItem(storageKey, "true");

      Alert.alert(
        "Stay up to date",
        "Enable notifications to know when expenses and settlements change in your groups.",
        [
          {
            text: "Not now",
            style: "cancel",
          },
          {
            text: "Enable",
            onPress: () => {
              void enableNotifications();
            },
          },
        ],
      );
    };

    void showPromptIfNeeded();
  }, [loading, user]);

  return null;
}

const enableNotifications = async () => {
  try {
    const expoPushToken = await getExpoPushToken();

    if (!expoPushToken) {
      Alert.alert(
        "Notifications not enabled",
        "You can enable notifications later from your device settings.",
      );
      return;
    }

    await registerPushTokenRequest(expoPushToken);

    Alert.alert(
      "Notifications enabled",
      "You will now receive updates about your groups and settlements.",
    );
  } catch (error) {
    Alert.alert("Could not enable notifications", getErrorMessage(error));
  }
};
