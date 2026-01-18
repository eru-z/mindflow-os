// MindFlow HomeTabsScreen — Plasma Aura OS (Erudita v∞)

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    Animated,
    Dimensions,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// ✅ Correct auth import:
import { useAuth } from "../context/AuthContext";
// ✅ Theme
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

// ---------------------------
// STORAGE KEYS
// ---------------------------
const STORAGE_KEYS = {
  TASKS: "@mindflow_tasks",
  NOTES: "@mindflow_notes",
  PLANNER: "@mindflow_planner",
  GOALS: "@mindflow_goals",
  STATS: "@mindflow_stats",
};

// ---------------------------
// INTERNAL CONTEXT (for tabs data)
// ---------------------------
const TabsContext = createContext(null);
function useApp() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("useApp must be used inside TabsContext.Provider");
  return ctx;
}

// Simple fade+scale animation for each tab
function useFadeScale() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [anim]);
  return {
    opacity: anim,
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.97, 1],
        }),
      },
    ],
  };
}

const TABS = [
  { key: "Tasks", label: "Tasks", icon: "checkmark-done-outline" },
  { key: "Notes", label: "Notes", icon: "document-text-outline" },
  { key: "Planner", label: "Planner", icon: "time-outline" },
  { key: "Goals", label: "Goals", icon: "flag-outline" },
];

const FILTERS = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "focus", label: "Deep work" },
  { key: "study", label: "Study" },
  { key: "wellness", label: "Wellness" },
];

// ----------------------------------------------------------------------
// ROOT HOME TABS SCREEN
// ----------------------------------------------------------------------
export default function HomeTabsScreen() {
  // safer auth usage to avoid "Cannot read property 'user' of undefined"
  const auth = useAuth();
  const user = auth?.user || null;

  const themeCtx = useTheme();
  const rawTheme =
  (themeCtx && (themeCtx.theme || themeCtx)) || {
    key: "dark",
    background: "#020617",
    text: "#F9FAFB",
    subtext: "#9CA3AF",
    primary: "#8B5CF6",
    card: "#020617",
    border: "#1F2937",
  };

  const toggleTheme = themeCtx?.toggleTheme || (() => {});

  // Normalize theme so this screen can use extra tokens
  const themeKey = rawTheme?.key || "dark";
  const theme = {
    ...rawTheme,
    key: themeKey,
    surface:
      rawTheme?.surface ||
      rawTheme?.card ||
      (themeKey === "light" ? "#ffffff" : "rgba(15,23,42,0.96)"),
    accent: rawTheme?.accent || rawTheme?.primary || "#A855F7",
    blurTint: rawTheme?.blurTint || (themeKey === "light" ? "light" : "dark"),
  };

  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [planner, setPlanner] = useState([]);
  const [goals, setGoals] = useState([]);

  const [stats, setStats] = useState({
    streak: 0,
    lastActiveDate: null,
  });

  // Focus mini-timer
  const [focusDuration, setFocusDuration] = useState(25 * 60);
  const [focusRemaining, setFocusRemaining] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const focusIntervalRef = useRef(null);

  const [exporting, setExporting] = useState(false);

  // Home UI state
  const [activeTab, setActiveTab] = useState("Tasks");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKey, setFilterKey] = useState("all");

  // Initial load
  useEffect(() => {
    (async () => {
      try {
        const [t, n, p, g, storedStats] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.TASKS),
          AsyncStorage.getItem(STORAGE_KEYS.NOTES),
          AsyncStorage.getItem(STORAGE_KEYS.PLANNER),
          AsyncStorage.getItem(STORAGE_KEYS.GOALS),
          AsyncStorage.getItem(STORAGE_KEYS.STATS),
        ]);
        if (t) setTasks(JSON.parse(t));
        if (n) setNotes(JSON.parse(n));
        if (p) setPlanner(JSON.parse(p));
        if (g) setGoals(JSON.parse(g));
        if (storedStats) setStats(JSON.parse(storedStats));
      } catch (e) {
        console.warn("Failed to load MindFlow data", e);
      }
    })();
  }, []);

  // Persist data
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks)).catch(
      () => {}
    );
  }, [tasks]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes)).catch(
      () => {}
    );
  }, [notes]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.PLANNER, JSON.stringify(planner)).catch(
      () => {}
    );
  }, [planner]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals)).catch(
      () => {}
    );
  }, [goals]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats)).catch(
      () => {}
    );
  }, [stats]);

  // Streak logic
  function registerProductiveEvent() {
    const today = new Date().toISOString().slice(0, 10);
    setStats((prev) => {
      if (!prev.lastActiveDate) {
        return { lastActiveDate: today, streak: 1 };
      }
      if (prev.lastActiveDate === today) {
        return prev;
      }
      const prevDate = new Date(prev.lastActiveDate);
      const diffDays = Math.round(
        (new Date(today) - prevDate) / (1000 * 60 * 60 * 24)
      );
      return {
        lastActiveDate: today,
        streak: diffDays === 1 ? prev.streak + 1 : 1,
      };
    });
  }

  // Focus timer logic
  useEffect(() => {
    if (focusRunning) {
      focusIntervalRef.current = setInterval(() => {
        setFocusRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(focusIntervalRef.current);
            registerProductiveEvent();
            return focusDuration;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (focusIntervalRef.current) {
      clearInterval(focusIntervalRef.current);
    }
    return () => {
      if (focusIntervalRef.current) clearInterval(focusIntervalRef.current);
    };
  }, [focusRunning, focusDuration]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const payload = JSON.stringify(
        { tasks, notes, planner, goals, stats },
        null,
        2
      );
      await Share.share({
        message: payload,
        title: "MindFlow backup",
      });
    } catch (e) {
      console.warn("Export failed", e);
    } finally {
      setExporting(false);
    }
  };

  const aiInsights = getAIInsights({ tasks, planner, goals });

  const gradientColors =
    themeKey === "light"
      ? ["#FDF2FF", "#FAF5FF", "#FEFCE8"]
      : ["#020617", "#0B0625", "#1E1037", "#312E81"];

  const focusMinutes = Math.floor(focusRemaining / 60)
    .toString()
    .padStart(2, "0");
  const focusSeconds = (focusRemaining % 60).toString().padStart(2, "0");

  const todayCompleted = countCompletedToday(tasks);
  const completionRatio =
    (todayCompleted / Math.max(tasks.length || 1, 3)) * 100;

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const weekday = now.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const displayName = user?.name || "there";

  return (
    <TabsContext.Provider
      value={{
        theme,
        tasks,
        setTasks,
        notes,
        setNotes,
        planner,
        setPlanner,
        goals,
        setGoals,
        stats,
        registerProductiveEvent,
        searchQuery,
        filterKey,
      }}
    >
      <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
        <View style={styles.root}>
          {/* Frosted overlay */}
          <BlurView
            style={StyleSheet.absoluteFill}
            intensity={40}
            tint={theme.blurTint}
          />

          {/* Decorative orbs */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View
              style={[
                styles.orb,
                styles.orbTopRight,
                { backgroundColor: theme.primary },
              ]}
            />
            <View
              style={[
                styles.orb,
                styles.orbBottomLeft,
                { backgroundColor: theme.accent },
              ]}
            />
          </View>

          {/* HERO HEADER */}
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.heroGreeting, { color: theme.subtext }]}
                numberOfLines={1}
              >
                {greeting}, {displayName}
              </Text>
              <Text
                style={[styles.heroTitle, { color: theme.text }]}
                numberOfLines={1}
              >
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
              <Text
                style={[styles.heroChipText, { color: theme.subtext }]}
                numberOfLines={1}
              >
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
                <Ionicons
                  name="flame-outline"
                  size={14}
                  color={theme.primary}
                />
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

          {/* SEARCH + HEADER ACTIONS */}
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
              <Ionicons
                name="search-outline"
                size={18}
                color={theme.subtext}
              />
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
              onPress={handleExport}
              activeOpacity={0.8}
              style={[
                styles.iconPillLarge,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Ionicons
                name={exporting ? "sync-outline" : "download-outline"}
                size={18}
                color={theme.subtext}
              />
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

          {/* FILTER CHIPS */}
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
                      backgroundColor: active
                        ? theme.primary + "26"
                        : theme.card,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      {
                        color: active ? theme.primary : theme.subtext,
                      },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* OVERVIEW STRIP (analytics + focus + AI) */}
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
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
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
                    style={[
                      styles.snapshotCaption,
                      { color: theme.subtext },
                    ]}
                  >
                    Tasks completed
                  </Text>
                </View>
                <View>
                  <Text
                    style={[styles.snapshotNumber, { color: theme.text }]}
                  >
                    {goals.length}
                  </Text>
                  <Text
                    style={[
                      styles.snapshotCaption,
                      { color: theme.subtext },
                    ]}
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
                    style={[
                      styles.snapshotCaption,
                      { color: theme.subtext },
                    ]}
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
                    {
                      width: `${Math.min(100, completionRatio)}%`,
                    },
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
                    onPress={() => {
                      const secs = m * 60;
                      setFocusDuration(secs);
                      setFocusRemaining(secs);
                    }}
                    style={[
                      styles.focusChip,
                      {
                        borderColor:
                          focusDuration === m * 60
                            ? theme.primary
                            : theme.border,
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
                onPress={() => setFocusRunning((v) => !v)}
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

            {/* AI / insights */}
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
                <Text key={line} style={[styles.aiLine, { color: theme.text }]}>
                  • {line}
                </Text>
              ))}
            </View>
          </ScrollView>

          {/* QUICK ACTIONS BAR */}
          <View style={styles.quickRow}>
            <QuickAction
              label="New task"
              icon="checkmark-circle-outline"
              theme={theme}
              onPress={() => setActiveTab("Tasks")}
            />
            <QuickAction
              label="New note"
              icon="document-text-outline"
              theme={theme}
              onPress={() => setActiveTab("Notes")}
            />
            <QuickAction
              label="Plan block"
              icon="time-outline"
              theme={theme}
              onPress={() => setActiveTab("Planner")}
            />
            <QuickAction
              label="New goal"
              icon="flag-outline"
              theme={theme}
              onPress={() => setActiveTab("Goals")}
            />
          </View>

          {/* CONTENT SHELL WITH CUSTOM TABS */}
          <View
            style={[
              styles.tabsWrapper,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            {/* Segmented header */}
            <View style={styles.tabHeaderRow}>
              {TABS.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    style={[
                      styles.tabHeaderChip,
                      {
                        backgroundColor: active
                          ? theme.primary
                          : "transparent",
                      },
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
                        {
                          color: active ? "#F9FAFB" : theme.subtext,
                        },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.tabContentWrapper}>
              {activeTab === "Tasks" && <TasksTab />}
              {activeTab === "Notes" && <NotesTab />}
              {activeTab === "Planner" && <PlannerTab />}
              {activeTab === "Goals" && <GoalsTab />}
            </View>
          </View>

          {/* FLOATING BOTTOM DOCK */}
          <BottomDock
            activeTab={activeTab}
            onTabPress={setActiveTab}
            theme={theme}
          />
        </View>
      </LinearGradient>
    </TabsContext.Provider>
  );
}

// ----------------------------------------------------------------------
// QUICK ACTION BUTTON
// ----------------------------------------------------------------------
function QuickAction({ label, icon, theme, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
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
        <Ionicons name={icon} size={18} color={theme.primary} />
      </View>
      <Text style={[styles.quickLabel, { color: theme.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ----------------------------------------------------------------------
// FLOATING BOTTOM DOCK
// ----------------------------------------------------------------------
function BottomDock({ activeTab, onTabPress, theme }) {
  return (
    <View pointerEvents="box-none" style={styles.bottomDockWrap}>
      <BlurView
        tint={theme.blurTint}
        intensity={40}
        style={[styles.bottomDock, { backgroundColor: theme.card }]}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onTabPress(tab.key)}
              style={styles.bottomDockItem}
              activeOpacity={0.9}
            >
              <View
                style={[
                  styles.bottomDockIconBubble,
                  {
                    backgroundColor: active ? theme.primary : "transparent",
                  },
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

// ----------------------------------------------------------------------
// TASKS TAB
// ----------------------------------------------------------------------
function TasksTab() {
  const {
    theme,
    tasks,
    setTasks,
    registerProductiveEvent,
    searchQuery,
    filterKey,
  } = useApp();
  const animStyle = useFadeScale();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("Medium");

  const openNewTask = () => {
    setEditingTask(null);
    setTitle("");
    setCategory("");
    setPriority("Medium");
    setModalVisible(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setCategory(task.category || "");
    setPriority(task.priority || "Medium");
    setModalVisible(true);
  };

  const saveTask = () => {
    if (!title.trim()) return;
    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                title: title.trim(),
                category: category.trim(),
                priority,
              }
            : t
        )
      );
    } else {
      const now = new Date().toISOString();
      setTasks((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          title: title.trim(),
          category: category.trim(),
          priority,
          completed: false,
          createdAt: now,
          completedAt: null,
        },
      ]);
    }
    setModalVisible(false);
  };

  const toggleCompleted = (id) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const nowCompleted = !t.completed;
        if (nowCompleted) registerProductiveEvent();
        return {
          ...t,
          completed: nowCompleted,
          completedAt: nowCompleted ? new Date().toISOString() : null,
        };
      })
    );
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const priorityColor = (p) => {
    if (p === "High") return "#EF4444";
    if (p === "Low") return "#22C55E";
    return theme.primary;
  };

  const sorted = [...tasks].sort((a, b) => {
    const map = { High: 0, Medium: 1, Low: 2 };
    return (map[a.priority] ?? 1) - (map[b.priority] ?? 1);
  });

  const visible = sorted.filter((t) => filterTask(t, searchQuery, filterKey));

  return (
    <Animated.View style={[styles.tabContainer, animStyle]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Tasks
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={openNewTask}
          >
            <Ionicons name="add" size={18} color="#F9FAFB" />
            <Text style={styles.primaryButtonText}>New Task</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.sectionSubtitle, { color: theme.subtext }]}>
          Capture focus tasks for today. Tap to complete, long-press to edit.
        </Text>

        {visible.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: theme.subtext }]}>
              No tasks match your view
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>
              Adjust filters or create a new task to start the day with
              intention.
            </Text>
          </View>
        ) : (
          <View style={{ marginTop: 14 }}>
            {visible.map((task) => (
              <Pressable
                key={task.id}
                onPress={() => toggleCompleted(task.id)}
                onLongPress={() => openEditTask(task)}
                style={({ pressed }) => [
                  styles.glassCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
              >
                <View style={styles.cardTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.taskTitle,
                        {
                          color: theme.text,
                          textDecorationLine: task.completed
                            ? "line-through"
                            : "none",
                          opacity: task.completed ? 0.6 : 1,
                        },
                      ]}
                    >
                      {task.title}
                    </Text>
                    {!!task.category && (
                      <Text
                        style={[
                          styles.taskCategory,
                          { color: theme.subtext },
                        ]}
                      >
                        {task.category}
                      </Text>
                    )}
                  </View>

                  <View
                    style={[
                      styles.priorityChip,
                      {
                        borderColor: priorityColor(task.priority),
                        backgroundColor:
                          theme.key === "light"
                            ? "#FFFBF5"
                            : "rgba(15,23,42,0.95)",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: priorityColor(task.priority) },
                      ]}
                    />
                    <Text
                      style={[
                        styles.priorityText,
                        { color: priorityColor(task.priority) },
                      ]}
                    >
                      {task.priority}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBottomRow}>
                  <Text style={[styles.cardMeta, { color: theme.subtext }]}>
                    {task.completed ? "Completed" : "Active"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => deleteTask(task.id)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={theme.subtext}
                    />
                  </TouchableOpacity>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <LinearGradient
            colors={
              theme.key === "light"
                ? ["#FDF2FF", "#FFFFFF"]
                : ["#020617", "#111827"]
            }
            style={styles.modalCardWrap}
          >
            <BlurView
              tint={theme.blurTint}
              intensity={40}
              style={styles.modalCard}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingTask ? "Edit Task" : "New Task"}
              </Text>

              <TextInput
                placeholder="Title"
                placeholderTextColor={theme.subtext}
                value={title}
                onChangeText={setTitle}
                style={[
                  styles.input,
                  { borderColor: theme.border, color: theme.text },
                ]}
              />
              <TextInput
                placeholder="Category (optional)"
                placeholderTextColor={theme.subtext}
                value={category}
                onChangeText={setCategory}
                style={[
                  styles.input,
                  { borderColor: theme.border, color: theme.text },
                ]}
              />

              <Text style={[styles.modalLabel, { color: theme.subtext }]}>
                Priority
              </Text>
              <View style={styles.priorityRow}>
                {["High", "Medium", "Low"].map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPriority(p)}
                    style={[
                      styles.priorityOption,
                      {
                        borderColor:
                          priority === p ? priorityColor(p) : theme.border,
                        backgroundColor:
                          priority === p
                            ? priorityColor(p) + "14"
                            : "transparent",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityOptionText,
                        {
                          color:
                            priority === p
                              ? priorityColor(p)
                              : theme.subtext,
                        },
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={[
                    styles.secondaryButton,
                    { borderColor: theme.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      { color: theme.subtext },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveTask}
                  style={[
                    styles.primaryButton,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Text style={styles.primaryButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </LinearGradient>
        </View>
      </Modal>
    </Animated.View>
  );
}

// ----------------------------------------------------------------------
// NOTES TAB
// ----------------------------------------------------------------------
function NotesTab() {
  const { theme, notes, setNotes, searchQuery, filterKey } = useApp();
  const animStyle = useFadeScale();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const openNewNote = () => {
    setEditingNote(null);
    setTitle("");
    setContent("");
    setModalVisible(true);
  };

  const openEditNote = (note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setModalVisible(true);
  };

  const saveNote = () => {
    if (!title.trim() && !content.trim()) return;
    const now = new Date().toISOString();
    if (editingNote) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingNote.id ? { ...n, title, content } : n
        )
      );
    } else {
      setNotes((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          title: title.trim() || "Untitled",
          content: content.trim(),
          createdAt: now,
        },
      ]);
    }
    setModalVisible(false);
  };

  const deleteNote = (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const filteredNotes = notes.filter((n) =>
    filterNote(n, searchQuery, filterKey)
  );

  const left = filteredNotes.filter((_, i) => i % 2 === 0);
  const right = filteredNotes.filter((_, i) => i % 2 === 1);

  return (
    <Animated.View style={[styles.tabContainer, animStyle]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Notes
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={openNewNote}
          >
            <Ionicons name="add" size={18} color="#F9FAFB" />
            <Text style={styles.primaryButtonText}>New Note</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.sectionSubtitle, { color: theme.subtext }]}>
          Capture ideas, learning and references in flexible cards.
        </Text>

        {filteredNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: theme.subtext }]}>
              No notes match your view
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>
              Use search to find a note or start fresh with a new one.
            </Text>
          </View>
        ) : (
          <View style={styles.masonryWrap}>
            <View style={styles.masonryColumn}>
              {left.map((note) => (
                <Pressable
                  key={note.id}
                  onPress={() => openEditNote(note)}
                  style={({ pressed }) => [
                    styles.noteCard,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      opacity: pressed ? 0.93 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}
                >
                  <Text
                    style={[styles.noteTitle, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {note.title}
                  </Text>
                  <Text
                    style={[styles.noteContent, { color: theme.subtext }]}
                    numberOfLines={5}
                  >
                    {note.content}
                  </Text>
                  <TouchableOpacity
                    onPress={() => deleteNote(note.id)}
                    style={styles.noteDelete}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={theme.subtext}
                    />
                  </TouchableOpacity>
                </Pressable>
              ))}
            </View>
            <View style={styles.masonryColumn}>
              {right.map((note) => (
                <Pressable
                  key={note.id}
                  onPress={() => openEditNote(note)}
                  style={({ pressed }) => [
                    styles.noteCard,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      opacity: pressed ? 0.93 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}
                >
                  <Text
                    style={[styles.noteTitle, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {note.title}
                  </Text>
                  <Text
                    style={[styles.noteContent, { color: theme.subtext }]}
                    numberOfLines={5}
                  >
                    {note.content}
                  </Text>
                  <TouchableOpacity
                    onPress={() => deleteNote(note.id)}
                    style={styles.noteDelete}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={theme.subtext}
                    />
                  </TouchableOpacity>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <LinearGradient
            colors={
              theme.key === "light"
                ? ["#FDF2FF", "#FFFFFF"]
                : ["#020617", "#111827"]
            }
            style={styles.modalCardWrap}
          >
            <BlurView
              tint={theme.blurTint}
              intensity={40}
              style={styles.modalCard}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingNote ? "Edit Note" : "New Note"}
              </Text>

              <TextInput
                placeholder="Title"
                placeholderTextColor={theme.subtext}
                value={title}
                onChangeText={setTitle}
                style={[
                  styles.input,
                  { borderColor: theme.border, color: theme.text },
                ]}
              />
              <TextInput
                placeholder="Content"
                placeholderTextColor={theme.subtext}
                value={content}
                onChangeText={setContent}
                style={[
                  styles.textArea,
                  { borderColor: theme.border, color: theme.text },
                ]}
                multiline
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={[
                    styles.secondaryButton,
                    { borderColor: theme.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      { color: theme.subtext },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveNote}
                  style={[
                    styles.primaryButton,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Text style={styles.primaryButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </LinearGradient>
        </View>
      </Modal>
    </Animated.View>
  );
}

// ----------------------------------------------------------------------
// PLANNER TAB
// ----------------------------------------------------------------------
function PlannerTab() {
  const { theme, planner, setPlanner, searchQuery, filterKey } = useApp();
  const animStyle = useFadeScale();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");

  const openNewBlock = () => {
    setEditingBlock(null);
    setTime("");
    setTitle("");
    setModalVisible(true);
  };

  const openEditBlock = (block) => {
    setEditingBlock(block);
    setTime(block.time);
    setTitle(block.title);
    setModalVisible(true);
  };

  const saveBlock = () => {
    if (!time.trim() || !title.trim()) return;
    if (editingBlock) {
      setPlanner((prev) =>
        prev.map((b) =>
          b.id === editingBlock.id
            ? { ...b, time: time.trim(), title: title.trim() }
            : b
        )
      );
    } else {
      setPlanner((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          time: time.trim(),
          title: title.trim(),
        },
      ]);
    }
    setModalVisible(false);
  };

  const deleteBlock = (id) => {
    setPlanner((prev) => prev.filter((b) => b.id !== id));
  };

  const sorted = [...planner].sort((a, b) => a.time.localeCompare(b.time));
  const visible = sorted.filter((b) => filterBlock(b, searchQuery, filterKey));

  return (
    <Animated.View style={[styles.tabContainer, animStyle]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Planner
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={openNewBlock}
          >
            <Ionicons name="add" size={18} color="#F9FAFB" />
            <Text style={styles.primaryButtonText}>Add Block</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.sectionSubtitle, { color: theme.subtext }]}>
          Time-block your day into deep work, admin, breaks and review.
        </Text>

        {visible.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: theme.subtext }]}>
              No blocks match your view
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>
              Plan your morning, afternoon and evening as separate focus blocks.
            </Text>
          </View>
        ) : (
          <View style={styles.timelineWrap}>
            <View
              style={[
                styles.timelineLine,
                { backgroundColor: theme.border },
              ]}
            />
            {visible.map((block) => (
              <Pressable
                key={block.id}
                onPress={() => openEditBlock(block)}
                style={({ pressed }) => [
                  styles.timelineItem,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    opacity: pressed ? 0.93 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                <View style={styles.timelineDotOuter}>
                  <View
                    style={[
                      styles.timelineDotInner,
                      { backgroundColor: theme.primary },
                    ]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.timelineTime, { color: theme.subtext }]}
                  >
                    {block.time}
                  </Text>
                  <Text
                    style={[styles.timelineTitle, { color: theme.text }]}
                  >
                    {block.title}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => deleteBlock(block.id)}
                  hitSlop={8}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={theme.subtext}
                  />
                </TouchableOpacity>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <LinearGradient
            colors={
              theme.key === "light"
                ? ["#FDF2FF", "#FFFFFF"]
                : ["#020617", "#111827"]
            }
            style={styles.modalCardWrap}
          >
            <BlurView
              tint={theme.blurTint}
              intensity={40}
              style={styles.modalCard}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingBlock ? "Edit Block" : "New Block"}
              </Text>

              <TextInput
                placeholder="Time (e.g. 09:00–11:00)"
                placeholderTextColor={theme.subtext}
                value={time}
                onChangeText={setTime}
                style={[
                  styles.input,
                  { borderColor: theme.border, color: theme.text },
                ]}
              />
              <TextInput
                placeholder="Title"
                placeholderTextColor={theme.subtext}
                value={title}
                onChangeText={setTitle}
                style={[
                  styles.input,
                  { borderColor: theme.border, color: theme.text },
                ]}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={[
                    styles.secondaryButton,
                    { borderColor: theme.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      { color: theme.subtext },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveBlock}
                  style={[
                    styles.primaryButton,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Text style={styles.primaryButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </LinearGradient>
        </View>
      </Modal>
    </Animated.View>
  );
}

// ----------------------------------------------------------------------
// GOALS TAB
// ----------------------------------------------------------------------
function GoalsTab() {
  const {
    theme,
    goals,
    setGoals,
    registerProductiveEvent,
    searchQuery,
    filterKey,
  } = useApp();
  const animStyle = useFadeScale();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState("0");

  const openNewGoal = () => {
    setEditingGoal(null);
    setTitle("");
    setDescription("");
    setProgress("0");
    setModalVisible(true);
  };

  const openEditGoal = (goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description);
    setProgress(String(goal.progress ?? 0));
    setModalVisible(true);
  };

  const saveGoal = () => {
    if (!title.trim()) return;
    const numeric = Math.min(100, Math.max(0, Number(progress) || 0));
    if (editingGoal) {
      setGoals((prev) =>
        prev.map((g) =>
          g.id === editingGoal.id
            ? {
                ...g,
                title: title.trim(),
                description: description.trim(),
                progress: numeric,
              }
            : g
        )
      );
    } else {
      setGoals((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          title: title.trim(),
          description: description.trim(),
          progress: numeric,
        },
      ]);
    }
    if (numeric > 0) registerProductiveEvent();
    setModalVisible(false);
  };

  const deleteGoal = (id) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const visible = goals.filter((g) => filterGoal(g, searchQuery, filterKey));

  return (
    <Animated.View style={[styles.tabContainer, animStyle]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Goals
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={openNewGoal}
          >
            <Ionicons name="add" size={18} color="#F9FAFB" />
            <Text style={styles.primaryButtonText}>Add Goal</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.sectionSubtitle, { color: theme.subtext }]}>
          Define direction and track visual progress over time.
        </Text>

        {visible.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: theme.subtext }]}>
              No goals match your view
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>
              Add learning, career, health or personal goals and revisit weekly.
            </Text>
          </View>
        ) : (
          <View style={{ marginTop: 14 }}>
            {visible.map((goal) => (
              <Pressable
                key={goal.id}
                onPress={() => openEditGoal(goal)}
                style={({ pressed }) => [
                  styles.glassCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    opacity: pressed ? 0.93 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                <View style={styles.cardTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.goalTitle, { color: theme.text }]}>
                      {goal.title}
                    </Text>
                    {!!goal.description && (
                      <Text
                        style={[
                          styles.goalDescription,
                          { color: theme.subtext },
                        ]}
                        numberOfLines={3}
                      >
                        {goal.description}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteGoal(goal.id)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={theme.subtext}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.progressWrap}>
                  <LinearGradient
                    colors={["#4F46E5", "#7C3AED", "#A855F7"]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={[
                      styles.progressBarFill,
                      { width: `${goal.progress}%` },
                    ]}
                  />
                  <View
                    style={[
                      styles.progressBarTrack,
                      { borderColor: theme.border },
                    ]}
                  />
                  <Text
                    style={[styles.progressLabel, { color: theme.subtext }]}
                  >
                    {goal.progress}% complete
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <LinearGradient
            colors={
              theme.key === "light"
                ? ["#FDF2FF", "#FFFFFF"]
                : ["#020617", "#111827"]
            }
            style={styles.modalCardWrap}
          >
            <BlurView
              tint={theme.blurTint}
              intensity={40}
              style={styles.modalCard}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingGoal ? "Edit Goal" : "New Goal"}
              </Text>

              <TextInput
                placeholder="Title"
                placeholderTextColor={theme.subtext}
                value={title}
                onChangeText={setTitle}
                style={[
                  styles.input,
                  { borderColor: theme.border, color: theme.text },
                ]}
              />
              <TextInput
                placeholder="Description"
                placeholderTextColor={theme.subtext}
                value={description}
                onChangeText={setDescription}
                multiline
                style={[
                  styles.textArea,
                  { borderColor: theme.border, color: theme.text },
                ]}
              />

              <Text style={[styles.modalLabel, { color: theme.subtext }]}>
                Progress (%)
              </Text>
              <TextInput
                placeholder="0 - 100"
                placeholderTextColor={theme.subtext}
                value={progress}
                onChangeText={setProgress}
                keyboardType="numeric"
                style={[
                  styles.input,
                  { borderColor: theme.border, color: theme.text },
                ]}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={[
                    styles.secondaryButton,
                    { borderColor: theme.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      { color: theme.subtext },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveGoal}
                  style={[
                    styles.primaryButton,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Text style={styles.primaryButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </LinearGradient>
        </View>
      </Modal>
    </Animated.View>
  );
}

// ----------------------------------------------------------------------
// HELPERS (AI, search, stats, filters)
// ----------------------------------------------------------------------
function getAIInsights({ tasks, planner, goals }) {
  const insights = [];

  const high = tasks.filter(
    (t) => t.priority === "High" && !t.completed
  );
  if (high.length) {
      insights.push(
        `Start with ${high.length} high-priority task${high.length > 1 ? "s" : ""} today.`
      );
  }

  if (planner.length > 0) {
    insights.push(
      `Your next time-block is "${planner[0].title}" at ${planner[0].time}.`
    );
  }

  if (goals.length > 0) {
    const avg =
      goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length;
    insights.push(`Average goal progress: ${Math.round(avg)}%.`);
  }

  if (tasks.filter((t) => t.completed).length === 0) {
    insights.push("Complete one small task to build momentum.");
  }

  if (insights.length === 0) insights.push("You’re all set. Plan your day.");
  return insights;
}

function countCompletedToday(tasks) {
  const today = new Date().toISOString().slice(0, 10);
  return tasks.filter(
    (t) => t.completed && (t.completedAt || "").slice(0, 10) === today
  ).length;
}

function filterTask(t, q, filter) {
  if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false;
  if (filter === "today") return true;
  if (filter === "focus") return t.priority === "High";
  if (filter === "study") return t.category?.toLowerCase() === "study";
  if (filter === "wellness") return t.category?.toLowerCase() === "wellness";
  return true;
}

function filterNote(n, q) {
  if (!q) return true;
  return (
    n.title.toLowerCase().includes(q.toLowerCase()) ||
    n.content.toLowerCase().includes(q.toLowerCase())
  );
}

function filterBlock(b, q) {
  if (!q) return true;
  return (
    b.title.toLowerCase().includes(q.toLowerCase()) ||
    b.time.toLowerCase().includes(q.toLowerCase())
  );
}

function filterGoal(g, q) {
  if (!q) return true;
  return (
    g.title.toLowerCase().includes(q.toLowerCase()) ||
    g.description?.toLowerCase().includes(q.toLowerCase())
  );
}

// ----------------------------------------------------------------------
// STYLES
// ----------------------------------------------------------------------
const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 56 : 32,
    paddingHorizontal: 18,
  },

  orb: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 260,
    opacity: 0.25,
    filter: "blur(80px)",
  },
  orbTopRight: { top: -80, right: -60 },
  orbBottomLeft: { bottom: -80, left: -60 },

  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  heroGreeting: {
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.8,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 2,
    maxWidth: "90%",
  },
  heroAvatarWrap: {
    marginLeft: 12,
  },
  heroAvatarBorder: {
    width: 46,
    height: 46,
    padding: 2,
    borderRadius: 46,
  },
  heroAvatarInner: {
    flex: 1,
    borderRadius: 40,
    backgroundColor: "#fff2",
  },

  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  heroChipText: { marginLeft: 6, fontSize: 13 },
  heroRightGroup: { flexDirection: "row", alignItems: "center", marginLeft: "auto" },
  heroChipSmall: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  heroChipTextSmall: { marginLeft: 4, fontSize: 12 },
  iconPillLarge: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 14,
    marginLeft: 4,
  },

  // SEARCH ROW
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  searchInputWrap: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },

  filterChip: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "500",
  },

  snapshotCard: {
    width: width * 0.65,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 14,
  },
  snapshotLabel: { fontSize: 13, marginBottom: 6 },
  snapshotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  snapshotNumber: { fontSize: 22, fontWeight: "700" },
  snapshotCaption: { fontSize: 12 },

  snapshotBarWrap: { marginTop: 8 },
  snapshotBarTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  snapshotBarFill: {
    height: 6,
    borderRadius: 6,
  },

  focusTime: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
  },
  focusControlsRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  focusChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
  },
  focusChipText: { fontSize: 13 },

  aiLine: { fontSize: 13, marginBottom: 4 },

  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  quickButton: {
    width: (width - 40) / 4 - 4,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
  },
  quickIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  quickLabel: { fontSize: 12, fontWeight: "500" },

  tabsWrapper: {
    borderWidth: 1,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 100,
  },
  tabHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  tabHeaderChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tabHeaderText: { marginLeft: 6, fontSize: 13, fontWeight: "600" },
  tabContentWrapper: {},

  // CARD / GLASS
  glassCard: {
    borderWidth: 1,
    padding: 14,
    borderRadius: 20,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  taskCategory: {
    fontSize: 12,
    marginTop: 4,
  },

  priorityChip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    marginRight: 6,
  },
  priorityText: { fontSize: 12 },

  cardMeta: { fontSize: 12 },

  emptyState: {
    marginTop: 40,
    padding: 20,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
  emptySubtitle: { fontSize: 13 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "#0006",
    justifyContent: "center",
    padding: 20,
  },
  modalCardWrap: {
    borderRadius: 24,
  },
  modalCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 14 },
  modalLabel: {
    fontSize: 13,
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    fontSize: 14,
    height: 100,
    marginBottom: 12,
    textAlignVertical: "top",
  },

  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: "#F9FAFB",
    fontWeight: "600",
    marginLeft: 6,
  },

  secondaryButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
  },
  secondaryButtonText: { fontWeight: "500" },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },

  masonryWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  masonryColumn: {
    width: "48%",
  },
  noteCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  noteContent: {
    fontSize: 13,
  },
  noteDelete: {
    position: "absolute",
    right: 10,
    bottom: 10,
  },

  timelineWrap: {
    marginTop: 14,
    paddingVertical: 6,
  },
  timelineLine: {
    position: "absolute",
    left: 28,
    top: 0,
    bottom: 0,
    width: 2,
  },
  timelineItem: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    marginLeft: 20,
    flexDirection: "row",
  },
  timelineDotOuter: {
    width: 16,
    height: 16,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  timelineDotInner: {
    width: 8,
    height: 8,
    borderRadius: 8,
  },
  timelineTime: { fontSize: 13, marginBottom: 2 },
  timelineTitle: { fontSize: 15, fontWeight: "600" },

  goalTitle: { fontSize: 15, fontWeight: "700" },
  goalDescription: { fontSize: 13, marginTop: 4 },

  progressWrap: {
    marginTop: 12,
    height: 20,
    justifyContent: "center",
  },
  progressBarTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 6,
  },
  progressLabel: {
    position: "absolute",
    right: 0,
    top: -4,
    fontSize: 11,
  },

  bottomDockWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 16,
    alignItems: "center",
  },
  bottomDock: {
    flexDirection: "row",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 0,
    overflow: "hidden",
  },
  bottomDockItem: {
    alignItems: "center",
    marginHorizontal: 14,
  },
  bottomDockIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  bottomDockLabel: { fontSize: 11 },
});

export { HomeTabsScreen };

