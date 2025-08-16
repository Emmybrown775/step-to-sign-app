import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/Colors";
import { ThemedText } from "../components/ThemedText";
import {
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { useBLEContext } from "../providers/BLEContext";
import { router } from "expo-router";

type Step =
  | "welcome"
  | "instructions"
  | "listening"
  | "received"
  | "confirming"
  | "success";

export default function FirstTimePasswordSetup() {
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [newReceivedSequence, setNewReceivedSequence] = useState<string>("");
  const [step, setStep] = useState<Step>("welcome");
  const [loading, setLoading] = useState<boolean>(false);
  const {
    sendMessage,
    waitForConfirmSetPasswordAck,
    recievedSequence,
    recievedState,
    clearSequence,
  } = useBLEContext();

  useEffect(() => {
    if (recievedState === "confirm_set_password") {
      setNewReceivedSequence(recievedSequence);
      setPassword(recievedSequence);
      setStep("received");
      sendMessage("<confirm_password>");
    } else if (recievedState === "set_password_confirmed") {
      setNewReceivedSequence(recievedSequence);
      setPassword(recievedSequence);
      setStep("success");
      setTimeout(() => {
        clearSequence();
        router.replace("/");
      }, 3000);
    } else if (recievedState === "set_password_denied") {
      Alert.alert("Wrong password, please try again");
      clearSequence();
      setPassword("");
      setNewReceivedSequence("");
      setStep("welcome");
    } else if (recievedState === "set_password_error") {
      Alert.alert("Error saving Password, please try again");
      clearSequence();
      setPassword("");
      setNewReceivedSequence("");
      setStep("welcome");
    }
  }, [recievedSequence, recievedState]);

  const handleStartCreatingPassword = (): void => {
    sendMessage("<set_password>");

    waitForConfirmSetPasswordAck((active: boolean) => {
      console.log("Yelloooo");
      if (active) {
        setStep("listening");
        setNewReceivedSequence("");
      } else {
        router.replace("/(tabs)/home");
      }
    });
  };

  const handleConfirmSetup = (): void => {
    if (password !== confirmPassword) {
      return;
    }

    setStep("confirming");
    sendMessage(`<set_initial_password>${password}</set_initial_password>`);

    setTimeout(() => {
      setStep("success");
      setTimeout(() => {
        router.replace("/");
      }, 2500);
    }, 1500);
  };

  const handleRetry = (): void => {
    setStep("instructions");
    setNewReceivedSequence("");
    setPassword("");
    setConfirmPassword("");
  };

  const isFormValid = (): boolean => {
    return password.length >= 4 && password === confirmPassword;
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: Colors.dark.background }}
    >
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Welcome Screen */}
        {step === "welcome" && (
          <View className="flex-1 justify-center items-center py-12">
            <View
              className="w-32 h-32 rounded-full items-center justify-center mb-8"
              style={{ backgroundColor: Colors.dark.primary + "20" }}
            >
              <Ionicons
                name="lock-closed"
                size={64}
                color={Colors.dark.primary}
              />
            </View>

            <ThemedText type="title" className="text-center mb-4">
              Welcome to your Wallet
            </ThemedText>

            <ThemedText
              type="link"
              style={{ color: Colors.dark.textSecondary }}
              className="text-center mb-8 px-4 leading-6"
            >
              Let's set up your secure morse code password. This will be used to
              unlock your device and access your data.
            </ThemedText>

            <TouchableOpacity
              className="py-4 px-8 rounded-2xl items-center mb-4"
              style={{ backgroundColor: Colors.dark.primary }}
              onPress={() => setStep("instructions")}
            >
              <ThemedText
                type="defaultSemiBold"
                style={{ color: Colors.dark.background, fontSize: 16 }}
              >
                Get Started
              </ThemedText>
            </TouchableOpacity>

            <ThemedText
              style={{ color: Colors.dark.textSecondary }}
              className="text-center text-sm px-8"
            >
              Your password will be stored securely on the device
            </ThemedText>
          </View>
        )}

        {/* Instructions */}
        {step === "instructions" && (
          <View className="py-8">
            <ThemedText type="title" className="text-center mb-8">
              How It Works
            </ThemedText>

            <View className="space-y-6 mb-12">
              {/* Step 1 */}
              <View className="flex-row items-start">
                <View
                  className="w-8 h-8 rounded-full items-center justify-center mr-4 mt-1"
                  style={{ backgroundColor: Colors.dark.primary }}
                >
                  <ThemedText
                    style={{ color: Colors.dark.background }}
                    type="defaultSemiBold"
                  >
                    1
                  </ThemedText>
                </View>
                <View className="flex-1">
                  <ThemedText type="defaultSemiBold" className="mb-2">
                    Create Your Sequence
                  </ThemedText>
                  <ThemedText
                    type="link"
                    style={{ color: Colors.dark.textSecondary }}
                  >
                    Use the device buttons to input your morse code. Use dots
                    (.) and dashes (-) to create a unique pattern.
                  </ThemedText>
                </View>
              </View>

              {/* Step 2 */}
              <View className="flex-row my-2 items-start">
                <View
                  className="w-8 h-8 rounded-full items-center justify-center mr-4 mt-1"
                  style={{ backgroundColor: Colors.dark.primary }}
                >
                  <ThemedText
                    style={{ color: Colors.dark.background }}
                    type="defaultSemiBold"
                  >
                    2
                  </ThemedText>
                </View>
                <View className="flex-1">
                  <ThemedText type="defaultSemiBold" className="mb-2">
                    Confirm Your Pattern
                  </ThemedText>
                  <ThemedText
                    type="link"
                    style={{ color: Colors.dark.textSecondary }}
                  >
                    We'll show you the sequence and ask you to type it again to
                    make sure it's correct.
                  </ThemedText>
                </View>
              </View>

              {/* Step 3 */}
              <View className="flex-row my-2 items-start">
                <View
                  className="w-8 h-8 rounded-full items-center justify-center mr-4 mt-1"
                  style={{ backgroundColor: Colors.dark.primary }}
                >
                  <ThemedText
                    style={{ color: Colors.dark.background }}
                    type="defaultSemiBold"
                  >
                    3
                  </ThemedText>
                </View>
                <View className="flex-1">
                  <ThemedText type="defaultSemiBold" className="mb-2">
                    All Set!
                  </ThemedText>
                  <ThemedText
                    type="link"
                    style={{ color: Colors.dark.textSecondary }}
                  >
                    Your password will be saved and you can start using your
                    secure device.
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Tips */}
            <View
              className="p-4 rounded-2xl mb-8"
              style={{ backgroundColor: Colors.dark.card }}
            >
              <View className="flex-row items-center mb-3">
                <Ionicons name="bulb" size={20} color={Colors.dark.primary} />
                <ThemedText
                  type="defaultSemiBold"
                  className="ml-2"
                  style={{ color: Colors.dark.primary }}
                >
                  Tips for a Strong Password
                </ThemedText>
              </View>
              <ThemedText
                style={{ color: Colors.dark.textSecondary }}
                className="text-sm leading-5"
              >
                • Make it at least 4 characters long{"\n"}• Mix dots and dashes
                for better security{"\n"}• Choose something you can remember
                easily{"\n"}• Avoid simple patterns like "----" or "...."
              </ThemedText>
            </View>

            <TouchableOpacity
              className="py-4 rounded-2xl items-center"
              style={{ backgroundColor: Colors.dark.primary }}
              onPress={handleStartCreatingPassword}
            >
              <ThemedText
                type="defaultSemiBold"
                style={{ color: Colors.dark.background, fontSize: 16 }}
              >
                Start Creating Password
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Listening for sequence */}
        {step === "listening" && (
          <View className="flex-1 justify-center items-center py-12">
            <View
              className="w-24 h-24 rounded-full items-center justify-center mb-6"
              style={{ backgroundColor: Colors.dark.primary + "20" }}
            >
              <Ionicons name="radio" size={48} color={Colors.dark.primary} />
            </View>

            <ThemedText type="title" className="text-center mb-4">
              Input Your Morse Code
            </ThemedText>

            <ThemedText
              style={{ color: Colors.dark.textSecondary }}
              className="text-center mb-8 px-8"
            >
              Use the device buttons to create your morse code sequence. Press
              the done button when finished.
            </ThemedText>

            <View
              className="p-4 rounded-2xl flex-row items-center mb-6"
              style={{ backgroundColor: Colors.dark.cardSecondary }}
            >
              <View
                className="w-3 h-3 rounded-full mr-3"
                style={{ backgroundColor: "#3B82F6" }}
              />
              <ThemedText style={{ color: Colors.dark.textSecondary }}>
                Listening for morse input...
              </ThemedText>
            </View>

            <TouchableOpacity
              className="py-3 px-6 rounded-xl"
              style={{ backgroundColor: Colors.dark.card }}
              onPress={() => setStep("instructions")}
            >
              <ThemedText style={{ color: Colors.dark.textSecondary }}>
                Go Back
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Sequence received - show and confirm */}
        {/* Sequence received - show and confirm */}
        {step === "received" && (
          <View className="py-8">
            <View className="flex-row items-center mb-8">
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: "#10B981" }}
              >
                <Ionicons name="checkmark" size={18} color="white" />
              </View>
              <ThemedText type="defaultSemiBold">Password Received</ThemedText>
            </View>

            {/* Display received sequence */}
            <View className="mb-6">
              <ThemedText
                type="defaultSemiBold"
                className="mb-3"
                style={{ color: Colors.dark.text }}
              >
                Your Morse Code Password
              </ThemedText>
              <View
                className="p-6 rounded-2xl"
                style={{ backgroundColor: Colors.dark.card }}
              >
                <ThemedText
                  className="text-center font-mono"
                  style={{
                    color: Colors.dark.primary,
                    fontSize: 24,
                    letterSpacing: 4,
                  }}
                >
                  {newReceivedSequence || "- - . . - -"}
                </ThemedText>
              </View>
              <ThemedText
                style={{ color: Colors.dark.textSecondary }}
                className="text-center text-sm mt-2"
              >
                Length: {newReceivedSequence.length} characters
              </ThemedText>
            </View>

            {/* Confirmation instruction */}
            <View className="mb-8">
              <ThemedText
                type="defaultSemiBold"
                className="mb-3 text-center"
                style={{ color: Colors.dark.text }}
              >
                Now Confirm Your Password
              </ThemedText>
              <ThemedText
                style={{ color: Colors.dark.textSecondary }}
                className="text-center mb-6 px-4"
              >
                Use the device buttons to input the same sequence again to
                confirm it's correct.
              </ThemedText>

              {/* Listening indicator */}
              <View
                className="p-4 rounded-2xl flex-row items-center justify-center mb-6"
                style={{ backgroundColor: Colors.dark.cardSecondary }}
              >
                <View
                  className="w-3 h-3 rounded-full mr-3"
                  style={{ backgroundColor: "#3B82F6" }}
                />
                <ThemedText style={{ color: Colors.dark.textSecondary }}>
                  Listening for confirmation...
                </ThemedText>
              </View>

              {/* Show confirmation sequence as it's being typed */}
              {confirmPassword.length > 0 && (
                <View className="mb-4">
                  <ThemedText
                    style={{ color: Colors.dark.textSecondary }}
                    className="text-center text-sm mb-2"
                  >
                    Confirmation sequence:
                  </ThemedText>
                  <View
                    className="p-4 rounded-2xl"
                    style={{ backgroundColor: Colors.dark.card }}
                  >
                    <ThemedText
                      className="text-center font-mono"
                      style={{
                        color: Colors.dark.primary,
                        fontSize: 20,
                        letterSpacing: 3,
                      }}
                    >
                      {confirmPassword}
                    </ThemedText>
                  </View>
                </View>
              )}

              {/* Validation Messages */}
              {password !== confirmPassword && confirmPassword.length > 0 && (
                <View className="flex-row items-center justify-center mt-3">
                  <Ionicons name="close-circle" size={16} color="#EF4444" />
                  <ThemedText
                    className="text-sm ml-2"
                    style={{ color: "#EF4444" }}
                  >
                    Sequences don't match
                  </ThemedText>
                </View>
              )}

              {password === confirmPassword && confirmPassword.length > 0 && (
                <View className="flex-row items-center justify-center mt-3">
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <ThemedText
                    className="text-sm ml-2"
                    style={{ color: "#10B981" }}
                  >
                    Sequences match!
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Action buttons */}
            <View className="flex-row gap-4">
              <TouchableOpacity
                className="flex-1 py-4 rounded-2xl items-center"
                style={{ backgroundColor: Colors.dark.card }}
                onPress={handleRetry}
              >
                <ThemedText style={{ color: Colors.dark.textSecondary }}>
                  Start Over
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 py-4 rounded-2xl items-center"
                style={{
                  backgroundColor: isFormValid()
                    ? Colors.dark.primary
                    : Colors.dark.cardSecondary,
                  opacity: isFormValid() ? 1 : 0.5,
                }}
                disabled={!isFormValid()}
                onPress={handleConfirmSetup}
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
                  Save Password
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Confirming with device */}
        {step === "confirming" && (
          <View className="flex-1 justify-center items-center py-12">
            <View
              className="w-24 h-24 rounded-full items-center justify-center mb-6"
              style={{ backgroundColor: Colors.dark.primary + "20" }}
            >
              <Ionicons name="sync" size={48} color={Colors.dark.primary} />
            </View>

            <ThemedText type="title" className="text-center mb-4">
              Setting Up Password
            </ThemedText>

            <ThemedText
              style={{ color: Colors.dark.textSecondary }}
              className="text-center px-8"
            >
              Saving your morse code password to the device...
            </ThemedText>
          </View>
        )}

        {/* Success */}
        {step === "success" && (
          <View className="flex-1 justify-center items-center py-12">
            <View
              className="w-32 h-32 rounded-full items-center justify-center mb-8"
              style={{ backgroundColor: "#10B981" }}
            >
              <Ionicons name="checkmark" size={64} color="white" />
            </View>

            <ThemedText type="title" className="text-center mb-4">
              Setup Complete!
            </ThemedText>

            <ThemedText
              style={{ color: Colors.dark.textSecondary }}
              className="text-center px-8 mb-6"
            >
              Your secure morse code password has been saved. You can now use
              your device safely.
            </ThemedText>

            <View
              className="p-4 rounded-2xl mx-8"
              style={{ backgroundColor: Colors.dark.card }}
            >
              <ThemedText
                style={{ color: Colors.dark.textSecondary }}
                className="text-center text-sm"
              >
                Redirecting Please wait...
              </ThemedText>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
