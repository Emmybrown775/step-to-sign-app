import {
  SafeAreaView,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from "react-native";
import { ThemedText } from "../components/ThemedText";
import { Colors } from "../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import { useBLEContext } from "../providers/BLEContext";
import TrainViewMode from "../components/TrainViewMode";
import ManageViewMode from "../components/ManageViewMode";
import { useTrainingContext } from "../providers/TrainingProvider";

type ViewMode = "train" | "manage";

export default function TrainModel() {
  const { connectedDevice, sendMessage, clearIMUData, clearTrainingData } =
    useBLEContext();
  const { resetTraining } = useTrainingContext();

  const [viewMode, setViewMode] = useState<ViewMode>("train");

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
            Gesture Training
          </ThemedText>

          <View className="w-12" />
        </View>

        {/* View Mode Toggle */}
        <View
          className="p-1 rounded-2xl mb-6 shadow-sm"
          style={{ backgroundColor: Colors.dark.cardSecondary }}
        >
          <View className="flex-row">
            <TouchableOpacity
              className="flex-1 py-3 rounded-xl"
              style={{
                backgroundColor:
                  viewMode === "train" ? Colors.dark.primary : "transparent",
              }}
              onPress={() => setViewMode("train")}
            >
              <ThemedText
                className="text-center font-semibold"
                style={{
                  color:
                    viewMode === "train"
                      ? Colors.dark.background
                      : Colors.dark.textSecondary,
                }}
              >
                Train New
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-3 rounded-xl"
              style={{
                backgroundColor:
                  viewMode === "manage" ? Colors.dark.primary : "transparent",
              }}
              onPress={() => setViewMode("manage")}
            >
              <ThemedText
                className="text-center font-semibold"
                style={{
                  color:
                    viewMode === "manage"
                      ? Colors.dark.background
                      : Colors.dark.textSecondary,
                }}
              >
                Manage ({3})
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Connection Status */}
        <View
          className="px-5 py-4 rounded-3xl mb-6 shadow-sm"
          style={{
            backgroundColor: connectedDevice
              ? Colors.dark.primary + "20"
              : Colors.dark.cardSecondary,
          }}
        >
          <View className="flex-row items-center gap-x-3">
            <Ionicons
              name={connectedDevice ? "bluetooth" : "bluetooth-outline"}
              color={
                connectedDevice
                  ? Colors.dark.primary
                  : Colors.dark.textSecondary
              }
              size={24}
            />
            <ThemedText
              style={{
                color: connectedDevice
                  ? Colors.dark.primary
                  : Colors.dark.textSecondary,
              }}
            >
              {connectedDevice ? "Device Connected" : "Device Not Connected"}
            </ThemedText>
          </View>
        </View>

        {viewMode === "train" ? (
          <TrainViewMode />
        ) : (
          /* Manage Gestures View */
          <ManageViewMode />
        )}

        {/* Add some bottom padding */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
