import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { registerRequest } from "../api/auth";
import { getErrorMessage } from "../utils/errorMessage";
import { colors, spacing } from "../utils/theme";

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<
    "name" | "email" | "password" | null
  >(null);
  const { login } = useAuth();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Missing fields", "Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    try {
      const data = await registerRequest(name, email, password);
      await login(
        { id: data.id, name: data.name, email: data.email },
        data.token,
      );
    } catch (error: any) {
      Alert.alert("Registration failed", getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>
        Start sharing expenses with friends and groups.
      </Text>

      <TextInput
        style={[styles.input, focusedField === "name" && styles.inputFocused]}
        placeholder="Name"
        value={name}
        onChangeText={setName}
        onFocus={() => setFocusedField("name")}
        onBlur={() => setFocusedField(null)}
      />
      <TextInput
        style={[styles.input, focusedField === "email" && styles.inputFocused]}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        onFocus={() => setFocusedField("email")}
        onBlur={() => setFocusedField(null)}
      />
      <TextInput
        style={[
          styles.input,
          focusedField === "password" && styles.inputFocused,
        ]}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        onFocus={() => setFocusedField("password")}
        onBlur={() => setFocusedField(null)}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>
          {submitting ? "Creating account..." : "Sign Up"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.linkText}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 32,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  linkText: { color: "#2563eb", textAlign: "center", fontSize: 14 },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
});
