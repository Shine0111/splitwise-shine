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
      const message =
        error.response?.data?.message || "Failed to respond to settlement";
      Alert.alert("Error", message);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

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
                <Text style={styles.bold}>{item.from.name}</Text> says they paid
                you <Text style={styles.bold}>{item.amount} Ar</Text>
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

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  header: { marginBottom: 24, marginTop: 16 },
  name: { fontSize: 22, fontWeight: "bold" },
  email: { fontSize: 14, color: "#666", marginTop: 4 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#888",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  emptyText: { color: "#888", fontSize: 14, marginBottom: 24 },
  pendingCard: {
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  pendingText: { fontSize: 14, marginBottom: 2 },
  pendingGroup: { fontSize: 12, color: "#888", marginBottom: 12 },
  bold: { fontWeight: "700" },
  pendingButtons: { flexDirection: "row", gap: 8 },
  rejectButton: {
    flex: 1,
    backgroundColor: "#fee2e2",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  rejectText: { color: "#dc2626", fontWeight: "600", fontSize: 13 },
  confirmButton: {
    flex: 1,
    backgroundColor: "#dcfce7",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmText: { color: "#16a34a", fontWeight: "600", fontSize: 13 },
  logoutButton: {
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 32,
  },
  logoutText: { color: "#dc2626", fontSize: 16, fontWeight: "600" },
});
