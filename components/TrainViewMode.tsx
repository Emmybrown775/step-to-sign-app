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
import TrainSetupView from "./train_views/TrainSetupView";
import TrainCollectView from "./train_views/TrainCollectView";
import TrainProcessView from "./train_views/TrainProcessView";
import TrainTrainingView from "./train_views/TrainTrainingView";
import TrainCompleteView from "./train_views/TrainCompleteView";
import { TrainingStep } from "../hooks/useTrainingData";
import { useTrainingContext } from "../providers/TrainingProvider";

export default function TrainViewMode() {
  const {
    getStepIcon,
    getStepColor,
    trainingState,
    getTotalProgress,
    resetTraining,
  } = useTrainingContext();

  useEffect(() => {
    resetTraining();
  }, []);

  return (
    <>
      {/* Progress Steps */}
      <View
        className="px-6 py-6 rounded-3xl mb-6 shadow-lg"
        style={{ backgroundColor: Colors.dark.card }}
      >
        <ThemedText type="subtitle" className="mb-6">
          Training Progress
        </ThemedText>

        {/* Step Indicators */}
        <View className="flex-row justify-between items-center mb-6">
          {(
            [
              "setup",
              "collect",
              "process",
              "train",
              "complete",
            ] as TrainingStep[]
          ).map((step, index) => (
            <View key={step} className="items-center flex-1">
              <Ionicons
                name={getStepIcon(step, trainingState.step) as any}
                color={getStepColor(step, trainingState.step)}
                size={28}
              />
              <ThemedText
                className="mt-2 text-center"
                style={{
                  color: getStepColor(step, trainingState.step),
                  fontSize: 11,
                }}
              >
                {step === "setup"
                  ? "Setup"
                  : step === "collect"
                    ? "Collect"
                    : step === "process"
                      ? "Process"
                      : step === "train"
                        ? "Train"
                        : "Complete"}
              </ThemedText>
            </View>
          ))}
        </View>

        {/* Progress Bar */}
        <View
          className="h-2 rounded-full mb-4"
          style={{ backgroundColor: Colors.dark.cardSecondary }}
        >
          <View
            className="h-2 rounded-full"
            style={{
              backgroundColor: Colors.dark.primary,
              width: `${getTotalProgress()}%`,
            }}
          />
        </View>
      </View>

      {/* Step Content */}
      <View
        className="px-6 py-6 rounded-3xl mb-6 shadow-lg"
        style={{ backgroundColor: Colors.dark.card }}
      >
        {trainingState.step === "setup" && <TrainSetupView />}

        {trainingState.step === "collect" && <TrainCollectView />}

        {trainingState.step === "process" && <TrainProcessView />}

        {trainingState.step === "train" && <TrainTrainingView />}

        {trainingState.step === "complete" && <TrainCompleteView />}
      </View>
    </>
  );
}
