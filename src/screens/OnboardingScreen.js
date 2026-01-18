// src/screens/OnboardingScreen.js

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const STEPS = [
  {
    key: "calm",
    titleTop: "Design your calm,",
    titleBottom: "own your focus.",
    subtitle:
      "MindFlow OS is your private workspace where tasks, focus, and wellness live together in one calm surface.",
    chips: [
      { icon: "checkmark-circle", label: "Intentional tasks" },
      { icon: "moon-outline", label: "Soft dark OS" },
      { icon: "sparkles-outline", label: "Focus-first layout" },
    ],
  },
  {
    key: "system",
    titleTop: "Build a focus",
    titleBottom: "system that fits you.",
    subtitle:
      "Capture tasks, time-block your day, track goals and reflect — all connected, not scattered in 5 apps.",
    chips: [
      { icon: "time-outline", label: "Deep work blocks" },
      { icon: "flag-outline", label: "Goal tracking" },
      { icon: "document-text-outline", label: "Smart notes" },
    ],
  },
  {
    key: "os",
    titleTop: "Welcome to",
    titleBottom: "MindFlow OS v∞.",
    subtitle:
      "A plasma-style dashboard with streaks, analytics, focus timer and insights designed for real study & work.",
    chips: [
      { icon: "flame-outline", label: "Streaks & stats" },
      { icon: "sparkles-outline", label: "Mindful insights" },
      { icon: "grid-outline", label: "OS-level home" },
    ],
  },
];

export default function OnboardingScreen({ onFinish }) {
  // ❗ IMPORTANT: No navigation.navigate() anywhere here
  // App.js controls which screen shows next

  const [stepIndex, setStepIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  const step = STEPS[stepIndex];

  const goToStep = (index) => {
    setStepIndex(index);
    Animated.timing(progress, {
      toValue: index,
      duration: 260,
      useNativeDriver: true,
    }).start();
  };

  // ❗ Final button now uses onFinish()
  const handleNext = () => {
    if (stepIndex < STEPS.length - 1) {
      goToStep(stepIndex + 1);
    } else {
      onFinish(); // ✔ finish onboarding
    }
  };

  const isLast = stepIndex === STEPS.length - 1;

  return (
    <LinearGradient
      colors={["#020617", "#0b1120", "#1e1b4b", "#4c1d95"]}
      style={styles.container}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Ionicons name="sparkles-outline" size={22} color="#a5b4fc" />
          <Text style={styles.brandText}>MindFlow OS</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>v∞ champion build</Text>
        </View>
      </View>

      {/* CENTER CONTENT */}
      <View style={styles.center}>
        <View style={styles.orb} />

        {/* Animated Slide */}
        <Animated.View
          style={[
            styles.slide,
            {
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, STEPS.length - 1],
                    outputRange: [0, -24],
                  }),
                },
                {
                  translateY: progress.interpolate({
                    inputRange: [0, STEPS.length - 1],
                    outputRange: [0, -6],
                  }),
                },
              ],
              opacity: progress.interpolate({
                inputRange: [stepIndex - 1, stepIndex, stepIndex + 1],
                outputRange: [0.6, 1, 0.6],
                extrapolate: "clamp",
              }),
            },
          ]}
        >
          <Text style={styles.title}>{step.titleTop}</Text>
          <Text style={styles.titleGradient}>{step.titleBottom}</Text>

          <Text style={styles.subtitle}>{step.subtitle}</Text>

          <View style={styles.chipsRow}>
            {step.chips.map((chip) => (
              <View key={chip.label} style={styles.chip}>
                <Ionicons name={chip.icon} size={16} color="#a5b4fc" />
                <Text style={styles.chipText}>{chip.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        {/* Pager dots + Skip */}
        <View style={styles.footerTopRow}>
          <View style={styles.dotsRow}>
            {STEPS.map((s, index) => {
              const active = index === stepIndex;
              return (
                <TouchableOpacity
                  key={s.key}
                  onPress={() => goToStep(index)}
                  style={[styles.dot, active && styles.dotActive]}
                  activeOpacity={0.8}
                />
              );
            })}
          </View>

          {!isLast && (
            <TouchableOpacity onPress={onFinish /* ✔ skip directly */}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Primary button */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.primaryButtonWrapper}
          onPress={handleNext}
        >
          <LinearGradient
            colors={["#818cf8", "#a855f7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>
              {isLast ? "Get started" : "Continue"}
            </Text>
            <Ionicons
              name={isLast ? "log-in-outline" : "arrow-forward"}
              size={18}
              color="#f9fafb"
            />
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Built for late nights, deep focus, and ambitious goals.
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingVertical: 32 },

  // HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandText: {
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.4)",
  },
  badgeText: {
    color: "#cbd5f5",
    fontSize: 11,
  },

  // CENTER
  center: { flex: 1, justifyContent: "center" },

  orb: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(129, 140, 248, 0.5)",
    top: 40,
    right: -80,
    opacity: 0.35,
  },

  slide: {
    maxWidth: 340,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#f9fafb",
    letterSpacing: 0.3,
  },
  titleGradient: {
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 16,
    color: "#c7d2fe",
  },
  subtitle: {
    color: "#cbd5f5",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
    opacity: 0.92,
  },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.45)",
  },
  chipText: {
    color: "#e5e7eb",
    fontSize: 12,
    marginLeft: 6,
  },

  // FOOTER
  footer: { gap: 12 },
  footerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(148,163,184,0.5)",
  },
  dotActive: {
    width: 18,
    backgroundColor: "#a855f7",
  },
  skipText: {
    color: "#9ca3af",
    fontSize: 12,
  },

  primaryButtonWrapper: {
    borderRadius: 999,
    overflow: "hidden",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 999,
    gap: 6,
  },
  primaryButtonText: {
    color: "#f9fafb",
    fontWeight: "600",
    fontSize: 16,
  },

  footerText: {
    color: "#9ca3af",
    fontSize: 12,
    textAlign: "center",
  },
});
