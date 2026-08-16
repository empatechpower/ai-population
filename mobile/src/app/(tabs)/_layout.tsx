import { Tabs } from "expo-router/js-tabs";
import { Home, Apple, Zap, Users } from "lucide-react-native";
import Svg, { Circle, Path } from "react-native-svg";

const GOLD = "#D4B06A";
const MUTED = "#9A9094";

function JourneyIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Circle cx={4} cy={18} r={1.8} stroke={color} strokeWidth={1.7} />
      <Circle cx={11} cy={11} r={1.8} stroke={color} strokeWidth={1.7} />
      <Circle cx={18} cy={4} r={1.8} stroke={color} strokeWidth={1.7} />
      <Path
        d="M5.5 16.6 C7.2 14 9.2 12.4 9.4 12.8"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <Path
        d="M12.6 9.8 C14.3 7.4 16.4 5.5 16.6 5.8"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: GOLD,
        tabBarInactiveTintColor: MUTED,
        tabBarStyle: { backgroundColor: "#F9F6F1", borderTopColor: "rgba(180,155,120,0.18)" },
        tabBarLabelStyle: { fontSize: 10, letterSpacing: 0.2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Today", tabBarIcon: ({ color }) => <Home size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: "Journey",
          tabBarIcon: ({ color }) => <JourneyIcon color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{ title: "Nutrition", tabBarIcon: ({ color }) => <Apple size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="movement"
        options={{ title: "Movement", tabBarIcon: ({ color }) => <Zap size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="community"
        options={{ title: "Community", tabBarIcon: ({ color }) => <Users size={22} color={color} /> }}
      />
    </Tabs>
  );
}
