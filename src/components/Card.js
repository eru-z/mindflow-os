// src/components/Card.js

import { StyleSheet, View } from "react-native";
import { useTheme } from "../hooks/useTheme";

export default function Card({ children, style }) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
});
