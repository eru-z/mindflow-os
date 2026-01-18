// src/screens/FeaturesHub.js
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

export default function FeaturesHub() {
  return (
    <LinearGradient
      colors={["#020617", "#0b1220", "#1e1b4b"]}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Features hub</Text>
        <Text style={styles.subtitle}>
          Social, analytics and premium layers — ready for hackathon demos,
          waiting for real data.
        </Text>

        <View style={styles.block}>
          <View style={styles.blockHeader}>
            <Ionicons name="people-outline" size={20} color="#c7d2fe" />
            <Text style={styles.blockTitle}>Social layer</Text>
          </View>
          <Text style={styles.blockText}>
            Leaderboards, gentle rivalry, private wins. Share streaks, focus
            minutes and goals with friends or your team.
          </Text>
          <Text style={styles.tagRow}>• Friends • Leaderboard • Challenges</Text>
        </View>

        <View style={styles.block}>
          <View style={styles.blockHeader}>
            <Ionicons name="analytics-outline" size={20} color="#c7d2fe" />
            <Text style={styles.blockTitle}>Analytics</Text>
          </View>
          <Text style={styles.blockText}>
            Weekly stats, focus heatmaps and trend lines. Enough visuals to make
            judges nod, even with mock data.
          </Text>
          <Text style={styles.tagRow}>
            • Focus time • Task completion • Mood trend
          </Text>
        </View>

        <View style={styles.block}>
          <View style={styles.blockHeader}>
            <Ionicons name="diamond-outline" size={20} color="#c7d2fe" />
            <Text style={styles.blockTitle}>Premium layer</Text>
          </View>
          <Text style={styles.blockText}>
            Extra themes, offline backups, sync and pro insights. Keep it locked
            behind a soft “coming soon” wall.
          </Text>
          <Text style={styles.tagRow}>• Premium themes • Cloud sync • Pro OS</Text>
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
  block: {
    backgroundColor: "rgba(15,23,42,0.9)",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(55,65,81,0.9)",
  },
  blockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  blockTitle: { color: "#e5e7eb", fontWeight: "600", fontSize: 15 },
  blockText: { color: "#9ca3af", fontSize: 13, marginBottom: 10 },
  tagRow: { color: "#c7d2fe", fontSize: 12 },
});
