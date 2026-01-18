// src/screens/MindToolsScreen.js
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

export default function MindToolsScreen() {
  return (
    <LinearGradient
      colors={["#020617", "#111827", "#1e1b4b"]}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Mind tools</Text>
        <Text style={styles.subtitle}>
          Focus, productivity and intelligence stitched into one calm system.
        </Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="timer-outline" size={18} color="#e5e7eb" />
            </View>
            <Text style={styles.cardTitle}>Focus Studio</Text>
          </View>
          <Text style={styles.cardText}>
            Pomodoro, long-form deep work, and soft break reminders. Configure
            durations later — UI is already winning.
          </Text>
          <Text style={styles.cardBadge}>Next: 25 min • Chill mode</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="sparkles-outline" size={18} color="#e5e7eb" />
            </View>
            <Text style={styles.cardTitle}>Flow Intelligence</Text>
          </View>
          <Text style={styles.cardText}>
            Surface smart suggestions: when to work, when to rest, which task to
            pick. Data later, illusion of OS now.
          </Text>
          <Text style={styles.cardBadge}>Score: 83 • Rising</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="heart-outline" size={18} color="#e5e7eb" />
            </View>
            <Text style={styles.cardTitle}>Calm Layer</Text>
          </View>
          <Text style={styles.cardText}>
            Breathing, micro check-ins, mood tracker. Nothing aggressive — just
            gentle nudges to stay human.
          </Text>
          <Text style={styles.cardBadge}>Mood: Soft & present</Text>
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
  subtitle: { color: "#9ca3af", fontSize: 13, marginBottom: 20 },
  card: {
    backgroundColor: "rgba(15,23,42,0.9)",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(55,65,81,0.9)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(30,64,175,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: { color: "#e5e7eb", fontWeight: "600", fontSize: 15 },
  cardText: { color: "#9ca3af", fontSize: 13, marginBottom: 10 },
  cardBadge: { color: "#c7d2fe", fontSize: 12 },
});
