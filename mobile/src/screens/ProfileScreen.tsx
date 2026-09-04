import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import {
  getPendingSettlementsRequest,
  confirmSettlementRequest,
  Settlement,
} from "../api/settlements";
import { getErrorMessage } from "../utils/errorMessage";
import { colors, spacing } from "../utils/theme";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [pending, setPending] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const fetchPending = async () => {
    try {
      const data = await getPendingSettlementsRequest();
      setPending(data);
    } catch (error) {
      // silent fail is acceptable here — non-critical background data
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPending();
    }, []),
  );

  const handleRespond = async (
    settlementId: string,
    action: "confirm" | "reject",
  ) => {
    setRespondingId(settlementId);
    if (action === "confirm") setIsConfirming(true);
    if (action === "reject") setIsRejecting(true);
    try {
      await confirmSettlementRequest(settlementId, action);
      setPending((prev) => prev.filter((s) => s._id !== settlementId));
    } catch (error: any) {
      Alert.alert("Error", getErrorMessage(error));
    } finally {
      setRespondingId(null);
      setIsConfirming(false);
      setIsRejecting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: logout },
    ]);
  };

  const initials =
    user?.name
      ?.trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.confirmationsSection}>
        <Text style={styles.sectionTitle}>Pending Confirmations</Text>

        {loading ? (
          <ActivityIndicator style={{ marginVertical: 16 }} />
        ) : pending.length === 0 ? (
          <Text style={styles.emptyText}>Nothing pending.</Text>
        ) : (
          <FlatList
            data={pending}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.pendingCard}>
                <Text style={styles.pendingText}>
                  <Text style={styles.bold}>{item.from.name}</Text> says they
                  paid you <Text style={styles.bold}>{item.amount} Ar</Text>
                </Text>
                <Text style={styles.pendingGroup}>{item.group.name}</Text>

                <View style={styles.pendingButtons}>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleRespond(item._id, "reject")}
                    disabled={respondingId === item._id}
                  >
                    <Text style={styles.rejectText}>
                      {isRejecting ? "..." : "Reject"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => handleRespond(item._id, "confirm")}
                    disabled={respondingId === item._id}
                  >
                    <Text style={styles.confirmText}>
                      {isConfirming ? "..." : "Confirm"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary,
    marginRight: spacing.md,
  },
  avatarText: {
    color: colors.surface,
    fontSize: 20,
    fontWeight: "800",
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  email: {
    color: colors.muted,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  emptyText: { color: "#888", fontSize: 14, marginBottom: 24 },
  pendingCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  pendingText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  pendingGroup: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  bold: {
    color: colors.text,
    fontWeight: "700",
  },
  pendingButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  rejectButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    alignItems: "center",
  },
  rejectText: {
    color: colors.danger,
    fontWeight: "700",
    fontSize: 13,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.success,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmText: {
    color: colors.surface,
    fontWeight: "700",
    fontSize: 13,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: "transparent",
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  logoutText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: "700",
  },
  confirmationsSection: {
    flex: 1,
  },
});
