// src/screens/SettingsScreen.js
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [notifications, setNotifications] = useState(false);

  return (
    <LinearGradient
      colors={["#020617", "#0f172a", "#111827"]}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>
          Fine-tune how MindFlow feels on this device. Real logic can come
          later; UI is already judge-ready.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="moon-outline" size={18} color="#c7d2fe" />
              <Text style={styles.rowText}>Dark mode</Text>
            </View>
            <Switch value={darkMode} onValueChange={setDarkMode} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="phone-portrait-outline" size={18} color="#c7d2fe" />
              <Text style={styles.rowText}>Haptics</Text>
            </View>
            <Switch value={haptics} onValueChange={setHaptics} />
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="notifications-outline" size={18} color="#c7d2fe" />
              <Text style={styles.rowText}>Gentle notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutBox}>
            <Text style={styles.aboutTitle}>MindFlow OS v∞</Text>
            <Text style={styles.aboutText}>ChampionTrials Edition</Text>
            <Text style={styles.aboutMeta}>Designed by Erudita Ultra Fusion</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: {
    color: "#e5e7eb",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: { color: "#9ca3af", fontSize: 13, marginBottom: 18 },
  section: { marginBottom: 18 },
  sectionTitle: {
    color: "#e5e7eb",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  row: {
    backgroundColor: "rgba(15,23,42,0.9)",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(31,41,55,0.9)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowText: { color: "#e5e7eb", fontSize: 14 },
  aboutBox: {
    backgroundColor: "rgba(15,23,42,0.9)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(55,65,81,0.9)",
  },
  aboutTitle: { color: "#e5e7eb", fontSize: 16, fontWeight: "600" },
  aboutText: { color: "#a5b4fc", marginTop: 4, fontSize: 13 },
  aboutMeta: { color: "#6b7280", marginTop: 6, fontSize: 11 },
});
