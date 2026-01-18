// src/api.js — MindFlow API Wrapper v∞

import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_KEY = "@mindflow_user";

const API = {
  async saveUser(user) {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  async getStoredUser() {
    const json = await AsyncStorage.getItem(USER_KEY);
    return json ? JSON.parse(json) : null;
  },

  async clearUser() {
    await AsyncStorage.removeItem(USER_KEY);
  },

  async getAiSuggestion(payload) {
    // LOCAL MOCK (safe for hackathons)
    const { tasks, focusToday, notes } = payload;
    const unfinished = tasks.filter((t) => !t.completed).length;

    if (unfinished > 5) {
      return "Try reducing clutter by finishing 1–2 small tasks to build momentum.";
    }

    if (focusToday < 40) {
      return "Your focus is still warming up today. A single 25-minute session can unlock flow.";
    }

    if (notes.length === 0) {
      return "Capture one thought or idea in your notes to clear your mind.";
    }

    return "You're balanced today. Stay in flow, prioritize your key task, and keep the streak going.";
  },
};

export default API;
