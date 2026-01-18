// src/screens/ProfileScreen.js
// MindFlow Profile — Platinum Ivory OS × Plasma Dark v∞
// Erudita Ultra Fusion Design System — 2025 Edition

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
    Alert,
    Animated,
    Easing,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

// ----------------------------------------------
// STORAGE KEYS
// ----------------------------------------------
const STORAGE_KEYS = {
  PROFILE: "@mindflow_profile",
  TASKS: "@mindflow_tasks",
  FOCUS: "@mindflow_focus",
  MOODS: "@mindflow_moods",
};

// ----------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------
export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isDark = theme.key === "dark";

  // ----------------------------------------------
  // STATE
  // ----------------------------------------------
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: "",
    avatarColor: isDark ? "#a855f7" : "#d8c49a", // Neon Violet (dark) / Platinum (light)
  });

  const [stats, setStats] = useState({
    focusMinutes: 0,
    tasksThisWeek: 0,
    totalTasks: 0,
    moodAverage: 0,
    productivityScore: 0,
  });

  const [insights, setInsights] = useState([]);
  const [editVisible, setEditVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [animationMode, setAnimationMode] = useState("normal");

  // ----------------------------------------------
  // ANIMATION REFS
  // ----------------------------------------------
  const avatarPulse = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  // ----------------------------------------------
  // LIGHT MODE: Platinum Ivory Glass Tokens
  // DARK MODE: Neon Plasma OS Tokens
  // ----------------------------------------------
  const bg = isDark
    ? theme.backgroundGradient || ["#020617", "#0b1120", "#1e1b4b"]
    : ["#f6f4f2", "#f1eeea", "#ebe7ff"]; // Pearl → Soft Ivory → Soft Violet

  const primary = isDark ? "#a855f7" : "#d8c49a"; // Neon violet / champagne platinum

  const textMain = isDark ? "#eef2ff" : "#2a2a2a";
  const textSoft = isDark ? "#9ca3af" : "#6f6f6f";

  const cardBg = isDark
    ? "rgba(15,23,42,0.72)"
    : "rgba(255,255,255,0.55)";

  const border = isDark
    ? "rgba(148,163,184,0.35)"
    : "rgba(210,210,210,0.45)";

  const glow = isDark
    ? "rgba(168,85,247,0.4)"
    : "rgba(199,178,255,0.28)";

  const cardShadow = isDark
    ? {
        shadowColor: "#000",
        shadowOpacity: 0.28,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
      }
    : {
        shadowColor: "rgba(0,0,0,0.08)",
        shadowOpacity: 0.18,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 7 },
        elevation: 7,
      };

  // Avatar letter fallback
  const avatarLetter = (profile.name || user?.name || "M")
    .trim()
    .charAt(0)
    .toUpperCase();

  // ----------------------------------------------
  // LOAD PROFILE + ANALYTICS
  // ----------------------------------------------
  useEffect(() => {
    loadProfile();
    loadStats();
  }, []);

  useEffect(() => {
    generateInsights();
  }, [stats]);

  useEffect(() => {
    runAvatarPulse();
  }, [animationMode]);

  async function loadProfile() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
      if (raw) {
        setProfile((prev) => ({ ...prev, ...JSON.parse(raw) }));
      }
    } catch (e) {
      console.log("Profile load error", e);
    }
  }

  async function loadStats() {
    try {
      let totalTasks = 0;
      let tasksThisWeek = 0;

      const tasksRaw = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
      if (tasksRaw) {
        const tasks = JSON.parse(tasksRaw);
        if (Array.isArray(tasks)) {
          totalTasks = tasks.length;

          const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          tasksThisWeek = tasks.filter((t) => {
            if (!t.createdAt) return false;
            return new Date(t.createdAt).getTime() >= oneWeekAgo;
          }).length;
        }
      }

      let focusMinutes = 0;
      const focusRaw = await AsyncStorage.getItem(STORAGE_KEYS.FOCUS);
      if (focusRaw) {
        const focus = JSON.parse(focusRaw);
        if (focus && typeof focus.totalSeconds === "number") {
          focusMinutes = Math.round(focus.totalSeconds / 60);
        }
      }

      let moodAverage = 0;
      const moodsRaw = await AsyncStorage.getItem(STORAGE_KEYS.MOODS);
      if (moodsRaw) {
        const moods = JSON.parse(moodsRaw);
        if (Array.isArray(moods) && moods.length > 0) {
          const sum = moods.reduce(
            (acc, m) => acc + (typeof m.value === "number" ? m.value : 0),
            0
          );
          moodAverage = +(sum / moods.length).toFixed(1);
        }
      }

      const productivityScore = Math.min(
        100,
        Math.round(
          (tasksThisWeek * 2 +
            totalTasks * 0.5 +
            focusMinutes * 0.3 +
            (moodAverage || 3) * 4) / 2
        )
      );

      setStats({
        focusMinutes,
        tasksThisWeek,
        totalTasks,
        moodAverage,
        productivityScore,
      });
    } catch (e) {
      console.log("Stats load error", e);
    }
  }

  // ----------------------------------------------
  // AI INSIGHTS
  // ----------------------------------------------
  function generateInsights() {
    const list = [];

    if (stats.tasksThisWeek > 15)
      list.push("Your weekly task throughput is high — consistent productivity.");
    else if (stats.tasksThisWeek > 0)
      list.push("Momentum started — stack another small task now.");
    else list.push("A 2-minute task can unlock your productivity streak.");

    if (stats.focusMinutes > 120)
      list.push("Deep focus detected — you're operating in high-performance mode.");
    else if (stats.focusMinutes > 0)
      list.push("One more short focus session will amplify results.");

    if (stats.moodAverage >= 4)
      list.push("Strong emotional baseline — ideal for creative output.");
    else if (stats.moodAverage > 0)
      list.push("A microbreak may help stabilize your flow.");

    if (stats.productivityScore >= 80)
      list.push("Peak window unlocked — capitalize on this energy.");
    else
      list.push("Small habits compound — one small action now boosts tomorrow.");

    setInsights(list.slice(0, 3));
  }

  // ----------------------------------------------
  // AVATAR PULSE ANIMATION
  // ----------------------------------------------
  function runAvatarPulse() {
    avatarPulse.setValue(0);
    if (animationMode === "reduced") return;

    Animated.loop(
      Animated.sequence([
        Animated.timing(avatarPulse, {
          toValue: 1,
          duration: 2400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(avatarPulse, {
          toValue: 0,
          duration: 2400,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }

  const haloScale = avatarPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const haloOpacity = avatarPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.85],
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, -18],
    extrapolate: "clamp",
  });

  // ----------------------------------------------
  // HANDLE PROFILE SAVE
  // ----------------------------------------------
  async function handleSaveProfile() {
    try {
      setSaving(true);
      await AsyncStorage.setItem(
        STORAGE_KEYS.PROFILE,
        JSON.stringify(profile)
      );
      setSaving(false);
      setEditVisible(false);
    } catch (e) {
      setSaving(false);
    }
  }

  function handleLogout() {
    Alert.alert("Logout", "Leave MindFlow OS?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  }

  // ----------------------------------------------
  // ACHIEVEMENT DEFINITIONS
  // ----------------------------------------------
  const achievements = [
    {
      key: "focus",
      label: "Deep Focus",
      desc: "120+ minutes logged",
      unlocked: stats.focusMinutes >= 120,
    },
    {
      key: "tasks",
      label: "Task Champion",
      desc: "15+ weekly tasks",
      unlocked: stats.tasksThisWeek >= 15,
    },
    {
      key: "momentum",
      label: "Momentum Builder",
      desc: "Streak started",
      unlocked: stats.tasksThisWeek > 0,
    },
    {
      key: "mood",
      label: "Mood Guardian",
      desc: "Avg mood 4.0+",
      unlocked: stats.moodAverage >= 4,
    },
  ];

  // ============================================================
  // UI START
  // ============================================================
  return (
    <LinearGradient colors={bg} style={{ flex: 1 }}>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 50 }}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        >
          {/* ============================================================ */}
          {/* HEADER */}
          {/* ============================================================ */}
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.title, { color: textMain }]}>Profile</Text>
              <Text style={[styles.subtitle, { color: textSoft }]}>
                Operator of MindFlow OS
              </Text>
            </View>

            {/* Avatar */}
            <View style={styles.avatarWrapper}>
              <Animated.View
                style={[
                  styles.avatarHalo,
                  {
                    opacity: haloOpacity,
                    transform: [{ scale: haloScale }],
                    borderColor: glow,
                  },
                ]}
              />

              <BlurView
                intensity={isDark ? 36 : 28}
                tint={isDark ? "dark" : "light"}
                style={styles.avatarBlur}
              >
                <View
                  style={[
                    styles.avatarBig,
                    {
                      backgroundColor: cardBg,
                      borderColor: primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarText,
                      { color: primary },
                    ]}
                  >
                    {avatarLetter}
                  </Text>
                </View>
              </BlurView>
            </View>
          </View>

          {/* ============================================================ */}
          {/* USER CARD */}
          {/* ============================================================ */}
          <BlurView
            intensity={isDark ? 40 : 28}
            tint={isDark ? "dark" : "light"}
            style={styles.glassCard}
          >
            <LinearGradient
              colors={
                isDark
                  ? ["rgba(79,70,229,0.45)", "rgba(168,85,247,0.15)"]
                  : ["rgba(255,255,255,0.6)", "rgba(235,227,255,0.4)"]
              }
              style={styles.outerGlow}
            >
              <View
                style={[
                  styles.infoCard,
                  cardShadow,
                  {
                    backgroundColor: cardBg,
                    borderColor: border,
                  },
                ]}
              >
                <Text style={[styles.name, { color: textMain }]}>
                  {profile.name || "Unknown User"}
                </Text>

                <Text
                  style={[
                    styles.role,
                    { color: primary, marginBottom: 4 },
                  ]}
                >
                  Creator • OS Architect
                </Text>

                <Text style={[styles.meta, { color: textSoft }]}>
                  ID • {profile.email || "no-email"}
                </Text>

                {!!profile.bio && (
                  <Text style={[styles.bio, { color: textSoft }]}>
                    {profile.bio}
                  </Text>
                )}

                <View style={styles.infoActionsRow}>
                  <TouchableOpacity
                    onPress={() => setEditVisible(true)}
                    style={[styles.chipButton, { borderColor: primary }]}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name="pencil-outline"
                      size={14}
                      color={primary}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.chipText, { color: primary }]}>
                      Edit Profile
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.versionPill}>
                    <Ionicons
                      name="sparkles-outline"
                      size={13}
                      color={isDark ? "#fafafa" : "#3a3a3a"}
                      style={{ marginRight: 5 }}
                    />
                    <Text
                      style={[
                        styles.versionText,
                        { color: isDark ? "#fafafa" : "#3a3a3a" },
                      ]}
                    >
                      MindFlow OS v∞
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </BlurView>

          {/* ============================================================ */}
          {/* ANALYTICS */}
          {/* ============================================================ */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textMain }]}>
              System Analytics
            </Text>

            <View style={styles.analyticsGrid}>
              <AnalyticsCard
                label="Productivity Score"
                value={stats.productivityScore}
                suffix="/100"
                icon="speedometer-outline"
                theme={theme}
              />
              <AnalyticsCard
                label="Focus Time"
                value={stats.focusMinutes}
                suffix="min"
                icon="time-outline"
                theme={theme}
              />
              <AnalyticsCard
                label="Tasks This Week"
                value={stats.tasksThisWeek}
                icon="checkbox-outline"
                theme={theme}
              />
              <AnalyticsCard
                label="Mood Average"
                value={stats.moodAverage || "-"}
                icon="pulse-outline"
                theme={theme}
              />
            </View>
          </View>

          {/* ============================================================ */}
          {/* ACHIEVEMENTS */}
          {/* ============================================================ */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textMain }]}>
              Achievements
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 12 }}
            >
              {achievements.map((a) => (
                <View
                  key={a.key}
                  style={[
                    styles.achievementCard,
                    cardShadow,
                    {
                      backgroundColor: cardBg,
                      borderColor: a.unlocked ? primary : border,
                      opacity: a.unlocked ? 1 : 0.7,
                    },
                  ]}
                >
                  <View style={styles.achievementHeaderRow}>
                    <Ionicons
                      name={
                        a.unlocked
                          ? "checkmark-circle-outline"
                          : "ellipse-outline"
                      }
                      size={18}
                      color={a.unlocked ? primary : textSoft}
                    />
                    <Text
                      style={[
                        styles.achievementLabel,
                        { color: a.unlocked ? textMain : textSoft },
                      ]}
                    >
                      {a.label}
                    </Text>
                  </View>

                  <Text style={[styles.achievementDesc, { color: textSoft }]}>
                    {a.desc}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* ============================================================ */}
          {/* AI INSIGHTS */}
          {/* ============================================================ */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textMain }]}>
              MindFlow Insights
            </Text>

            <View
              style={[
                styles.rowCard,
                cardShadow,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              {insights.map((line, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    marginBottom: 6,
                    alignItems: "flex-start",
                  }}
                >
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 999,
                      marginTop: 6,
                      marginRight: 8,
                      backgroundColor: primary,
                    }}
                  />
                  <Text
                    style={{
                      color: textSoft,
                      fontSize: 13,
                      flex: 1,
                    }}
                  >
                    {line}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* ============================================================ */}
          {/* CONTROLS */}
          {/* ============================================================ */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textMain }]}>
              Controls
            </Text>

            {/* THEME */}
            <TouchableOpacity
              style={[
                styles.controlRow,
                cardShadow,
                { backgroundColor: cardBg, borderColor: border },
              ]}
              onPress={toggleTheme}
            >
              <Ionicons name="color-palette-outline" size={18} color={primary} />
              <Text style={[styles.controlText, { color: textMain }]}>
                Theme & Appearance
              </Text>
              <Text style={{ color: textSoft, fontSize: 12, marginRight: 6 }}>
                {isDark ? "Plasma Dark" : "Platinum Ivory"}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={textSoft} />
            </TouchableOpacity>

            {/* HAPTICS */}
            <TouchableOpacity
              style={[
                styles.controlRow,
                cardShadow,
                { backgroundColor: cardBg, borderColor: border },
              ]}
              onPress={() => setHapticsEnabled(!hapticsEnabled)}
            >
              <Ionicons
                name="phone-portrait-outline"
                size={18}
                color={primary}
              />
              <Text style={[styles.controlText, { color: textMain }]}>
                Haptics
              </Text>
              <Text style={{ color: textSoft, fontSize: 12, marginRight: 6 }}>
                {hapticsEnabled ? "Enabled" : "Disabled"}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={textSoft} />
            </TouchableOpacity>

            {/* SOUND */}
            <TouchableOpacity
              style={[
                styles.controlRow,
                cardShadow,
                { backgroundColor: cardBg, borderColor: border },
              ]}
              onPress={() => setSoundEnabled(!soundEnabled)}
            >
              <Ionicons name="volume-high-outline" size={18} color={primary} />
              <Text style={[styles.controlText, { color: textMain }]}>
                Sound Effects
              </Text>
              <Text style={{ color: textSoft, fontSize: 12, marginRight: 6 }}>
                {soundEnabled ? "Enabled" : "Muted"}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={textSoft} />
            </TouchableOpacity>

            {/* ANIMATIONS */}
            <TouchableOpacity
              style={[
                styles.controlRow,
                cardShadow,
                { backgroundColor: cardBg, borderColor: border },
              ]}
              onPress={() =>
                setAnimationMode(
                  animationMode === "normal" ? "reduced" : "normal"
                )
              }
            >
              <Ionicons name="sparkles-outline" size={18} color={primary} />
              <Text style={[styles.controlText, { color: textMain }]}>
                Animations
              </Text>
              <Text style={{ color: textSoft, fontSize: 12, marginRight: 6 }}>
                {animationMode === "normal" ? "Full Motion" : "Reduced Motion"}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={textSoft} />
            </TouchableOpacity>
          </View>

          {/* ============================================================ */}
          {/* LOGOUT */}
          {/* ============================================================ */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>

      {/* ============================================================ */}
      {/* EDIT PROFILE MODAL */}
      {/* ============================================================ */}
      <Modal
        visible={editVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <BlurView intensity={50} tint="dark" style={styles.modalCard}>
            <Text style={[styles.modalTitle, { color: "#fafafa" }]}>
              Edit Profile
            </Text>

            <TextInput
              placeholder="Name"
              placeholderTextColor="#9ca3af"
              value={profile.name}
              onChangeText={(v) =>
                setProfile((prev) => ({ ...prev, name: v }))
              }
              style={styles.input}
            />

            <TextInput
              placeholder="Email"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              keyboardType="email-address"
              value={profile.email}
              onChangeText={(v) =>
                setProfile((prev) => ({ ...prev, email: v }))
              }
              style={styles.input}
            />

            <TextInput
              placeholder="Short bio (optional)"
              placeholderTextColor="#9ca3af"
              multiline
              value={profile.bio}
              onChangeText={(v) =>
                setProfile((prev) => ({ ...prev, bio: v }))
              }
              style={[styles.input, { height: 90, textAlignVertical: "top" }]}
            />

            <TextInput
              placeholder="Avatar Accent (hex)"
              placeholderTextColor="#9ca3af"
              value={profile.avatarColor}
              onChangeText={(v) =>
                setProfile((prev) => ({ ...prev, avatarColor: v }))
              }
              autoCapitalize="none"
              style={styles.input}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "transparent" }]}
                onPress={() => setEditVisible(false)}
              >
                <Text
                  style={{ color: "#9ca3af", fontSize: 13 }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: primary }]}
                onPress={handleSaveProfile}
              >
                <Text
                  style={{ color: "#fafafa", fontWeight: "600", fontSize: 13 }}
                >
                  {saving ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// --------------------------------------------------------
// ANALYTICS CARD COMPONENT (Light Mode Fixed Too)
// --------------------------------------------------------
function AnalyticsCard({ label, value, suffix, icon, theme }) {
  const isDark = theme.key === "dark";

  const textMain = isDark ? "#eef2ff" : "#2a2a2a";
  const textSoft = isDark ? "#9ca3af" : "#6f6f6f";
  const primary = isDark ? "#a855f7" : "#d8c49a";

  const cardBg = isDark
    ? "rgba(15,23,42,0.72)"
    : "rgba(255,255,255,0.55)";

  const border = isDark
    ? "rgba(148,163,184,0.35)"
    : "rgba(210,210,210,0.45)";

  const cardShadow = isDark
    ? {
        shadowColor: "#000",
        shadowOpacity: 0.28,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
      }
    : {
        shadowColor: "rgba(0,0,0,0.08)",
        shadowOpacity: 0.18,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 7 },
        elevation: 7,
      };

  return (
    <View
      style={[
        styles.analyticsCard,
        cardShadow,
        {
          backgroundColor: cardBg,
          borderColor: border,
        },
      ]}
    >
      <View style={styles.analyticsHeaderRow}>
        <Ionicons name={icon} size={16} color={primary} />
        <Text style={[styles.analyticsLabel, { color: textSoft }]}>
          {label}
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
        <Text style={[styles.analyticsValue, { color: textMain }]}>
          {value}
        </Text>
        {suffix ? (
          <Text style={{ color: textSoft, fontSize: 11, marginLeft: 3 }}>
            {suffix}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// --------------------------------------------------------
// STYLES
// --------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },

  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { fontSize: 13, marginTop: 4 },

  avatarWrapper: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHalo: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 999,
    borderWidth: 2,
  },
  avatarBlur: {
    borderRadius: 999,
    overflow: "hidden",
  },
  avatarBig: {
    width: 58,
    height: 58,
    borderRadius: 999,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
  },

  glassCard: {
    borderRadius: 26,
    overflow: "hidden",
    marginBottom: 20,
  },
  outerGlow: {
    borderRadius: 26,
    padding: 1.2,
  },

  infoCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
  },
  name: { fontSize: 19, fontWeight: "600" },
  role: { fontSize: 13, marginTop: 4 },
  meta: { fontSize: 12, marginTop: 6 },
  bio: { fontSize: 12, marginTop: 8 },

  infoActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    justifyContent: "space-between",
  },

  chipButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipText: { fontSize: 12 },

  versionPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  versionText: { fontSize: 11, fontWeight: "500" },

  section: { marginBottom: 22 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },

  analyticsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  analyticsCard: {
    width: "48%",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
  },
  analyticsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  analyticsLabel: { fontSize: 11 },
  analyticsValue: { fontSize: 17, fontWeight: "600" },

  achievementCard: {
    minWidth: 160,
    maxWidth: 200,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    marginRight: 10,
  },
  achievementHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 6,
  },
  achievementLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  achievementDesc: { fontSize: 11 },

  rowCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    marginTop: 6,
  },

  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  controlText: { fontSize: 14, flex: 1, marginLeft: 10 },

  logoutButton: {
    backgroundColor: "rgba(220,38,38,0.95)",
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  logoutText: {
    color: "#fef2f2",
    fontWeight: "600",
    fontSize: 14,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    borderRadius: 24,
    padding: 18,
    overflow: "hidden",
    backgroundColor: "rgba(15,23,42,0.93)",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  input: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.45)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#f3f4f6",
    backgroundColor: "rgba(255,255,255,0.07)",
    marginBottom: 10,
  },
  modalActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    gap: 10,
  },
  modalButton: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});