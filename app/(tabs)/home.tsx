import {
  SafeAreaView,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { ThemedText } from "../../components/ThemedText";
import { Colors } from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useBLEContext } from "../../providers/BLEContext";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { useAuthContext } from "../../providers/AuthProvider";

export default function Index() {
  const { balance, suiUsdPrice, fetchBalanceAndPrice, user } = useAuthContext();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBalanceAndPrice();
    setRefreshing(false);
  };

  return (
    <SafeAreaView
      className="flex-1 pt-16 px-5"
      style={{ backgroundColor: Colors.dark.background }}
    >
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.dark.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mb-8">
          <View
            className="px-3 py-3 rounded-2xl shadow-sm"
            style={{ backgroundColor: Colors.dark.cardSecondary }}
          >
            <Image
              source={require("../../assets/images/sui-logo-white.png")}
              className="size-8"
            />
          </View>

          <View
            className="px-4 py-3 rounded-2xl shadow-sm"
            style={{ backgroundColor: Colors.dark.cardSecondary }}
          >
            <ThemedText
              className="text-center"
              type="defaultSemiBold"
              style={{ color: Colors.dark.textSecondary }}
            >
              {"0x" + user?.slice(0, 4) + "..." + user?.slice(-4)}
            </ThemedText>
          </View>
        </View>

        {/* Portfolio Card */}
        <View
          className="px-6 py-6 rounded-3xl mb-6 shadow-lg"
          style={{ backgroundColor: Colors.dark.card }}
        >
          <ThemedText
            className="mb-2"
            style={{ color: Colors.dark.textSecondary }}
          >
            Total Portfolio
          </ThemedText>
          <ThemedText
            className="py-4 mb-4"
            type="title"
            style={{ fontSize: 36 }}
          >
            {!balance || !suiUsdPrice
              ? "--.--"
              : `$${(balance * suiUsdPrice).toFixed(2)}`}
          </ThemedText>

          <View className="flex-row justify-between items-center gap-x-4">
            <TouchableOpacity
              className="flex-grow justify-center items-center py-5 rounded-2xl"
              style={{ backgroundColor: Colors.dark.primary }}
              onPress={() => {
                router.navigate("/send");
              }}
            >
              <Ionicons
                name="paper-plane"
                color={Colors.dark.background}
                size={28}
              />
              <ThemedText
                className="mt-2"
                style={{ color: Colors.dark.background, fontWeight: "600" }}
              >
                Send
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-grow justify-center items-center py-5 rounded-2xl"
              style={{ backgroundColor: Colors.dark.cardSecondary }}
            >
              <Ionicons name="qr-code" color={Colors.dark.text} size={28} />
              <ThemedText className="mt-2" style={{ fontWeight: "600" }}>
                Receive
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Assets Header */}
        <View className="mb-4">
          <ThemedText
            type="subtitle"
            style={{ color: Colors.dark.textSecondary }}
          >
            Assets
          </ThemedText>
        </View>

        {/* Sui Token Card */}
        <View
          className="px-5 py-5 rounded-3xl shadow-sm"
          style={{ backgroundColor: Colors.dark.card }}
        >
          <View className="flex-row justify-between items-center">
            <View className="flex-row gap-x-4 items-center flex-1">
              <View
                className="px-3 py-3 rounded-2xl"
                style={{ backgroundColor: Colors.dark.primary }}
              >
                <Image
                  source={require("../../assets/images/sui-logo-white.png")}
                  className="size-8"
                />
              </View>

              <View className="flex-1">
                <ThemedText type="defaultSemiBold" className="mb-1">
                  Sui
                </ThemedText>
                <ThemedText
                  type="link"
                  style={{ color: Colors.dark.textSecondary }}
                >
                  {suiUsdPrice ? `$${suiUsdPrice.toFixed(3)}` : "--.--"}
                </ThemedText>
              </View>
            </View>

            <View className="items-end">
              <ThemedText type="defaultSemiBold" className="mb-1">
                {!balance || !suiUsdPrice
                  ? "--.--"
                  : `$${(balance * suiUsdPrice).toFixed(2)}`}
              </ThemedText>
              <ThemedText
                type="link"
                style={{ color: Colors.dark.textSecondary }}
              >
                {balance ? `${balance.toFixed(3)} SUI` : "_"}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Add some bottom padding */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
