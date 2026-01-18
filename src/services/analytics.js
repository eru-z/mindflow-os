// src/services/analytics.js

// Lightweight mock analytics layer for hackathon demo.

export async function logEvent(name, params = {}) {
  // In a real app this would send to an analytics service.
  console.log("[Analytics]", name, params);
}

export async function logScreenView(screenName) {
  return logEvent("screen_view", { screenName });
}

export async function logFocusSession(durationSeconds) {
  return logEvent("focus_session", { durationSeconds });
}
