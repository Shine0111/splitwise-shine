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
  deleteExpenseRequest,
} from "../api/expenses";
import { addMemberRequest } from "../api/groups";
import { useAuth } from "../context/AuthContext";
import {
  createSettlementRequest,
  getGroupSettlementsRequest,
  Settlement,
} from "../api/settlements";
import { getErrorMessage } from "../utils/errorMessage";
import { colors, spacing } from "../utils/theme";

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
  const { user } = useAuth();
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [settlingTransaction, setSettlingTransaction] =
    useState<BalanceTransaction | null>(null);
  const [settling, setSettling] = useState(false);
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  const fetchData = async () => {
    try {
      const [expensesData, balancesData, settlementsData] = await Promise.all([
        getGroupExpensesRequest(groupId),
        getGroupBalancesRequest(groupId),
        getGroupSettlementsRequest(groupId),
      ]);
      setExpenses(expensesData);
      setBalances(balancesData);
      setSettlements(settlementsData);
    } catch (error) {
      Alert.alert("Error", "Failed to load group data");
    } finally {
      setLoading(false);
    }
  };

  const hasPendingSettlement = (transaction: BalanceTransaction) => {
    const relevantSettlements = settlements
      .filter(
        (s) =>
          s.from._id === transaction.from._id &&
          s.to._id === transaction.to._id,
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    const latest = relevantSettlements[0];
    return latest?.status === "pending";
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
      Alert.alert("Error", getErrorMessage(error));
    } finally {
      setAddingMember(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;

    Alert.alert(
      "Delete expense",
      `Delete "${selectedExpense.description}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteExpenseRequest(selectedExpense._id);
              setSelectedExpense(null);
              fetchData();
            } catch (error: any) {
              Alert.alert("Error", getErrorMessage(error));
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const handleSettle = async () => {
    if (!settlingTransaction) return;

    setSettling(true);
    try {
      await createSettlementRequest(
        groupId,
        settlingTransaction.to._id,
        settlingTransaction.amount,
      );
      setSettlingTransaction(null);
      Alert.alert(
        "Request sent",
        `${settlingTransaction.to.name} needs to confirm before this is reflected in the balance.`,
      );
      fetchData();
    } catch (error: any) {
      Alert.alert("Error", getErrorMessage(error));
    } finally {
      setSettling(false);
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
            <TouchableOpacity
              style={styles.expenseCard}
              onPress={() => setSelectedExpense(item)}
            >
              <View style={styles.expenseRow}>
                <Text style={styles.expenseDescription}>
                  {item.description}
                </Text>
                <Text style={styles.expenseAmount}>{item.amount} Ar</Text>
              </View>
              <Text style={styles.expensePaidBy}>
                Paid by {item.paidBy.name}
              </Text>
            </TouchableOpacity>
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
          renderItem={({ item }) => {
            const isPending = hasPendingSettlement(item);

            return (
              <View style={styles.balanceCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.balanceText}>
                    <Text style={styles.balanceName}>{item.from.name}</Text>{" "}
                    owes <Text style={styles.balanceName}>{item.to.name}</Text>
                  </Text>
                  <Text style={styles.balanceAmount}>{item.amount} Ar</Text>
                </View>

                {user?.id === item.from._id &&
                  (isPending ? (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>Pending</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.settleButton}
                      onPress={() => setSettlingTransaction(item)}
                    >
                      <Text style={styles.settleButtonText}>Settle Up</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            );
          }}
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
      <Modal visible={!!selectedExpense} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedExpense && (
              <>
                <Text style={styles.modalTitle}>
                  {selectedExpense.description}
                </Text>
                <Text style={styles.detailAmount}>
                  {selectedExpense.amount} Ar
                </Text>
                <Text style={styles.detailPaidBy}>
                  Paid by {selectedExpense.paidBy.name}
                </Text>

                <Text style={styles.splitHeader}>Split</Text>
                {selectedExpense.splits.map((split) => (
                  <View key={split.user._id} style={styles.splitRow}>
                    <Text style={styles.splitName}>{split.user.name}</Text>
                    <Text style={styles.splitAmount}>{split.amount} Ar</Text>
                  </View>
                ))}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setSelectedExpense(null)}
                  >
                    <Text style={styles.cancelText}>Close</Text>
                  </TouchableOpacity>

                  {user?.id === selectedExpense.paidBy._id && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={handleDeleteExpense}
                      disabled={deleting}
                    >
                      <Text style={styles.deleteButtonText}>
                        {deleting ? "Deleting..." : "Delete"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      <Modal visible={!!settlingTransaction} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {settlingTransaction && (
              <>
                <Text style={styles.modalTitle}>Confirm Settlement</Text>
                <Text style={styles.settleConfirmText}>
                  Record that you paid{" "}
                  <Text style={styles.balanceName}>
                    {settlingTransaction.to.name}
                  </Text>{" "}
                  {settlingTransaction.amount} Ar?
                </Text>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setSettlingTransaction(null)}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.createButton}
                    onPress={handleSettle}
                    disabled={settling}
                  >
                    <Text style={styles.createText}>
                      {settling ? "Recording..." : "Confirm"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  backButton: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: colors.border,
    borderRadius: 12,
    padding: 4,
    marginBottom: spacing.lg,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: 9,
  },
  tabButtonActive: {
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
  },
  tabTextActive: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  emptyText: { color: "#888", fontSize: 15 },
  expenseRow: { flexDirection: "row", justifyContent: "space-between" },
  expenseCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  expenseDescription: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    marginRight: spacing.sm,
  },
  expenseAmount: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  expensePaidBy: {
    color: colors.muted,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  balanceCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceText: {
    color: colors.text,
    fontSize: 15,
    flex: 1,
    lineHeight: 21,
  },
  balanceName: {
    color: colors.text,
    fontWeight: "700",
  },
  balanceAmount: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: "800",
    marginLeft: spacing.sm,
  },
  fab: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  fabText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "700",
  },
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
  detailAmount: { fontSize: 28, fontWeight: "bold", marginBottom: 4 },
  detailPaidBy: { fontSize: 14, color: "#666", marginBottom: 20 },
  splitHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  splitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  splitName: { fontSize: 15 },
  splitAmount: { fontSize: 15, fontWeight: "600" },
  deleteButton: {
    backgroundColor: "#FEE2E2",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
  },
  deleteButtonText: {
    color: colors.danger,
    fontWeight: "700",
  },
  settleButton: {
    backgroundColor: colors.success,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginLeft: spacing.sm,
  },
  settleButtonText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "700",
  },
  settleConfirmText: { fontSize: 15, marginBottom: 20, lineHeight: 22 },
  pendingBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    marginLeft: spacing.sm,
  },
  pendingBadgeText: {
    color: "#92400E",
    fontSize: 13,
    fontWeight: "700",
  },
});
