// App.js — Full Navigation Root (Onboarding → Auth → HomeTabs)
// Erudita MindFlow OS v∞

import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import AuthProvider, { useAuth } from "./src/context/AuthContext";
import ThemeProvider, { useTheme } from "./src/context/ThemeContext";

// Screens
import AuthScreen from "./src/screens/AuthScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";

import AnalyticsScreen from "./src/screens/AnalyticsScreen";
import FocusScreen from "./src/screens/FocusScreen";
import HomeScreen from "./src/screens/HomeScreen";
import NotesScreen from "./src/screens/NotesScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const DOCK_ITEMS = {
  Home: { icon: "grid-outline", label: "Home" },
  Focus: { icon: "time-outline", label: "Focus" },
  Notes: { icon: "document-text-outline", label: "Notes" },
  Analytics: { icon: "analytics-outline", label: "Analytics" },
  Profile: { icon: "person-circle-outline", label: "Profile" },
};

/* -----------------------------
   BOTTOM TABS (Dock)
------------------------------ */
function HomeTabs() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const item = DOCK_ITEMS[route.name];

        return {
          headerShown: false,
          tabBarShowLabel: true,
          tabBarStyle: {
            position: "absolute",
            bottom: 18,
            left: 24,
            right: 24,
            height: 64,
            paddingBottom: 6,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: "rgba(148,163,184,0.3)",
            backgroundColor:
              theme.key === "light"
                ? "rgba(250,250,249,0.96)"
                : "rgba(15,23,42,0.98)",

            shadowColor: "#000",
            shadowOpacity: 0.25,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 10 },
            elevation: 20,
          },

          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.dockIcon,
                focused && styles.dockIconActive,
              ]}
            >
              <Ionicons
                name={item.icon}
                size={18}
                color={focused ? "#0f172a" : "#e5e7eb"}
              />
            </View>
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              style={[
                styles.dockLabel,
                focused && styles.dockLabelActive,
              ]}
            >
              {item.label}
            </Text>
          ),
        };
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Focus" component={FocusScreen} />
      <Tab.Screen name="Notes" component={NotesScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

/* -----------------------------
   ROOT STACK NAVIGATION FLOW
------------------------------ */
function RootNavigator() {
  const { user } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState(false);

  // auto complete onboarding once opened once
  function handleFinishOnboarding() {
    setOnboardingDone(true);
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!onboardingDone ? (
        <Stack.Screen name="Onboarding">
          {(props) => (
            <OnboardingScreen
              {...props}
              onFinish={handleFinishOnboarding}
            />
          )}
        </Stack.Screen>
      ) : !user ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : (
        <Stack.Screen name="HomeTabs" component={HomeTabs} />
      )}
    </Stack.Navigator>
  );
}

/* -----------------------------
   APP WRAPPER
------------------------------ */
export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </AuthProvider>
  );
}

/* -----------------------------
   DOCK STYLES
------------------------------ */
const styles = StyleSheet.create({
  dockIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(31,41,55,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  dockIconActive: {
    backgroundColor: "#f9fafb",
  },
  dockLabel: {
    fontSize: 10,
    color: "#e5e7eb",
    marginTop: 3,
  },
  dockLabelActive: {
    color: "#0f172a",
    fontWeight: "700",
  },
});
