// src/services/storage.js

import AsyncStorage from "@react-native-async-storage/async-storage";

export async function setItem(key, value) {
  try {
    const toStore = JSON.stringify(value);
    await AsyncStorage.setItem(key, toStore);
  } catch (e) {
    console.log("AsyncStorage setItem error:", e);
  }
}

export async function getItem(key) {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value == null) return null;
    return JSON.parse(value);
  } catch (e) {
    console.log("AsyncStorage getItem error:", e);
    return null;
  }
}

export async function removeItem(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.log("AsyncStorage removeItem error:", e);
  }
}
