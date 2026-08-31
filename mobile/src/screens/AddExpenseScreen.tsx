import { createExpenseRequest } from "../api/expenses";
import { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";

export default function AddExpenseScreen({ route, navigation }: any) {
  const { groupId, groupName } = route.params;

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert(
        "Missing description",
        "Please enter what this expense was for",
      );
      return;
    }
    const numericAmount = Number(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Invalid amount", "Please enter a valid amount");
      return;
    }

    if (!Number.isInteger(numericAmount)) {
      Alert.alert(
        "Invalid amount",
        "Amount must be a whole number (Ariary has no cents)",
      );
      return;
    }

    setSubmitting(true);
    try {
      await createExpenseRequest(groupId, description.trim(), numericAmount);
      navigation.goBack();
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "Failed to add expense. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backButton}>Cancel</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Add Expense</Text>
      <Text style={styles.subtitle}>{groupName}</Text>

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Groceries, Taxi, Dinner"
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>Amount (MGA)</Text>
      <TextInput
        style={styles.input}
        placeholder="0"
        keyboardType="number-pad"
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={styles.helperText}>
        This will be split equally among all group members.
      </Text>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.submitButtonText}>
          {submitting ? "Adding..." : "Add Expense"}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60 },
  backButton: { color: "#2563eb", fontSize: 16, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: "bold" },
  subtitle: { fontSize: 15, color: "#666", marginBottom: 24 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  helperText: { fontSize: 13, color: "#888", marginBottom: 24 },
  submitButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
