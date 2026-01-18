// src/context/ThemeContext.js
import { createContext, useContext, useState } from "react";

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState({
    key: "dark",
    background: "#050816",
    text: "#F9FAFB",
    subtext: "#9CA3AF",
    card: "rgba(15,23,42,0.92)",
    border: "rgba(148,163,184,0.5)",
  });

  function toggleTheme() {
    setTheme((prev) =>
      prev.key === "dark"
        ? {
            key: "light",
            background: "#ffffff",
            text: "#111827",
            subtext: "#6b7280",
            card: "#f5f5f5",
            border: "#d1d5db",
          }
        : {
            key: "dark",
            background: "#050816",
            text: "#F9FAFB",
            subtext: "#9CA3AF",
            card: "rgba(15,23,42,0.92)",
            border: "rgba(148,163,184,0.5)",
          }
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
