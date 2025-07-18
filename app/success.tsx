import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/Colors";
import { ThemedText } from "../components/ThemedText";
import { Image, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomButton from "../components/CustomButton";
import { useAuthContext } from "../providers/AuthProvider";
import { useBLEContext } from "../providers/BLEContext";
import { useLocalSearchParams, router } from "expo-router";
import { STATE } from "../hooks/useBluetooth";

export default function Success() {
  const { amount, recipient, txHash } = useLocalSearchParams();
  const { balance, user, suiUsdPrice } = useAuthContext();
  const { changeState } = useBLEContext();

  const handleDone = () => {
    // Reset any BLE state if needed
    changeState(STATE.IDLE);
    // Navigate back to home or main screen
    router.replace("/");
  };

  const handleViewTransaction = () => {
    // Navigate to transaction details or open explorer
    // You can implement this based on your app's navigation structure
    console.log("View transaction:", txHash);
  };

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <SafeAreaView
      className="flex-1 px-6"
      style={{
        backgroundColor: Colors.dark.background,
      }}
    >
      <View className="flex-1">
        {/* Header */}
        <View className="items-center mt-8 mb-12">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: Colors.dark.primary }}
          >
            <Ionicons
              name="checkmark"
              size={40}
              color={Colors.dark.background}
            />
          </View>

          <ThemedText type="title" className="text-2xl mb-2">
            Transaction Sent!
          </ThemedText>

          <ThemedText
            style={{ color: Colors.dark.textSecondary }}
            className="text-center"
          >
            Your transaction has been successfully broadcast to the network
          </ThemedText>
        </View>

        {/* Transaction Details Card */}
        <View
          className="px-6 py-6 rounded-3xl mb-6"
          style={{ backgroundColor: Colors.dark.card }}
        >
          {/* Amount */}
          <View className="items-center mb-8">
            <View className="flex-row items-center mb-2">
              <Image
                source={require("../assets/images/sui-logo-white.png")}
                className="size-6 mr-2"
              />
              <ThemedText type="title" className="text-3xl">
                {amount || "0"}
              </ThemedText>
              <ThemedText type="title" className="text-3xl ml-2">
                SUI
              </ThemedText>
            </View>
            <ThemedText
              style={{ color: Colors.dark.textSecondary }}
              className="text-lg"
            >
              ${amount ? parseFloat(amount.toString()) * suiUsdPrice : "__._"}
            </ThemedText>
          </View>

          {/* Transaction Info */}
          <View className="space-y-4">
            {/* To */}
            <View className="flex-row justify-between items-center">
              <ThemedText style={{ color: Colors.dark.textSecondary }}>
                To
              </ThemedText>
              <ThemedText type="defaultSemiBold">
                {formatAddress(recipient)}
              </ThemedText>
            </View>

            {/* Divider */}
            <View
              className="h-px"
              style={{ backgroundColor: Colors.dark.cardSecondary }}
            />

            {/* From */}
            <View className="flex-row justify-between items-center">
              <ThemedText style={{ color: Colors.dark.textSecondary }}>
                From
              </ThemedText>
              <ThemedText type="defaultSemiBold">
                {formatAddress(user)}
              </ThemedText>
            </View>

            {/* Divider */}
            <View
              className="h-px"
              style={{ backgroundColor: Colors.dark.cardSecondary }}
            />

            {/* Gas Fee */}
            <View className="flex-row justify-between items-center">
              <ThemedText style={{ color: Colors.dark.textSecondary }}>
                Gas Fee
              </ThemedText>
              <View className="items-end">
                <ThemedText type="defaultSemiBold">~0.001 SUI</ThemedText>
                <ThemedText
                  style={{ color: Colors.dark.textSecondary }}
                  className="text-sm"
                >
                  $0.00
                </ThemedText>
              </View>
            </View>

            {/* Transaction Hash */}
            {txHash && (
              <>
                <View
                  className="h-px"
                  style={{ backgroundColor: Colors.dark.cardSecondary }}
                />
                <View className="flex-row justify-between items-center">
                  <ThemedText style={{ color: Colors.dark.textSecondary }}>
                    Transaction Hash
                  </ThemedText>
                  <TouchableOpacity onPress={handleViewTransaction}>
                    <ThemedText
                      type="defaultSemiBold"
                      style={{ color: Colors.dark.primary }}
                    >
                      {formatAddress(txHash)}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Updated Balance */}
        <View
          className="px-6 py-4 rounded-2xl mb-6"
          style={{ backgroundColor: Colors.dark.cardSecondary }}
        >
          <View className="flex-row justify-between items-center">
            <ThemedText style={{ color: Colors.dark.textSecondary }}>
              Updated Balance
            </ThemedText>
            <View className="flex-row items-center">
              <Image
                source={require("../assets/images/sui-logo-white.png")}
                className="size-4 mr-2"
              />
              <ThemedText type="defaultSemiBold">
                {balance.toFixed(4)} SUI
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Spacer */}
        <View className="flex-1" />

        {/* Action Buttons */}
        <View className="mb-6 space-y-3">
          {/* View Transaction Button */}
          {txHash && (
            <TouchableOpacity
              className="py-4 mb-4 rounded-2xl items-center border"
              style={{
                backgroundColor: Colors.dark.background,
                borderColor: Colors.dark.primary,
              }}
              onPress={handleViewTransaction}
            >
              <ThemedText
                type="defaultSemiBold"
                style={{
                  color: Colors.dark.primary,
                  fontSize: 16,
                }}
              >
                View on Explorer
              </ThemedText>
            </TouchableOpacity>
          )}

          {/* Done Button */}
          <TouchableOpacity
            className="py-4 rounded-2xl items-center"
            style={{
              backgroundColor: Colors.dark.primary,
            }}
            onPress={handleDone}
          >
            <ThemedText
              type="defaultSemiBold"
              style={{
                color: Colors.dark.background,
                fontSize: 16,
              }}
            >
              Done
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
