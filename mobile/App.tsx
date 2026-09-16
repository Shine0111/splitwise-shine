import "./src/notifications/notificationHandler";
import { AuthProvider } from "./src/context/AuthContext";
import RootNavigator from "./src/navigation/RootNavigator";
import NotificationPermissionPrompt from "./src/notifications/NotificationPermissionPrompt";

export default function App() {
  return (
    <AuthProvider>
      <NotificationPermissionPrompt />
      <RootNavigator />
    </AuthProvider>
  );
}
