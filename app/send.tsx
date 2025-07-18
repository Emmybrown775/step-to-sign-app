import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/Colors";
import { ThemedText } from "../components/ThemedText";
import { Image, TextInput, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomButton from "../components/CustomButton";
import { useState } from "react";
import { useAuthContext } from "../providers/AuthProvider";
import { useBLEContext } from "../providers/BLEContext";
import { Transaction } from "@mysten/sui/transactions";
import { Buffer } from "buffer";
import { STATE } from "../hooks/useBluetooth";

export default function Send() {
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const { balance, user, suiUsdPrice } = useAuthContext();
  const { client, sendMessage, systemState, changeState } = useBLEContext();

  const handlePercentagePress = (percentage) => {
    if (percentage === "Max") {
      setAmount(balance.toString());
    } else {
      const percent = parseInt(percentage) / 100;
      setAmount((balance * percent).toFixed(4));
    }
  };

  const generateMessageHex = async () => {
    try {
      const tx = new Transaction();

      const amountInSui = parseFloat(amount);
      const amountInMist = Math.floor(amountInSui * 1000000000);
      const [coin] = tx.splitCoins(tx.gas, [amountInMist]);
      tx.setSender(user);
      tx.transferObjects([coin], recipient);

      const txBytes = await tx.build({ client });

      const txString = Buffer.from(txBytes).toString("hex");
      sendMessage("<msg" + txString + ">");
      changeState(STATE.AWAITING_SIG);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SafeAreaView
      className="flex-1 px-6"
      style={{
        backgroundColor: Colors.dark.background,
      }}
    >
      <View className="flex-1">
        {/* Token Selection Header */}
        <View className="flex-row justify-between items-center mb-8">
          <TouchableOpacity
            className="flex-row items-center px-4 py-3 rounded-2xl"
            style={{ backgroundColor: Colors.dark.card }}
          >
            <View className="px-2 py-2 rounded-full mr-2">
              <Image
                source={require("../assets/images/sui-logo-white.png")}
                className="size-5"
              />
            </View>
            <ThemedText type="defaultSemiBold" className="mr-2">
              Sui
            </ThemedText>
            <Ionicons
              name="chevron-down"
              size={18}
              color={Colors.dark.textSecondary}
            />
          </TouchableOpacity>

          <View className="flex-row items-center gap-2">
            <Ionicons
              name="wallet-outline"
              size={16}
              color={Colors.dark.textSecondary}
            />
            <ThemedText style={{ color: Colors.dark.textSecondary }}>
              {balance.toFixed(4)} SUI
            </ThemedText>
          </View>
        </View>

        {/* Amount Input Section */}
        <View className="mb-6">
          <View className="items-center mb-2">
            <TextInput
              placeholder="0"
              value={amount}
              onChangeText={setAmount}
              className="text-6xl font-bold text-center"
              placeholderTextColor={Colors.dark.textSecondary}
              style={{ color: Colors.dark.text, minWidth: 100 }}
              keyboardType="numeric"
              cursorColor={Colors.dark.primary}
            />
          </View>

          <View className="items-center mb-6">
            <ThemedText
              className="text-xl"
              style={{ color: Colors.dark.textSecondary }}
            >
              $0.00
            </ThemedText>
          </View>

          {/* Percentage Buttons */}
          <View className="flex-row gap-x-3">
            {["25%", "50%", "Max"].map((percentage) => (
              <TouchableOpacity
                key={percentage}
                className="flex-1 py-3 rounded-2xl items-center"
                style={{ backgroundColor: Colors.dark.cardSecondary }}
                onPress={() => handlePercentagePress(percentage)}
              >
                <ThemedText
                  type="defaultSemiBold"
                  style={{ color: Colors.dark.primary }}
                >
                  {percentage}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Divider */}
        <View
          className="h-px my-8"
          style={{ backgroundColor: Colors.dark.cardSecondary }}
        />

        {/* Recipient Section */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-6">
            <ThemedText type="defaultSemiBold">To</ThemedText>
            <TouchableOpacity className="flex-row items-center gap-2">
              <Ionicons name="scan" size={16} color={Colors.dark.primary} />
              <ThemedText style={{ color: Colors.dark.primary }}>
                Scan QR
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View
            className="px-4 py-4 rounded-2xl"
            style={{ backgroundColor: Colors.dark.card }}
          >
            <TextInput
              placeholder="Enter recipient address"
              value={recipient}
              onChangeText={setRecipient}
              multiline
              className="text-base"
              placeholderTextColor={Colors.dark.textSecondary}
              style={{
                color: Colors.dark.text,
                minHeight: 50,
                textAlignVertical: "top",
              }}
              cursorColor={Colors.dark.primary}
            />
          </View>
        </View>

        {/* Spacer */}
        <View className="flex-1" />

        {/* Bottom Section with Gas Fees and Send Button */}
        <View
          className="px-6 py-6 rounded-3xl mb-6"
          style={{ backgroundColor: Colors.dark.card }}
        >
          <View className="flex-row justify-between items-center mb-6">
            <ThemedText type="defaultSemiBold">Estimated Gas Fees</ThemedText>
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

          <TouchableOpacity
            className="py-4 rounded-2xl items-center"
            style={{
              backgroundColor:
                amount && recipient
                  ? Colors.dark.primary
                  : Colors.dark.cardSecondary,
              opacity: amount && recipient ? 1 : 0.5,
            }}
            disabled={!amount || !recipient || systemState != STATE.IDLE}
            onPress={() => generateMessageHex()}
          >
            <ThemedText
              type="defaultSemiBold"
              style={{
                color:
                  amount && recipient
                    ? Colors.dark.background
                    : Colors.dark.textSecondary,
                fontSize: 16,
              }}
            >
              {systemState == STATE.IDLE ? "Send" : ""}
              {systemState == STATE.AWAITING_SIG ? "Awaiting Sig..." : ""}
              {systemState == STATE.BROADCASTING_TX ? "Broadcasting" : ""}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
