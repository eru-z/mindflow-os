// src/components/Button.js

import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
} from "react-native";
import { useTheme } from "../hooks/useTheme";

export default function Button({
  title,
  onPress,
  loading,
  variant = "primary",
  style,
}) {
  const { theme } = useTheme();

  const backgroundColor =
    variant === "primary" ? theme.accent || "#8b5cf6" : "transparent";
  const textColor = variant === "primary" ? "#0b0218" : theme.text;
  const borderColor = variant === "outline" ? theme.border : "transparent";

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor, borderColor, borderWidth: borderColor ? 1 : 0 },
        style,
      ]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.86}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "700",
    fontSize: 15,
  },
});
