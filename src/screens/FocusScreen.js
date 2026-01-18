// src/screens/FocusScreen.js
// MindFlow Focus — Erudita Plasma Quantum OS v∞
// Dark by default, fully theme-aware, mega-structured and mega-designed.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

/* -------------------------------------------------------------------------- */
/*  DESIGN TOKENS — ERUDITA ULTRA FUSION                                      */
/* -------------------------------------------------------------------------- */

const TOKENS = {
  radius: {
    xs: 10,
    sm: 14,
    md: 18,
    lg: 24,
    xl: 30,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 18,
    xl: 24,
  },
  blurCardOpacity: 0.95,
  shadow: {
    card: {
      shadowColor: "#000",
      shadowOpacity: 0.4,
      shadowRadius: 26,
      shadowOffset: { width: 0, height: 18 },
      elevation: 16,
    },
    soft: {
      shadowColor: "#020617",
      shadowOpacity: 0.25,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 14 },
      elevation: 8,
    },
  },
};

const STORAGE_KEY = "@mindflow_focus_stats_plasma_v1";

const FOCUS_MODES = [
  {
    id: "pomodoro",
    label: "Pomodoro",
    minutes: 25,
    description: "Classic 25 minute sprint",
  },
  {
    id: "deep",
    label: "Deep Focus",
    minutes: 50,
    description: "Longer deep work block",
  },
  {
    id: "sprint",
    label: "Lightning",
    minutes: 10,
    description: "Quick momentum boost",
  },
  {
    id: "study",
    label: "Study Session",
    minutes: 90,
    description: "Extended reading & study",
  },
  {
    id: "custom",
    label: "Custom",
    minutes: 45,
    description: "Design your own flow",
  },
];

const QUOTES = [
  "Your focus determines your reality.",
  "Deep work today, momentum tomorrow.",
  "You become what you repeat every day.",
  "Attention is your sharpest tool.",
  "Protect your focus like a rare resource.",
];

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

/* -------------------------------------------------------------------------- */
/*  SMALL SUBCOMPONENTS                                                       */
/* -------------------------------------------------------------------------- */

function SectionHeader({ title, subtitle, colorTitle, colorSubtitle }) {
  return (
    <View style={{ marginBottom: TOKENS.spacing.sm }}>
      <Text
        style={[
          styles.sectionTitle,
          { color: colorTitle },
        ]}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={[
            styles.sectionSubtitle,
            { color: colorSubtitle },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

function ModeChip({ mode, active, minimal, onPress, theme, isDark }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.modeChip,
        {
          borderColor: active ? "#7c3aed" : theme.border,
          backgroundColor: active
            ? isDark
              ? "rgba(15,23,42,0.98)"
              : "rgba(255,255,255,0.98)"
            : "transparent",
        },
        active && TOKENS.shadow.soft,
      ]}
    >
      <Text
        style={[
          styles.modeLabel,
          { color: active ? "#a5b4fc" : theme.text },
        ]}
      >
        {mode.label}
      </Text>
      {!minimal && (
        <Text
          style={[
            styles.modeDesc,
            { color: active ? "#c7d2fe" : theme.subtext },
          ]}
        >
          {mode.description}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function EnhancerToggle({ label, description, value, onValueChange, isDark }) {
  return (
    <View
      style={[
        styles.enhancerCard,
        {
          backgroundColor: isDark
            ? "rgba(15,23,42,0.96)"
            : "rgba(255,255,255,0.97)",
          borderColor: isDark ? "#1e293b" : "#e5e7eb",
        },
        TOKENS.shadow.soft,
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.enhancerLabel,
            { color: isDark ? "#e5e7eb" : "#111827" },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.enhancerDescription,
            { color: isDark ? "#9ca3af" : "#6b7280" },
          ]}
        >
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor={value ? "#6366f1" : isDark ? "#9ca3af" : "#e5e7eb"}
        trackColor={{ false: "#4b5563", true: "#3730a3" }}
      />
    </View>
  );
}

function StatCard({ label, value, hint, theme }) {
  const isDark = theme.key === "dark";
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: isDark
            ? "rgba(15,23,42,0.97)"
            : "rgba(255,255,255,0.97)",
          borderColor: theme.border,
        },
        TOKENS.shadow.soft,
      ]}
    >
      <Text
        style={[
          styles.statLabel,
          { color: isDark ? "#9ca3af" : "#6b7280" },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.statValue,
          { color: theme.text },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.statHint,
          { color: isDark ? "#6b7280" : "#9ca3af" },
        ]}
      >
        {hint}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  MAIN SCREEN COMPONENT                                                     */
/* -------------------------------------------------------------------------- */

export default function FocusScreen() {
  const { theme } = useTheme();
  const isDark = theme.key === "dark"; // ✅ correct with your ThemeContext

  // ----------------- CORE STATE -----------------
  const [selectedMode, setSelectedMode] = useState("pomodoro");
  const [customMinutes, setCustomMinutes] = useState(45);
  const [initialSeconds, setInitialSeconds] = useState(25 * 60);
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  // Stats
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [todaySessions, setTodaySessions] = useState(0);
  const [longestSession, setLongestSession] = useState(0);
  const [weeklyMinutes, setWeeklyMinutes] = useState(0);

  // UX toggles
  const [zenLock, setZenLock] = useState(false);
  const [minimalUI, setMinimalUI] = useState(false);
  const [ambient, setAmbient] = useState(true);

  // Modals
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [celebrateVisible, setCelebrateVisible] = useState(false);
  const [lastSessionMinutes, setLastSessionMinutes] = useState(0);

  // UI meta
  const [quote, setQuote] = useState(
    QUOTES[Math.floor(Math.random() * QUOTES.length)]
  );

  // Animations
  const intervalRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const minutesDisplay = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secondsDisplay = String(seconds % 60).padStart(2, "0");
  const selectedModeObj =
    FOCUS_MODES.find((m) => m.id === selectedMode) || FOCUS_MODES[0];

  /* ---------------------------------------------------------------------- */
  /*  PERSISTENCE (STATS)                                                  */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        const data = JSON.parse(raw);
        const todayKey = getTodayKey();

        if (data[todayKey]) {
          setTodayMinutes(data[todayKey].minutes || 0);
          setTodaySessions(data[todayKey].sessions || 0);
        }
        setWeeklyMinutes(data.weeklyMinutes || 0);
        setLongestSession(data.longestSession || 0);
      } catch (e) {
        console.log("Error loading focus stats", e);
      }
    })();
  }, []);

  async function saveStats(sessionMinutes) {
    try {
      const todayKey = getTodayKey();
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      let data = raw ? JSON.parse(raw) : {};

      if (!data[todayKey]) {
        data[todayKey] = { minutes: 0, sessions: 0 };
      }

      data[todayKey].minutes += sessionMinutes;
      data[todayKey].sessions += 1;
      data.weeklyMinutes = (data.weeklyMinutes || 0) + sessionMinutes;
      data.longestSession = Math.max(
        data.longestSession || 0,
        sessionMinutes
      );

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      setTodayMinutes(data[todayKey].minutes);
      setTodaySessions(data[todayKey].sessions);
      setWeeklyMinutes(data.weeklyMinutes);
      setLongestSession(data.longestSession);
    } catch (e) {
      console.log("Error saving focus stats", e);
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  MODE HANDLING                                                         */
  /* ---------------------------------------------------------------------- */

  function getSecondsForModeId(modeId) {
    if (modeId === "custom") return customMinutes * 60;
    const mode = FOCUS_MODES.find((m) => m.id === modeId);
    return (mode?.minutes || 25) * 60;
  }

  function handleModePress(modeId) {
    if (running) {
      Alert.alert(
        "Session running",
        "Pause or finish the session before changing modes."
      );
      return;
    }

    setSelectedMode(modeId);

    if (modeId === "custom") {
      setShowCustomModal(true);
      return;
    }

    const secs = getSecondsForModeId(modeId);
    setInitialSeconds(secs);
    setSeconds(secs);
  }

  function handleConfirmCustom(minutesValue) {
    const value = Number(minutesValue);
    if (Number.isNaN(value) || value < 5 || value > 180) {
      Alert.alert("Invalid value", "Choose a duration between 5 and 180.");
      return;
    }
    setCustomMinutes(value);
    const secs = value * 60;
    setInitialSeconds(secs);
    setSeconds(secs);
    setShowCustomModal(false);
  }

  /* ---------------------------------------------------------------------- */
  /*  TIMER + ANIMATIONS                                                    */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setRunning(false);

            const sessionMinutes = Math.round(initialSeconds / 60);
            setLastSessionMinutes(sessionMinutes);
            saveStats(sessionMinutes);
            setCelebrateVisible(true);
            setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
            return initialSeconds;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, initialSeconds]);

  function handleToggleTimer() {
    setRunning((prev) => !prev);
  }

  function handleReset() {
    if (running && zenLock) {
      Alert.alert(
        "Zen Lock active",
        "Turn off Zen Lock to reset this block early."
      );
      return;
    }
    setRunning(false);
    setSeconds(initialSeconds);
  }

  // Progress bar animation
  useEffect(() => {
    if (!initialSeconds) return;
    const ratio =
      seconds >= initialSeconds ? 0 : 1 - seconds / initialSeconds;

    Animated.timing(progressAnim, {
      toValue: ratio,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [seconds, initialSeconds]);

  // Breathing pulse for timer
  useEffect(() => {
    if (!ambient) {
      pulseAnim.setValue(0);
      return;
    }
    if (running) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0);
    }
  }, [running, ambient]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });

  /* ---------------------------------------------------------------------- */
  /*  AI SUGGESTION                                                         */
  /* ---------------------------------------------------------------------- */

  function getAISuggestion() {
    if (running) {
      return "Stay inside the block. Treat the timer as a non-negotiable boundary.";
    }
    if (todayMinutes === 0) {
      return "Start with a 10–25 minute sprint to break inertia.";
    }
    if (todayMinutes >= 120) {
      return "You’ve built strong momentum today. One more focused block will lock in your gains.";
    }
    if (todaySessions >= 4) {
      return "Your consistency is strong. Use the next block for the single highest-leverage task.";
    }
    if (zenLock) {
      return "Zen Lock is on. Protect this upcoming block like an important meeting.";
    }
    return "Choose a mode that matches your energy, then commit fully until the block ends.";
  }

  /* ---------------------------------------------------------------------- */
  /*  COLORS (DARK / LIGHT)                                                 */
  /* ---------------------------------------------------------------------- */

  const backgroundGradient = isDark
    ? ["#020617", "#050816", "#020617"]
    : ["#f5f0e6", "#f7f7ff", "#ffffff"];

  const accentGradient = isDark
    ? ["#4f46e5", "#7c3aed", "#a855f7"]
    : ["#6366f1", "#ec4899", "#facc15"];

  const timerInnerBg = isDark
    ? "rgba(10,15,30,0.98)"
    : "rgba(249,250,252,0.98)";

  const cardSurface = isDark ? theme.card : "rgba(255,255,255,0.97)";

  /* ---------------------------------------------------------------------- */
  /*  RENDER                                                                */
  /* ---------------------------------------------------------------------- */

  return (
    <LinearGradient colors={backgroundGradient} style={styles.container}>
      {/* BACKGROUND PLASMA ORBS */}
      <View
        style={[
          styles.orbTopRight,
          {
            backgroundColor: isDark
              ? "rgba(129,140,248,0.32)"
              : "rgba(250,204,21,0.14)",
          },
        ]}
        pointerEvents="none"
      />
      <View
        style={[
          styles.orbBottomLeft,
          {
            borderColor: isDark
              ? "rgba(148,163,184,0.38)"
              : "rgba(209,213,219,0.8)",
          },
        ]}
        pointerEvents="none"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* HEADER */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>
              Deep Focus OS
            </Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>
              One Plasma workspace for high-quality, distraction-free sessions.
            </Text>
          </View>

          <View
            style={[
              styles.headerPill,
              {
                backgroundColor: isDark
                  ? "rgba(15,23,42,0.96)"
                  : "rgba(255,255,255,0.96)",
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={styles.headerPillLabel}>Today</Text>
            <Text style={styles.headerPillValue}>
              {todayMinutes} min · {todaySessions} blocks
            </Text>
          </View>
        </View>

        {/* MODE STRIP */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.modeStrip}
        >
          {FOCUS_MODES.map((mode) => (
            <ModeChip
              key={mode.id}
              mode={mode}
              active={mode.id === selectedMode}
              minimal={minimalUI}
              onPress={() => handleModePress(mode.id)}
              theme={theme}
              isDark={isDark}
            />
          ))}
        </ScrollView>

        {/* TIMER CARD */}
        <View
          style={[
            styles.timerCard,
            { backgroundColor: cardSurface, borderColor: theme.border },
            TOKENS.shadow.card,
          ]}
        >
          <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
            <LinearGradient colors={accentGradient} style={styles.timerOuter}>
              {/* Hologram ring layer */}
              <View style={styles.ringHalo} />
              <View style={styles.ringHaloSoft} />

              {/* Main inner timer */}
              <View
                style={[
                  styles.timerInner,
                  {
                    backgroundColor: timerInnerBg,
                    borderColor: isDark
                      ? "rgba(129,140,248,0.5)"
                      : "rgba(209,213,219,0.9)",
                  },
                ]}
              >
                <Text style={[styles.timerText, { color: theme.text }]}>
                  {minutesDisplay}:{secondsDisplay}
                </Text>
                {!minimalUI && (
                  <Text
                    style={[
                      styles.timerSub,
                      { color: theme.subtext },
                    ]}
                  >
                    {selectedModeObj.label} ·{" "}
                    {selectedMode === "custom"
                      ? `${customMinutes} min`
                      : `${selectedModeObj.minutes} min`}
                  </Text>
                )}
              </View>
            </LinearGradient>
          </Animated.View>

          {/* PROGRESS BAR */}
          <View
            style={[
              styles.progressTrack,
              {
                backgroundColor: isDark ? "#020617" : "#e5e7eb",
              },
            ]}
          >
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressWidth,
                  backgroundColor: isDark ? "#6366f1" : "#7c3aed",
                },
              ]}
            />
          </View>

          {/* TIMER ACTIONS */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: running
                    ? isDark
                      ? "#f9fafb"
                      : "#111827"
                    : "#4f46e5",
                },
              ]}
              onPress={handleToggleTimer}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  {
                    color: running ? "#111827" : "#f9fafb",
                  },
                ]}
              >
                {running ? "Pause session" : "Start session"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryButton,
                { borderColor: theme.border },
              ]}
              onPress={handleReset}
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: theme.text },
                ]}
              >
                Reset
              </Text>
            </TouchableOpacity>
          </View>

          {/* QUOTE */}
          {!minimalUI && (
            <View style={styles.quoteBlock}>
              <Text
                style={[
                  styles.quoteLabel,
                  { color: theme.subtext },
                ]}
              >
                Today’s focus mantra
              </Text>
              <Text
                style={[
                  styles.quoteText,
                  { color: theme.text },
                ]}
              >
                “{quote}”
              </Text>
            </View>
          )}
        </View>

        {/* FOCUS ENVIRONMENT */}
        <View style={styles.section}>
          <SectionHeader
            title="Focus environment"
            subtitle="Tune how MindFlow shields and shapes this block."
            colorTitle={theme.text}
            colorSubtitle={theme.subtext}
          />

          <View style={styles.toggleGrid}>
            <EnhancerToggle
              label="Zen Lock"
              description="Discourage early resets while a block is running."
              value={zenLock}
              onValueChange={setZenLock}
              isDark={isDark}
            />
            <EnhancerToggle
              label="Minimal UI"
              description="Reduce visual noise; keep only the essentials."
              value={minimalUI}
              onValueChange={setMinimalUI}
              isDark={isDark}
            />
            <EnhancerToggle
              label="Ambient Motion"
              description="Soft breathing around the timer while focusing."
              value={ambient}
              onValueChange={setAmbient}
              isDark={isDark}
            />
          </View>
        </View>

        {/* AI SUGGESTION */}
        <View
          style={[
            styles.aiCard,
            { backgroundColor: cardSurface, borderColor: theme.border },
            TOKENS.shadow.soft,
          ]}
        >
          <Text style={[styles.aiLabel, { color: "#a5b4fc" }]}>
            MindFlow Intelligence
          </Text>
          <Text style={[styles.aiText, { color: theme.text }]}>
            {getAISuggestion()}
          </Text>
        </View>

        {/* ANALYTICS */}
        <View style={styles.section}>
          <SectionHeader
            title="Deep work analytics"
            subtitle="A quick snapshot of how today fits into your overall focus."
            colorTitle={theme.text}
            colorSubtitle={theme.subtext}
          />

          <View style={styles.statsRow}>
            <StatCard
              label="Today total"
              value={`${todayMinutes} min`}
              hint="Deep work time"
              theme={theme}
            />
            <StatCard
              label="Sessions"
              value={String(todaySessions)}
              hint="Blocks completed"
              theme={theme}
            />
          </View>

          <View style={styles.statsRow}>
            <StatCard
              label="Longest block"
              value={`${longestSession} min`}
              hint="Single stretch"
              theme={theme}
            />
            <StatCard
              label="This week"
              value={`${weeklyMinutes} min`}
              hint="Total focus"
              theme={theme}
            />
          </View>
        </View>
      </ScrollView>

      {/* CUSTOM MODE MODAL (quick chips only, simple UX) */}
      <Modal
        visible={showCustomModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: isDark
                  ? "rgba(15,23,42,0.98)"
                  : "rgba(255,255,255,0.98)",
              },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: theme.text },
              ]}
            >
              Custom session length
            </Text>
            <Text
              style={[
                styles.modalSubtitle,
                { color: theme.subtext },
              ]}
            >
              Choose a duration that matches your capacity right now.
            </Text>

            <View style={styles.customChipRow}>
              {[25, 45, 60, 90].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={styles.customChip}
                  onPress={() => handleConfirmCustom(m)}
                >
                  <Text style={styles.customChipText}>{m} min</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setShowCustomModal(false);
                setSelectedMode("pomodoro");
                const secs = getSecondsForModeId("pomodoro");
                setInitialSeconds(secs);
                setSeconds(secs);
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CELEBRATION MODAL */}
      <Modal
        visible={celebrateVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCelebrateVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.celebrateCard,
              {
                backgroundColor: isDark
                  ? "rgba(15,23,42,0.98)"
                  : "rgba(255,255,255,0.98)",
              },
            ]}
          >
            <LinearGradient
              colors={accentGradient}
              style={styles.celebrateBadge}
            >
              <Text style={styles.celebrateBadgeText}>
                Session complete
              </Text>
            </LinearGradient>

            <Text
              style={[
                styles.celebrateTitle,
                { color: theme.text },
              ]}
            >
              Strong block of focus.
            </Text>
            <Text
              style={[
                styles.celebrateSubtitle,
                { color: theme.subtext },
              ]}
            >
              You completed {lastSessionMinutes} minutes and now have{" "}
              {todayMinutes} minutes of structured deep work today.
            </Text>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={() => {
                  setCelebrateVisible(false);
                  const secs = getSecondsForModeId(selectedMode);
                  setInitialSeconds(secs);
                  setSeconds(secs);
                }}
              >
                <Text style={styles.modalPrimaryText}>
                  Start another block
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setCelebrateVisible(false)}
              >
                <Text style={styles.modalSecondaryText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

/* -------------------------------------------------------------------------- */
/*  STYLES                                                                    */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 70,
    paddingHorizontal: 22,
  },

  orbTopRight: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -90,
    right: -130,
  },
  orbBottomLeft: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    bottom: -100,
    left: -130,
    borderWidth: 1,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    maxWidth: 260,
  },
  headerPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  headerPillLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#9ca3af",
  },
  headerPillValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#e5e7eb",
  },

  modeStrip: {
    marginBottom: 16,
  },
  modeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: TOKENS.radius.md,
    borderWidth: 1,
    marginRight: 10,
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  modeDesc: {
    fontSize: 11,
    marginTop: 2,
  },

  timerCard: {
    padding: 18,
    borderRadius: TOKENS.radius.xl,
    borderWidth: 1,
    marginBottom: 22,
  },
  timerOuter: {
    width: 240,
    height: 240,
    borderRadius: 120,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
    marginTop: 6,
  },
  ringHalo: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: "rgba(191,219,254,0.6)",
    opacity: 0.75,
  },
  ringHaloSoft: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.45)",
    opacity: 0.85,
  },
  timerInner: {
    width: "100%",
    height: "100%",
    borderRadius: 120,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  timerText: {
    fontSize: 42,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  timerSub: {
    fontSize: 13,
    marginTop: 6,
  },

  progressTrack: {
    height: 6,
    borderRadius: 999,
    marginTop: 20,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },

  quoteBlock: {
    marginTop: 18,
  },
  quoteLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  quoteText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
  },

  section: {
    marginTop: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },

  toggleGrid: {
    marginTop: 14,
    gap: 10,
  },
  enhancerCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: TOKENS.radius.lg,
    borderWidth: 1,
  },
  enhancerLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  enhancerDescription: {
    fontSize: 11,
    marginTop: 2,
  },

  aiCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: TOKENS.radius.lg,
    borderWidth: 1,
  },
  aiLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  aiText: {
    fontSize: 13,
    lineHeight: 18,
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  statCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: TOKENS.radius.lg,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  statHint: {
    fontSize: 11,
    marginTop: 2,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 22,
  },
  modalCard: {
    width: "100%",
    borderRadius: TOKENS.radius.xl,
    padding: 18,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  customChipRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  customChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#111827",
    alignItems: "center",
  },
  customChipText: {
    color: "#f9fafb",
    fontSize: 13,
    fontWeight: "600",
  },
  modalCancelButton: {
    marginTop: 16,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#6b7280",
    alignItems: "center",
  },
  modalCancelText: {
    color: "#e5e7eb",
    fontSize: 13,
    fontWeight: "500",
  },

  celebrateCard: {
    width: "100%",
    borderRadius: TOKENS.radius.xl,
    padding: 20,
  },
  celebrateBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
  },
  celebrateBadgeText: {
    color: "#f9fafb",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  celebrateTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  celebrateSubtitle: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
  },
  modalButtonsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  modalPrimaryButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: "#4f46e5",
    alignItems: "center",
  },
  modalPrimaryText: {
    color: "#f9fafb",
    fontWeight: "600",
    fontSize: 14,
  },
  modalSecondaryButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#6b7280",
    alignItems: "center",
  },
  modalSecondaryText: {
    color: "#e5e7eb",
    fontWeight: "500",
    fontSize: 13,
  },
});
