import { Tabs } from "expo-router";
import { Colors } from "../../constants/Colors";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

export default function () {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.dark.tint,
        tabBarStyle: {
          backgroundColor: Colors.dark.background,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Wallet",
          tabBarIcon({ focused, color, size }) {
            return (
              <Ionicons
                name={focused ? "wallet" : "wallet-outline"}
                size={size}
                color={color}
              ></Ionicons>
            );
          },
        }}
      ></Tabs.Screen>
    </Tabs>
  );
}
