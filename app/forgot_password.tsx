// ForgotPassword.tsx - Forgot password with 24h lockout
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/Colors";
import { ThemedText } from "../components/ThemedText";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type RootStackParamList = {
  PasswordOptions: undefined;
  ForgotPassword: undefined;
};

type ForgotPasswordNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ForgotPassword"
>;

export default function ForgotPassword() {
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    checkLockoutStatus();
  }, []);

  useEffect(() => {
    if (lockoutTime) {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const distance = lockoutTime - now;

        if (distance > 0) {
          const hours = Math.floor(distance / (1000 * 60 * 60));
          const minutes = Math.floor(
            (distance % (1000 * 60 * 60)) / (1000 * 60),
          );
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);

          setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeRemaining("");
          setLockoutTime(null);
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [lockoutTime]);

  const checkLockoutStatus = async (): Promise<void> => {
    try {
      // const lockoutData = await As.getItem("password_reset_lockout");
      // if (lockoutData) {
      //   const lockoutTimestamp = parseInt(lockoutData);
      //   const now = new Date().getTime();
      //   if (now < lockoutTimestamp) {
      //     setLockoutTime(lockoutTimestamp);
      //   } else {
      //     await AsyncStorage.removeItem("password_reset_lockout");
      //   }
      // }
    } catch (error) {
      console.error("Error checking lockout status:", error);
    }
  };

  const initiateForgotPassword = async (): Promise<void> => {
    try {
      // const lockoutTime = new Date().getTime() + 24 * 60 * 60 * 1000; // 24 hours
      // await AsyncStorage.setItem(
      //   "password_reset_lockout",
      //   lockoutTime.toString(),
      // );
      // setLockoutTime(lockoutTime);
      // Here you would typically also:
      // 1. Generate recovery codes
      // 2. Send notification to user's email
      // 3. Log security event
    } catch (error) {
      console.error("Error initiating forgot password:", error);
    }
  };

  return (
    <SafeAreaView
      className="flex-1 px-6"
      style={{ backgroundColor: Colors.dark.background }}
    >
      <View className="flex-1">
        {/* Header */}
        <View className="flex-1 justify-center">
          {!lockoutTime ? (
            <>
              {/* Warning Icon */}
              <View
                className="w-24 h-24 rounded-full items-center justify-center mb-6 self-center"
                style={{ backgroundColor: Colors.dark.error + "20" }}
              >
                <Ionicons name="warning" size={48} color={Colors.dark.error} />
              </View>

              <ThemedText type="title" className="text-center mb-6">
                Reset Password?
              </ThemedText>

              <ThemedText
                style={{ color: Colors.dark.textSecondary }}
                className="text-center mb-8 leading-6"
              >
                Initiating a password reset will lock your account for 24 hours.
                After this period, you'll be able to set a new morse code
                sequence.
              </ThemedText>

              {/* Warning Box */}
              <View
                className="p-4 rounded-2xl mb-8"
                style={{ backgroundColor: Colors.dark.error + "10" }}
              >
                <View className="flex-row items-start">
                  <Ionicons
                    name="alert-circle"
                    size={20}
                    color={Colors.dark.error}
                    style={{ marginRight: 12, marginTop: 4 }}
                  />
                  <View className="flex-1">
                    <ThemedText
                      type="defaultSemiBold"
                      style={{ color: Colors.dark.error }}
                      className="mb-2"
                    >
                      Important Security Notice
                    </ThemedText>
                    <ThemedText
                      style={{ color: Colors.dark.textSecondary }}
                      className="text-sm leading-5"
                    >
                      • Account will be locked for exactly 24 hours{"\n"}• No
                      transactions can be made during lockout{"\n"}• This action
                      cannot be undone{"\n"}• Consider trying to remember your
                      sequence first
                    </ThemedText>
                  </View>
                </View>
              </View>

              {/* Initiate Reset Button */}
              <TouchableOpacity
                className="py-4 rounded-2xl items-center mb-4"
                style={{ backgroundColor: Colors.dark.error }}
                onPress={initiateForgotPassword}
              >
                <ThemedText
                  type="defaultSemiBold"
                  style={{
                    color: Colors.dark.background,
                    fontSize: 16,
                  }}
                >
                  Initiate Password Reset
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                className="py-4 rounded-2xl items-center"
                style={{ backgroundColor: Colors.dark.cardSecondary }}
                onPress={() => navigation.goBack()}
              >
                <ThemedText
                  type="defaultSemiBold"
                  style={{
                    color: Colors.dark.text,
                    fontSize: 16,
                  }}
                >
                  Cancel
                </ThemedText>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Locked Icon */}
              <View
                className="w-24 h-24 rounded-full items-center justify-center mb-6 self-center"
                style={{ backgroundColor: Colors.dark.error + "20" }}
              >
                <Ionicons
                  name="lock-closed"
                  size={48}
                  color={Colors.dark.error}
                />
              </View>

              <ThemedText type="title" className="text-center mb-6">
                Account Locked
              </ThemedText>

              <ThemedText
                style={{ color: Colors.dark.textSecondary }}
                className="text-center mb-8"
              >
                Your account is currently locked due to a password reset
                request.
              </ThemedText>

              {/* Countdown Timer */}
              <View
                className="p-6 rounded-2xl mb-8"
                style={{ backgroundColor: Colors.dark.card }}
              >
                <ThemedText type="defaultSemiBold" className="text-center mb-2">
                  Time Remaining
                </ThemedText>
                <ThemedText
                  className="text-3xltext-center"
                  style={{ color: Colors.dark.error }}
                  type="defaultSemiBold"
                >
                  {timeRemaining}
                </ThemedText>
              </View>

              <View
                className="p-4 rounded-2xl"
                style={{ backgroundColor: Colors.dark.cardSecondary }}
              >
                <ThemedText
                  style={{ color: Colors.dark.textSecondary }}
                  className="text-center text-sm"
                >
                  During this lockout period, you cannot access your wallet or
                  make transactions. After the timer expires, you'll be able to
                  set a new password.
                </ThemedText>
              </View>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
