// MindFlow Home — Ultra Deluxe Erudita OS v∞

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ✅ CONTEXTS
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const STORAGE_KEYS = {
  TASKS: "@mindflow_tasks",
  NOTES: "@mindflow_notes",
  PLANNER: "@mindflow_planner",
  MOODS: "@mindflow_moods",
  FOCUS: "@mindflow_focus",
};

const INITIAL_FOCUS_DURATION = 25 * 60; // 25 minutes

const DOCK_ITEMS = [
  { key: "Home", icon: "grid-outline", label: "Home" },
  { key: "Focus", icon: "time-outline", label: "Focus" },
  { key: "Notes", icon: "document-text-outline", label: "Notes" },
  { key: "Analytics", icon: "analytics-outline", label: "Analytics" },
  { key: "Profile", icon: "person-circle-outline", label: "Profile" },
];

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // --------------------------------
  // STATE
  // --------------------------------
  const [isOnline, setIsOnline] = useState(true);

  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [planner, setPlanner] = useState([]);
  const [moods, setMoods] = useState([]);
  const [focusSeconds, setFocusSeconds] = useState(INITIAL_FOCUS_DURATION);
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusToday, setFocusToday] = useState(0);

  const [distractionFree, setDistractionFree] = useState(false);

  // Modals
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCategory, setTaskCategory] = useState("");
  const [taskPriority, setTaskPriority] = useState("Medium");

  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const [plannerModalVisible, setPlannerModalVisible] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [plannerTime, setPlannerTime] = useState("");
  const [plannerTitle, setPlannerTitle] = useState("");

  const [moodModalVisible, setMoodModalVisible] = useState(false);

  // Flow Assistant / Quick actions
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);
  const [activeDockTab, setActiveDockTab] = useState("Home");

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(30)).current;
  const focusIntervalRef = useRef(null);

  // --------------------------------
  // LOAD / SAVE STORAGE
  // --------------------------------
  useEffect(() => {
    async function loadAll() {
      try {
        const [
          tasksJson,
          notesJson,
          plannerJson,
          moodsJson,
          focusJson,
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.TASKS),
          AsyncStorage.getItem(STORAGE_KEYS.NOTES),
          AsyncStorage.getItem(STORAGE_KEYS.PLANNER),
          AsyncStorage.getItem(STORAGE_KEYS.MOODS),
          AsyncStorage.getItem(STORAGE_KEYS.FOCUS),
        ]);

        if (tasksJson) setTasks(JSON.parse(tasksJson));
        if (notesJson) setNotes(JSON.parse(notesJson));
        if (plannerJson) setPlanner(JSON.parse(plannerJson));
        if (moodsJson) setMoods(JSON.parse(moodsJson));

        if (focusJson) {
          const parsed = JSON.parse(focusJson);
          if (typeof parsed.focusToday === "number") {
            setFocusToday(parsed.focusToday);
          }
        }
      } catch (e) {
        console.log("Load error:", e);
      }
    }
    loadAll();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(
      STORAGE_KEYS.TASKS,
      JSON.stringify(tasks)
    ).catch(() => {});
  }, [tasks]);

  useEffect(() => {
    AsyncStorage.setItem(
      STORAGE_KEYS.NOTES,
      JSON.stringify(notes)
    ).catch(() => {});
  }, [notes]);

  useEffect(() => {
    AsyncStorage.setItem(
      STORAGE_KEYS.PLANNER,
      JSON.stringify(planner)
    ).catch(() => {});
  }, [planner]);

  useEffect(() => {
    AsyncStorage.setItem(
      STORAGE_KEYS.MOODS,
      JSON.stringify(moods)
    ).catch(() => {});
  }, [moods]);

  useEffect(() => {
    AsyncStorage.setItem(
      STORAGE_KEYS.FOCUS,
      JSON.stringify({ focusToday })
    ).catch(() => {});
  }, [focusToday]);

  // --------------------------------
  // ANIMATIONS + FOCUS TIMER
  // --------------------------------
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (focusRunning) {
      focusIntervalRef.current = setInterval(() => {
        setFocusSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(focusIntervalRef.current);
            focusIntervalRef.current = null;
            setFocusRunning(false);
            const minutes = Math.round(INITIAL_FOCUS_DURATION / 60);
            setFocusToday((m) => m + minutes);
            Alert.alert(
              "Session complete",
              `You completed ${minutes} minutes of deep work.`
            );
            return INITIAL_FOCUS_DURATION;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (focusIntervalRef.current) {
          clearInterval(focusIntervalRef.current);
        }
      };
    } else {
      if (focusIntervalRef.current) {
        clearInterval(focusIntervalRef.current);
        focusIntervalRef.current = null;
      }
    }
  }, [focusRunning]);

  // --------------------------------
  // DERIVED DATA
  // --------------------------------
  const completedTasks = useMemo(
    () => tasks.filter((t) => t.completed).length,
    [tasks]
  );
  const totalTasks = tasks.length;

  const lastMood = moods[moods.length - 1]?.label || "Not logged";

  const focusMinutesDisplay = Math.floor(focusSeconds / 60)
    .toString()
    .padStart(2, "0");
  const focusSecondsDisplay = (focusSeconds % 60)
    .toString()
    .padStart(2, "0");

  const productivityScore = useMemo(() => {
    const taskScore =
      totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 70;
    const focusScore = Math.min(focusToday / 120, 1) * 30;
    return Math.round(taskScore + focusScore);
  }, [completedTasks, totalTasks, focusToday]);

  const moodCounts = useMemo(() => {
    const res = {};
    moods.forEach((m) => {
      res[m.label] = (res[m.label] || 0) + 1;
    });
    return res;
  }, [moods]);

  const suggestions = useMemo(() => {
    const arr = [];
    if (tasks.some((t) => !t.completed && t.priority === "High")) {
      arr.push({
        id: "s1",
        title: "Start with a high priority task",
        description:
          "Convert one high priority item into a deep work block.",
        action: "high_priority",
      });
    }
    if (focusToday < 60) {
      arr.push({
        id: "s2",
        title: "Schedule a 25-minute session",
        description:
          "You have less than one hour of focus today. One session can change it.",
        action: "start_focus",
      });
    }
    const todayStr = new Date().toDateString();
    if (!moods.some((m) => m.date === todayStr)) {
      arr.push({
        id: "s3",
        title: "Log your current mood",
        description:
          "Mood tracking helps generate deeper insights over time.",
        action: "log_mood",
      });
    }
    if (arr.length === 0) {
      arr.push({
        id: "s4",
        title: "Maintain this flow",
        description:
          "You are in sync with your tasks and focus. Keep going.",
        action: "none",
      });
    }
    return arr;
  }, [tasks, focusToday, moods]);

  // Gradients based on theme (Plasma Dark / Plasma Light)
  const backgroundGradient =
    theme?.key === "light"
      ? ["#f9fafb", "#f5f5f4", "#f3e8ff"]
      : ["#020617", "#050816", "#020617"];

  const heroGradient =
    theme?.key === "light"
      ? ["#faf5ff", "#fefce8", "#f5f5f4"]
      : ["#0b1120", "#111827", "#1e1b4b"];

  // --------------------------------
  // CRUD: TASKS
  // --------------------------------
  function openNewTaskModal(priority = "Medium") {
    setEditingTask(null);
    setTaskTitle("");
    setTaskCategory("");
    setTaskPriority(priority);
    setTaskModalVisible(true);
  }

  function openEditTask(task) {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskCategory(task.category || "");
    setTaskPriority(task.priority || "Medium");
    setTaskModalVisible(true);
  }

  function saveTask() {
    if (!taskTitle.trim()) {
      Alert.alert("Missing title", "Task title cannot be empty.");
      return;
    }
    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                title: taskTitle.trim(),
                category: taskCategory.trim(),
                priority: taskPriority,
              }
            : t
        )
      );
    } else {
      const newTask = {
        id: Date.now().toString(),
        title: taskTitle.trim(),
        category: taskCategory.trim(),
        priority: taskPriority,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
    }
    setTaskModalVisible(false);
  }

  function toggleTaskCompleted(id) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    );
  }

  function deleteTask(id) {
    Alert.alert("Delete task", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          setTasks((prev) => prev.filter((t) => t.id !== id)),
      },
    ]);
  }

  // --------------------------------
  // CRUD: NOTES
  // --------------------------------
  function openNewNoteModal() {
    setEditingNote(null);
    setNoteTitle("");
    setNoteContent("");
    setNoteModalVisible(true);
  }

  function openEditNote(note) {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteModalVisible(true);
  }

  function saveNote() {
    if (!noteTitle.trim()) {
      Alert.alert("Missing title", "Note title cannot be empty.");
      return;
    }
    if (editingNote) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingNote.id
            ? {
                ...n,
                title: noteTitle.trim(),
                content: noteContent.trim(),
              }
            : n
        )
      );
    } else {
      const newNote = {
        id: Date.now().toString(),
        title: noteTitle.trim(),
        content: noteContent.trim(),
        createdAt: new Date().toISOString(),
      };
      setNotes((prev) => [newNote, ...prev]);
    }
    setNoteModalVisible(false);
  }

  function deleteNote(id) {
    Alert.alert("Delete note", "Delete this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          setNotes((prev) => prev.filter((n) => n.id !== id)),
      },
    ]);
  }

  // --------------------------------
  // CRUD: PLANNER
  // --------------------------------
  function openNewBlockModal() {
    setEditingBlock(null);
    setPlannerTime("");
    setPlannerTitle("");
    setPlannerModalVisible(true);
  }

  function openEditBlock(block) {
    setEditingBlock(block);
    setPlannerTime(block.time);
    setPlannerTitle(block.title);
    setPlannerModalVisible(true);
  }

  function saveBlock() {
    if (!plannerTime.trim() || !plannerTitle.trim()) {
      Alert.alert(
        "Missing fields",
        "Time and title are required."
      );
      return;
    }
    if (editingBlock) {
      setPlanner((prev) =>
        prev.map((b) =>
          b.id === editingBlock.id
            ? {
                ...b,
                time: plannerTime.trim(),
                title: plannerTitle.trim(),
              }
            : b
        )
      );
    } else {
      const newBlock = {
        id: Date.now().toString(),
        time: plannerTime.trim(),
        title: plannerTitle.trim(),
      };
      setPlanner((prev) => [...prev, newBlock]);
    }
    setPlannerModalVisible(false);
  }

  function deleteBlock(id) {
    Alert.alert("Delete block", "Remove this block?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          setPlanner((prev) => prev.filter((b) => b.id !== id)),
      },
    ]);
  }

  // --------------------------------
  // MOOD + FOCUS
  // --------------------------------
  function logMood(label) {
    const todayStr = new Date().toDateString();
    setMoods((prev) => [
      ...prev.filter((m) => m.date !== todayStr),
      { date: todayStr, label },
    ]);
    setMoodModalVisible(false);
  }

  function toggleFocus() {
    setFocusRunning((r) => !r);
  }

  function resetFocus() {
    setFocusRunning(false);
    setFocusSeconds(INITIAL_FOCUS_DURATION);
  }

  function addManualFocus(minutes) {
    setFocusToday((m) => m + minutes);
    Alert.alert(
      "Focus logged",
      `Added ${minutes} minutes to today.`
    );
  }

  function handleSuggestionAction(s) {
    if (s.action === "high_priority") {
      const high = tasks.find(
        (t) => !t.completed && t.priority === "High"
      );
      if (high) {
        Alert.alert(
          "Suggested task",
          `Turn this into your next focus block:\n\n${high.title}`
        );
      } else {
        Alert.alert("No high priority tasks", "You are up to date.");
      }
    } else if (s.action === "start_focus") {
      setFocusRunning(true);
    } else if (s.action === "log_mood") {
      setMoodModalVisible(true);
    }
  }

  // --------------------------------
  // DOCK & FLOW ASSISTANT
  // --------------------------------
  function handleDockPress(item) {
    setActiveDockTab(item.key);
    if (!navigation) return;
    if (item.key === "Home") return;
    try {
      navigation.navigate(item.key);
    } catch (e) {
      // ignore if route doesn't exist yet
    }
  }

  // --------------------------------
  // DISTRACTION-FREE MODE VIEW
  // --------------------------------
  if (distractionFree) {
    return (
      <LinearGradient
        colors={["#020617", "#050816", "#020617"]}
        style={{ flex: 1 }}
      >
        <View style={styles.distractionRoot}>
          <Text style={styles.distractionHeading}>Focus only</Text>
          <Text style={styles.distractionSub}>
            Distraction-free mode hides everything except your timer and tasks.
          </Text>

          <LinearGradient
            colors={["#4f46e5", "#7c3aed"]}
            style={styles.focusCapsule}
          >
            <Text style={styles.focusCapsuleLabel}>Focus timer</Text>
            <Text style={styles.focusCapsuleTime}>
              {focusMinutesDisplay}:{focusSecondsDisplay}
            </Text>
            <Text style={styles.focusCapsuleHint}>
              Today: {focusToday} minutes
            </Text>
            <View style={styles.focusCapsuleButtons}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={toggleFocus}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>
                  {focusRunning ? "Pause" : "Start"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={resetFocus}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <View style={styles.distractionTasksCard}>
            <Text style={styles.smallLabel}>Key tasks</Text>
            {tasks.slice(0, 4).map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.distractionTaskRow,
                  t.completed && { opacity: 0.7 },
                ]}
                onPress={() => toggleTaskCompleted(t.id)}
                onLongPress={() => openEditTask(t)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.distractionTaskText,
                    t.completed && { textDecorationLine: "line-through" },
                  ]}
                >
                  {t.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.exitDistraction}
            onPress={() => setDistractionFree(false)}
          >
            <Text style={styles.exitDistractionText}>
              Exit distraction-free mode
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // --------------------------------
  // MAIN ULTRA DELUXE DASHBOARD
  // --------------------------------
  return (
    <LinearGradient
      colors={backgroundGradient}
      style={{ flex: 1 }}
    >
      {/* Floating assistant bubble (opens Flow Assistant) */}
      <TouchableOpacity
        style={styles.assistantBubble}
        activeOpacity={0.9}
        onPress={() => setQuickActionsVisible(true)}
      >
        <LinearGradient
          colors={["#6366f1", "#a855f7"]}
          style={styles.assistantInner}
        >
          <Ionicons
            name="sparkles-outline"
            size={18}
            color="#f9fafb"
          />
        </LinearGradient>
      </TouchableOpacity>

      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: translateAnim }],
        }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO LAYER */}
          <LinearGradient
            colors={heroGradient}
            style={styles.heroLayer}
          >
            <View style={styles.heroLeft}>
              <Text style={styles.heroGreeting}>
                MindFlow OS
              </Text>
              <Text style={styles.heroHeadline}>
                Welcome back, {user?.name || "creator"}
              </Text>
              <Text style={styles.heroSubtitle}>
                Your personal control center for tasks, focus, and mental
                clarity.
              </Text>

              <View style={styles.heroChipsRow}>
                <StatusChip
                  label={
                    isOnline ? "Online workspace" : "Offline changes queued"
                  }
                  icon={isOnline ? "cloud-outline" : "cloud-offline-outline"}
                  accent={isOnline ? "#22c55e" : "#f97316"}
                  onPress={() => setIsOnline((v) => !v)}
                />
                <StatusChip
                  label={
                    theme?.key === "dark"
                      ? "Plasma Dark"
                      : "Plasma Light"
                  }
                  icon={
                    theme?.key === "dark"
                      ? "moon-outline"
                      : "sunny-outline"
                  }
                  accent="#6366f1"
                  onPress={toggleTheme}
                />
              </View>
            </View>

            {/* Productivity ring + avatar */}
            <View style={styles.heroRight}>
              <View style={styles.scoreRingOuter}>
                <View style={styles.scoreRingInner}>
                  <Text style={styles.scoreRingLabel}>Score</Text>
                  <Text style={styles.scoreRingValue}>
                    {productivityScore}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.heroAvatarOuter}
                activeOpacity={0.85}
                onPress={() => navigation?.navigate("Profile")}
              >
                <View style={styles.heroAvatarInner}>
                  <Text style={styles.heroAvatarInitial}>
                    {(user?.name || "M")
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* SYSTEM METRICS CHIPS */}
          <View style={styles.systemRow}>
            <SystemChip
              label="Tasks today"
              value={`${completedTasks}/${totalTasks}`}
              hint="Tap to manage"
              icon="checkmark-done-outline"
              onPress={() => openNewTaskModal()}
            />
            <SystemChip
              label="Focus time"
              value={`${focusToday} min`}
              hint="Tap to log 10 min"
              icon="time-outline"
              onPress={() => addManualFocus(10)}
            />
            <SystemChip
              label="Mood"
              value={lastMood}
              hint="Tap to log"
              icon="pulse-outline"
              onPress={() => setMoodModalVisible(true)}
            />
          </View>

          {/* MAIN GRID: LEFT = FOCUS CAPSULE, RIGHT = WIDGET STACK */}
          <View style={styles.mainGrid}>
            {/* Focus capsule */}
            <LinearGradient
              colors={["#4f46e5", "#7c3aed"]}
              style={styles.mainFocusCapsule}
            >
              <Text style={styles.focusLabel}>Live focus capsule</Text>
              <Text style={styles.focusTime}>
                {focusMinutesDisplay}:{focusSecondsDisplay}
              </Text>
              <Text style={styles.focusSub}>
                Today: {focusToday} minutes of deep work
              </Text>
              <View style={styles.focusButtonRow}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={toggleFocus}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>
                    {focusRunning ? "Pause" : "Start"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={resetFocus}
                  activeOpacity={0.85}
                >
                  <Text style={styles.secondaryButtonText}>Reset</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Widget vertical stack */}
            <View style={styles.widgetColumn}>
              <MiniWidget
                title="Quick task"
                description="Capture something you must not forget."
                icon="add-circle-outline"
                onPress={() => openNewTaskModal("High")}
              />
              <MiniWidget
                title="Quick note"
                description="Drop a thought or reflection."
                icon="document-text-outline"
                onPress={openNewNoteModal}
              />
              <MiniWidget
                title="Planner"
                description="Adjust today’s time blocks."
                icon="calendar-outline"
                onPress={
                  planner.length > 0
                    ? () => openEditBlock(planner[0])
                    : openNewBlockModal
                }
              />
              <MiniWidget
                title="Focus mode"
                description="Enter a minimal, distraction-free workspace."
                icon="remove-outline"
                onPress={() => setDistractionFree(true)}
              />
            </View>
          </View>

          {/* MINI KANBAN TASKS (ACTIVE VS DONE) */}
          <View style={styles.kanbanSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Tasks board</Text>
              <TouchableOpacity
                onPress={() => openNewTaskModal()}
                activeOpacity={0.8}
              >
                <Text style={styles.linkText}>New</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 4 }}
            >
              <View style={styles.kanbanColumn}>
                <Text style={styles.kanbanTitle}>Active</Text>
                {tasks.filter((t) => !t.completed).length === 0 ? (
                  <Text style={styles.kanbanEmpty}>
                    No active tasks. Add one.
                  </Text>
                ) : (
                  tasks
                    .filter((t) => !t.completed)
                    .map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        style={styles.kanbanCard}
                        activeOpacity={0.9}
                        onPress={() => toggleTaskCompleted(t.id)}
                        onLongPress={() => openEditTask(t)}
                      >
                        <Text
                          style={styles.kanbanCardTitle}
                          numberOfLines={2}
                        >
                          {t.title}
                        </Text>
                        <View style={styles.kanbanMetaRow}>
                          {t.category ? (
                            <Text style={styles.kanbanCategory}>
                              {t.category}
                            </Text>
                          ) : null}
                          <View style={styles.kanbanPriority}>
                            <Text style={styles.kanbanPriorityText}>
                              {t.priority}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))
                )}
              </View>

              <View style={styles.kanbanColumn}>
                <Text style={styles.kanbanTitle}>Done</Text>
                {tasks.filter((t) => t.completed).length === 0 ? (
                  <Text style={styles.kanbanEmpty}>
                    Nothing done yet. Start one item.
                  </Text>
                ) : (
                  tasks
                    .filter((t) => t.completed)
                    .map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        style={[styles.kanbanCard, { opacity: 0.7 }]}
                        activeOpacity={0.9}
                        onPress={() => toggleTaskCompleted(t.id)}
                      >
                        <Text
                          style={[
                            styles.kanbanCardTitle,
                            { textDecorationLine: "line-through" },
                          ]}
                          numberOfLines={2}
                        >
                          {t.title}
                        </Text>
                      </TouchableOpacity>
                    ))
                )}
              </View>
            </ScrollView>
          </View>

          {/* NOTES MASONRY LAYOUT */}
          <View style={styles.notesSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Notes board</Text>
              <TouchableOpacity
                onPress={openNewNoteModal}
                activeOpacity={0.8}
              >
                <Text style={styles.linkText}>New note</Text>
              </TouchableOpacity>
            </View>

            {notes.length === 0 ? (
              <TouchableOpacity
                style={styles.noteEmpty}
                onPress={openNewNoteModal}
              >
                <Text style={styles.noteEmptyText}>
                  Capture strategies, reflections, and ideas here.
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.masonry}>
                <View style={styles.masonryColumn}>
                  {notes
                    .filter((_, idx) => idx % 2 === 0)
                    .map((n, idx) => (
                      <TouchableOpacity
                        key={n.id}
                        style={[
                          styles.noteCard,
                          idx % 2 === 0 && { minHeight: 110 },
                        ]}
                        onPress={() => openEditNote(n)}
                        onLongPress={() => deleteNote(n.id)}
                        activeOpacity={0.9}
                      >
                        <Text
                          style={styles.noteTitle}
                          numberOfLines={1}
                        >
                          {n.title}
                        </Text>
                        <Text
                          style={styles.noteSnippet}
                          numberOfLines={4}
                        >
                          {n.content}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
                <View style={styles.masonryColumn}>
                  {notes
                    .filter((_, idx) => idx % 2 !== 0)
                    .map((n, idx) => (
                      <TouchableOpacity
                        key={n.id}
                        style={[
                          styles.noteCard,
                          idx % 2 === 0 && { minHeight: 140 },
                        ]}
                        onPress={() => openEditNote(n)}
                        onLongPress={() => deleteNote(n.id)}
                        activeOpacity={0.9}
                      >
                        <Text
                          style={styles.noteTitle}
                          numberOfLines={1}
                        >
                          {n.title}
                        </Text>
                        <Text
                          style={styles.noteSnippet}
                          numberOfLines={4}
                        >
                          {n.content}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </View>
            )}
          </View>

          {/* ANALYTICS MINI DASHBOARD */}
          <View style={styles.analyticsSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Analytics snapshot</Text>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    "Analytics",
                    "Later this can open a dedicated analytics screen."
                  )
                }
                activeOpacity={0.8}
              >
                <Text style={styles.linkText}>More</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.analyticsGrid}>
              <AnalyticsTile
                variant="ring"
                title="Completion"
                value={
                  totalTasks === 0
                    ? 0
                    : Math.round((completedTasks / totalTasks) * 100)
                }
                unit="%"
              />
              <AnalyticsTile
                variant="bar"
                title="Focus today"
                value={focusToday}
                unit="min"
              />
              <AnalyticsTile
                variant="mood"
                title="Mood entries"
                moodCounts={moodCounts}
              />
              <AnalyticsTile
                variant="text"
                title="Active planner blocks"
                value={planner.length}
                unit=""
              />
            </View>
          </View>

          {/* SMART SUGGESTIONS STRIP */}
          <View style={styles.suggestionsSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Smart suggestions</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 4 }}
            >
              {suggestions.map((s, idx) => (
                <SuggestionCard
                  key={s.id}
                  suggestion={s}
                  variant={idx % 3}
                  onApply={() => handleSuggestionAction(s)}
                />
              ))}
            </ScrollView>
          </View>

          {/* PREMIUM STRIP */}
          <View style={styles.premiumSection}>
            <LinearGradient
              colors={["#0f172a", "#111827", "#1e1b4b"]}
              style={styles.premiumCard}
            >
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={styles.premiumTitle}>
                  Unlock MindFlow premium
                </Text>
                <Text style={styles.premiumText}>
                  Deep analytics, team workspaces, and theme studio for your
                  MindFlow OS.
                </Text>
                <View style={styles.premiumBadgesRow}>
                  <PremiumBadge label="Advanced analytics" />
                  <PremiumBadge label="Cloud sync" />
                  <PremiumBadge label="Theme studio" />
                </View>
              </View>
              <TouchableOpacity
                style={styles.premiumButton}
                onPress={() =>
                  Alert.alert(
                    "Premium",
                    "Here you can later implement real subscription logic."
                  )
                }
                activeOpacity={0.9}
              >
                <Text style={styles.premiumButtonText}>
                  Explore
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Floating OS Dock */}
      <View style={styles.dockWrapper}>
        <LinearGradient
          colors={
            theme?.key === "light"
              ? ["rgba(250,250,249,0.96)", "rgba(248,250,252,0.98)"]
              : ["rgba(15,23,42,0.98)", "rgba(15,23,42,0.96)"]
          }
          style={styles.dockInner}
        >
          {DOCK_ITEMS.map((item) => {
            const active = activeDockTab === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={styles.dockItem}
                onPress={() => handleDockPress(item)}
                activeOpacity={0.9}
              >
                <View
                  style={[
                    styles.dockIconShell,
                    active && styles.dockIconShellActive,
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={active ? "#0f172a" : "#e5e7eb"}
                  />
                </View>
                <Text
                  style={[
                    styles.dockLabel,
                    active && styles.dockLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </LinearGradient>
      </View>

      {/* ------------- MODALS ------------- */}
      {/* Task modal */}
      <Modal
        visible={taskModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTaskModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingTask ? "Edit task" : "New task"}
            </Text>
            <TextInput
              placeholder="Task title"
              placeholderTextColor="#6b7280"
              style={styles.modalInput}
              value={taskTitle}
              onChangeText={setTaskTitle}
            />
            <TextInput
              placeholder="Category (optional)"
              placeholderTextColor="#6b7280"
              style={styles.modalInput}
              value={taskCategory}
              onChangeText={setTaskCategory}
            />
            <View style={styles.modalRow}>
              {["High", "Medium", "Low"].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.chip,
                    taskPriority === p && styles.chipActive,
                  ]}
                  onPress={() => setTaskPriority(p)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      taskPriority === p && styles.chipTextActive,
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setTaskModalVisible(false)}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={saveTask}
              >
                <Text style={styles.primaryButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Note modal */}
      <Modal
        visible={noteModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingNote ? "Edit note" : "New note"}
            </Text>
            <TextInput
              placeholder="Title"
              placeholderTextColor="#6b7280"
              style={styles.modalInput}
              value={noteTitle}
              onChangeText={setNoteTitle}
            />
            <TextInput
              placeholder="Write your note..."
              placeholderTextColor="#6b7280"
              style={[styles.modalInput, { height: 90 }]}
              value={noteContent}
              onChangeText={setNoteContent}
              multiline
            />
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setNoteModalVisible(false)}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={saveNote}
              >
                <Text style={styles.primaryButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Planner modal */}
      <Modal
        visible={plannerModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPlannerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingBlock ? "Edit block" : "New planner block"}
            </Text>
            <TextInput
              placeholder="Time (e.g. 09:00–10:00)"
              placeholderTextColor="#6b7280"
              style={styles.modalInput}
              value={plannerTime}
              onChangeText={setPlannerTime}
            />
            <TextInput
              placeholder="Block title"
              placeholderTextColor="#6b7280"
              style={styles.modalInput}
              value={plannerTitle}
              onChangeText={setPlannerTitle}
            />
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setPlannerModalVisible(false)}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={saveBlock}
              >
                <Text style={styles.primaryButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Mood modal */}
      <Modal
        visible={moodModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setMoodModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>How do you feel?</Text>
            <View style={styles.modalRow}>
              {["Calm", "Focused", "Energized", "Tired", "Stressed"].map(
                (m) => (
                  <TouchableOpacity
                    key={m}
                    style={styles.chip}
                    onPress={() => logMood(m)}
                  >
                    <Text style={styles.chipText}>{m}</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
            <TouchableOpacity
              style={[styles.secondaryButton, { marginTop: 12 }]}
              onPress={() => setMoodModalVisible(false)}
            >
              <Text style={styles.secondaryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Flow Assistant / Quick actions modal */}
      <Modal
        visible={quickActionsVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setQuickActionsVisible(false)}
      >
        <View style={styles.quickModalOverlay}>
          <View style={styles.quickModalCard}>
            <View style={styles.quickHeaderRow}>
              <Text style={styles.quickTitle}>Flow Assistant</Text>
              <Text style={styles.quickSubtitle}>
                Choose a next best action for your current state.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.quickActionRow}
              activeOpacity={0.9}
              onPress={() => {
                setQuickActionsVisible(false);
                openNewTaskModal("High");
              }}
            >
              <View style={styles.quickIconShell}>
                <Ionicons
                  name="flash-outline"
                  size={18}
                  color="#fefce8"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickActionTitle}>
                  Add a high-priority task
                </Text>
                <Text style={styles.quickActionSubtitle}>
                  Capture the most important thing you could move right now.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionRow}
              activeOpacity={0.9}
              onPress={() => {
                setQuickActionsVisible(false);
                setMoodModalVisible(true);
              }}
            >
              <View style={styles.quickIconShell}>
                <Ionicons
                  name="pulse-outline"
                  size={18}
                  color="#fefce8"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickActionTitle}>
                  Log your current mood
                </Text>
                <Text style={styles.quickActionSubtitle}>
                  Use mood tracking to generate smarter patterns over time.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionRow}
              activeOpacity={0.9}
              onPress={() => {
                setQuickActionsVisible(false);
                setFocusRunning(true);
              }}
            >
              <View style={styles.quickIconShell}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color="#fefce8"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickActionTitle}>
                  Start a 25-minute focus
                </Text>
                <Text style={styles.quickActionSubtitle}>
                  Drop into a deep-work block and protect your attention.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionRow}
              activeOpacity={0.9}
              onPress={() => {
                setQuickActionsVisible(false);
                setDistractionFree(true);
              }}
            >
              <View style={styles.quickIconShell}>
                <Ionicons
                  name="remove-outline"
                  size={18}
                  color="#fefce8"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickActionTitle}>
                  Enter Focus Only mode
                </Text>
                <Text style={styles.quickActionSubtitle}>
                  Hide dashboards and keep only timer + key tasks.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCloseButton}
              onPress={() => setQuickActionsVisible(false)}
            >
              <Text style={styles.quickCloseText}>Close assistant</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

/* ================= SMALL COMPONENTS ================= */

function StatusChip({ label, icon, accent, onPress }) {
  return (
    <TouchableOpacity
      style={styles.statusChip}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.statusDot, { backgroundColor: accent }]} />
      <Ionicons name={icon} size={14} color="#e5e7eb" />
      <Text style={styles.statusChipText}>{label}</Text>
    </TouchableOpacity>
  );
}

function SystemChip({ label, value, hint, icon, onPress }) {
  return (
    <TouchableOpacity
      style={styles.systemChip}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.systemChipHeader}>
        <Ionicons name={icon} size={15} color="#a855f7" />
        <Text style={styles.systemChipLabel}>{label}</Text>
      </View>
      <Text style={styles.systemChipValue}>{value}</Text>
      <Text style={styles.systemChipHint}>{hint}</Text>
    </TouchableOpacity>
  );
}

function MiniWidget({ title, description, icon, onPress }) {
  return (
    <TouchableOpacity
      style={styles.widget}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.widgetIconCircle}>
        <Ionicons name={icon} size={16} color="#f9fafb" />
      </View>
      <Text style={styles.widgetTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.widgetDescription} numberOfLines={2}>
        {description}
      </Text>
    </TouchableOpacity>
  );
}

function AnalyticsTile({ variant, title, value, unit, moodCounts }) {
  if (variant === "ring") {
    const percent = Math.min(Math.max(value || 0, 0), 100);
    return (
      <View style={styles.analyticsTile}>
        <Text style={styles.analyticsTitle}>{title}</Text>
        <View style={styles.analyticsRing}>
          <View style={styles.analyticsRingOuter}>
            <View
              style={[
                styles.analyticsRingFill,
                { width: `${percent}%` },
              ]}
            />
          </View>
          <Text style={styles.analyticsRingValue}>
            {value}
            {unit}
          </Text>
        </View>
      </View>
    );
  }

  if (variant === "bar") {
    const capped = Math.min(value || 0, 240);
    const heightRatio = capped / 240;
    return (
      <View style={styles.analyticsTile}>
        <Text style={styles.analyticsTitle}>{title}</Text>
        <View style={styles.analyticsBarShell}>
          <View
            style={[
              styles.analyticsBarFill,
              { height: `${Math.max(10, heightRatio * 100)}%` },
            ]}
          />
        </View>
        <Text style={styles.analyticsBarText}>
          {value}
          {unit}
        </Text>
      </View>
    );
  }

  if (variant === "mood") {
    const entries = Object.entries(moodCounts || {});
    return (
      <View style={styles.analyticsTile}>
        <Text style={styles.analyticsTitle}>{title}</Text>
        {entries.length === 0 ? (
          <Text style={styles.analyticsSmallText}>
            No mood entries yet.
          </Text>
        ) : (
          <View style={styles.moodBubbleRow}>
            {entries.map(([label, count]) => (
              <View key={label} style={styles.moodBubble}>
                <Text style={styles.moodBubbleLabel}>{label}</Text>
                <Text style={styles.moodBubbleCount}>{count}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }

  // text variant
  return (
    <View style={styles.analyticsTile}>
      <Text style={styles.analyticsTitle}>{title}</Text>
      <Text style={styles.analyticsRingValue}>
        {value}
        {unit}
      </Text>
      <Text style={styles.analyticsSmallText}>
        Updated based on your latest day.
      </Text>
    </View>
  );
}

function SuggestionCard({ suggestion, variant, onApply }) {
  const containerStyle =
    variant === 0
      ? styles.suggestionWide
      : variant === 1
      ? styles.suggestionTall
      : styles.suggestionCompact;

  return (
    <View style={containerStyle}>
      <Text style={styles.suggestionTitle}>
        {suggestion.title}
      </Text>
      <Text style={styles.suggestionDesc} numberOfLines={3}>
        {suggestion.description}
      </Text>
      <View style={styles.suggestionFooter}>
        <TouchableOpacity
          style={styles.suggestionButton}
          onPress={onApply}
          activeOpacity={0.9}
        >
          <Text style={styles.suggestionButtonText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PremiumBadge({ label }) {
  return (
    <View style={styles.premiumBadge}>
      <Text style={styles.premiumBadgeText}>{label}</Text>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 80, // extra for dock
  },

  heroLayer: {
    borderRadius: 28,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  heroLeft: {
    flex: 1,
    gap: 6,
  },
  heroGreeting: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#9ca3af",
  },
  heroHeadline: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },
  heroSubtitle: {
    fontSize: 12,
    color: "#e5e7eb",
  },
  heroChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  heroRight: {
    marginLeft: 18,
    alignItems: "center",
    gap: 10,
  },
  scoreRingOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2,
    borderColor: "rgba(129, 140, 248, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.15)",
  },
  scoreRingInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreRingLabel: {
    fontSize: 10,
    color: "#9ca3af",
  },
  scoreRingValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f9fafb",
  },
  heroAvatarOuter: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#020617",
  },
  heroAvatarInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  heroAvatarInitial: {
    fontSize: 15,
    fontWeight: "600",
    color: "#f9fafb",
  },

  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(15, 23, 42, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(55, 65, 81, 0.9)",
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  statusChipText: {
    fontSize: 11,
    color: "#e5e7eb",
  },

  systemRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  systemChip: {
    flex: 1,
    borderRadius: 18,
    padding: 12,
    backgroundColor: "rgba(15, 23, 42, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(31, 41, 55, 0.9)",
  },
  systemChipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  systemChipLabel: {
    fontSize: 11,
    color: "#e5e7eb",
  },
  systemChipValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f9fafb",
    marginTop: 2,
  },
  systemChipHint: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },

  mainGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  mainFocusCapsule: {
    flex: 1.3,
    borderRadius: 26,
    padding: 16,
  },
  focusLabel: {
    fontSize: 11,
    color: "#e5e7eb",
  },
  focusTime: {
    fontSize: 26,
    fontWeight: "700",
    color: "#f9fafb",
    marginTop: 4,
  },
  focusSub: {
    fontSize: 11,
    color: "#e5e7eb",
    opacity: 0.9,
    marginBottom: 10,
  },
  focusButtonRow: {
    flexDirection: "row",
    gap: 8,
  },

  widgetColumn: {
    flex: 1,
    gap: 8,
  },
  widget: {
    borderRadius: 18,
    padding: 10,
    backgroundColor: "rgba(15, 23, 42, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(31, 41, 55, 0.9)",
  },
  widgetIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(79, 70, 229, 0.8)",
    marginBottom: 4,
  },
  widgetTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#f9fafb",
  },
  widgetDescription: {
    fontSize: 11,
    color: "#9ca3af",
  },

  kanbanSection: {
    borderRadius: 24,
    padding: 14,
    backgroundColor: "rgba(15, 23, 42, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(31, 41, 55, 0.9)",
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#f9fafb",
  },
  linkText: {
    fontSize: 12,
    color: "#a855f7",
    fontWeight: "500",
  },
  kanbanColumn: {
    width: 190,
    marginRight: 10,
  },
  kanbanTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#e5e7eb",
    marginBottom: 4,
  },
  kanbanEmpty: {
    fontSize: 11,
    color: "#9ca3af",
  },
  kanbanCard: {
    borderRadius: 16,
    padding: 10,
    backgroundColor: "rgba(15, 23, 42, 0.98)",
    borderWidth: 1,
    borderColor: "rgba(31, 41, 55, 0.9)",
    marginBottom: 8,
  },
  kanbanCardTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#f9fafb",
    marginBottom: 4,
  },
  kanbanMetaRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  kanbanCategory: {
    fontSize: 10,
    color: "#9ca3af",
  },
  kanbanPriority: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(129, 140, 248, 0.3)",
  },
  kanbanPriorityText: {
    fontSize: 10,
    color: "#e5e7eb",
  },

  notesSection: {
    borderRadius: 24,
    padding: 14,
    backgroundColor: "rgba(15, 23, 42, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(31, 41, 55, 0.9)",
    marginBottom: 18,
  },
  noteEmpty: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(31, 41, 55, 0.9)",
    padding: 12,
    marginTop: 4,
  },
  noteEmptyText: {
    fontSize: 11,
    color: "#9ca3af",
  },
  masonry: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  masonryColumn: {
    flex: 1,
    gap: 8,
  },
  noteCard: {
    borderRadius: 16,
    padding: 10,
    backgroundColor: "rgba(15, 23, 42, 0.98)",
    borderWidth: 1,
    borderColor: "rgba(31, 41, 55, 0.9)",
  },
  noteTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#f9fafb",
    marginBottom: 4,
  },
  noteSnippet: {
    fontSize: 11,
    color: "#9ca3af",
  },

  analyticsSection: {
    borderRadius: 24,
    padding: 14,
    backgroundColor: "rgba(15, 23, 42, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(31, 41, 55, 0.9)",
    marginBottom: 18,
  },
  analyticsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  analyticsTile: {
    width: "48%",
    borderRadius: 16,
    padding: 10,
    backgroundColor: "rgba(15, 23, 42, 0.98)",
    borderWidth: 1,
    borderColor: "rgba(31, 41, 55, 0.9)",
  },
  analyticsTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#e5e7eb",
    marginBottom: 4,
  },
  analyticsRing: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  analyticsRingOuter: {
    width: "100%",
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(31, 41, 55, 0.9)",
    overflow: "hidden",
    marginBottom: 4,
  },
  analyticsRingFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#6366f1",
  },
  analyticsRingValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f9fafb",
  },
  analyticsBarShell: {
    width: 18,
    height: 70,
    borderRadius: 999,
    backgroundColor: "rgba(31, 41, 55, 0.9)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 2,
  },
  analyticsBarFill: {
    width: "100%",
    borderRadius: 999,
    backgroundColor: "#a855f7",
  },
  analyticsBarText: {
    fontSize: 12,
    color: "#f9fafb",
    marginTop: 6,
  },
  analyticsSmallText: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 4,
  },
  moodBubbleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  moodBubble: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(31, 41, 55, 0.9)",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  moodBubbleLabel: {
    fontSize: 11,
    color: "#e5e7eb",
  },
  moodBubbleCount: {
    fontSize: 11,
    color: "#9ca3af",
  },

  suggestionsSection: {
    borderRadius: 24,
    padding: 14,
    backgroundColor: "rgba(15, 23, 42, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(31, 41, 55, 0.9)",
    marginBottom: 18,
  },
  suggestionWide: {
    width: 230,
    borderRadius: 18,
    padding: 12,
    marginRight: 10,
    backgroundColor: "rgba(15, 23, 42, 0.98)",
    borderWidth: 1,
    borderColor: "rgba(79, 70, 229, 0.8)",
  },
  suggestionTall: {
    width: 200,
    borderRadius: 18,
    padding: 12,
    marginRight: 10,
    backgroundColor: "rgba(15, 23, 42, 0.98)",
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.8)",
  },
  suggestionCompact: {
    width: 180,
    borderRadius: 18,
    padding: 12,
    marginRight: 10,
    backgroundColor: "rgba(15, 23, 42, 0.98)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.6)",
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#f9fafb",
    marginBottom: 4,
  },
  suggestionDesc: {
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 8,
  },
  suggestionFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  suggestionButton: {
    borderRadius: 999,
    backgroundColor: "#6366f1",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  suggestionButtonText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#f9fafb",
  },

  premiumSection: {
    marginBottom: 32,
  },
  premiumCard: {
    borderRadius: 24,
    padding: 14,
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  premiumTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#f9fafb",
  },
  premiumText: {
    fontSize: 12,
    color: "#e5e7eb",
  },
  premiumBadgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  premiumBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(15, 23, 42, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(55, 65, 81, 0.9)",
  },
  premiumBadgeText: {
    fontSize: 10,
    color: "#e5e7eb",
  },
  premiumButton: {
    borderRadius: 999,
    backgroundColor: "#f9fafb",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  premiumButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },

  // Buttons reused
  primaryButton: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: "#f9fafb",
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.8)",
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#f9fafb",
  },

  // Distraction-free
  distractionRoot: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 42,
  },
  distractionHeading: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f9fafb",
    marginBottom: 4,
  },
  distractionSub: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 18,
  },
  focusCapsule: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 18,
  },
  focusCapsuleLabel: {
    fontSize: 12,
    color: "#e5e7eb",
  },
  focusCapsuleTime: {
    fontSize: 28,
    fontWeight: "700",
    color: "#f9fafb",
    marginVertical: 4,
  },
  focusCapsuleHint: {
    fontSize: 11,
    color: "#e5e7eb",
  },
  focusCapsuleButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  distractionTasksCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(31, 41, 55, 0.9)",
    padding: 14,
    backgroundColor: "rgba(15, 23, 42, 0.96)",
  },
  smallLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 6,
  },
  distractionTaskRow: {
    paddingVertical: 5,
  },
  distractionTaskText: {
    fontSize: 13,
    color: "#f9fafb",
  },
  exitDistraction: {
    marginTop: 18,
    alignItems: "center",
  },
  exitDistractionText: {
    fontSize: 12,
    color: "#a855f7",
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "rgba(55, 65, 81, 0.9)",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f9fafb",
    marginBottom: 10,
  },
  modalInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(55, 65, 81, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: "#f9fafb",
    fontSize: 13,
    marginBottom: 8,
    backgroundColor: "rgba(15, 23, 42, 0.96)",
  },
  modalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(55, 65, 81, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipActive: {
    backgroundColor: "rgba(99, 102, 241, 0.25)",
    borderColor: "#6366f1",
  },
  chipText: {
    fontSize: 12,
    color: "#e5e7eb",
  },
  chipTextActive: {
    fontWeight: "600",
    color: "#e5e7eb",
  },
  modalButtonsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  // Assistant bubble
  assistantBubble: {
    position: "absolute",
    right: 20,
    bottom: 92, // above dock
    zIndex: 20,
  },
  assistantInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 9,
  },

  // Dock
  dockWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 18,
    paddingHorizontal: 24,
    zIndex: 15,
  },
  dockInner: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)",
  },
  dockItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  dockIconShell: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31, 41, 55, 0.9)",
  },
  dockIconShellActive: {
    backgroundColor: "#f9fafb",
  },
  dockLabel: {
    fontSize: 10,
    color: "#e5e7eb",
  },
  dockLabelActive: {
    color: "#0f172a",
    fontWeight: "600",
  },

  // Quick actions / Flow Assistant
  quickModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    justifyContent: "flex-end",
  },
  quickModalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    backgroundColor: "#020617",
    borderTopWidth: 1,
    borderColor: "rgba(55, 65, 81, 0.9)",
  },
  quickHeaderRow: {
    marginBottom: 10,
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f9fafb",
  },
  quickSubtitle: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  quickActionRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 10,
    borderRadius: 16,
    paddingHorizontal: 8,
    backgroundColor: "rgba(15, 23, 42, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(31, 41, 55, 0.9)",
    marginTop: 8,
  },
  quickIconShell: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(79,70,229,0.8)",
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#f9fafb",
  },
  quickActionSubtitle: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  quickCloseButton: {
    marginTop: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.6)",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quickCloseText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#e5e7eb",
  },
});

