import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { useBLEContext } from "../providers/BLEContext";
import { useEffect, useState } from "react";
import { ThemedText } from "../components/ThemedText";
import CustomButton from "../components/CustomButton";
import { router } from "expo-router";
import { Colors } from "../constants/Colors";
import { Ionicons } from "@expo/vector-icons";

export default function Index() {
  const {
    requestPermissions,
    checkBluetoothState,
    scanForPheripherals,
    connectedDevice,
    allDevices,
    connectToDevice,
    publicKey,
  } = useBLEContext();

  const [isScanning, setIsScanning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("");

  const scanForDevices = async () => {
    setIsScanning(true);
    setConnectionStatus("Requesting permissions...");

    const isPermissionEnabled = await requestPermissions();
    if (isPermissionEnabled) {
      setConnectionStatus("Checking Bluetooth...");
      checkBluetoothState();
      setConnectionStatus("Scanning for devices...");
      scanForPheripherals();
    } else {
      setConnectionStatus("Permission denied");
      setIsScanning(false);
    }
  };

  const handleDeviceConnect = async (device) => {
    setConnectionStatus(`Connecting to ${device.name}...`);
    try {
      await connectToDevice(device);
      setConnectionStatus("Connected! Getting public key...");
    } catch (error) {
      setConnectionStatus("Connection failed. Please try again.");
      setTimeout(() => setConnectionStatus(""), 3000);
    }
  };

  useEffect(() => {
    scanForDevices();
  }, []);

  useEffect(() => {
    if (publicKey) {
      setConnectionStatus("Success! Redirecting...");
      setTimeout(() => {
        router.replace("/(tabs)/home");
      }, 1000);
    }
  }, [publicKey]);

  useEffect(() => {
    if (allDevices.length > 0) {
      setIsScanning(false);
      setConnectionStatus("");
    }
  }, [allDevices]);

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: Colors.dark.background }}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.dark.background}
      />

      <View className="flex-1 px-6">
        {/* Header */}
        <View className="flex-1 justify-center items-center">
          <View
            className="p-8 rounded-3xl mb-8"
            style={{ backgroundColor: Colors.dark.card }}
          >
            <Image
              source={require("../assets/images/sui-logo-white.png")}
              className="size-24"
            />
          </View>

          <Text
            className="text-center mb-4 text-3xl font-bold"
            style={{ color: Colors.dark.text }}
          >
            Step To Sign
          </Text>

          <ThemedText
            className="text-center mb-12 text-base"
            style={{ color: Colors.dark.textSecondary }}
          >
            Connect your hardware wallet to continue
          </ThemedText>

          {/* Connection Status */}
          {connectedDevice ? (
            <View className="items-center">
              <View
                className="p-4 rounded-2xl mb-4"
                style={{ backgroundColor: Colors.dark.primary }}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={48}
                  color={Colors.dark.background}
                />
              </View>
              <ThemedText
                type="defaultSemiBold"
                className="mb-2"
                style={{ color: Colors.dark.primary }}
              >
                Connected to {connectedDevice.name}
              </ThemedText>
              <ThemedText
                className="text-center"
                style={{ color: Colors.dark.textSecondary }}
              >
                {publicKey
                  ? "Getting ready..."
                  : "Retrieving wallet information..."}
              </ThemedText>
              <ActivityIndicator
                className="mt-4"
                size="large"
                color={Colors.dark.primary}
              />
            </View>
          ) : (
            <View className="w-full items-center">
              {/* Scanning State */}
              {isScanning && (
                <View className="items-center mb-8">
                  <ActivityIndicator
                    size="large"
                    color={Colors.dark.primary}
                    className="mb-4"
                  />
                  <ThemedText
                    className="text-center"
                    style={{ color: Colors.dark.textSecondary }}
                  >
                    {connectionStatus}
                  </ThemedText>
                </View>
              )}

              {/* Device List */}
              {allDevices.length > 0 && (
                <View className="w-full">
                  <ThemedText
                    type="defaultSemiBold"
                    className="mb-4 text-center"
                  >
                    Available Devices
                  </ThemedText>

                  <ScrollView
                    className="max-h-60"
                    showsVerticalScrollIndicator={false}
                  >
                    {allDevices.map((device, index) => (
                      <TouchableOpacity
                        key={index}
                        className="flex-row items-center p-4 mb-3 rounded-2xl"
                        style={{ backgroundColor: Colors.dark.card }}
                        onPress={() => handleDeviceConnect(device)}
                      >
                        <View
                          className="p-3 rounded-xl mr-4"
                          style={{ backgroundColor: Colors.dark.cardSecondary }}
                        >
                          <Ionicons
                            name="hardware-chip"
                            size={24}
                            color={Colors.dark.primary}
                          />
                        </View>

                        <View className="flex-1">
                          <ThemedText type="defaultSemiBold" className="mb-1">
                            {device.name || "Unknown Device"}
                          </ThemedText>
                          <ThemedText
                            style={{ color: Colors.dark.textSecondary }}
                            className="text-sm"
                          >
                            {device.id}
                          </ThemedText>
                        </View>

                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={Colors.dark.textSecondary}
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Connection Status Message */}
              {connectionStatus && !isScanning && (
                <View className="mt-4">
                  <ThemedText
                    className="text-center"
                    style={{ color: Colors.dark.textSecondary }}
                  >
                    {connectionStatus}
                  </ThemedText>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Retry Button */}
        {!connectedDevice && !isScanning && allDevices.length === 0 && (
          <View className="pb-8">
            <TouchableOpacity
              className="py-4 rounded-2xl items-center"
              style={{ backgroundColor: Colors.dark.cardSecondary }}
              onPress={scanForDevices}
            >
              <ThemedText type="defaultSemiBold">Retry Scan</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Help Text */}
        <View className="pb-8">
          <ThemedText
            className="text-center text-sm"
            style={{ color: Colors.dark.textSecondary }}
          >
            Make sure your hardware wallet is powered on and in pairing mode
          </ThemedText>
        </View>
      </View>
    </SafeAreaView>
  );
}
