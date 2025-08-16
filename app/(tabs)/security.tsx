import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { ThemedText } from "../../components/ThemedText";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function PasswordOptions() {
  return (
    <SafeAreaView
      className="flex-1 pt-6 px-5"
      style={{ backgroundColor: Colors.dark.background }}
    >
      <View className="flex-1">
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
            Security
          </ThemedText>

          <View className="w-12" />
        </View>

        {/* Options */}
        <View className="gap-4">
          <TouchableOpacity
            className="p-6 rounded-2xl flex-row items-center justify-between"
            style={{ backgroundColor: Colors.dark.card }}
            onPress={() => router.navigate("/set_password")}
          >
            <View className="flex-row items-center">
              <View
                className="p-3 rounded-full mr-4"
                style={{ backgroundColor: Colors.dark.primary + "20" }}
              >
                <Ionicons name="key" size={24} color={Colors.dark.primary} />
              </View>
              <View>
                <ThemedText type="defaultSemiBold">Change Password</ThemedText>
                <ThemedText
                  type="link"
                  style={{ color: Colors.dark.textSecondary }}
                  className="text-sm mt-1"
                >
                  Update your sequence
                </ThemedText>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.dark.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            className="p-6 rounded-2xl flex-row items-center justify-between"
            style={{ backgroundColor: Colors.dark.card }}
            onPress={() => router.navigate("/forgot_password")}
          >
            <View className="flex-row items-center">
              <View className="p-3 rounded-full mr-4 bg-red-600">
                <Ionicons
                  className="color-red-500"
                  name="help-circle"
                  size={24}
                />
              </View>
              <View>
                <ThemedText type="defaultSemiBold">Forgot Password</ThemedText>
                <ThemedText
                  type="link"
                  style={{ color: Colors.dark.textSecondary }}
                  className="text-sm mt-1"
                >
                  With 24-hour waiting period
                </ThemedText>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.dark.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Security Notice */}
        <View
          className="p-4 rounded-2xl mt-8"
          style={{ backgroundColor: Colors.dark.cardSecondary }}
        >
          <View className="flex-row items-start">
            <Ionicons
              name="shield-checkmark"
              size={20}
              color={Colors.dark.primary}
              style={{ marginRight: 12, marginTop: 4 }}
            />
            <View className="flex-1">
              <ThemedText
                type="subtitle"
                style={{ color: Colors.dark.primary }}
                className="mb-2"
              >
                Security Notice
              </ThemedText>
              <ThemedText
                type="link"
                style={{ color: Colors.dark.textSecondary }}
              >
                Password changes require morse code authentication via your
                connected device. Forgot password initiates a 24-hour security
                lockout period.
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
