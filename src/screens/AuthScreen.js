import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// ✔ CORRECT CONTEXT IMPORTS
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function AuthScreen() {
  const { login } = useAuth();      
  const { theme } = useTheme();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  // -----------------------
  // AUTH HANDLER
  // -----------------------
  function handleAuth() {
    if (!email.trim()) {
      alert("Please enter your email");
      return;
    }

    if (mode === "register" && !name.trim()) {
      alert("Please enter your name");
      return;
    }

    const userData =
      mode === "login"
        ? { email }
        : { email, name };

    // ❗ NO navigation.navigate()
    // App.js handles navigation automatically after login
    login(userData);
  }

  return (
    <LinearGradient
      colors={["#020617", "#111827", "#1e1b4b"]}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.logo}>MindFlow</Text>
          <Text style={styles.caption}>Your calm & focused workspace</Text>
        </View>

        {/* SWITCH LOGIN / REGISTER */}
        <View style={styles.switchRow}>
          <TouchableOpacity
            style={[styles.switchChip, mode === "login" && styles.switchChipActive]}
            onPress={() => setMode("login")}
          >
            <Text
              style={[styles.switchText, mode === "login" && styles.switchTextActive]}
            >
              Login
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.switchChip, mode === "register" && styles.switchChipActive]}
            onPress={() => setMode("register")}
          >
            <Text
              style={[styles.switchText, mode === "register" && styles.switchTextActive]}
            >
              Register
            </Text>
          </TouchableOpacity>
        </View>

        {/* AUTH CARD */}
        <View style={styles.card}>
          {mode === "register" && (
            <View style={styles.field}>
              <Text style={styles.label}>Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color="#9ca3af" />
                <TextInput
                  placeholder="Erudita"
                  placeholderTextColor="#6b7280"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                />
              </View>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#9ca3af" />
              <TextInput
                placeholder="you@mindflow.os"
                placeholderTextColor="#6b7280"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
              />
            </View>
          </View>

          {/* BUTTON */}
          <TouchableOpacity activeOpacity={0.9} style={styles.buttonWrapper} onPress={handleAuth}>
            <LinearGradient
              colors={["#818cf8", "#a855f7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>
                {mode === "login" ? "Enter Workspace" : "Create Workspace"}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#f9fafb" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* FOOTER */}
        <View style={{ marginTop: 18 }}>
          <Text style={styles.smallText}>
            Your data is stored locally. Sync arrives when you win the hackathon.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// ------------------- STYLES -------------------
const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  header: { marginTop: 40, marginBottom: 24 },
  logo: {
    fontSize: 28,
    fontWeight: "700",
    color: "#e5e7eb",
    letterSpacing: 0.25,
  },
  caption: { color: "#9ca3af", marginTop: 4 },

  switchRow: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderRadius: 999,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.4)",
  },
  switchChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
  },
  switchChipActive: {
    backgroundColor: "rgba(129, 140, 248, 0.25)",
  },
  switchText: { color: "#9ca3af", fontSize: 13 },
  switchTextActive: { color: "#e5e7eb", fontWeight: "600" },

  card: {
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.5)",
  },

  field: { marginBottom: 16 },
  label: { color: "#9ca3af", marginBottom: 6, fontSize: 13 },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(55, 65, 81, 0.9)",
  },
  input: {
    flex: 1,
    color: "#e5e7eb",
    fontSize: 14,
    paddingVertical: 2,
  },

  buttonWrapper: {
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 8,
  },
  button: {
    paddingVertical: 13,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  buttonText: {
    color: "#f9fafb",
    fontWeight: "600",
    fontSize: 15,
  },

  smallText: {
    color: "#6b7280",
    fontSize: 11,
    textAlign: "center",
  },
});
