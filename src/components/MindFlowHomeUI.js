// src/components/MindFlowHomeUI.js
// Presentational components for MindFlow Home dashboard

import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { useMindFlow } from "../context/MindFlowContext";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

export const FILTERS = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "focus", label: "Deep work" },
  { key: "study", label: "Study" },
  { key: "wellness", label: "Wellness" },
];

export function HeroHeader() {
  const { theme, themeKey, toggleTheme } = useTheme();
  const { greeting, weekday, stats } = useMindFlow();

  return (
    <>
      <View style={styles.heroRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroGreeting, { color: theme.subtext }]}>
            {greeting},
          </Text>
          <Text style={[styles.heroTitle, { color: theme.text }]}>
            You are on a wave of productivity.
          </Text>
        </View>
        <View style={styles.heroAvatarWrap}>
          <LinearGradient
            colors={
              themeKey === "light"
                ? ["#F97316", "#FDBA74"]
                : ["#4F46E5", "#A855F7"]
            }
            style={styles.heroAvatarBorder}
          >
            <View style={styles.heroAvatarInner} />
          </LinearGradient>
        </View>
      </View>

      <View style={styles.heroMetaRow}>
        <View
          style={[
            styles.heroChip,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Ionicons
            name="calendar-outline"
            size={14}
            color={theme.subtext}
          />
          <Text style={[styles.heroChipText, { color: theme.subtext }]}>
            {weekday}
          </Text>
        </View>

        <View style={styles.heroRightGroup}>
          <View
            style={[
              styles.heroChipSmall,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Ionicons name="flame-outline" size={14} color={theme.primary} />
            <Text
              style={[styles.heroChipTextSmall, { color: theme.text }]}
            >
              {stats.streak || 0} day streak
            </Text>
          </View>
          <TouchableOpacity
            onPress={toggleTheme}
            activeOpacity={0.8}
            style={[
              styles.iconPillLarge,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Ionicons
              name={themeKey === "light" ? "moon-outline" : "sunny-outline"}
              size={18}
              color={theme.primary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

export function SearchBar({ onExport }) {
  const { theme } = useTheme();
  const { searchQuery, setSearchQuery } = useMindFlow();

  return (
    <View style={styles.searchRow}>
      <View
        style={[
          styles.searchInputWrap,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        <Ionicons name="search-outline" size={18} color={theme.subtext} />
        <TextInput
          placeholder="Search tasks, notes, planner, goals"
          placeholderTextColor={theme.subtext}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchInput, { color: theme.text }]}
          returnKeyType="search"
        />
      </View>
      <TouchableOpacity
        onPress={onExport}
        activeOpacity={0.8}
        style={[
          styles.iconPillLarge,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <Ionicons name="download-outline" size={18} color={theme.subtext} />
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.iconPillLarge,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <Ionicons name="options-outline" size={18} color={theme.subtext} />
      </TouchableOpacity>
    </View>
  );
}

export function FilterChips() {
  const { theme } = useTheme();
  const { filterKey, setFilterKey } = useMindFlow();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginBottom: 12 }}
      contentContainerStyle={{ paddingRight: 4 }}
    >
      {FILTERS.map((f) => {
        const active = filterKey === f.key;
        return (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilterKey(f.key)}
            style={[
              styles.filterChip,
              {
                borderColor: active ? theme.primary : theme.border,
                backgroundColor: active ? theme.primary + "26" : theme.card,
              },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: active ? theme.primary : theme.subtext },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export function OverviewStrip() {
  const { theme } = useTheme();
  const {
    todayCompleted,
    goals,
    stats,
    completionRatio,
    focusMinutes,
    focusSeconds,
    focusDuration,
    setFocusPreset,
    toggleFocusRunning,
    focusRunning,
    aiInsights,
  } = useMindFlow();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginBottom: 12 }}
      contentContainerStyle={{ paddingRight: 8 }}
    >
      {/* Today snapshot */}
      <View
        style={[
          styles.snapshotCard,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.snapshotLabel, { color: theme.subtext }]}>
          Today overview
        </Text>
        <View style={styles.snapshotRow}>
          <View>
            <Text
              style={[styles.snapshotNumber, { color: theme.text }]}
            >
              {todayCompleted}
            </Text>
            <Text
              style={[styles.snapshotCaption, { color: theme.subtext }]}
            >
              Tasks done
            </Text>
          </View>
          <View>
            <Text
              style={[styles.snapshotNumber, { color: theme.text }]}
            >
              {goals.length}
            </Text>
            <Text
              style={[styles.snapshotCaption, { color: theme.subtext }]}
            >
              Active goals
            </Text>
          </View>
          <View>
            <Text
              style={[styles.snapshotNumber, { color: theme.text }]}
            >
              {stats.streak || 0}
            </Text>
            <Text
              style={[styles.snapshotCaption, { color: theme.subtext }]}
            >
              Day streak
            </Text>
          </View>
        </View>
        <View style={styles.snapshotBarWrap}>
          <View
            style={[
              styles.snapshotBarTrack,
              { borderColor: theme.border },
            ]}
          />
          <LinearGradient
            colors={["#4F46E5", "#7C3AED", "#A855F7"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[
              styles.snapshotBarFill,
              { width: `${Math.min(100, completionRatio)}%` },
            ]}
          />
        </View>
      </View>

      {/* Focus timer */}
      <View
        style={[
          styles.snapshotCard,
          {
            width: width * 0.45,
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        <Text style={[styles.snapshotLabel, { color: theme.subtext }]}>
          Focus session
        </Text>
        <Text style={[styles.focusTime, { color: theme.text }]}>
          {focusMinutes}:{focusSeconds}
        </Text>
        <View style={styles.focusControlsRow}>
          {[25, 50].map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setFocusPreset(m)}
              style={[
                styles.focusChip,
                {
                  borderColor:
                    focusDuration === m * 60 ? theme.primary : theme.border,
                  backgroundColor:
                    focusDuration === m * 60
                      ? theme.primary + "1A"
                      : "transparent",
                },
              ]}
            >
              <Text
                style={[
                  styles.focusChipText,
                  {
                    color:
                      focusDuration === m * 60
                        ? theme.primary
                        : theme.subtext,
                  },
                ]}
              >
                {m}m
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          onPress={toggleFocusRunning}
          style={[
            styles.primaryButton,
            {
              marginTop: 8,
              justifyContent: "center",
              backgroundColor: theme.primary,
            },
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {focusRunning ? "Pause" : "Start focus"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* AI insights */}
      <View
        style={[
          styles.snapshotCard,
          {
            width: width * 0.55,
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        <Text style={[styles.snapshotLabel, { color: theme.subtext }]}>
          MindFlow insights
        </Text>
        {aiInsights.map((line) => (
          <Text
            key={line}
            style={[styles.aiLine, { color: theme.text }]}
          >
            • {line}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

export function QuickActionsRow({ onTabChange }) {
  const { theme } = useTheme();

  const actions = [
    { key: "Tasks", label: "New task", icon: "checkmark-circle-outline" },
    { key: "Notes", label: "New note", icon: "document-text-outline" },
    { key: "Planner", label: "Plan block", icon: "time-outline" },
    { key: "Goals", label: "New goal", icon: "flag-outline" },
  ];

  return (
    <View style={styles.quickRow}>
      {actions.map((a) => (
        <TouchableOpacity
          key={a.key}
          activeOpacity={0.9}
          onPress={() => onTabChange(a.key)}
          style={[
            styles.quickButton,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <View
            style={[
              styles.quickIconWrap,
              {
                backgroundColor:
                  theme.key === "light"
                    ? theme.accent + "26"
                    : theme.primary + "26",
              },
            ]}
          >
            <Ionicons name={a.icon} size={18} color={theme.primary} />
          </View>
          <Text style={[styles.quickLabel, { color: theme.text }]}>
            {a.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function SegmentedTabsHeader({ tabs, activeTab, onTabChange }) {
  const { theme } = useTheme();
  return (
    <View style={styles.tabHeaderRow}>
      {tabs.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            style={[
              styles.tabHeaderChip,
              { backgroundColor: active ? theme.primary : "transparent" },
            ]}
          >
            <Ionicons
              name={tab.icon}
              size={16}
              color={active ? "#F9FAFB" : theme.subtext}
            />
            <Text
              style={[
                styles.tabHeaderText,
                { color: active ? "#F9FAFB" : theme.subtext },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function BottomDock({ tabs, activeTab, onTabChange }) {
  const { theme } = useTheme();

  return (
    <View pointerEvents="box-none" style={styles.bottomDockWrap}>
      <BlurView
        tint={theme.blurTint}
        intensity={40}
        style={[styles.bottomDock, { backgroundColor: theme.card }]}
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onTabChange(tab.key)}
              style={styles.bottomDockItem}
              activeOpacity={0.9}
            >
              <View
                style={[
                  styles.bottomDockIconBubble,
                  { backgroundColor: active ? theme.primary : "transparent" },
                ]}
              >
                <Ionicons
                  name={tab.icon}
                  size={18}
                  color={active ? "#F9FAFB" : theme.subtext}
                />
              </View>
              <Text
                style={[
                  styles.bottomDockLabel,
                  { color: active ? theme.text : theme.subtext },
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  // hero
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  heroGreeting: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginTop: 2,
  },
  heroAvatarWrap: {
    marginLeft: 12,
  },
  heroAvatarBorder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 2,
  },
  heroAvatarInner: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "rgba(15,23,42,0.9)",
  },
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  heroChipText: {
    fontSize: 11,
    fontWeight: "500",
  },
  heroRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroChipSmall: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  heroChipTextSmall: {
    fontSize: 11,
    fontWeight: "500",
  },

  // search
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
  },
  iconPillLarge: {
    borderRadius: 999,
    borderWidth: 1,
    padding: 8,
  },

  // filters
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "500",
  },

  // overview
  snapshotCard: {
    width: width * 0.52,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginRight: 10,
  },
  snapshotLabel: {
    fontSize: 11,
    marginBottom: 8,
  },
  snapshotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  snapshotNumber: {
    fontSize: 18,
    fontWeight: "700",
  },
  snapshotCaption: {
    fontSize: 11,
    marginTop: 2,
  },
  snapshotBarWrap: {
    marginTop: 10,
  },
  snapshotBarTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  snapshotBarFill: {
    height: 6,
    borderRadius: 999,
  },

  focusTime: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 2,
  },
  focusControlsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  focusChip: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 4,
    alignItems: "center",
  },
  focusChipText: {
    fontSize: 11,
    fontWeight: "500",
  },
  aiLine: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },

  // quick actions
  quickRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  quickButton: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  quickIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: "500",
  },

  // tab header
  tabHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  tabHeaderChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    paddingVertical: 6,
    gap: 4,
  },
  tabHeaderText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // bottom dock
  bottomDockWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 12,
  },
  bottomDock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  bottomDockItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  bottomDockIconBubble: {
    padding: 6,
    borderRadius: 999,
  },
  bottomDockLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
});
