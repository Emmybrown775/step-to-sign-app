import {
  SafeAreaView,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { ThemedText } from "../../components/ThemedText";
import { Colors } from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useAuthContext } from "../../providers/AuthProvider";
import { router } from "expo-router";

export default function Settings() {
  const { user } = useAuthContext();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
      },
    ]);
  };

  const settingsItems = [
    {
      title: "Train Model",
      subtitle: "Collect data and train your personal model",
      icon: "bulb-outline",
      onPress: () => router.navigate("/train_model"),
      color: Colors.dark.primary,
    },
    {
      title: "Security",
      subtitle: "Manage your account security",
      icon: "shield-checkmark-outline",
      onPress: () => {
        // Navigate to security settings
      },
      color: "#4CAF50",
    },
    {
      title: "Notifications",
      subtitle: "Configure notification preferences",
      icon: "notifications-outline",
      onPress: () => {
        // Navigate to notification settings
      },
      color: "#FF9800",
    },
    {
      title: "Privacy",
      subtitle: "Data and privacy settings",
      icon: "eye-off-outline",
      onPress: () => {
        // Navigate to privacy settings
      },
      color: "#9C27B0",
    },
    {
      title: "Help & Support",
      subtitle: "Get help and contact support",
      icon: "help-circle-outline",
      onPress: () => {
        // Navigate to help
      },
      color: "#2196F3",
    },
    {
      title: "About",
      subtitle: "App version and information",
      icon: "information-circle-outline",
      onPress: () => {
        // Navigate to about
      },
      color: "#607D8B",
    },
  ];

  return (
    <SafeAreaView
      className="flex-1 pt-16 px-5"
      style={{ backgroundColor: Colors.dark.background }}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-8">
          <TouchableOpacity
            className="px-3 py-3 rounded-2xl shadow-sm"
            style={{ backgroundColor: Colors.dark.cardSecondary }}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" color={Colors.dark.text} size={24} />
          </TouchableOpacity>

          <ThemedText type="title" style={{ fontSize: 24 }}>
            Settings
          </ThemedText>

          <View className="w-12" />
        </View>

        {/* User Profile Card */}
        <View
          className="px-6 py-6 rounded-3xl mb-6 shadow-lg"
          style={{ backgroundColor: Colors.dark.card }}
        >
          <View className="flex-row items-center gap-x-4">
            <View
              className="px-4 py-4 rounded-full"
              style={{ backgroundColor: Colors.dark.primary }}
            >
              <Ionicons
                name="person"
                color={Colors.dark.background}
                size={32}
              />
            </View>

            <View className="flex-1">
              <ThemedText type="subtitle" className="mb-1">
                Wallet Address
              </ThemedText>
              <ThemedText
                style={{ color: Colors.dark.textSecondary }}
                numberOfLines={1}
              >
                {"0x" + user?.slice(0, 8) + "..." + user?.slice(-8)}
              </ThemedText>
            </View>

            <TouchableOpacity
              className="px-3 py-3 rounded-xl"
              style={{ backgroundColor: Colors.dark.cardSecondary }}
            >
              <Ionicons
                name="copy-outline"
                color={Colors.dark.text}
                size={20}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Items */}
        <View className="gap-y-3">
          {settingsItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              className="px-5 py-5 rounded-3xl shadow-sm"
              style={{ backgroundColor: Colors.dark.card }}
              onPress={item.onPress}
            >
              <View className="flex-row items-center gap-x-4">
                <View
                  className="px-3 py-3 rounded-2xl"
                  style={{ backgroundColor: item.color + "20" }}
                >
                  <Ionicons
                    name={item.icon as any}
                    color={item.color}
                    size={24}
                  />
                </View>

                <View className="flex-1">
                  <ThemedText type="defaultSemiBold" className="mb-1">
                    {item.title}
                  </ThemedText>
                  <ThemedText
                    style={{ color: Colors.dark.textSecondary, fontSize: 14 }}
                  >
                    {item.subtitle}
                  </ThemedText>
                </View>

                <Ionicons
                  name="chevron-forward"
                  color={Colors.dark.textSecondary}
                  size={20}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          className="mt-8 px-6 py-4 rounded-3xl shadow-sm"
          style={{ backgroundColor: Colors.dark.cardSecondary }}
          onPress={handleLogout}
        >
          <View className="flex-row items-center justify-center gap-x-3">
            <Ionicons name="log-out-outline" color="#FF5722" size={24} />
            <ThemedText
              type="defaultSemiBold"
              style={{ color: "#FF5722", fontSize: 16 }}
            >
              Logout
            </ThemedText>
          </View>
        </TouchableOpacity>

        {/* Add some bottom padding */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
