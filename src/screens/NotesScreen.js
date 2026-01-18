// src/screens/NotesScreen.js
// MindFlow OS — NotesScreen GOD v∞ (Erudita Ultra Fusion • Speedsters Core)

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { useTheme } from "../context/ThemeContext";

const STORAGE_KEY = "@mindflow_notes";

// Ultra Fusion Note Colors
const NOTE_COLORS = [
  { key: "speedster", label: "Speedsters", color: "#facc15" }, // main
  { key: "plasmaBlue", label: "Plasma Blue", color: "#38bdf8" },
  { key: "neoPurple", label: "Neo Purple", color: "#a855f7" },
  { key: "champagne", label: "Champagne", color: "#fbbf24" },
  { key: "noir", label: "Noir", color: "#0f172a" },
];

const DEFAULT_TAG_SUGGESTIONS = [
  "#school",
  "#project",
  "#idea",
  "#urgent",
  "#personal",
  "#speedsters",
];

// -----------------------------------------------------
// STREAK HELPER
// -----------------------------------------------------
function computeStreak(notes) {
  if (!notes || notes.length === 0) return 0;

  const daysSet = new Set(
    notes.map((n) => new Date(n.createdAt).toISOString().slice(0, 10))
  );

  const today = new Date();
  let streak = 0;

  while (true) {
    const d = new Date(today);
    d.setDate(today.getDate() - streak);
    const key = d.toISOString().slice(0, 10);
    if (daysSet.has(key)) streak += 1;
    else break;
  }

  return streak;
}

// -----------------------------------------------------
// OFFLINE "AI" HELPERS
// -----------------------------------------------------
function summarizeText(text) {
  if (!text) return "";
  if (text.length <= 220) return text;
  let trimmed = text.slice(0, 220);
  const lastSpace = trimmed.lastIndexOf(" ");
  if (lastSpace > 0) trimmed = trimmed.slice(0, lastSpace);
  return trimmed + "…";
}

function toBulletList(text) {
  if (!text.trim()) return "";
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  return lines.map((l) => "• " + l).join("\n");
}

function shortenText(text) {
  if (!text) return "";
  const sentences = text.split(/([.!?])\s+/);
  if (sentences.length <= 2) return text;
  return sentences.slice(0, 4).join(" ").trim() + "…";
}

// -----------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------
export default function NotesScreen() {
  const { theme } = useTheme();

  const [notes, setNotes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedColor, setSelectedColor] = useState("speedster");
  const [tagsInput, setTagsInput] = useState("");
  const [pinned, setPinned] = useState(false);

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("recent");
  const [filterTag, setFilterTag] = useState(null);
  const [filterColor, setFilterColor] = useState(null);

  const [streak, setStreak] = useState(0);
  const [todayCount, setTodayCount] = useState(0);

  // LOAD NOTES
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setNotes(Array.isArray(parsed) ? parsed : []);
        }
      } catch (e) {
        console.log("Failed to load notes", e);
      }
    })();
  }, []);

  // SAVE NOTES + STREAK/TODAY
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes)).catch(() => {});

    const s = computeStreak(notes);
    setStreak(s);

    const todayKey = new Date().toISOString().slice(0, 10);
    const todayNotes = notes.filter(
      (n) => new Date(n.createdAt).toISOString().slice(0, 10) === todayKey
    );
    setTodayCount(todayNotes.length);
  }, [notes]);

  // FILTER + SEARCH + SORT
  const processedNotes = useMemo(() => {
    let out = [...notes];

    if (filterTag) {
      out = out.filter((n) =>
        (n.tags || []).some((t) =>
          t.toLowerCase().includes(filterTag.toLowerCase())
        )
      );
    }

    if (filterColor) {
      out = out.filter((n) => n.colorKey === filterColor);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter((n) => {
        const tagsJoined = (n.tags || []).join(" ").toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          (n.content || "").toLowerCase().includes(q) ||
          tagsJoined.includes(q)
        );
      });
    }

    out.sort((a, b) => {
      if (sortKey === "az") return a.title.localeCompare(b.title);
      if (sortKey === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortKey === "color")
        return (a.colorKey || "").localeCompare(b.colorKey || "");
      if (sortKey === "pinned") {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      // recent
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return out;
  }, [notes, filterTag, filterColor, search, sortKey]);

  const pinnedNotes = processedNotes.filter((n) => n.pinned);
  const otherNotes = processedNotes.filter((n) => !n.pinned);
  const orderedNotes = [...pinnedNotes, ...otherNotes];

  const col1 = orderedNotes.filter((_, i) => i % 2 === 0);
  const col2 = orderedNotes.filter((_, i) => i % 2 !== 0);

  // -----------------------------------------------------
  // CRUD
  // -----------------------------------------------------
  function openNew() {
    setEditing(null);
    setTitle("");
    setContent("");
    setTagsInput("");
    setPinned(false);
    setSelectedColor("speedster");
    setModalVisible(true);
  }

  function openEdit(note) {
    setEditing(note);
    setTitle(note.title);
    setContent(note.content || "");
    setTagsInput((note.tags || []).join(" "));
    setPinned(!!note.pinned);
    setSelectedColor(note.colorKey || "speedster");
    setModalVisible(true);
  }

  function extractTags(raw) {
    if (!raw.trim()) return [];
    const parts = raw
      .split(/[\s,]+/)
      .map((p) => p.trim())
      .filter(Boolean);

    return Array.from(
      new Set(
        parts.map((t) =>
          t.startsWith("#") ? t.toLowerCase() : "#" + t.toLowerCase()
        )
      )
    );
  }

  function saveNote() {
    if (!title.trim()) {
      Alert.alert("Missing title", "Note title cannot be empty.");
      return;
    }

    const now = new Date().toISOString();
    const tags = extractTags(tagsInput);

    if (editing) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editing.id
            ? {
                ...n,
                title: title.trim(),
                content: content.trim(),
                colorKey: selectedColor,
                tags,
                pinned,
                updatedAt: now,
              }
            : n
        )
      );
    } else {
      const newNote = {
        id: Date.now().toString(),
        title: title.trim(),
        content: content.trim(),
        colorKey: selectedColor,
        tags,
        pinned,
        createdAt: now,
        updatedAt: now,
      };
      setNotes((prev) => [newNote, ...prev]);
    }

    setModalVisible(false);
  }

  function deleteNote(id) {
    Alert.alert("Delete note?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: () =>
          setNotes((prev) => prev.filter((n) => n.id !== id)),
        style: "destructive",
      },
    ]);
  }

  function togglePin(note) {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === note.id ? { ...n, pinned: !n.pinned } : n
      )
    );
  }

  function duplicateNote(note) {
    const now = new Date().toISOString();
    const clone = {
      ...note,
      id: Date.now().toString(),
      title: note.title + " (copy)",
      createdAt: now,
      updatedAt: now,
    };
    setNotes((prev) => [clone, ...prev]);
  }

  // -----------------------------------------------------
  // AI ACTIONS
  // -----------------------------------------------------
  function handleSummarize() {
    if (content.trim()) setContent(summarizeText(content));
  }

  function handleMakeList() {
    if (content.trim()) setContent(toBulletList(content));
  }

  function handleShorten() {
    if (content.trim()) setContent(shortenText(content));
  }

  // -----------------------------------------------------
  // UI
  // -----------------------------------------------------
  return (
    <LinearGradient
      colors={["#020617", "#020617", "#050816"]}
      style={{ flex: 1 }}
    >
      {/* Plasma background accents */}
      <View style={styles.plasmaOrbTop} />
      <View style={styles.plasmaOrbBottom} />

      {/* MAIN CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* HEADER HERO */}
        <View style={styles.headerWrapper}>
          <BlurView intensity={60} tint="dark" style={styles.heroCardBlur}>
            <LinearGradient
              colors={["rgba(250,204,21,0.16)", "rgba(56,189,248,0.08)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroLeft}>
                <View style={styles.heroHousePill}>
                  <Ionicons
                    name="flash-outline"
                    size={16}
                    color="#facc15"
                  />
                  <Text style={styles.heroHouseText}>Speedsters House</Text>
                </View>
                <Text style={styles.heroTitle}>Ultra Fusion Notes</Text>
                <Text style={styles.heroSubtitle}>
                  Capture lightning ideas, class summaries and brain dumps in a
                  Speedster-grade workspace.
                </Text>

                <View style={styles.heroMetricsRow}>
                  <View style={styles.metricPill}>
                    <Text style={styles.metricLabel}>Streak</Text>
                    <Text style={styles.metricValue}>
                      {streak > 0 ? `${streak} days` : "0 days"}
                    </Text>
                  </View>
                  <View style={styles.metricPill}>
                    <Text style={styles.metricLabel}>Today</Text>
                    <Text style={styles.metricValue}>
                      {todayCount} note{todayCount === 1 ? "" : "s"}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.heroRight}>
                <View style={styles.heroOrbOuter}>
                  <View style={styles.heroOrbInner}>
                    <Ionicons
                      name="sparkles-outline"
                      size={26}
                      color="#facc15"
                    />
                  </View>
                  <View style={styles.heroOrbRing} />
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </View>

        {/* TOOLBAR */}
        <View style={styles.toolbar}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#9ca3af" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search notes, tags, classes…"
              placeholderTextColor="#6b7280"
              style={styles.searchInput}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color="#6b7280"
                />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 6 }}
          >
            {["recent", "pinned", "az", "oldest", "color"].map((key) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.sortPill,
                  sortKey === key && styles.sortPillActive,
                ]}
                onPress={() => setSortKey(key)}
              >
                <Text
                  style={[
                    styles.sortPillText,
                    sortKey === key && styles.sortPillTextActive,
                  ]}
                >
                  {key === "recent"
                    ? "Recent"
                    : key === "pinned"
                    ? "Pinned"
                    : key === "az"
                    ? "A–Z"
                    : key === "oldest"
                    ? "Oldest"
                    : "Color"}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* TAG + COLOR FILTERS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsRow}
        >
          <TouchableOpacity
            style={[
              styles.tagChip,
              !filterTag && !filterColor && styles.tagChipActive,
            ]}
            onPress={() => {
              setFilterTag(null);
              setFilterColor(null);
            }}
          >
            <Text
              style={[
                styles.tagChipText,
                !filterTag && !filterColor && styles.tagChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {DEFAULT_TAG_SUGGESTIONS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.tagChip,
                filterTag === t && styles.tagChipActive,
              ]}
              onPress={() => {
                setFilterTag(filterTag === t ? null : t);
                setFilterColor(null);
              }}
            >
              <Text
                style={[
                  styles.tagChipText,
                  filterTag === t && styles.tagChipTextActive,
                ]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}

          {NOTE_COLORS.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[
                styles.colorDotChip,
                filterColor === c.key && styles.colorDotChipActive,
              ]}
              onPress={() => {
                setFilterColor(filterColor === c.key ? null : c.key);
                setFilterTag(null);
              }}
            >
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: c.color },
                ]}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* GRID */}
        <View style={{ paddingHorizontal: 16 }}>
          {orderedNotes.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyCard}
              onPress={openNew}
              activeOpacity={0.9}
            >
              <Ionicons
                name="sparkles-outline"
                size={22}
                color="#a5b4fc"
                style={{ marginBottom: 6 }}
              />
              <Text style={styles.emptyTitle}>No notes yet</Text>
              <Text style={styles.emptyText}>
                Tap to drop your first Speedster thought into Ultra Fusion OS.
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.masonry}>
              {/* Column 1 */}
              <View style={styles.column}>
                {col1.map((n, i) => {
                  const colorDef =
                    NOTE_COLORS.find((c) => c.key === n.colorKey) ||
                    NOTE_COLORS[0];

                  return (
                    <BlurView
                      key={n.id}
                      intensity={38}
                      tint="dark"
                      style={styles.noteBlurWrapper}
                    >
                      <TouchableOpacity
                        style={[
                          styles.noteCard,
                          {
                            borderColor: colorDef.color + "55",
                          },
                          i % 2 === 0 && { minHeight: 140 },
                        ]}
                        activeOpacity={0.92}
                        onPress={() => openEdit(n)}
                        onLongPress={() =>
                          Alert.alert("Note actions", n.title, [
                            {
                              text: n.pinned ? "Unpin" : "Pin",
                              onPress: () => togglePin(n),
                            },
                            {
                              text: "Duplicate",
                              onPress: () => duplicateNote(n),
                            },
                            {
                              text: "Delete",
                              style: "destructive",
                              onPress: () => deleteNote(n.id),
                            },
                            { text: "Cancel", style: "cancel" },
                          ])
                        }
                      >
                        <View style={styles.noteHeaderRow}>
                          <View style={styles.noteTitleRow}>
                            <View
                              style={[
                                styles.noteAccentDot,
                                { backgroundColor: colorDef.color },
                              ]}
                            />
                            <Text
                              style={[
                                styles.noteTitle,
                                { color: colorDef.color },
                              ]}
                              numberOfLines={1}
                            >
                              {n.title}
                            </Text>
                          </View>
                          {n.pinned && (
                            <Ionicons
                              name="star"
                              size={14}
                              color="#facc15"
                              style={styles.pinIcon}
                            />
                          )}
                        </View>

                        <Text
                          style={styles.noteContent}
                          numberOfLines={7}
                        >
                          {n.content || "Empty note"}
                        </Text>

                        <View style={styles.noteFooterRow}>
                          <Text style={styles.noteDate}>
                            {new Date(n.createdAt).toLocaleDateString()}
                          </Text>
                          <View style={styles.tagsMiniRow}>
                            {(n.tags || []).slice(0, 2).map((t) => (
                              <View style={styles.tagMini} key={t}>
                                <Text style={styles.tagMiniText}>{t}</Text>
                              </View>
                            ))}
                            {n.tags && n.tags.length > 2 && (
                              <Text style={styles.moreTagsText}>
                                +{n.tags.length - 2}
                              </Text>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    </BlurView>
                  );
                })}
              </View>

              {/* Column 2 */}
              <View style={styles.column}>
                {col2.map((n, i) => {
                  const colorDef =
                    NOTE_COLORS.find((c) => c.key === n.colorKey) ||
                    NOTE_COLORS[0];

                  return (
                    <BlurView
                      key={n.id}
                      intensity={38}
                      tint="dark"
                      style={styles.noteBlurWrapper}
                    >
                      <TouchableOpacity
                        style={[
                          styles.noteCard,
                          {
                            borderColor: colorDef.color + "55",
                          },
                          i % 2 === 0 && { minHeight: 160 },
                        ]}
                        activeOpacity={0.92}
                        onPress={() => openEdit(n)}
                        onLongPress={() =>
                          Alert.alert("Note actions", n.title, [
                            {
                              text: n.pinned ? "Unpin" : "Pin",
                              onPress: () => togglePin(n),
                            },
                            {
                              text: "Duplicate",
                              onPress: () => duplicateNote(n),
                            },
                            {
                              text: "Delete",
                              style: "destructive",
                              onPress: () => deleteNote(n.id),
                            },
                            { text: "Cancel", style: "cancel" },
                          ])
                        }
                      >
                        <View style={styles.noteHeaderRow}>
                          <View style={styles.noteTitleRow}>
                            <View
                              style={[
                                styles.noteAccentDot,
                                { backgroundColor: colorDef.color },
                              ]}
                            />
                            <Text
                              style={[
                                styles.noteTitle,
                                { color: colorDef.color },
                              ]}
                              numberOfLines={1}
                            >
                              {n.title}
                            </Text>
                          </View>
                          {n.pinned && (
                            <Ionicons
                              name="star"
                              size={14}
                              color="#facc15"
                              style={styles.pinIcon}
                            />
                          )}
                        </View>

                        <Text
                          style={styles.noteContent}
                          numberOfLines={7}
                        >
                          {n.content || "Empty note"}
                        </Text>

                        <View style={styles.noteFooterRow}>
                          <Text style={styles.noteDate}>
                            {new Date(n.createdAt).toLocaleDateString()}
                          </Text>
                          <View style={styles.tagsMiniRow}>
                            {(n.tags || []).slice(0, 2).map((t) => (
                              <View style={styles.tagMini} key={t}>
                                <Text style={styles.tagMiniText}>{t}</Text>
                              </View>
                            ))}
                            {n.tags && n.tags.length > 2 && (
                              <Text style={styles.moreTagsText}>
                                +{n.tags.length - 2}
                              </Text>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    </BlurView>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FLOATING ACTION ORB */}
      <View style={styles.fabContainer}>
        <LinearGradient
          colors={["#facc15", "#fbbf24"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGlow}
        >
          <TouchableOpacity
            style={styles.fab}
            onPress={openNew}
            activeOpacity={0.9}
          >
            <Ionicons name="add" size={26} color="#0f172a" />
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <BlurView intensity={70} tint="dark" style={styles.modalBlur}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalBadge}>
                    {editing ? "Edit note" : "New note"}
                  </Text>
                  <Text style={styles.modalTitle}>
                    {editing
                      ? "Refine your fusion"
                      : "Capture a Speedster thought"}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.pinToggle,
                    pinned && styles.pinToggleActive,
                  ]}
                  onPress={() => setPinned((p) => !p)}
                >
                  <Ionicons
                    name={pinned ? "star" : "star-outline"}
                    size={18}
                    color={pinned ? "#facc15" : "#9ca3af"}
                  />
                </TouchableOpacity>
              </View>

              {/* Title */}
              <TextInput
                placeholder="Note title"
                placeholderTextColor="#64748b"
                style={styles.inputTitle}
                value={title}
                onChangeText={setTitle}
              />

              {/* Content */}
              <TextInput
                placeholder="Type your idea, class notes, or brain dump…"
                placeholderTextColor="#64748b"
                style={styles.inputContent}
                value={content}
                onChangeText={setContent}
                multiline
              />

              {/* Color selector */}
              <View style={styles.sectionRow}>
                <Text style={styles.sectionLabel}>Color</Text>
                <View style={styles.colorRow}>
                  {NOTE_COLORS.map((c) => (
                    <TouchableOpacity
                      key={c.key}
                      style={[
                        styles.colorPickerDot,
                        { backgroundColor: c.color },
                        selectedColor === c.key &&
                          styles.colorPickerDotActive,
                      ]}
                      onPress={() => setSelectedColor(c.key)}
                    />
                  ))}
                </View>
              </View>

              {/* Tags */}
              <View style={styles.sectionRow}>
                <Text style={styles.sectionLabel}>Tags</Text>
                <TextInput
                  placeholder="Add tags like #school #project #speedsters"
                  placeholderTextColor="#64748b"
                  style={styles.inputTags}
                  value={tagsInput}
                  onChangeText={setTagsInput}
                />
              </View>

              {/* Quick tag suggestions */}
              <View style={styles.tagsSuggestRow}>
                {DEFAULT_TAG_SUGGESTIONS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={styles.tagSuggestChip}
                    onPress={() =>
                      setTagsInput((prev) =>
                        prev.includes(t) ? prev : (prev + " " + t).trim()
                      )
                    }
                  >
                    <Text style={styles.tagSuggestText}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* AI Actions */}
              <View style={styles.aiRow}>
                <Text style={styles.sectionLabel}>MindFlow AI (offline)</Text>
                <View style={styles.aiButtonsRow}>
                  <TouchableOpacity
                    style={styles.aiPill}
                    onPress={handleSummarize}
                  >
                    <Ionicons
                      name="sparkles-outline"
                      size={14}
                      color="#e5e7eb"
                    />
                    <Text style={styles.aiPillText}>Summarize</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.aiPill}
                    onPress={handleShorten}
                  >
                    <Ionicons
                      name="cut-outline"
                      size={14}
                      color="#e5e7eb"
                    />
                    <Text style={styles.aiPillText}>Shorter</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.aiPill}
                    onPress={handleMakeList}
                  >
                    <Ionicons
                      name="list-outline"
                      size={14}
                      color="#e5e7eb"
                    />
                    <Text style={styles.aiPillText}>Bullet list</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* ACTION BUTTONS */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={saveNote}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveText}>
                    {editing ? "Save changes" : "Save note"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// -----------------------------------------------------
// STYLES
// -----------------------------------------------------
const styles = StyleSheet.create({
  plasmaOrbTop: {
    position: "absolute",
    top: -120,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(250,204,21,0.12)",
  },
  plasmaOrbBottom: {
    position: "absolute",
    bottom: -140,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(59,130,246,0.10)",
  },

  headerWrapper: {
    paddingHorizontal: 18,
    paddingTop: 48,
    paddingBottom: 10,
  },
  heroCardBlur: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
  },
  heroCard: {
    borderRadius: 28,
    padding: 18,
    flexDirection: "row",
  },
  heroLeft: {
    flex: 1.3,
    gap: 6,
  },
  heroRight: {
    flex: 0.8,
    alignItems: "center",
    justifyContent: "center",
  },
  heroHousePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.9)",
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.4)",
    gap: 6,
  },
  heroHouseText: {
    fontSize: 11,
    color: "#e5e7eb",
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f9fafb",
    marginTop: 6,
  },
  heroSubtitle: {
    fontSize: 12,
    color: "#cbd5f5",
    marginTop: 2,
  },
  heroMetricsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  metricPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.9)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.5)",
  },
  metricLabel: {
    fontSize: 10,
    color: "#9ca3af",
  },
  metricValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#e5e7eb",
  },

  heroOrbOuter: {
    width: 80,
    height: 80,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.5)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  heroOrbInner: {
    width: 60,
    height: 60,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.96)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroOrbRing: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.25)",
    opacity: 0.8,
  },

  // TOOLBAR
  toolbar: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.92)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1f2937",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: "#e5e7eb",
    fontSize: 13,
  },
  sortPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1f2937",
    marginRight: 8,
    marginTop: 8,
  },
  sortPillActive: {
    backgroundColor: "rgba(250,204,21,0.12)",
    borderColor: "#facc15",
  },
  sortPillText: {
    fontSize: 11,
    color: "#9ca3af",
  },
  sortPillTextActive: {
    color: "#facc15",
    fontWeight: "600",
  },

  // TAG FILTERS
  tagsRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1f2937",
    marginRight: 6,
    backgroundColor: "rgba(15,23,42,0.9)",
  },
  tagChipActive: {
    borderColor: "#facc15",
    backgroundColor: "rgba(250,204,21,0.1)",
  },
  tagChipText: {
    fontSize: 11,
    color: "#9ca3af",
  },
  tagChipTextActive: {
    color: "#facc15",
    fontWeight: "600",
  },

  colorDotChip: {
    width: 26,
    height: 26,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1f2937",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  colorDotChipActive: {
    borderColor: "#facc15",
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
  },

  // EMPTY
  emptyCard: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: "rgba(15,23,42,0.96)",
    borderWidth: 1,
    borderColor: "#1f2937",
    alignItems: "center",
    marginTop: 24,
  },
  emptyTitle: {
    color: "#e5e7eb",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 12,
    textAlign: "center",
  },

  // GRID
  masonry: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    paddingBottom: 20,
  },
  column: {
    flex: 1,
    gap: 10,
  },
  noteBlurWrapper: {
    borderRadius: 18,
    overflow: "hidden",
  },
  noteCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: "rgba(15,23,42,0.96)",
    borderWidth: 1,
  },
  noteHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  noteTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 6,
  },
  noteAccentDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  noteTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  pinIcon: {
    marginLeft: 6,
  },
  noteContent: {
    color: "#e5e7eb",
    fontSize: 12,
    lineHeight: 18,
  },
  noteFooterRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  noteDate: {
    fontSize: 10,
    color: "#64748b",
  },
  tagsMiniRow: {
    flexDirection: "row",
    marginLeft: "auto",
    alignItems: "center",
    gap: 4,
  },
  tagMini: {
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "rgba(15,23,42,0.92)",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  tagMiniText: {
    fontSize: 9,
    color: "#9ca3af",
  },
  moreTagsText: {
    fontSize: 9,
    color: "#9ca3af",
  },

  // FAB
fabContainer: {
  position: "absolute",
  right: 22,
  top: 180, // <- sits over hero card
  zIndex: 999,
},

  fabGlow: {
    padding: 3,
    borderRadius: 999,
    shadowColor: "#facc15",
    shadowOpacity: 0.9,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "#facc15",
    justifyContent: "center",
    alignItems: "center",
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "#0009",
    justifyContent: "center",
    padding: 20,
  },
  modalBlur: {
    borderRadius: 28,
    overflow: "hidden",
  },
  modalCard: {
    backgroundColor: "rgba(15,23,42,0.96)",
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  modalBadge: {
    fontSize: 11,
    color: "#a5b4fc",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  modalTitle: {
    color: "#f9fafb",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  pinToggle: {
    marginLeft: "auto",
    padding: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  pinToggleActive: {
    backgroundColor: "rgba(250,204,21,0.12)",
    borderColor: "#facc15",
  },

  inputTitle: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#f9fafb",
    fontSize: 14,
    marginTop: 6,
    marginBottom: 8,
  },
  inputContent: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#e5e7eb",
    fontSize: 13,
    minHeight: 120,
    textAlignVertical: "top",
  },

  sectionRow: {
    marginTop: 10,
  },
  sectionLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 4,
  },
  colorRow: {
    flexDirection: "row",
    gap: 8,
  },
  colorPickerDot: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorPickerDotActive: {
    borderColor: "#facc15",
  },

  inputTags: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    color: "#e5e7eb",
    fontSize: 12,
  },

  tagsSuggestRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  tagSuggestChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1f2937",
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(15,23,42,0.95)",
  },
  tagSuggestText: {
    fontSize: 11,
    color: "#9ca3af",
  },

  aiRow: {
    marginTop: 14,
  },
  aiButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  aiPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1f2937",
    backgroundColor: "rgba(15,23,42,0.95)",
  },
  aiPillText: {
    fontSize: 11,
    color: "#e5e7eb",
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cancelText: {
    color: "#9ca3af",
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: "#facc15",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  saveText: {
    color: "#0f172a",
    fontWeight: "600",
    fontSize: 13,
  },
});
