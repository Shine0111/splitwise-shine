import { createExpenseRequest } from "../api/expenses";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  StyleSheet,
  Platform,
} from "react-native";

export default function AddExpenseScreen({ navigation }: any) {
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backButton}>Cancel</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Add Expense</Text>
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
