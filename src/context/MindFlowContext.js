// src/context/MindFlowContext.js
// MindFlow Engine — tasks, notes, planner, goals, focus, stats

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    Animated,
    Easing,
} from "react-native";

// We only *use* theme in UI, not needed here
// Theme is handled globally via ThemeContext

const STORAGE_KEYS = {
  TASKS: "@mindflow_tasks",
  NOTES: "@mindflow_notes",
  PLANNER: "@mindflow_planner",
  GOALS: "@mindflow_goals",
  STATS: "@mindflow_stats",
};

const MindFlowContext = createContext(null);

export const useMindFlow = () => {
  const ctx = useContext(MindFlowContext);
  if (!ctx) throw new Error("useMindFlow must be used inside <MindFlowProvider />");
  return ctx;
};

// Simple fade+scale animation
export function useFadeScale() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.ease),
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

export function MindFlowProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [planner, setPlanner] = useState([]);
  const [goals, setGoals] = useState([]);

  const [stats, setStats] = useState({
    streak: 0,
    lastActiveDate: null,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterKey, setFilterKey] = useState("all");

  // Focus timer
  const [focusDuration, setFocusDuration] = useState(25 * 60);
  const [focusRemaining, setFocusRemaining] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const focusIntervalRef = useRef(null);

  // ---------------------------------------------------
  // LOAD DATA
  // ---------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const [t, n, p, g, s] = await Promise.all([
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
        if (s) setStats(JSON.parse(s));
      } catch (e) {
        console.warn("MindFlow: failed to load data", e);
      }
    })();
  }, []);

  // ---------------------------------------------------
  // PERSIST DATA
  // ---------------------------------------------------
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks)).catch(() => {});
  }, [tasks]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes)).catch(() => {});
  }, [notes]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.PLANNER, JSON.stringify(planner)).catch(() => {});
  }, [planner]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals)).catch(() => {});
  }, [goals]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats)).catch(() => {});
  }, [stats]);

  // ---------------------------------------------------
  // STREAK LOGIC
  // ---------------------------------------------------
  function registerProductiveEvent() {
    const today = new Date().toISOString().slice(0, 10);

    setStats((prev) => {
      if (!prev.lastActiveDate) {
        return { lastActiveDate: today, streak: 1 };
      }
      if (prev.lastActiveDate === today) return prev;

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

  // ---------------------------------------------------
  // FOCUS TIMER
  // ---------------------------------------------------
  useEffect(() => {
    if (focusRunning) {
      focusIntervalRef.current = setInterval(() => {
        setFocusRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(focusIntervalRef.current);
            focusIntervalRef.current = null;
            registerProductiveEvent();
            return focusDuration;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (focusIntervalRef.current) {
      clearInterval(focusIntervalRef.current);
      focusIntervalRef.current = null;
    }

    return () => {
      if (focusIntervalRef.current) {
        clearInterval(focusIntervalRef.current);
        focusIntervalRef.current = null;
      }
    };
  }, [focusRunning, focusDuration]);

  const setFocusPreset = (minutes) => {
    const secs = minutes * 60;
    setFocusDuration(secs);
    setFocusRemaining(secs);
  };

  const toggleFocusRunning = () => {
    setFocusRunning((v) => !v);
  };

  const resetFocus = () => {
    setFocusRemaining(focusDuration);
    setFocusRunning(false);
  };

  // ---------------------------------------------------
  // DERIVED FIELDS
  // ---------------------------------------------------
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const weekday = now.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const todayCompleted = countCompletedToday(tasks);
  const completionRatio =
    (todayCompleted / Math.max(tasks.length || 1, 3)) * 100;

  const aiInsights = getAIInsights({ tasks, planner, goals });

  const focusMinutes = Math.floor(focusRemaining / 60)
    .toString()
    .padStart(2, "0");
  const focusSeconds = (focusRemaining % 60).toString().padStart(2, "0");

  const exportPayload = {
    tasks,
    notes,
    planner,
    goals,
    stats,
  };

  const value = {
    // core state
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
    // search & filters
    searchQuery,
    setSearchQuery,
    filterKey,
    setFilterKey,
    // focus
    focusDuration,
    focusRemaining,
    focusRunning,
    setFocusPreset,
    toggleFocusRunning,
    resetFocus,
    focusMinutes,
    focusSeconds,
    // derived
    greeting,
    weekday,
    todayCompleted,
    completionRatio,
    aiInsights,
    // export
    exportPayload,
  };

  return (
    <MindFlowContext.Provider value={value}>
      {children}
    </MindFlowContext.Provider>
  );
}

// ----------------- helpers -----------------
function countCompletedToday(tasks) {
  const today = new Date().toISOString().slice(0, 10);
  return tasks.filter(
    (t) => t.completed && (t.completedAt || "").slice(0, 10) === today
  ).length;
}

function getAIInsights({ tasks, planner, goals }) {
  const insights = [];

  const high = tasks.filter(
    (t) => t.priority === "High" && !t.completed
  );
  if (high.length) {
    insights.push(
      `Start with ${high.length} high-priority task${
        high.length > 1 ? "s" : ""
      } to unlock momentum.`
    );
  }

  const lowGoals = goals.filter((g) => (g.progress || 0) < 40);
  if (lowGoals.length) {
    insights.push(
      "Pick one goal under 40% and attach a Planner block for it today."
    );
  }

  if (planner.length && tasks.length) {
    insights.push("Assign at least one important task to each morning block.");
  }

  if (!insights.length) {
    insights.push(
      "Your system looks stable. Use Goals and Planner to stretch just a little more."
    );
  }

  return insights;
}
