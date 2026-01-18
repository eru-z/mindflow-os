// src/screens/TasksScreen.js
// MindFlow OS — TasksScreen v∞ (Erudita Ultra Plasma)

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
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

const STORAGE_KEY = "@mindflow_tasks";

export default function TasksScreen() {
  const { theme } = useTheme();

  const [tasks, setTasks] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [category, setCategory] = useState("");

  // --------------------------------------------------
  // LOAD TASKS
  // --------------------------------------------------
  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setTasks(JSON.parse(raw));
    })();
  }, []);

  // SAVE
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  // --------------------------------------------------
  // CRUD
  // --------------------------------------------------
  function openNew() {
    setEditing(null);
    setTitle("");
    setCategory("");
    setPriority("Medium");
    setModalVisible(true);
  }

  function openEdit(task) {
    setEditing(task);
    setTitle(task.title);
    setPriority(task.priority);
    setCategory(task.category || "");
    setModalVisible(true);
  }

  function saveTask() {
    if (!title.trim()) {
      Alert.alert("Missing title", "Task title cannot be empty.");
      return;
    }

    if (editing) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editing.id
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
      const newTask = {
        id: Date.now().toString(),
        title: title.trim(),
        category: category.trim(),
        priority,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
    }
    setModalVisible(false);
  }

  function toggleCompleted(id) {
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

  // --------------------------------------------------
  return (
    <LinearGradient
      colors={["#020617", "#050816", "#020617"]}
      style={{ flex: 1 }}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tasks</Text>

        <TouchableOpacity style={styles.newButton} onPress={openNew}>
          <Ionicons name="add" size={26} color="#f9fafb" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {tasks.length === 0 ? (
          <Text style={styles.empty}>No tasks yet. Create one.</Text>
        ) : (
          tasks.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.card,
                { borderColor: t.completed ? "#6366f1" : "#1f2937" },
                t.completed && { opacity: 0.7 },
              ]}
              onPress={() => toggleCompleted(t.id)}
              onLongPress={() => openEdit(t)}
            >
              <View style={styles.cardRow}>
                <Ionicons
                  name={
                    t.completed ? "checkmark-circle" : "ellipse-outline"
                  }
                  size={20}
                  color={t.completed ? "#a855f7" : "#a5b4fc"}
                />
                <Text
                  style={[
                    styles.cardTitle,
                    t.completed && { textDecorationLine: "line-through" },
                  ]}
                >
                  {t.title}
                </Text>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.tag}>{t.category}</Text>

                <View style={styles.priority(t.priority)}>
                  <Text style={styles.priorityText}>{t.priority}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => deleteTask(t.id)}
                  style={{ marginLeft: "auto" }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color="#f87171"
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editing ? "Edit task" : "New task"}
            </Text>

            <TextInput
              placeholder="Task title"
              placeholderTextColor="#94a3b8"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />

            <TextInput
              placeholder="Category (optional)"
              placeholderTextColor="#94a3b8"
              value={category}
              onChangeText={setCategory}
              style={styles.input}
            />

            <View style={styles.priorityRow}>
              {["High", "Medium", "Low"].map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPriority(p)}
                  style={[
                    styles.priorityChip,
                    p === priority && styles.priorityChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityChipText,
                      p === priority && styles.priorityChipTextActive,
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={saveTask}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// --------------------------------------------------
// STYLES
// --------------------------------------------------
const styles = StyleSheet.create({
  header: {
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    color: "#f9fafb",
    fontSize: 22,
    fontWeight: "700",
  },
  newButton: { marginLeft: "auto" },

  empty: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
    marginTop: 40,
  },

  card: {
    padding: 14,
    borderWidth: 1,
    borderRadius: 18,
    backgroundColor: "rgba(15,23,42,0.97)",
    marginBottom: 14,
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardTitle: { color: "#f9fafb", fontSize: 15, fontWeight: "600" },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  tag: { color: "#94a3b8", fontSize: 12 },

  priority: (p) => ({
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor:
      p === "High"
        ? "rgba(220,38,38,0.3)"
        : p === "Medium"
        ? "rgba(234,179,8,0.25)"
        : "rgba(16,185,129,0.25)",
  }),
  priorityText: {
    color: "#f9fafb",
    fontSize: 11,
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "#0008",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#020617",
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  modalTitle: {
    color: "#f9fafb",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 14,
    padding: 10,
    color: "#f9fafb",
    marginBottom: 12,
  },

  priorityRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  priorityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#334155",
  },
  priorityChipActive: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  priorityChipText: { color: "#e2e8f0", fontSize: 12 },
  priorityChipTextActive: { color: "#fff", fontWeight: "600" },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelText: { color: "#94a3b8" },

  saveBtn: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  saveText: { color: "#fff", fontWeight: "600" },
});
