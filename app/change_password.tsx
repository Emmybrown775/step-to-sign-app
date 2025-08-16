import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/Colors";
import { ThemedText } from "../components/ThemedText";
import { View, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { useBLEContext } from "../providers/BLEContext";
import { router } from "expo-router";

type Step =
  | "verify_current"
  | "verifying_current"
  | "current_verified"
  | "ready_new"
  | "listening_new"
  | "received_new"
  | "listening_confirm"
  | "confirming_new"
  | "success";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [receivedSequence, setReceivedSequence] = useState<string>("");
  const [step, setStep] = useState<Step>("verify_current");
  const [isListening, setIsListening] = useState(false);
  const { sendMessage, systemState } = useBLEContext();

  // Listen for incoming responses from MCU
  // useEffect(() => {
  //   if (systemState?.lastMessage) {
  //     const message = systemState.lastMessage;

  //     // Handle current password verification response
  //     if (message === "<password_correct>" && step === "verifying_current") {
  //       setStep("current_verified");
  //       setTimeout(() => setStep("ready_new"), 1500);
  //     } else if (
  //       message === "<password_incorrect>" &&
  //       step === "verifying_current"
  //     ) {
  //       setStep("verify_current");
  //       setCurrentPassword("");
  //       // Could add error state here
  //     }

  //     // Handle new morse sequence from MCU
  //     if (message.startsWith("<morse_sequence>") && isListening) {
  //       const sequence = message
  //         .replace("<morse_sequence>", "")
  //         .replace("</morse_sequence>", "");

  //       if (step === "listening_new") {
  //         setReceivedSequence(sequence);
  //         setNewPassword(sequence);
  //         setIsListening(false);
  //         setStep("received_new");
  //       } else if (step === "listening_confirm") {
  //         setConfirmPassword(sequence);
  //         setIsListening(false);
  //         setStep("received_new");
  //       }
  //     }
  //   }
  // }, [systemState?.lastMessage, step, isListening]);

  const handleVerifyCurrentPassword = (): void => {
    setStep("verifying_current");
    sendMessage("<start_current_password_verification>");
  };

  const handleStartNewPasswordInput = (): void => {
    setStep("listening_new");
    setIsListening(true);
    setReceivedSequence("");
    sendMessage("<start_morse_input>");
  };

  const handleConfirmNewPassword = (): void => {
    if (newPassword !== confirmPassword) return;

    setStep("confirming_new");
    sendMessage(`<change_password>${newPassword}</change_password>`);

    setTimeout(() => {
      setStep("success");
      setTimeout(() => {
        router.navigate("/(tabs)/home");
      }, 2500);
    }, 1500);
  };

  const handleRetryNewPassword = (): void => {
    setStep("ready_new");
    setReceivedSequence("");
    setNewPassword("");
    setConfirmPassword("");
    setIsListening(false);
  };

  const isCurrentPasswordValid = (): boolean => {
    return currentPassword.length >= 4;
  };

  const isNewPasswordFormValid = (): boolean => {
    return newPassword.length >= 4 && newPassword === confirmPassword;
  };

  return (
    <SafeAreaView
      className="flex-1 px-6"
      style={{ backgroundColor: Colors.dark.background }}
    >
      <View className="flex-1">
        {/* Verify Current Password */}
        {step === "verify_current" && (
          <>
            <View className="flex-row items-center mb-8">
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: Colors.dark.primary }}
              >
                <ThemedText
                  style={{ color: Colors.dark.background }}
                  type="defaultSemiBold"
                >
                  1
                </ThemedText>
              </View>
              <ThemedText type="defaultSemiBold">
                Verify Current Password
              </ThemedText>
            </View>

            <View className="flex-1 justify-center items-center">
              <View
                className="w-24 h-24 rounded-full items-center justify-center mb-6"
                style={{ backgroundColor: Colors.dark.primary + "20" }}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={48}
                  color={Colors.dark.primary}
                />
              </View>

              <ThemedText type="title" className="text-center mb-4">
                Verify Current Password
              </ThemedText>

              <ThemedText
                style={{ color: Colors.dark.textSecondary }}
                className="text-center mb-8 px-8"
              >
                Press the button below, then enter your current morse code
                password on the device to verify your identity.
              </ThemedText>

              <TouchableOpacity
                className="py-4 px-8 rounded-2xl items-center"
                style={{ backgroundColor: Colors.dark.primary }}
                onPress={handleVerifyCurrentPassword}
              >
                <ThemedText
                  type="defaultSemiBold"
                  style={{ color: Colors.dark.background, fontSize: 16 }}
                >
                  Start Verification
                </ThemedText>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Verifying Current Password */}
        {step === "verifying_current" && (
          <View className="flex-1 justify-center items-center">
            <View
              className="w-24 h-24 rounded-full items-center justify-center mb-6"
              style={{ backgroundColor: Colors.dark.primary + "20" }}
            >
              <Ionicons name="key" size={48} color={Colors.dark.primary} />
            </View>

            <ThemedText type="title" className="text-center mb-4">
              Enter Current Password
            </ThemedText>

            <ThemedText
              style={{ color: Colors.dark.textSecondary }}
              className="text-center mb-8 px-8"
            >
              Please enter your current morse code password on the device to
              verify your identity.
            </ThemedText>

            <View
              className="p-4 rounded-2xl flex-row items-center mb-6"
              style={{ backgroundColor: Colors.dark.cardSecondary }}
            >
              <View
                className="w-2 h-2 rounded-full mr-3 animate-pulse"
                style={{ backgroundColor: "#3B82F6" }}
              />
              <ThemedText style={{ color: Colors.dark.textSecondary }}>
                Waiting for password input on device...
              </ThemedText>
            </View>

            <TouchableOpacity
              className="py-3 px-6 rounded-xl"
              style={{ backgroundColor: Colors.dark.card }}
              onPress={() => setStep("verify_current")}
            >
              <ThemedText style={{ color: Colors.dark.textSecondary }}>
                Cancel
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Current Password Verified */}
        {step === "current_verified" && (
          <View className="flex-1 justify-center items-center">
            <View
              className="w-24 h-24 rounded-full items-center justify-center mb-6"
              style={{ backgroundColor: "#10B981" }}
            >
              <Ionicons name="checkmark" size={48} color="white" />
            </View>

            <ThemedText type="title" className="text-center mb-4">
              Password Verified!
            </ThemedText>

            <ThemedText
              style={{ color: Colors.dark.textSecondary }}
              className="text-center px-8"
            >
              Now let's set up your new morse code password
            </ThemedText>
          </View>
        )}

        {/* Ready to set new password */}
        {step === "ready_new" && (
          <>
            <View className="flex-row items-center mb-8">
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: Colors.dark.primary }}
              >
                <ThemedText
                  style={{ color: Colors.dark.background }}
                  type="defaultSemiBold"
                >
                  2
                </ThemedText>
              </View>
              <ThemedText type="defaultSemiBold">Set New Password</ThemedText>
            </View>

            <View className="flex-1 justify-center items-center">
              <View
                className="w-24 h-24 rounded-full items-center justify-center mb-6"
                style={{ backgroundColor: Colors.dark.primary + "20" }}
              >
                <Ionicons name="key" size={48} color={Colors.dark.primary} />
              </View>

              <ThemedText type="title" className="text-center mb-4">
                Create New Password
              </ThemedText>

              <ThemedText
                style={{ color: Colors.dark.textSecondary }}
                className="text-center mb-8 px-8"
              >
                Press the button below, then input your new morse code sequence
                on the connected device.
              </ThemedText>

              <TouchableOpacity
                className="py-4 px-8 rounded-2xl items-center"
                style={{ backgroundColor: Colors.dark.primary }}
                onPress={handleStartNewPasswordInput}
              >
                <ThemedText
                  type="defaultSemiBold"
                  style={{ color: Colors.dark.background, fontSize: 16 }}
                >
                  Start New Password Input
                </ThemedText>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Listening for new password */}
        {step === "listening_new" && (
          <View className="flex-1 justify-center items-center">
            <View
              className="w-24 h-24 rounded-full items-center justify-center mb-6"
              style={{ backgroundColor: Colors.dark.primary + "20" }}
            >
              <Ionicons name="radio" size={48} color={Colors.dark.primary} />
            </View>

            <ThemedText type="title" className="text-center mb-4">
              Input New Morse Code
            </ThemedText>

            <ThemedText
              style={{ color: Colors.dark.textSecondary }}
              className="text-center mb-8 px-8"
            >
              Input your new morse code sequence on the device now. Press the
              button when finished.
            </ThemedText>

            <View
              className="p-4 rounded-2xl flex-row items-center mb-6"
              style={{ backgroundColor: Colors.dark.cardSecondary }}
            >
              <View
                className="w-2 h-2 rounded-full mr-3 animate-pulse"
                style={{ backgroundColor: "#3B82F6" }}
              />
              <ThemedText style={{ color: Colors.dark.textSecondary }}>
                Waiting for new morse input...
              </ThemedText>
            </View>

            <TouchableOpacity
              className="py-3 px-6 rounded-xl"
              style={{ backgroundColor: Colors.dark.card }}
              onPress={() => setStep("ready_new")}
            >
              <ThemedText style={{ color: Colors.dark.textSecondary }}>
                Cancel
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* New sequence received - show and confirm */}
        {step === "received_new" && (
          <>
            <View className="flex-row items-center mb-8">
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: Colors.dark.primary }}
              >
                <ThemedText
                  style={{ color: Colors.dark.background }}
                  type="defaultSemiBold"
                >
                  3
                </ThemedText>
              </View>
              <ThemedText type="defaultSemiBold">
                Confirm New Password
              </ThemedText>
            </View>

            {/* Display received sequence */}
            <View className="mb-6">
              <ThemedText
                type="defaultSemiBold"
                className="mb-3"
                style={{ color: Colors.dark.text }}
              >
                New Morse Code Password
              </ThemedText>
              <View
                className="p-4 rounded-2xl"
                style={{ backgroundColor: Colors.dark.card }}
              >
                <ThemedText
                  className="text-base font-mono text-center"
                  style={{ color: Colors.dark.primary, fontSize: 18 }}
                >
                  {receivedSequence}
                </ThemedText>
              </View>
            </View>

            {/* Confirm by retyping */}
            <View className="mb-8">
              <ThemedText
                type="defaultSemiBold"
                className="mb-3"
                style={{ color: Colors.dark.text }}
              >
                Confirm New Password
              </ThemedText>
              <ThemedText
                style={{ color: Colors.dark.textSecondary }}
                className="mb-3 text-sm"
              >
                Press the button below to input the same sequence again to
                confirm:
              </ThemedText>

              <TouchableOpacity
                className="py-3 px-6 rounded-xl items-center mb-4"
                style={{ backgroundColor: Colors.dark.card }}
                onPress={() => {
                  setStep("listening_confirm");
                  setIsListening(true);
                  sendMessage("<start_morse_confirm>");
                }}
              >
                <ThemedText style={{ color: Colors.dark.primary }}>
                  Input Confirmation Sequence
                </ThemedText>
              </TouchableOpacity>

              {confirmPassword && (
                <View
                  className="p-4 rounded-2xl mb-4"
                  style={{ backgroundColor: Colors.dark.card }}
                >
                  <ThemedText
                    className="text-base font-mono text-center"
                    style={{ color: Colors.dark.text, fontSize: 16 }}
                  >
                    {confirmPassword}
                  </ThemedText>
                </View>
              )}

              {newPassword !== confirmPassword &&
                confirmPassword.length > 0 && (
                  <View className="flex-row items-center">
                    <Ionicons name="close-circle" size={16} color="#EF4444" />
                    <ThemedText
                      className="text-sm ml-2"
                      style={{ color: "#EF4444" }}
                    >
                      Passwords don't match
                    </ThemedText>
                  </View>
                )}

              {newPassword === confirmPassword &&
                confirmPassword.length > 0 && (
                  <View className="flex-row items-center">
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#10B981"
                    />
                    <ThemedText
                      className="text-sm ml-2"
                      style={{ color: "#10B981" }}
                    >
                      Passwords match!
                    </ThemedText>
                  </View>
                )}
            </View>

            {/* Action buttons */}
            <View className="flex-row gap-4">
              <TouchableOpacity
                className="flex-1 py-4 rounded-2xl items-center"
                style={{ backgroundColor: Colors.dark.card }}
                onPress={handleRetryNewPassword}
              >
                <ThemedText style={{ color: Colors.dark.textSecondary }}>
                  Try Again
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 py-4 rounded-2xl items-center"
                style={{
                  backgroundColor: isNewPasswordFormValid()
                    ? Colors.dark.primary
                    : Colors.dark.cardSecondary,
                  opacity: isNewPasswordFormValid() ? 1 : 0.5,
                }}
                disabled={!isNewPasswordFormValid()}
                onPress={handleConfirmNewPassword}
              >
                <ThemedText
                  type="defaultSemiBold"
                  style={{
                    color: isNewPasswordFormValid()
                      ? Colors.dark.background
                      : Colors.dark.textSecondary,
                    fontSize: 16,
                  }}
                >
                  Change Password
                </ThemedText>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Listening for confirmation sequence */}
        {step === "listening_confirm" && (
          <View className="flex-1 justify-center items-center">
            <View
              className="w-24 h-24 rounded-full items-center justify-center mb-6"
              style={{ backgroundColor: Colors.dark.primary + "20" }}
            >
              <Ionicons name="repeat" size={48} color={Colors.dark.primary} />
            </View>

            <ThemedText type="title" className="text-center mb-4">
              Confirm New Password
            </ThemedText>

            <ThemedText
              style={{ color: Colors.dark.textSecondary }}
              className="text-center mb-8 px-8"
            >
              Input the same morse code sequence again on the device to confirm
              your new password.
            </ThemedText>

            <View
              className="p-4 rounded-2xl flex-row items-center mb-6"
              style={{ backgroundColor: Colors.dark.cardSecondary }}
            >
              <View
                className="w-2 h-2 rounded-full mr-3 animate-pulse"
                style={{ backgroundColor: "#3B82F6" }}
              />
              <ThemedText style={{ color: Colors.dark.textSecondary }}>
                Waiting for confirmation sequence...
              </ThemedText>
            </View>

            <TouchableOpacity
              className="py-3 px-6 rounded-xl"
              style={{ backgroundColor: Colors.dark.card }}
              onPress={() => setStep("received_new")}
            >
              <ThemedText style={{ color: Colors.dark.textSecondary }}>
                Back
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
        {step === "confirming_new" && (
          <View className="flex-1 justify-center items-center">
            <View
              className="w-24 h-24 rounded-full items-center justify-center mb-6"
              style={{ backgroundColor: Colors.dark.primary + "20" }}
            >
              <Ionicons name="sync" size={48} color={Colors.dark.primary} />
            </View>

            <ThemedText type="title" className="text-center mb-4">
              Updating Password
            </ThemedText>

            <ThemedText
              style={{ color: Colors.dark.textSecondary }}
              className="text-center px-8"
            >
              Saving your new morse code password to the device...
            </ThemedText>
          </View>
        )}

        {/* Success */}
        {step === "success" && (
          <View className="flex-1 justify-center items-center">
            <View
              className="w-24 h-24 rounded-full items-center justify-center mb-6"
              style={{ backgroundColor: "#10B981" }}
            >
              <Ionicons name="checkmark" size={48} color="white" />
            </View>

            <ThemedText type="title" className="text-center mb-4">
              Password Changed!
            </ThemedText>

            <ThemedText
              style={{ color: Colors.dark.textSecondary }}
              className="text-center px-8"
            >
              Your morse code password has been successfully updated.
            </ThemedText>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
