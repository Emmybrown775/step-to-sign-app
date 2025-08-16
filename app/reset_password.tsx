import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/Colors";
import { ThemedText } from "../components/ThemedText";
import { View, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { useBLEContext } from "../providers/BLEContext";
import { CommonActions } from "@react-navigation/native";
import { router } from "expo-router";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { sendMessage } = useBLEContext();

  const isFormValid = (): boolean => {
    return newPassword.length >= 4 && newPassword === confirmPassword;
  };

  const handleResetPassword = async (): Promise<void> => {
    if (!isFormValid()) {
      return;
    }

    setIsLoading(true);

    try {
      // Send new password to device
      sendMessage(`<reset_password>${newPassword}</reset_password>`);

      // Clear lockout status

      // Navigate back to main app
      setTimeout(() => {
        setIsLoading(false);
        router.push("/(tabs)/home");
      }, 2000);
    } catch (error) {
      console.error("Error resetting password:", error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1 px-6"
        style={{ backgroundColor: Colors.dark.background }}
      >
        <View className="flex-1 justify-center items-center">
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: Colors.dark.success + "20" }}
          >
            <Ionicons name="checkmark" size={48} color={Colors.dark.success} />
          </View>

          <ThemedText type="title" className="text-center mb-4">
            Password Reset Complete!
          </ThemedText>

          <ThemedText
            style={{ color: Colors.dark.textSecondary }}
            className="text-center px-8"
          >
            Your new morse code sequence has been set successfully.
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 px-6"
      style={{ backgroundColor: Colors.dark.background }}
    >
      <View className="flex-1">
        {/* Header */}
        <View className="items-center mb-8">
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: Colors.dark.success + "20" }}
          >
            <Ionicons name="key" size={48} color={Colors.dark.success} />
          </View>
          <ThemedText type="title" className="text-center">
            Set New Password
          </ThemedText>
          <ThemedText
            style={{ color: Colors.dark.textSecondary }}
            className="text-center mt-2"
          >
            Create your new morse code sequence
          </ThemedText>
        </View>

        {/* New Password Input */}
        <View className="mb-6">
          <ThemedText
            type="defaultSemiBold"
            className="mb-3"
            style={{ color: Colors.dark.text }}
          >
            New Morse Code Sequence
          </ThemedText>
          <View
            className="p-4 rounded-2xl"
            style={{ backgroundColor: Colors.dark.card }}
          >
            <TextInput
              placeholder="Enter new sequence (dots and dashes)"
              value={newPassword}
              onChangeText={setNewPassword}
              className="text-base"
              placeholderTextColor={Colors.dark.textSecondary}
              style={{ color: Colors.dark.text }}
              secureTextEntry
              cursorColor={Colors.dark.primary}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Confirm Password Input */}
        <View className="mb-8">
          <ThemedText
            type="defaultSemiBold"
            className="mb-3"
            style={{ color: Colors.dark.text }}
          >
            Confirm New Sequence
          </ThemedText>
          <View
            className="p-4 rounded-2xl"
            style={{ backgroundColor: Colors.dark.card }}
          >
            <TextInput
              placeholder="Confirm new sequence"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              className="text-base"
              placeholderTextColor={Colors.dark.textSecondary}
              style={{ color: Colors.dark.text }}
              secureTextEntry
              cursorColor={Colors.dark.primary}
              autoCapitalize="none"
            />
          </View>

          {newPassword !== confirmPassword && confirmPassword.length > 0 && (
            <ThemedText
              style={{ color: Colors.dark.error }}
              className="text-sm mt-2"
            >
              Sequences don't match
            </ThemedText>
          )}
        </View>

        {/* Password Requirements */}
        <View
          className="p-4 rounded-2xl mb-8"
          style={{ backgroundColor: Colors.dark.cardSecondary }}
        >
          <ThemedText
            type="defaultSemiBold"
            style={{ color: Colors.dark.primary }}
            className="mb-2"
          >
            Password Requirements
          </ThemedText>
          <ThemedText
            style={{ color: Colors.dark.textSecondary }}
            className="text-sm leading-5"
          >
            • Minimum 4 characters{"\n"}• Use dots (.) and dashes (-){"\n"}•
            Easy to tap on your device{"\n"}• Hard for others to guess
          </ThemedText>
        </View>

        <View className="flex-1" />

        {/* Reset Button */}
        <TouchableOpacity
          className="py-4 rounded-2xl items-center"
          style={{
            backgroundColor: isFormValid()
              ? Colors.dark.success
              : Colors.dark.cardSecondary,
            opacity: isFormValid() ? 1 : 0.5,
          }}
          disabled={!isFormValid()}
          onPress={handleResetPassword}
        >
          <ThemedText
            type="defaultSemiBold"
            style={{
              color: isFormValid()
                ? Colors.dark.background
                : Colors.dark.textSecondary,
              fontSize: 16,
            }}
          >
            Set New Password
          </ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
