// src/screens/AnalyticsScreen.js
// TMOS Analytics — Ultra Plasma Neural Core (Digital School Houses Final Boss v∞)

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
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
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

// ---------------------------
// STORAGE KEYS
// ---------------------------
const STORAGE_KEYS = {
  TASKS: "@mindflow_tasks",
  FOCUS: "@mindflow_focus",
  MOODS: "@mindflow_moods",
  PLANNER: "@mindflow_planner",
};

// Optional house override (for future)
const HOUSE_OVERRIDES_KEY = "@mindflow_active_house";

// ---------------------------
// HOUSES + PORTRAIT IMAGES
// ---------------------------
const HOUSE_IMAGES = {
  Shadows: require("../../assets/houses/shadows.png"),
  Hipsters: require("../../assets/houses/hipsters.png"),
  Engineers: require("../../assets/houses/engineers.png"),
  Speedsters: require("../../assets/houses/speedsters.png"),
};

const HOUSES = {
  Shadows: {
    key: "Shadows",
    label: "Shadows",
    tagline: "Deep-focus specialists.",
    accent: "#6366f1",
    gradient: ["#020617", "#020617", "#1d1b4f"],
    icon: "moon-outline",
    buffs: {
      focusMultiplier: 1.12,
      moodWeight: 0.9,
      streakFocusBias: 1.1,
      planningSensitivity: 0.8,
    },
  },
  Speedsters: {
    key: "Speedsters",
    label: "Speedsters",
    tagline: "Fast execution bursts.",
    accent: "#22c55e",
    gradient: ["#020617", "#022c22", "#14532d"],
    icon: "flash-outline",
    buffs: {
      focusMultiplier: 1.08,
      moodWeight: 0.85,
      streakFocusBias: 0.95,
      planningSensitivity: 1.1,
    },
  },
  Engineers: {
    key: "Engineers",
    label: "Engineers",
    tagline: "Logical task precision.",
    accent: "#0ea5e9",
    gradient: ["#020617", "#022c44", "#082f49"],
    icon: "construct-outline",
    buffs: {
      focusMultiplier: 1.06,
      moodWeight: 1.0,
      streakFocusBias: 1.25,
      planningSensitivity: 0.7,
    },
  },
  Hipsters: {
    key: "Hipsters",
    label: "Hipsters",
    tagline: "Creative flow cycles.",
    accent: "#f97316",
    gradient: ["#020617", "#4c1d95", "#7c2d12"],
    icon: "sparkles-outline",
    buffs: {
      focusMultiplier: 1.04,
      moodWeight: 1.4,
      streakFocusBias: 0.9,
      planningSensitivity: 1.2,
    },
  },
};

// default house logic — your house = Speedsters
function getInitialHouseKey(user) {
  const fromUser = user?.house;
  if (fromUser && HOUSES[fromUser]) return fromUser;
  return "Speedsters";
}

// ---------------------------
// SAFE PARSE HELPERS
// ---------------------------
function safeParse(raw, fallback = []) {
  try {
    const parsed = raw ? JSON.parse(raw) : fallback;
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// --------------------------------------------------
// MAIN SCREEN
// --------------------------------------------------
export default function AnalyticsScreen({ navigation }) {
  const { user } = useAuth();
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [focusSessions, setFocusSessions] = useState([]);
  const [moods, setMoods] = useState([]);
  const [plannerItems, setPlannerItems] = useState([]);

  const [aiBrainText, setAiBrainText] = useState("");
  const [aiForecastText, setAiForecastText] = useState("");
  const [alerts, setAlerts] = useState([]);

  // plasma command palette
  const [commandOpen, setCommandOpen] = useState(false);

  // active house (local state, Speedsters by default)
  const [activeHouseKey, setActiveHouseKey] = useState(() =>
    getInitialHouseKey(user)
  );

  const heroAnim = useRef(new Animated.Value(0)).current;
  const chartsAnim = useRef(new Animated.Value(0)).current;
  const panelsAnim = useRef(new Animated.Value(0)).current;

  const house = HOUSES[activeHouseKey] || HOUSES.Speedsters;

  // ---------------------------
  // LOAD ANALYTICS (SAFE)
  // ---------------------------
  async function loadAnalytics() {
    try {
      setLoading(true);
      const [tasksRaw, focusRaw, moodsRaw, plannerRaw, houseOverrideRaw] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.TASKS),
          AsyncStorage.getItem(STORAGE_KEYS.FOCUS),
          AsyncStorage.getItem(STORAGE_KEYS.MOODS),
          AsyncStorage.getItem(STORAGE_KEYS.PLANNER),
          AsyncStorage.getItem(HOUSE_OVERRIDES_KEY),
        ]);

      setTasks(safeParse(tasksRaw));
      setFocusSessions(safeParse(focusRaw));
      setMoods(safeParse(moodsRaw));
      setPlannerItems(safeParse(plannerRaw));

      if (houseOverrideRaw && HOUSES[houseOverrideRaw]) {
        setActiveHouseKey(houseOverrideRaw);
      }
    } catch (e) {
      console.log("Analytics load error:", e);
      setTasks([]);
      setFocusSessions([]);
      setMoods([]);
      setPlannerItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  // ---------------------------
  // METRICS ENGINE (HOUSE-AWARE)
// + Neural Forecast, DNA, Recovery, XP, Champion, Future Window, Identity
  // ---------------------------
  const metrics = useMemo(() => {
    const taskArr = Array.isArray(tasks) ? tasks : [];
    const focusArr = Array.isArray(focusSessions)
      ? focusSessions
      : [];
    const moodsArr = Array.isArray(moods) ? moods : [];
    const plannerArr = Array.isArray(plannerItems)
      ? plannerItems
      : [];

    const now = new Date();
    const buffs = house.buffs;

    // TASKS
    const totalTasks = taskArr.length;
    const completedTasks = taskArr.filter(
      (t) => t && (t.done || t.completed)
    ).length;
    const completionRate =
      totalTasks === 0
        ? 0
        : Math.round((completedTasks / totalTasks) * 100);

    // FOCUS
    let totalFocusSecondsRaw = 0;
    focusArr.forEach((s) => {
      if (!s) return;
      const dur =
        typeof s.duration === "number"
          ? s.duration
          : typeof s.seconds === "number"
          ? s.seconds
          : 0;
      totalFocusSecondsRaw += dur;
    });
    const totalFocusSeconds =
      totalFocusSecondsRaw * (buffs.focusMultiplier || 1);
    const totalFocusMinutes = Math.round(totalFocusSeconds / 60);
    const avgDailyFocus = Math.round(totalFocusMinutes / 7);

    // ACTIVITY DATES
    const activityDates = new Set();
    const collectDate = (entry) => {
      if (!entry) return;
      const d =
        entry.date ||
        entry.timestamp ||
        entry.createdAt ||
        entry.completedAt;
      const dateObj = d ? new Date(d) : null;
      const key = dateObj
        ? dateObj.toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);
      activityDates.add(key);
    };
    taskArr.forEach(collectDate);
    focusArr.forEach(collectDate);
    moodsArr.forEach(collectDate);

    // STREAKS
    let currentStreak = 0;
    const daysBack = 30;
    let longestStreak = 0;
    let temp = 0;

    for (let i = 0; i < daysBack; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const active = activityDates.has(key);

      if (i === 0) {
        if (active) currentStreak = 1;
      } else if (active && currentStreak > 0) {
        currentStreak += 1;
      }

      if (active) {
        temp += 1;
        if (temp > longestStreak) longestStreak = temp;
      } else {
        temp = 0;
      }
    }

    const displayStreak = Math.round(
      currentStreak * (buffs.streakFocusBias || 1)
    );

    // MOODS (avg)
    let moodScore = 0;
    let lowestMoodScore = null;
    let lowestMoodDate = null;

    if (moodsArr.length > 0) {
      const scores = moodsArr
        .map((m) => {
          if (!m) return 60;
          if (typeof m.score === "number") return m.score;
          switch ((m.mood || "").toLowerCase()) {
            case "great":
            case "energized":
            case "motivated":
              return 90;
            case "good":
            case "calm":
              return 75;
            case "ok":
            case "neutral":
              return 60;
            case "tired":
            case "low":
              return 45;
            case "stressed":
            case "anxious":
              return 35;
            default:
              return 60;
          }
        })
        .filter((n) => typeof n === "number");

      const avg =
        scores.length === 0
          ? 0
          : scores.reduce((a, b) => a + b, 0) / scores.length;

      moodScore = Math.round(
        avg * (buffs.moodWeight || 1)
      );
      moodScore = clamp(moodScore, 0, 100);

      // lowest mood day
      moodsArr.forEach((m, idx) => {
        const base =
          typeof scores[idx] === "number"
            ? scores[idx]
            : 60;
        if (
          lowestMoodScore === null ||
          base < lowestMoodScore
        ) {
          lowestMoodScore = base;
          const d =
            m.date || m.timestamp || new Date().toISOString();
          lowestMoodDate = new Date(d);
        }
      });
    }

    // WEEKLY FOCUS (last 7 days)
    const weekly = [];
    let bestFocusDayLabel = null;
    let bestFocusMinutes = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-GB", {
        weekday: "short",
      });

      const dayFocus = focusArr.filter((s) => {
        const sd = s?.date || s?.timestamp;
        if (!sd) return false;
        const dayKey = new Date(sd).toISOString().slice(0, 10);
        return dayKey === key;
      });

      const focusMinutes = Math.round(
        dayFocus.reduce((sum, s) => {
          const dur =
            typeof s.duration === "number"
              ? s.duration
              : typeof s.seconds === "number"
              ? s.seconds
              : 0;
          return sum + dur;
        }, 0) / 60
      );

      if (focusMinutes > bestFocusMinutes) {
        bestFocusMinutes = focusMinutes;
        bestFocusDayLabel = label;
      }

      weekly.push({
        key,
        label,
        focusMinutes,
      });
    }

    const maxFocus =
      weekly.reduce(
        (max, d) =>
          d.focusMinutes > max ? d.focusMinutes : max,
        30
      ) || 30;

    // PLANNER LOAD (with house sensitivity)
    const plannerLoadRaw = plannerArr.length;
    const plannerSensitivity = buffs.planningSensitivity || 1;
    const plannerLoad = Math.round(
      plannerLoadRaw * plannerSensitivity
    );

    // PRODUCTIVITY SCORE (house-aware)
    const focusScore = Math.min(totalFocusMinutes / 2, 40); // up to 40
    const compScore = completionRate * 0.3; // up to 30
    const moodScoreWeighted =
      (moodScore || 60) * 0.3 * (buffs.moodWeight || 1); // ~30
    let productivityScore = Math.round(
      Math.min(focusScore + compScore + moodScoreWeighted, 100)
    );
    productivityScore = clamp(productivityScore, 0, 100);

    // -------------------------
    // TMOS XP SYSTEM
    // -------------------------
    const xpTasks = completedTasks * 2;
    const xpFocus = focusArr.length * 5;
    const xpMoods = moodsArr.length * 1;
    const xpStreak = currentStreak * 3;
    const xpPlanner = plannerArr.length * 1;
    const xpTotal =
      xpTasks + xpFocus + xpMoods + xpStreak + xpPlanner;

    let level = 1;
    let levelLabel = "Apprentice OS";
    let levelMin = 0;
    let levelMax = 60;

    if (xpTotal >= 400) {
      level = 5;
      levelLabel = "Plasma Master";
      levelMin = 400;
      levelMax = 600;
    } else if (xpTotal >= 260) {
      level = 4;
      levelLabel = "Neural Operator";
      levelMin = 260;
      levelMax = 400;
    } else if (xpTotal >= 150) {
      level = 3;
      levelLabel = "Flow Architect";
      levelMin = 150;
      levelMax = 260;
    } else if (xpTotal >= 60) {
      level = 2;
      levelLabel = "Stable Loop";
      levelMin = 60;
      levelMax = 150;
    }

    const levelProgress = clamp(
      (xpTotal - levelMin) / (levelMax - levelMin || 1),
      0,
      1
    );

    // -------------------------
    // PLASMA HABIT DNA
    // -------------------------
    let fBand = 1;
    if (totalFocusMinutes >= 160) fBand = 3;
    else if (totalFocusMinutes >= 70) fBand = 2;

    let mBand = 2;
    if (moodScore && moodScore >= 80) mBand = 3;
    else if (moodScore && moodScore < 55) mBand = 1;

    let sBand = 1;
    if (currentStreak >= 7) sBand = 3;
    else if (currentStreak >= 3) sBand = 2;

    let pBand = 2;
    if (plannerLoadRaw <= 3 && completionRate >= 75)
      pBand = 3;
    else if (
      plannerLoadRaw > 8 &&
      completionRate < 55
    )
      pBand = 1;

    const dnaCode = `F${fBand} – M${mBand} – S${sBand} – P${pBand}`;

    let dnaDescriptor = "Calibrating Habit DNA…";
    if (totalTasks > 0 || totalFocusMinutes > 0) {
      const dnaParts = [];

      if (fBand === 3)
        dnaParts.push("high-focus operator");
      else if (fBand === 2)
        dnaParts.push("steady-focus builder");
      else dnaParts.push("emerging focus profile");

      if (sBand === 3)
        dnaParts.push("identity-level streaks");
      else if (sBand === 2)
        dnaParts.push("growing streak discipline");
      else dnaParts.push("streaks still forming");

      if (pBand === 3)
        dnaParts.push("elite planning discipline");
      else if (pBand === 2)
        dnaParts.push("balanced planning");
      else dnaParts.push("planner overload risk");

      dnaDescriptor = dnaParts.join(" · ");
    }

    // -------------------------
    // RECOVERY INTELLIGENCE
    // -------------------------
    let recoveryScore = 70;
    if (totalFocusMinutes > 180) recoveryScore -= 15;
    if (totalFocusMinutes > 240) recoveryScore -= 10;
    if (moodScore > 0 && moodScore < 55) recoveryScore -= 20;
    if (moodScore >= 80) recoveryScore += 10;
    if (plannerLoadRaw > 8) recoveryScore -= 10;
    if (plannerLoadRaw <= 4) recoveryScore += 5;

    recoveryScore = clamp(recoveryScore, 0, 100);

    let recoveryLabel = "Balanced";
    if (recoveryScore >= 80) recoveryLabel = "Recharged";
    else if (recoveryScore < 55) recoveryLabel = "Under-recovered";

    let recoverySuggestion =
      "Protect one short reset block before the next big focus window.";
    if (recoveryScore >= 80) {
      recoverySuggestion =
        "You have enough recovery capital. You can safely schedule one ambitious deep-work block tomorrow.";
    } else if (recoveryScore < 55) {
      recoverySuggestion =
        "Inject a 10–15 minute active reset (walk, stretch, light breathing) before loading more tasks.";
    }

    // -------------------------
    // CHAMPION MODE SCORE
    // Focus × Consistency × Balance × Flow
    // -------------------------
    const focusFactor = clamp(
      totalFocusMinutes / 200,
      0,
      1
    );
    const consistencyFactor = clamp(
      currentStreak / 10,
      0,
      1
    );
    const balanceFactor = clamp(
      1 - Math.abs(plannerLoadRaw - 6) / 10,
      0,
      1
    );
    const flowFactor = clamp(
      (moodScore || 60) / 100,
      0,
      1
    );

    const championScore = Math.round(
      focusFactor *
        consistencyFactor *
        balanceFactor *
        flowFactor *
        100
    );

    // -------------------------
    // FUTURE WINDOW v∞
    // -------------------------
    let burnoutRisk = "low";
    if (
      totalFocusMinutes > 200 &&
      moodScore > 0 &&
      moodScore < 60
    )
      burnoutRisk = "medium";
    if (
      totalFocusMinutes > 260 &&
      moodScore > 0 &&
      moodScore < 55
    )
      burnoutRisk = "high";

    let bestDeepWorkHint = "Align deep work with your best focus day.";
    if (bestFocusDayLabel) {
      bestDeepWorkHint = `Next 3 deep-work windows should mirror your strongest pattern: ${bestFocusDayLabel} focus style.`;
    }

    let moodPrediction = "Mood will likely stay stable with light oscillations.";
    if (moodScore >= 80)
      moodPrediction =
        "Mood curve is elevated — ideal moment to push one ambitious block.";
    else if (moodScore > 0 && moodScore < 60)
      moodPrediction =
        "Mood curve shows pressure — one micro-reset per block will prevent a dip.";

    let consistencyPrediction =
      "Your consistency is forming — tiny daily actions will lock it in.";
    if (currentStreak >= 7)
      consistencyPrediction =
        "Your streak engine is strong. Even a 5-minute action on hard days preserves identity-level consistency.";
    else if (currentStreak === 0)
      consistencyPrediction =
        "No active streak yet. One action per day this week is enough to boot the system.";

    let overloadHint =
      plannerLoadRaw > 10
        ? "Planner overload detected. Cap visible tasks at 5–7 to avoid cognitive drag."
        : "Planner load is within a healthy band. Keep capture simple and visible list short.";

    const futureWindow = {
      burnoutRisk,
      bestDeepWorkHint,
      moodPrediction,
      consistencyPrediction,
      overloadHint,
    };

    // -------------------------
    // AI TIMELINE MEMORY SNAPSHOT
    // -------------------------
    let timelineTitle = "Behavior snapshot initializing…";
    let timelineBody =
      "As you log more focus, mood, and planner data, TMOS will build a monthly identity snapshot.";

    if (
      totalTasks > 0 ||
      totalFocusMinutes > 0 ||
      currentStreak > 0
    ) {
      const bestFocus =
        bestFocusMinutes > 0
          ? `Best focus pulse this week: ${bestFocusMinutes} min on ${bestFocusDayLabel}.`
          : "No clear best focus day yet — your curve is still forming.";

      const lowestMood =
        lowestMoodScore !== null && lowestMoodDate
          ? `Lowest mood signal: ${Math.round(
              lowestMoodScore
            )} on ${lowestMoodDate.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
            })}.`
          : "Mood curve is still being mapped.";

      const streakLine =
        currentStreak > 0
          ? `Active streak: ${currentStreak} days · All-time longest: ${longestStreak} days.`
          : `All-time longest streak so far: ${longestStreak} days.`;

      timelineTitle = "Month DNA Snapshot: Who were you this week?";
      timelineBody = `${bestFocus} ${streakLine} ${lowestMood} Your system is rendering a personal timeline of peaks, dips, and recovery loops.`;
    }

    const timeline = {
      title: timelineTitle,
      body: timelineBody,
    };

    // -------------------------
    // IDENTITY RANK
    // -------------------------
    let identityRank = "Stabilizer";

    if (
      championScore >= 80 &&
      currentStreak >= 7
    ) {
      identityRank = "Executor";
    } else if (
      plannerLoadRaw >= 6 &&
      completionRate >= 70
    ) {
      identityRank = "Builder";
    } else if (
      currentStreak >= 5 &&
      (moodScore === 0 || moodScore >= 60)
    ) {
      identityRank = "Stabilizer";
    } else if (moodScore >= 80) {
      identityRank = "Creative";
    } else if (
      plannerLoadRaw >= 4 &&
      completionRate >= 65
    ) {
      identityRank = "Strategist";
    } else if (
      totalFocusMinutes >= 200 &&
      moodScore > 0 &&
      moodScore < 60
    ) {
      identityRank = "Pusher";
    } else if (
      recoveryScore >= 70 &&
      productivityScore < 60
    ) {
      identityRank = "Recoverer";
    }

    return {
      totalTasks,
      completedTasks,
      completionRate,
      totalFocusMinutes,
      avgDailyFocus,
      currentStreak: displayStreak,
      baseStreak: currentStreak,
      longestStreak,
      moodScore,
      weekly,
      maxFocus,
      plannerLoad,
      productivityScore,
      rawPlannerLoad: plannerArr.length,

      // XP + Level + Champion
      xpTotal,
      level,
      levelLabel,
      levelProgress,
      championScore,

      // DNA
      dnaCode,
      dnaDescriptor,

      // Recovery
      recoveryScore,
      recoveryLabel,
      recoverySuggestion,

      // Future window + timeline
      futureWindow,
      timeline,

      // Identity
      identityRank,
    };
  }, [tasks, focusSessions, moods, plannerItems, house]);

  // --------------------------------------------------
  // AI ENGINE — HOUSE-AWARE TEXT
  // --------------------------------------------------
  function buildBrainText(m) {
    if (
      m.totalTasks === 0 &&
      m.totalFocusMinutes === 0 &&
      m.moodScore === 0
    ) {
      return `MindFlow Neural Core is online. Once you start logging tasks, focus sessions, and moods, it will build a behavioral model tuned to the ${house.label} house profile from Digital School.`;
    }

    const parts = [];

    if (house.key === "Shadows") {
      parts.push(
        "As a Shadows profile, your system is biased toward deep-focus intervals and quieter environments."
      );
    } else if (house.key === "Speedsters") {
      parts.push(
        "As a Speedsters profile, your system thrives on quick bursts and high-momentum task switching."
      );
    } else if (house.key === "Engineers") {
      parts.push(
        "As an Engineers profile, your system leans toward structured plans and consistent execution."
      );
    } else if (house.key === "Hipsters") {
      parts.push(
        "As a Hipsters profile, your system operates in creative waves — mood and environment shape output."
      );
    }

    if (m.totalFocusMinutes > 150) {
      parts.push(
        "Your deep-focus volume is in a high-performance bracket. Protect this capacity by aggressively limiting context switches during peak windows."
      );
    } else if (m.totalFocusMinutes > 60) {
      parts.push(
        "You are building a consistent focus habit. Two well-protected blocks per day will compound this quickly."
      );
    } else {
      parts.push(
        "Focus volume is still light. A single non-negotiable 25-minute block daily is enough to shift the trajectory."
      );
    }

    if (m.completionRate >= 80 && m.totalTasks > 0) {
      parts.push(
        "Your task conversion rate is strong — you reliably finish what you load into the system."
      );
    } else if (m.completionRate >= 50 && m.totalTasks > 0) {
      parts.push(
        "You convert around half your tasks. Tightening your daily scope will increase completion without increasing hours."
      );
    } else if (m.totalTasks > 0) {
      parts.push(
        "Your backlog is dense compared to what you actually finish. A quick archive pass will reduce cognitive drag."
      );
    }

    if (m.moodScore > 0) {
      if (m.moodScore >= 80) {
        parts.push(
          "Mood regulation is strongly supportive of high performance — you have psychological room to increase challenge if desired."
        );
      } else if (m.moodScore >= 60) {
        parts.push(
          "Mood is broadly stable with normal fluctuations. Intentional micro-breaks will keep it inside a healthy band."
        );
      } else {
        parts.push(
          "Mood signals indicate cognitive load or fatigue. Intentionally placing recovery blocks is now performance-critical, not optional."
        );
      }
    }

    if (m.baseStreak >= 3) {
      parts.push(
        `Underlying streak stability is visible: ${m.baseStreak} days of consistent engagement. This is how identity-level change actually forms.`
      );
    }

    return parts.join(" ");
  }

  function buildForecastText(m) {
    if (m.totalTasks === 0 && m.totalFocusMinutes === 0) {
      return "After two or three active days, the Neural Core will start forecasting your best focus windows and where to place recovery blocks, tuned to your Digital School house profile.";
    }

    let suggestedBlock = "10:00–12:00";
    if (house.key === "Shadows") suggestedBlock = "20:00–22:00";
    if (house.key === "Speedsters") suggestedBlock = "09:35–11:10";
    if (house.key === "Engineers") suggestedBlock = "09:00–11:00";
    if (house.key === "Hipsters") suggestedBlock = "13:00–15:00";

    let moodTrend = "stable";
    if (m.moodScore >= 80) moodTrend = "elevated";
    else if (m.moodScore > 0 && m.moodScore < 60)
      moodTrend = "under pressure";

    const projectedScore = Math.max(
      40,
      Math.min(98, m.productivityScore + 5)
    );

    const parts = [];
    parts.push(
      `Tomorrow's projected performance score is trending around ${projectedScore} / 100 for a ${house.label} profile.`
    );
    parts.push(
      `The highest-yield focus window for you is likely around ${suggestedBlock}. Treat this as a protected deep-work slot.`
    );

    if (m.moodScore > 0) {
      parts.push(
        `Mood trend is currently ${moodTrend}. One planned micro-break in the late afternoon will stabilize the curve.`
      );
    }

    if (m.rawPlannerLoad > 6) {
      parts.push(
        "Your planner density is high — consider moving non-essential items into a separate backlog so today’s lane stays clean."
      );
    }

    return parts.join(" ");
  }

  function buildSystemAlerts(m) {
    const list = [];

    if (
      house.key === "Shadows" &&
      m.totalFocusMinutes > 160 &&
      m.moodScore > 0 &&
      m.moodScore < 60
    ) {
      list.push({
        severity: "critical",
        title: "Shadow deep-focus overload",
        body: "You’re running heavy deep-work hours with a low mood index. This combination is powerful short term but unsustainable without real recovery.",
      });
    }

    if (
      house.key === "Speedsters" &&
      m.totalTasks > 10 &&
      m.completionRate < 50
    ) {
      list.push({
        severity: "high",
        title: "Speedster task-switch spike",
        body: "Your task volume is high and completion rate is lagging. Consolidate tasks into fewer, bigger moves to avoid fragmentation.",
      });
    }

    if (
      house.key === "Engineers" &&
      m.rawPlannerLoad > 10
    ) {
      list.push({
        severity: "high",
        title: "Engineer over-planning loop",
        body: "Planner density suggests you might be over-structuring. Ship a few imperfect tasks to restore momentum.",
      });
    }

    if (
      house.key === "Hipsters" &&
      m.moodScore > 0 &&
      m.moodScore < 55
    ) {
      list.push({
        severity: "high",
        title: "Hipster creative fatigue pattern",
        body: "Mood signals show creative fatigue. Inject one genuinely enjoyable, low-pressure block into your day.",
      });
    }

    if (m.completionRate < 50 && m.totalTasks > 6) {
      list.push({
        severity: "high",
        title: "Backlog overload",
        body: "Your completion rate is not keeping up with what you add. Reduce the visible list to a maximum of 5 live tasks.",
      });
    }

    if (
      m.totalFocusMinutes > 150 &&
      m.moodScore > 0 &&
      m.moodScore < 60 &&
      !list.find((a) => a.severity === "critical")
    ) {
      list.push({
        severity: "critical",
        title: "Performance–mood mismatch",
        body: "You are pushing significant focus hours with a strained mood index. This is a classical pre-burnout signature — recovery time is strategic, not optional.",
      });
    }

    if (m.baseStreak >= 5) {
      list.push({
        severity: "positive",
        title: "Streak momentum online",
        body: `You’ve maintained activity for ${m.baseStreak} days. On low-energy days, even a tiny action keeps this loop intact.`,
      });
    }

    if (list.length === 0) {
      list.push({
        severity: "normal",
        title: "System stable",
        body: "Your current patterns are balanced. Use this stability to experiment with slightly more ambitious deep-work blocks.",
      });
    }

    return list;
  }

  useEffect(() => {
    setAiBrainText(buildBrainText(metrics));
    setAiForecastText(buildForecastText(metrics));
    setAlerts(buildSystemAlerts(metrics));
  }, [metrics, house]);

  // ---------------------------
  // ANIMATIONS
  // ---------------------------
  useEffect(() => {
    Animated.stagger(140, [
      Animated.timing(heroAnim, {
        toValue: 1,
        duration: 480,
        useNativeDriver: true,
      }),
      Animated.timing(chartsAnim, {
        toValue: 1,
        duration: 480,
        useNativeDriver: true,
      }),
      Animated.timing(panelsAnim, {
        toValue: 1,
        duration: 480,
        useNativeDriver: true,
      }),
    ]).start();
  }, [heroAnim, chartsAnim, panelsAnim]);

  // ---------------------------
  // COMMAND PALETTE HANDLER
  // ---------------------------
  function handleCommand(type) {
    if (type === "forecast") {
      setAiForecastText(buildForecastText(metrics));
      setCommandOpen(false);
      return;
    }

    if (type === "dna") {
      Alert.alert(
        "Habit DNA Strand",
        `${metrics.dnaCode}\n\n${metrics.dnaDescriptor}`
      );
      setCommandOpen(false);
      return;
    }

    if (type === "recovery") {
      Alert.alert(
        "Recovery Intelligence",
        `Recovery score: ${metrics.recoveryScore}/100 (${metrics.recoveryLabel}).\n\n${metrics.recoverySuggestion}`
      );
      setCommandOpen(false);
      return;
    }

    if (type === "stats") {
      Alert.alert(
        "Neural Stats",
        `Focus (7d): ${metrics.totalFocusMinutes} min\nTasks: ${metrics.completedTasks}/${metrics.totalTasks}\nChampion score: ${metrics.championScore}/100\nIdentity: ${metrics.identityRank}`
      );
      setCommandOpen(false);
      return;
    }

    setCommandOpen(false);
  }

  // ---------------------------
  // RENDER
  // ---------------------------
  const plasmaBackground =
    theme.key === "dark"
      ? ["#020617", "#020617", "#020617"]
      : ["#eef2ff", "#e0ecff", "#f4f4ff"];

  const currentPortrait = HOUSE_IMAGES[house.key];

  return (
    <LinearGradient
      colors={plasmaBackground}
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.text}
          />
        }
      >
        {/* HEADER ROW */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.screenTitle,
                { color: theme.text },
              ]}
            >
              Neural Analytics
            </Text>
            <Text
              style={[
                styles.screenSubtitle,
                { color: theme.subtext },
              ]}
            >
              TMOS Plasma OS × Digital School Houses
            </Text>
          </View>

          <View style={styles.topRightColumn}>
            {/* Plasma Command Palette trigger */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setCommandOpen(true)}
              style={styles.commandButton}
            >
              <Ionicons
                name="terminal-outline"
                size={16}
                color="#e5e7eb"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.commandButtonText}>
                Command
              </Text>
            </TouchableOpacity>

            {/* Active house badge */}
            <View style={styles.houseBadge}>
              <Ionicons
                name={house.icon}
                size={18}
                color="#e5e7eb"
                style={{ marginRight: 6 }}
              />
              <View>
                <Text style={styles.houseBadgeTitle}>
                  {house.label}
                </Text>
                <Text style={styles.houseBadgeSub}>
                  Adaptive house engine
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* HOUSES STRIP — FUNCTIONAL, SPEEDSTERS DEFAULT */}
        <View style={styles.sectionHeaderRow}>
          <Text
            style={[
              styles.sectionLabel,
              { color: theme.subtext },
            ]}
          >
            Digital School houses
          </Text>
          <Text
            style={[
              styles.sectionHint,
              { color: theme.subtext },
            ]}
          >
            Tap a house to preview its analytics profile
          </Text>
        </View>
        <View style={styles.houseStrip}>
          {Object.values(HOUSES).map((h) => {
            const active = h.key === house.key;
            return (
              <TouchableOpacity
                key={h.key}
                activeOpacity={0.85}
                onPress={async () => {
                  setActiveHouseKey(h.key);
                  try {
                    await AsyncStorage.setItem(
                      HOUSE_OVERRIDES_KEY,
                      h.key
                    );
                  } catch (e) {
                    console.log(
                      "House override save error",
                      e
                    );
                  }
                }}
                style={[
                  styles.houseChip,
                  active && [
                    styles.houseChipActive,
                    { borderColor: h.accent },
                  ],
                ]}
              >
                <Image
                  source={HOUSE_IMAGES[h.key]}
                  style={[
                    styles.houseChipImage,
                    active && { borderColor: h.accent },
                  ]}
                />
                <View>
                  <Text
                    style={[
                      styles.houseChipText,
                      active && styles.houseChipTextActive,
                    ]}
                  >
                    {h.label}
                  </Text>
                  <Text style={styles.houseChipSubText}>
                    {h.tagline}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* NEURAL CORE HERO WITH BIG PORTRAIT */}
        <Animated.View
          style={[
            styles.heroWrapper,
            {
              opacity: heroAnim,
              transform: [
                {
                  translateY: heroAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
                {
                  scale: heroAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.97, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={house.gradient}
            style={styles.heroGradientBorder}
          >
            <BlurView
              intensity={55}
              tint={theme.key === "dark" ? "dark" : "light"}
              style={styles.heroBlur}
            >
              <View style={styles.heroHeaderRow}>
                {/* Portrait */}
                <View style={styles.heroPortraitWrapper}>
                  <Image
                    source={currentPortrait}
                    style={styles.heroPortrait}
                    resizeMode="cover"
                  />
                  <View style={styles.heroPortraitGlow} />
                </View>

                {/* Text */}
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text
                    style={[
                      styles.heroTitle,
                      { color: theme.text },
                    ]}
                  >
                    MindFlow Neural Core
                  </Text>
                  <Text
                    style={[
                      styles.heroSubtitle,
                      { color: theme.subtext },
                    ]}
                  >
                    Tuned to {house.label}: {house.tagline}
                  </Text>
                  <Text
                    style={[
                      styles.heroHouseTag,
                      { color: theme.subtext },
                    ]}
                  >
                    House identity:{" "}
                    <Text style={{ color: house.accent }}>
                      {house.label}
                    </Text>
                  </Text>
                </View>

                {/* Productivity score */}
                <View style={styles.heroScorePill}>
                  <Text style={styles.heroScoreLabel}>
                    Productivity
                  </Text>
                  <Text style={styles.heroScoreValue}>
                    {metrics.productivityScore}
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  styles.heroBody,
                  { color: theme.subtext },
                ]}
              >
                {aiBrainText}
              </Text>
            </BlurView>
          </LinearGradient>
        </Animated.View>

        {/* SYSTEM OVERVIEW SUMMARY */}
        <View style={styles.sectionHeaderRow}>
          <Text
            style={[
              styles.sectionLabel,
              { color: theme.subtext },
            ]}
          >
            System overview
          </Text>
          <Text
            style={[
              styles.sectionHint,
              { color: theme.subtext },
            ]}
          >
            Focus, execution, mood, streak, and planner load
          </Text>
        </View>
        <View style={styles.summaryGrid}>
          <SummaryCard
            theme={theme}
            icon="time-outline"
            label="Focus minutes"
            value={`${metrics.totalFocusMinutes}`}
            hint="last 7 days"
          />
          <SummaryCard
            theme={theme}
            icon="checkmark-done-outline"
            label="Tasks completed"
            value={`${metrics.completedTasks}/${metrics.totalTasks}`}
            hint={`${metrics.completionRate}% conversion`}
          />
          <SummaryCard
            theme={theme}
            icon="heart-outline"
            label="Mood index"
            value={
              metrics.moodScore
                ? `${metrics.moodScore}`
                : "--"
            }
            hint={
              metrics.moodScore
                ? "weighted by house profile"
                : "start logging moods"
            }
          />
          <SummaryCard
            theme={theme}
            icon="flame-outline"
            label="Active streak"
            value={`${metrics.currentStreak}d`}
            hint={`base: ${metrics.baseStreak}d · top: ${metrics.longestStreak}d`}
          />
        </View>

        {/* CHAMPION MODE + HABIT DNA */}
        <View style={styles.sectionHeaderRow}>
          <Text
            style={[
              styles.sectionLabel,
              { color: theme.subtext },
            ]}
          >
            Champion mode & Plasma DNA
          </Text>
          <Text
            style={[
              styles.sectionHint,
              { color: theme.subtext },
            ]}
          >
            XP, levels, DNA strand, and identity engine
          </Text>
        </View>

        <View style={styles.dnaChampionRow}>
          {/* DNA CARD */}
          <BlurView
            intensity={48}
            tint={theme.key === "dark" ? "dark" : "light"}
            style={styles.dnaCard}
          >
            <Text
              style={[
                styles.dnaTitle,
                { color: theme.text },
              ]}
            >
              Habit DNA Strand
            </Text>
            <Text
              style={[
                styles.dnaCode,
                { color: house.accent },
              ]}
            >
              {metrics.dnaCode}
            </Text>
            <Text
              style={[
                styles.dnaDescriptor,
                { color: theme.subtext },
              ]}
            >
              {metrics.dnaDescriptor}
            </Text>
            <Text style={styles.dnaHint}>
              Evolves as you log focus, mood, planner, and streak data.
            </Text>
          </BlurView>

          {/* CHAMPION CARD */}
          <BlurView
            intensity={48}
            tint={theme.key === "dark" ? "dark" : "light"}
            style={styles.championCard}
          >
            <View style={styles.championHeaderRow}>
              <Text
                style={[
                  styles.championLabel,
                  { color: theme.text },
                ]}
              >
                Champion score
              </Text>
              <View style={styles.championPill}>
                <Text style={styles.championPillText}>
                  {metrics.levelLabel}
                </Text>
              </View>
            </View>
            <View style={styles.championScoreRow}>
              <Text
                style={[
                  styles.championScore,
                  { color: theme.text },
                ]}
              >
                {metrics.championScore}
              </Text>
              <Text
                style={[
                  styles.championScoreSub,
                  { color: theme.subtext },
                ]}
              >
                / 100
              </Text>
            </View>
            <Text
              style={[
                styles.championXpText,
                { color: theme.subtext },
              ]}
            >
              Level {metrics.level} · {metrics.xpTotal} XP
            </Text>
            <View style={styles.levelBarTrack}>
              <View
                style={[
                  styles.levelBarFill,
                  {
                    width: `${Math.round(
                      metrics.levelProgress * 100
                    )}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.levelHint}>
              Actions unlock new OS effects as XP rises.
            </Text>
          </BlurView>
        </View>

        {/* DEEP PATTERNS: WEEKLY FOCUS + MOOD/STREAK (VERTICAL STACK) */}
        <View style={styles.sectionHeaderRow}>
          <Text
            style={[
              styles.sectionLabel,
              { color: theme.subtext },
            ]}
          >
            Deep patterns
          </Text>
          <Text
            style={[
              styles.sectionHint,
              { color: theme.subtext },
            ]}
          >
            Weekly focus curve and mood/streak stack
          </Text>
        </View>

        <Animated.View
          style={[
            styles.chartsColumn,
            {
              opacity: chartsAnim,
              transform: [
                {
                  translateY: chartsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* WEEKLY FOCUS CHART — FULL WIDTH */}
          <BlurView
            intensity={50}
            tint={theme.key === "dark" ? "dark" : "light"}
            style={styles.chartCard}
          >
            <View style={styles.chartHeaderRow}>
              <View>
                <Text
                  style={[
                    styles.chartTitle,
                    { color: theme.text },
                  ]}
                >
                  Weekly focus curve
                </Text>
                <Text
                  style={[
                    styles.chartSubtitle,
                    { color: theme.subtext },
                  ]}
                >
                  total {metrics.totalFocusMinutes} min · avg{" "}
                  {metrics.avgDailyFocus}m/day
                </Text>
              </View>
              <View style={styles.chartBadge}>
                <Ionicons
                  name="trending-up-outline"
                  size={16}
                  color={house.accent}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.chartBadgeText,
                    { color: house.accent },
                  ]}
                >
                  {house.label} pattern
                </Text>
              </View>
            </View>

            <View style={styles.chartBarsRow}>
              {metrics.weekly.map((day) => {
                const ratio =
                  metrics.maxFocus === 0
                    ? 0
                    : day.focusMinutes / metrics.maxFocus;
                const h = 24 + ratio * 90;
                return (
                  <View
                    key={day.key}
                    style={styles.chartBarWrapper}
                  >
                    <View style={styles.chartBarTrack}>
                      <View
                        style={[
                          styles.chartBarGlow,
                          {
                            opacity:
                              ratio === 0 ? 0.15 : 0.45,
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.chartBarFill,
                          {
                            height: h,
                            opacity:
                              ratio === 0 ? 0.25 : 0.98,
                            backgroundColor: house.accent,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.chartLabel,
                        { color: theme.subtext },
                      ]}
                    >
                      {day.label}
                    </Text>
                    <Text
                      style={[
                        styles.chartValue,
                        { color: theme.text },
                      ]}
                    >
                      {day.focusMinutes}
                    </Text>
                  </View>
                );
              })}
            </View>
          </BlurView>

          {/* SPACER */}
          <View style={{ height: 12 }} />

          {/* MOOD + STREAK — VERTICAL STACK */}
          <BlurView
            intensity={50}
            tint={theme.key === "dark" ? "dark" : "light"}
            style={styles.moodCard}
          >
            <View style={styles.moodHeaderRow}>
              <View>
                <Text
                  style={[
                    styles.chartTitle,
                    { color: theme.text },
                  ]}
                >
                  Mood & streak
                </Text>
                <Text
                  style={[
                    styles.chartSubtitle,
                    { color: theme.subtext },
                  ]}
                >
                  psychological load and consistency signature
                </Text>
              </View>
              <Ionicons
                name="pulse-outline"
                size={18}
                color="#e5e7eb"
              />
            </View>

            <View style={styles.moodVertical}>
              {/* Mood ring */}
              <View style={styles.moodRingWrapper}>
                <LinearGradient
                  colors={["#4f46e5", "#a855f7"]}
                  style={styles.moodRingOuter}
                >
                  <View style={styles.moodRingInner}>
                    <Text
                      style={[
                        styles.moodScore,
                        { color: theme.text },
                      ]}
                    >
                      {metrics.moodScore || "--"}
                    </Text>
                    <Text
                      style={[
                        styles.moodScoreLabel,
                        { color: theme.subtext },
                      ]}
                    >
                      mood index
                    </Text>
                  </View>
                </LinearGradient>
              </View>

              {/* Streak + planner */}
              <View style={styles.moodRightBlock}>
                <View style={styles.streakRow}>
                  <Ionicons
                    name="flame-outline"
                    size={18}
                    color="#f97316"
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.streakText,
                      { color: theme.text },
                    ]}
                  >
                    current:{" "}
                    <Text style={{ fontWeight: "700" }}>
                      {metrics.baseStreak} days
                    </Text>
                  </Text>
                </View>
                <Text
                  style={[
                    styles.streakSub,
                    { color: theme.subtext },
                  ]}
                >
                  longest streak: {metrics.longestStreak} days
                </Text>

                <View style={styles.streakBarRow}>
                  {Array.from({ length: 10 }).map((_, i) => {
                    const active =
                      i < metrics.baseStreak;
                    return (
                      <View
                        key={i}
                        style={[
                          styles.streakDot,
                          active && {
                            backgroundColor: "#f97316",
                            opacity: 0.95,
                          },
                        ]}
                      />
                    );
                  })}
                </View>

                <View style={styles.moodTrendRow}>
                  <Ionicons
                    name="heart-outline"
                    size={16}
                    color="#ec4899"
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.moodTrendText,
                      { color: theme.subtext },
                    ]}
                  >
                    planner load:{" "}
                    {metrics.rawPlannerLoad} items
                  </Text>
                </View>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* FORWARD MODEL + HOUSE BUFFS + FORECAST + ALERTS */}
        <View style={styles.sectionHeaderRow}>
          <Text
            style={[
              styles.sectionLabel,
              { color: theme.subtext },
            ]}
          >
            Forward model
          </Text>
          <Text
            style={[
              styles.sectionHint,
              { color: theme.subtext },
            ]}
          >
            House-aware forecast, buffs, and system alerts
          </Text>
        </View>

        <Animated.View
          style={[
            styles.panelsColumn,
            {
              opacity: panelsAnim,
              transform: [
                {
                  translateY: panelsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* HOUSE BUFF PANEL */}
          <BlurView
            intensity={52}
            tint={theme.key === "dark" ? "dark" : "light"}
            style={styles.housePanel}
          >
            <View style={styles.housePanelHeader}>
              <View style={styles.housePanelLeft}>
                <View style={styles.housePanelIconOrb}>
                  <Ionicons
                    name={house.icon}
                    size={20}
                    color="#e5e7eb"
                  />
                </View>
                <View>
                  <Text
                    style={[
                      styles.housePanelTitle,
                      { color: theme.text },
                    ]}
                  >
                    {house.label} profile buffs
                  </Text>
                  <Text
                    style={[
                      styles.housePanelSub,
                      { color: theme.subtext },
                    ]}
                  >
                    Logic, weights, and streak bias adapt to your house
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.houseBuffRow}>
              <BuffPill
                label="Focus bias"
                value={`x${house.buffs.focusMultiplier.toFixed(
                  2
                )}`}
              />
              <BuffPill
                label="Mood weight"
                value={`x${house.buffs.moodWeight.toFixed(
                  2
                )}`}
              />
            </View>
            <View style={styles.houseBuffRow}>
              <BuffPill
                label="Streak gain"
                value={`x${house.buffs.streakFocusBias.toFixed(
                  2
                )}`}
              />
              <BuffPill
                label="Planner sensitivity"
                value={`x${house.buffs.planningSensitivity.toFixed(
                  2
                )}`}
              />
            </View>
          </BlurView>

          {/* FORECAST PANEL (Neural Forecast v∞) */}
          <BlurView
            intensity={52}
            tint={theme.key === "dark" ? "dark" : "light"}
            style={styles.forecastCard}
          >
            <View style={styles.forecastHeader}>
              <View style={styles.forecastBadge}>
                <Ionicons
                  name="partly-sunny-outline"
                  size={18}
                  color="#e5e7eb"
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.forecastBadgeText,
                    { color: "#e5e7eb" },
                  ]}
                >
                  Neural Forecast v∞
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  setAiForecastText(
                    buildForecastText(metrics)
                  )
                }
              >
                <View style={styles.refreshChip}>
                  <Ionicons
                    name="refresh-outline"
                    size={16}
                    color={house.accent}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.refreshText,
                      { color: house.accent },
                    ]}
                  >
                    Regenerate
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.forecastScoreRow}>
              <View style={styles.forecastScoreBlock}>
                <Text
                  style={[
                    styles.forecastScoreLabel,
                    { color: theme.subtext },
                  ]}
                >
                  Tomorrow score
                </Text>
                <Text
                  style={[
                    styles.forecastScoreValue,
                    { color: theme.text },
                  ]}
                >
                  {Math.max(
                    40,
                    Math.min(
                      98,
                      metrics.productivityScore + 5
                    )
                  )}
                </Text>
              </View>
              <View style={styles.forecastScoreBlock}>
                <Text
                  style={[
                    styles.forecastScoreLabel,
                    { color: theme.subtext },
                  ]}
                >
                  Champion score
                </Text>
                <Text
                  style={[
                    styles.forecastScoreValue,
                    { color: theme.text },
                  ]}
                >
                  {metrics.championScore}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.forecastBody,
                { color: theme.subtext },
              ]}
            >
              {aiForecastText}
            </Text>
          </BlurView>

          {/* ALERTS */}
          <View style={{ marginTop: 18 }}>
            <Text
              style={[
                styles.sectionLabel,
                { color: theme.subtext },
              ]}
            >
              System alerts
            </Text>
            {alerts.map((alert, i) => (
              <AlertCard
                key={`${alert.title}-${i}`}
                theme={theme}
                alert={alert}
              />
            ))}
          </View>
        </Animated.View>

        {/* RECOVERY INTELLIGENCE */}
        <View style={styles.sectionHeaderRow}>
          <Text
            style={[
              styles.sectionLabel,
              { color: theme.subtext },
            ]}
          >
            Recovery Intelligence
          </Text>
          <Text
            style={[
              styles.sectionHint,
              { color: theme.subtext },
            ]}
          >
            Balancing workload, mood, and recovery loops
          </Text>
        </View>

        <BlurView
          intensity={50}
          tint={theme.key === "dark" ? "dark" : "light"}
          style={styles.recoveryCard}
        >
          <View style={styles.recoveryHeaderRow}>
            <View style={styles.recoveryScorePill}>
              <Text style={styles.recoveryScoreText}>
                {metrics.recoveryScore}
              </Text>
              <Text style={styles.recoveryScoreLabel}>
                recovery
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text
                style={[
                  styles.recoveryTitle,
                  { color: theme.text },
                ]}
              >
                {metrics.recoveryLabel}
              </Text>
              <Text
                style={[
                  styles.recoverySubtitle,
                  { color: theme.subtext },
                ]}
              >
                TMOS tracks focus load, mood signals, and planner
                density to protect your energy curve.
              </Text>
            </View>
          </View>
          <Text
            style={[
              styles.recoverySuggestion,
              { color: theme.subtext },
            ]}
          >
            {metrics.recoverySuggestion}
          </Text>
          <Text style={styles.offlineHint}>
            Offline Cognitive Cache: all analytics run locally and
            work fully offline.
          </Text>
        </BlurView>

        {/* AI TIMELINE MEMORY */}
        <View style={styles.sectionHeaderRow}>
          <Text
            style={[
              styles.sectionLabel,
              { color: theme.subtext },
            ]}
          >
            AI timeline memory
          </Text>
          <Text
            style={[
              styles.sectionHint,
              { color: theme.subtext },
            ]}
          >
            Peaks, dips, and narrative of your month
          </Text>
        </View>

        <BlurView
          intensity={50}
          tint={theme.key === "dark" ? "dark" : "light"}
          style={styles.timelineCard}
        >
          <Text
            style={[
              styles.timelineTitle,
              { color: theme.text },
            ]}
          >
            {metrics.timeline.title}
          </Text>
          <Text
            style={[
              styles.timelineBody,
              { color: theme.subtext },
            ]}
          >
            {metrics.timeline.body}
          </Text>
        </BlurView>

        {/* FUTURE WINDOW v∞ */}
        <View style={styles.sectionHeaderRow}>
          <Text
            style={[
              styles.sectionLabel,
              { color: theme.subtext },
            ]}
          >
            Future Window v∞
          </Text>
          <Text
            style={[
              styles.sectionHint,
              { color: theme.subtext },
            ]}
          >
            Predicting burnout risk, deep-work, and streak stability
          </Text>
        </View>

        <BlurView
          intensity={50}
          tint={theme.key === "dark" ? "dark" : "light"}
          style={styles.futureCard}
        >
          <View style={styles.futureRow}>
            <View style={styles.futureBadge}>
              <Ionicons
                name="warning-outline"
                size={16}
                color="#facc15"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.futureBadgeText}>
                Burnout risk:{" "}
                {metrics.futureWindow.burnoutRisk}
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.futureText,
              { color: theme.subtext },
            ]}
          >
            {metrics.futureWindow.bestDeepWorkHint}
          </Text>
          <Text
            style={[
              styles.futureText,
              { color: theme.subtext },
            ]}
          >
            {metrics.futureWindow.moodPrediction}
          </Text>
          <Text
            style={[
              styles.futureText,
              { color: theme.subtext },
            ]}
          >
            {metrics.futureWindow.consistencyPrediction}
          </Text>
          <Text
            style={[
              styles.futureText,
              { color: theme.subtext },
            ]}
          >
            {metrics.futureWindow.overloadHint}
          </Text>
        </BlurView>

        {/* IDENTITY RANK */}
        <View style={styles.sectionHeaderRow}>
          <Text
            style={[
              styles.sectionLabel,
              { color: theme.subtext },
            ]}
          >
            Identity rank
          </Text>
          <Text
            style={[
              styles.sectionHint,
              { color: theme.subtext },
            ]}
          >
            Weekly one-word identity based on your data
          </Text>
        </View>

        <BlurView
          intensity={50}
          tint={theme.key === "dark" ? "dark" : "light"}
          style={styles.identityCard}
        >
          <View style={styles.identityRow}>
            <View style={styles.identityOrb}>
              <Ionicons
                name="sparkles-outline"
                size={20}
                color="#e5e7eb"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.identityTitle,
                  { color: theme.text },
                ]}
              >
                {metrics.identityRank}
              </Text>
              <Text
                style={[
                  styles.identitySubtitle,
                  { color: theme.subtext },
                ]}
              >
                TMOS reads your focus, streak, planner, and mood
                patterns to assign a weekly identity. It updates as
                your behavior changes.
              </Text>
            </View>
          </View>
        </BlurView>

        {/* FOOTER QUOTE */}
        <View style={styles.footerQuoteWrapper}>
          <LinearGradient
            colors={["#020617", "#020617"]}
            style={styles.footerQuoteCard}
          >
            <Text style={styles.footerQuoteTitle}>
              Identity is built by streaks, not spikes.
            </Text>
            <Text style={styles.footerQuoteText}>
              Every focus block you finish, every mood check-in you
              log, and every small task you complete is a vote for
              the kind of person you're becoming. TMOS and the Digital
              School houses simply render that identity visible.
            </Text>
          </LinearGradient>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* PLASMA COMMAND PALETTE (OS-LEVEL) */}
      <Modal
        visible={commandOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCommandOpen(false)}
      >
        <View style={styles.commandBackdrop}>
          <BlurView
            intensity={70}
            tint={theme.key === "dark" ? "dark" : "light"}
            style={styles.commandCard}
          >
            <View style={styles.commandHeaderRow}>
              <Ionicons
                name="terminal-outline"
                size={20}
                color="#e5e7eb"
                style={{ marginRight: 8 }}
              />
              <Text
                style={[
                  styles.commandTitle,
                  { color: theme.text },
                ]}
              >
                Plasma Command Palette
              </Text>
            </View>
            <Text
              style={[
                styles.commandSubtitle,
                { color: theme.subtext },
              ]}
            >
              Quick OS-level commands. No AI, just smart shortcuts.
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.commandItem}
              onPress={() => handleCommand("forecast")}
            >
              <Text
                style={[
                  styles.commandItemTitle,
                  { color: theme.text },
                ]}
              >
                /forecast
              </Text>
              <Text
                style={[
                  styles.commandItemSubtitle,
                  { color: theme.subtext },
                ]}
              >
                Regenerate Neural Forecast for tomorrow.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.commandItem}
              onPress={() => handleCommand("dna")}
            >
              <Text
                style={[
                  styles.commandItemTitle,
                  { color: theme.text },
                ]}
              >
                /dna
              </Text>
              <Text
                style={[
                  styles.commandItemSubtitle,
                  { color: theme.subtext },
                ]}
              >
                Show current Habit DNA Strand and descriptor.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.commandItem}
              onPress={() => handleCommand("recovery")}
            >
              <Text
                style={[
                  styles.commandItemTitle,
                  { color: theme.text },
                ]}
              >
                /recovery
              </Text>
              <Text
                style={[
                  styles.commandItemSubtitle,
                  { color: theme.subtext },
                ]}
              >
                View Recovery Intelligence and micro-reset suggestion.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.commandItem}
              onPress={() => handleCommand("stats")}
            >
              <Text
                style={[
                  styles.commandItemTitle,
                  { color: theme.text },
                ]}
              >
                /stats
              </Text>
              <Text
                style={[
                  styles.commandItemSubtitle,
                  { color: theme.subtext },
                ]}
              >
                Quick summary of focus, tasks, champion score, and identity.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCommandOpen(false)}
              style={styles.commandCloseButton}
              activeOpacity={0.85}
            >
              <Text style={styles.commandCloseText}>
                Close
              </Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// --------------------------------------------------
// SMALL INLINE COMPONENTS
// --------------------------------------------------
function SummaryCard({ theme, icon, label, value, hint }) {
  return (
    <BlurView
      intensity={42}
      tint={theme.key === "dark" ? "dark" : "light"}
      style={styles.summaryCard}
    >
      <View style={styles.summaryIconOrb}>
        <Ionicons name={icon} size={18} color="#e5e7eb" />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.summaryLabel,
            { color: theme.subtext },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.summaryValue,
            { color: theme.text },
          ]}
        >
          {value}
        </Text>
        <Text
          style={[
            styles.summaryHint,
            { color: theme.subtext },
          ]}
        >
          {hint}
        </Text>
      </View>
    </BlurView>
  );
}

function BuffPill({ label, value }) {
  return (
    <View style={styles.buffPill}>
      <Text style={styles.buffLabel}>{label}</Text>
      <Text style={styles.buffValue}>{value}</Text>
    </View>
  );
}

function AlertCard({ theme, alert }) {
  const colors = {
    critical: "#f97316",
    high: "#fb7185",
    normal: "#38bdf8",
    positive: "#22c55e",
  };
  const accent = colors[alert.severity] || "#38bdf8";

  return (
    <BlurView
      intensity={48}
      tint={theme.key === "dark" ? "dark" : "light"}
      style={styles.alertCard}
    >
      <View style={styles.alertHeaderRow}>
        <View
          style={[
            styles.alertDot,
            { backgroundColor: accent },
          ]}
        />
        <Text
          style={[
            styles.alertTitle,
            { color: theme.text },
          ]}
        >
          {alert.title}
        </Text>
      </View>
      <Text
        style={[
          styles.alertBody,
          { color: theme.subtext },
        ]}
      >
        {alert.body}
      </Text>
    </BlurView>
  );
}

// --------------------------------------------------
// STYLES
// --------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 32,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  topRightColumn: {
    alignItems: "flex-end",
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    marginTop: 4,
    fontSize: 12,
  },

  commandButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.7)",
    backgroundColor: "rgba(15,23,42,0.96)",
    marginBottom: 8,
  },
  commandButtonText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#e5e7eb",
  },

  houseBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.96)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.6)",
  },
  houseBadgeTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#e5e7eb",
  },
  houseBadgeSub: {
    fontSize: 10,
    color: "#9ca3af",
  },

  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 6,
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionHint: {
    fontSize: 10,
    opacity: 0.8,
  },

  houseStrip: {
    flexDirection: "row",
    marginBottom: 18,
    marginTop: 4,
  },
  houseChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(30,64,175,0.4)",
    marginRight: 8,
    backgroundColor: "rgba(15,23,42,0.9)",
  },
  houseChipActive: {
    backgroundColor: "rgba(15,23,42,1)",
  },
  houseChipImage: {
    width: 26,
    height: 26,
    borderRadius: 999,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.7)",
  },
  houseChipText: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "500",
  },
  houseChipTextActive: {
    color: "#e5e7eb",
  },
  houseChipSubText: {
    fontSize: 10,
    color: "#6b7280",
  },

  // HERO
  heroWrapper: {
    borderRadius: 26,
    marginBottom: 20,
    overflow: "hidden",
  },
  heroGradientBorder: {
    borderRadius: 26,
    padding: 2,
  },
  heroBlur: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.65)",
    backgroundColor: "rgba(15,23,42,0.96)",
  },
  heroHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  heroPortraitWrapper: {
    width: 66,
    height: 66,
    borderRadius: 999,
    overflow: "hidden",
    marginRight: 12,
    position: "relative",
  },
  heroPortrait: {
    width: "100%",
    height: "100%",
  },
  heroPortraitGlow: {
    position: "absolute",
    inset: 0,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
  },

  heroTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  heroHouseTag: {
    fontSize: 11,
    opacity: 0.9,
  },
  heroScorePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
    alignItems: "center",
  },
  heroScoreLabel: {
    fontSize: 10,
    color: "#9ca3af",
  },
  heroScoreValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#e5e7eb",
    marginTop: -2,
  },
  heroBody: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  // SUMMARY GRID
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  summaryCard: {
    width: "48%",
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "rgba(15,23,42,0.9)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.5)",
  },
  summaryIconOrb: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  summaryHint: {
    fontSize: 10,
    marginTop: 2,
  },

  // DNA & CHAMPION
  dnaChampionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  dnaCard: {
    width: "48%",
    borderRadius: 18,
    padding: 12,
    backgroundColor: "rgba(15,23,42,0.9)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.5)",
  },
  dnaTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  dnaCode: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  dnaDescriptor: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 6,
  },
  dnaHint: {
    fontSize: 10,
    color: "#9ca3af",
  },

  championCard: {
    width: "48%",
    borderRadius: 18,
    padding: 12,
    backgroundColor: "rgba(15,23,42,0.9)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.5)",
  },
  championHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  championLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  championPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  championPillText: {
    fontSize: 10,
    color: "#e5e7eb",
  },
  championScoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  championScore: {
    fontSize: 28,
    fontWeight: "700",
  },
  championScoreSub: {
    fontSize: 14,
    marginLeft: 4,
  },
  championXpText: {
    fontSize: 11,
    marginTop: 4,
  },
  levelBarTrack: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    marginTop: 6,
    overflow: "hidden",
  },
  levelBarFill: {
    height: "100%",
    backgroundColor: "#6366f1",
  },
  levelHint: {
    fontSize: 10,
    marginTop: 4,
  },

  // CHARTS
  chartsColumn: {
    marginBottom: 24,
  },
  chartCard: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
    backgroundColor: "rgba(15,23,42,0.9)",
  },
  chartHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  chartSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  chartBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  chartBadgeText: {
    fontSize: 10,
  },
  chartBarsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  chartBarWrapper: {
    alignItems: "center",
    width: 32,
  },
  chartBarTrack: {
    width: 20,
    height: 130,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    position: "relative",
    justifyContent: "flex-end",
    marginBottom: 6,
  },
  chartBarGlow: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#4f46e5",
  },
  chartBarFill: {
    width: "100%",
    borderRadius: 999,
  },
  chartLabel: {
    fontSize: 10,
  },
  chartValue: {
    fontSize: 11,
    marginTop: -2,
  },

  // MOOD/STREAK STACK
  moodCard: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
    backgroundColor: "rgba(15,23,42,0.9)",
  },
  moodHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    alignItems: "center",
  },
  moodVertical: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  moodRingWrapper: {
    width: 130,
    alignItems: "center",
    justifyContent: "center",
  },
  moodRingOuter: {
    width: 120,
    height: 120,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  moodRingInner: {
    width: 92,
    height: 92,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.96)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
  },
  moodScore: {
    fontSize: 26,
    fontWeight: "700",
  },
  moodScoreLabel: {
    fontSize: 10,
  },
  moodRightBlock: {
    flex: 1,
    paddingLeft: 12,
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  streakText: {
    fontSize: 13,
  },
  streakSub: {
    fontSize: 11,
    marginTop: 2,
  },
  streakBarRow: {
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 8,
  },
  streakDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginRight: 4,
  },
  moodTrendRow: {
    flexDirection: "row",
    marginTop: 4,
    alignItems: "center",
  },
  moodTrendText: {
    fontSize: 11,
  },

  // PANELS
  panelsColumn: {
    marginBottom: 24,
  },

  // HOUSE PANEL
  housePanel: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
    backgroundColor: "rgba(15,23,42,0.9)",
    marginBottom: 12,
  },
  housePanelHeader: {
    flexDirection: "row",
    marginBottom: 10,
  },
  housePanelLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  housePanelIconOrb: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  housePanelTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  housePanelSub: {
    fontSize: 11,
    marginTop: 2,
  },
  houseBuffRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  // BUFF PILL
  buffPill: {
    width: "48%",
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
    alignItems: "center",
  },
  buffLabel: {
    fontSize: 11,
    color: "#e5e7eb",
  },
  buffValue: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2,
    color: "#e5e7eb",
  },

  // FORECAST
  forecastCard: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
    backgroundColor: "rgba(15,23,42,0.9)",
    marginBottom: 12,
  },
  forecastHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    alignItems: "center",
  },
  forecastBadge: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  forecastBadgeText: {
    fontSize: 11,
  },
  refreshChip: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  refreshText: {
    fontSize: 11,
  },
  forecastScoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  forecastScoreBlock: {
    width: "48%",
  },
  forecastScoreLabel: {
    fontSize: 11,
  },
  forecastScoreValue: {
    fontSize: 26,
    fontWeight: "700",
  },
  forecastBody: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  // ALERTS
  alertCard: {
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
    backgroundColor: "rgba(15,23,42,0.9)",
  },
  alertHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  alertDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 8,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  alertBody: {
    fontSize: 11,
    lineHeight: 16,
  },

  // RECOVERY
  recoveryCard: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
    backgroundColor: "rgba(15,23,42,0.9)",
    marginBottom: 18,
  },
  recoveryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  recoveryScorePill: {
    width: 46,
    height: 46,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  recoveryScoreText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#e5e7eb",
  },
  recoveryScoreLabel: {
    fontSize: 10,
    color: "#e5e7eb",
  },
  recoveryTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  recoverySubtitle: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  recoverySuggestion: {
    fontSize: 12,
    marginTop: 10,
    lineHeight: 18,
  },
  offlineHint: {
    fontSize: 10,
    marginTop: 8,
    opacity: 0.7,
  },

  // TIMELINE
  timelineCard: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
    backgroundColor: "rgba(15,23,42,0.9)",
    marginBottom: 18,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  timelineBody: {
    fontSize: 12,
    lineHeight: 18,
  },

  // FUTURE WINDOW
  futureCard: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
    backgroundColor: "rgba(15,23,42,0.9)",
    marginBottom: 18,
  },
  futureRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  futureBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  futureBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#facc15",
  },
  futureText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  // IDENTITY
  identityCard: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
    backgroundColor: "rgba(15,23,42,0.9)",
    marginBottom: 18,
  },
  identityRow: {
    flexDirection: "row",
  },
  identityOrb: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  identityTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  identitySubtitle: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },

  // FOOTER QUOTE
  footerQuoteWrapper: {
    marginTop: 12,
  },
  footerQuoteCard: {
    borderRadius: 20,
    padding: 16,
  },
  footerQuoteTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#f9fafb",
    marginBottom: 6,
  },
  footerQuoteText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#9ca3af",
  },

  // COMMAND PALETTE
  commandBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  commandCard: {
    width: "100%",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.5)",
    backgroundColor: "rgba(15,23,42,0.96)",
  },
  commandHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  commandTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  commandSubtitle: {
    fontSize: 11,
    marginBottom: 12,
    lineHeight: 16,
  },
  commandItem: {
    marginBottom: 12,
  },
  commandItemTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  commandItemSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  commandCloseButton: {
    marginTop: 12,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  commandCloseText: {
    fontSize: 13,
    color: "#e5e7eb",
  },
});
