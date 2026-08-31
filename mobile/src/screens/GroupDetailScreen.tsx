import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  getGroupExpensesRequest,
  getGroupBalancesRequest,
  Expense,
  BalanceTransaction,
} from "../api/expenses";
import { addMemberRequest } from "../api/groups";

export default function GroupDetailScreen({ route, navigation }: any) {
  const { groupId, groupName } = route.params;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<BalanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"expenses" | "balances">(
    "expenses",
  );
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  const fetchData = async () => {
    try {
      const [expensesData, balancesData] = await Promise.all([
        getGroupExpensesRequest(groupId),
        getGroupBalancesRequest(groupId),
      ]);
      setExpenses(expensesData);
      setBalances(balancesData);
    } catch (error) {
      Alert.alert("Error", "Failed to load group data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!memberEmail.trim()) {
      Alert.alert("Missing email", "Please enter an email address");
      return;
    }

    setAddingMember(true);
    try {
      await addMemberRequest(groupId, memberEmail.trim());
      setMemberEmail("");
      setAddMemberModalVisible(false);
      Alert.alert("Success", "Member added to the group");
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "Failed to add member. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setAddingMember(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [groupId]),
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{groupName}</Text>
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={() => setAddMemberModalVisible(true)}
        >
          <Text style={styles.inviteButtonText}>Invite Member</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "expenses" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("expenses")}
        >
          <Text
            style={
              activeTab === "expenses" ? styles.tabTextActive : styles.tabText
            }
          >
            Expenses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "balances" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("balances")}
        >
          <Text
            style={
              activeTab === "balances" ? styles.tabTextActive : styles.tabText
            }
          >
            Balances
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "expenses" ? (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item._id}
          contentContainerStyle={expenses.length === 0 && styles.centered}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No expenses yet.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.expenseCard}>
              <View style={styles.expenseRow}>
                <Text style={styles.expenseDescription}>
                  {item.description}
                </Text>
                <Text style={styles.expenseAmount}>{item.amount} Ar</Text>
              </View>
              <Text style={styles.expensePaidBy}>
                Paid by {item.paidBy.name}
              </Text>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={balances}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={balances.length === 0 && styles.centered}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Everyone is settled up.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.balanceCard}>
              <Text style={styles.balanceText}>
                <Text style={styles.balanceName}>{item.from.name}</Text> owes{" "}
                <Text style={styles.balanceName}>{item.to.name}</Text>
              </Text>
              <Text style={styles.balanceAmount}>{item.amount} Ar</Text>
            </View>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          navigation.navigate("AddExpense", { groupId, groupName })
        }
      >
        <Text style={styles.fabText}>+ Add Expense</Text>
      </TouchableOpacity>

      <Modal visible={addMemberModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Invite Member</Text>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              autoCapitalize="none"
              keyboardType="email-address"
              value={memberEmail}
              onChangeText={setMemberEmail}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setAddMemberModalVisible(false);
                  setMemberEmail("");
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleAddMember}
                disabled={addingMember}
              >
                <Text style={styles.createText}>
                  {addingMember ? "Adding..." : "Add"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { marginBottom: 16, marginTop: 8 },
  backButton: { color: "#2563eb", fontSize: 16, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "bold" },
  tabRow: { flexDirection: "row", marginBottom: 16, gap: 8 },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  tabButtonActive: { backgroundColor: "#2563eb" },
  tabText: { color: "#666", fontWeight: "600" },
  tabTextActive: { color: "#fff", fontWeight: "600" },
  emptyText: { color: "#888", fontSize: 15 },
  expenseCard: {
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  expenseRow: { flexDirection: "row", justifyContent: "space-between" },
  expenseDescription: { fontSize: 16, fontWeight: "600" },
  expenseAmount: { fontSize: 16, fontWeight: "600" },
  expensePaidBy: { fontSize: 13, color: "#666", marginTop: 4 },
  balanceCard: {
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceText: { fontSize: 15, flex: 1 },
  balanceName: { fontWeight: "600" },
  balanceAmount: { fontSize: 16, fontWeight: "700", color: "#dc2626" },
  fab: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  fabText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  inviteButton: {
    alignSelf: "flex-start",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  inviteButtonText: { color: "#2563eb", fontSize: 13, fontWeight: "600" },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  cancelText: { color: "#666", fontSize: 15 },
  cancelButton: { paddingVertical: 10, paddingHorizontal: 16 },
  createButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  createText: { color: "#fff", fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
  },
});
