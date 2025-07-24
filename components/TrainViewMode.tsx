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
import * as FileSystem from "expo-file-system";

interface TrainingState {
  step: TrainingStep;
  progress: number;
  isTraining: boolean;
  modelAccuracy: number | null;
  gestureList: GestureTrainingData[];
  currentlyCollecting: string | null;
}

interface GestureTrainingData {
  name: string;
  dataCollected: number;
  isComplete: boolean;
  targetSamples: number;
}

interface SavedGesture {
  id: string;
  name: string;
  accuracy: number;
  trainedAt: string;
  dataPoints: number;
}

type TrainingStep = "setup" | "collect" | "process" | "train" | "complete";

export default function TrainViewMode() {
  const {
    connectedDevice,
    sendMessage,
    currentTrainingSession,
    startTrainingSession,
    stopTrainingSession,
    getTrainingSessionProgress,
    getAllImuData,
    sendControlMessage,
    sendTransferMessage,
  } = useBLEContext();

  const [newGestureName, setNewGestureName] = useState("");
  const [collectingData, setCollectingData] = useState(false);

  const [trainingState, setTrainingState] = useState<TrainingState>({
    step: "setup",
    progress: 0,
    isTraining: false,
    modelAccuracy: null,
    gestureList: [],
    currentlyCollecting: null,
  });

  const [savedGestures, setSavedGestures] = useState<SavedGesture[]>([
    {
      id: "1",
      name: "Wave",
      accuracy: 92.3,
      trainedAt: "2024-01-15",
      dataPoints: 1000,
    },
    {
      id: "2",
      name: "Fist Bump",
      accuracy: 87.6,
      trainedAt: "2024-01-14",
      dataPoints: 1200,
    },
    {
      id: "3",
      name: "Thumbs Up",
      accuracy: 94.1,
      trainedAt: "2024-01-13",
      dataPoints: 950,
    },
  ]);

  useEffect(() => {
    if (currentTrainingSession) {
      const progress = getTrainingSessionProgress();

      // Update the gesture in our training list
      setTrainingState((prev) => ({
        ...prev,
        gestureList: prev.gestureList.map((gesture) =>
          gesture.name === currentTrainingSession.gestureName
            ? {
                ...gesture,
                dataCollected: currentTrainingSession.data.length,
                isComplete:
                  currentTrainingSession.data.length >= gesture.targetSamples,
              }
            : gesture,
        ),
        currentlyCollecting: currentTrainingSession.gestureName,
      }));

      // Auto-complete when target is reached
      if (progress >= 100) {
        setCollectingData(false);
        setTrainingState((prev) => ({
          ...prev,
          currentlyCollecting: null,
        }));
      }
    } else {
      // No active session
      if (collectingData) {
        setCollectingData(false);
        setTrainingState((prev) => ({
          ...prev,
          currentlyCollecting: null,
        }));
      }
    }
  }, [currentTrainingSession, getTrainingSessionProgress]);

  const addGestureToList = () => {
    if (!newGestureName.trim()) {
      Alert.alert(
        "Gesture Name Required",
        "Please enter a name for your gesture.",
      );
      return;
    }

    // Check if gesture already exists in current list
    if (
      trainingState.gestureList.some(
        (g) => g.name.toLowerCase() === newGestureName.toLowerCase(),
      )
    ) {
      Alert.alert(
        "Gesture Already Added",
        "This gesture is already in your training list.",
      );
      return;
    }

    const newGesture: GestureTrainingData = {
      name: newGestureName.trim(),
      dataCollected: 0,
      isComplete: false,
      targetSamples: 1000,
    };

    setTrainingState((prev) => ({
      ...prev,
      gestureList: [...prev.gestureList, newGesture],
    }));

    setNewGestureName("");
  };

  const removeGestureFromList = (gestureName: string) => {
    setTrainingState((prev) => ({
      ...prev,
      gestureList: prev.gestureList.filter((g) => g.name !== gestureName),
    }));
  };

  const startCollectionPhase = () => {
    if (trainingState.gestureList.length === 0) {
      Alert.alert(
        "No Gestures Added",
        "Please add at least one gesture before starting collection.",
      );
      return;
    }

    setTrainingState((prev) => ({
      ...prev,
      step: "collect",
    }));
  };

  const startDataCollection = async (gestureName: string) => {
    if (!connectedDevice) {
      Alert.alert(
        "Device Not Connected",
        "Please connect your BLE device before starting data collection.",
      );
      return;
    }

    if (currentTrainingSession) {
      Alert.alert(
        "Collection In Progress",
        "Please wait for the current gesture collection to complete.",
      );
      return;
    }

    try {
      setCollectingData(true);

      const gesture = trainingState.gestureList.find(
        (g) => g.name === gestureName,
      );
      const targetSamples = gesture.targetSamples || 1000;

      await startTrainingSession(gestureName, targetSamples);

      console.log(`Started data collection for ${gestureName}`);
    } catch (error) {
      console.error("Error starting data collection:", error);
      setCollectingData(false);
      Alert.alert(
        "Collection Error",
        "Failed to start data collection. Please try again.",
      );
    }
  };

  const stopDataCollection = async () => {
    if (currentTrainingSession) {
      try {
        await stopTrainingSession();
        console.log("Data collection stopped manually");
      } catch (error) {
        console.error("Error stopping data collection:", error);
      }
    }
  };

  const allGesturesComplete = trainingState.gestureList.every(
    (g) => g.isComplete,
  );

  const processData = async () => {
    setTrainingState((prev) => ({
      ...prev,
      step: "process",
      isTraining: true,
      progress: 0,
    }));

    try {
      const data = getAllImuData();
      const headers = Object.keys(data[0]);
      const rows = data.map((row) => headers.map((h) => row[h]).join(","));
      const csvContent = [headers.join(","), ...rows].join("\n");

      const fileUri = FileSystem.documentDirectory + "temp.csv";
      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      const formData = new FormData();
      formData.append("file", {
        uri: fileUri,
        name: "temp.csv",
        type: "text/csv",
      } as any); // <-- TS fix

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);

      const response = await fetch(
        "https://da2407fb0ec2.ngrok-free.app/train",
        {
          method: "POST",
          body: formData,
          signal: controller.signal,
        },
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error("Upload failed:", response.status);
        const errorText = await response.text();
        console.error(errorText);
        return;
      }

      console.log("asksakasjKASJ");

      const result = await response.json();
      const hFileBase64 = result.model_h;
      await FileSystem.writeAsStringAsync(
        FileSystem.documentDirectory + "gesture_model.h",
        hFileBase64,
        {
          encoding: FileSystem.EncodingType.Base64,
        },
      );
      console.log("Model + metadata received:", result.classes);

      setTrainingState((prev) => ({
        ...prev,
        step: "train",
        isTraining: false,
        progress: 100,
      }));
    } catch (error) {
      setTrainingState((prev) => ({
        ...prev,
        step: "process",
        isTraining: false,
        progress: 0,
      }));
      console.log(error);
    }
  };

  const trainModel = async () => {
    setTrainingState((prev) => ({
      ...prev,
      step: "train",
      isTraining: true,
      progress: 0,
    }));

    try {
      const fileUri = FileSystem.documentDirectory + "gesture_model.h";

      // Read file as base64 (safe for React Native)
      const base64Data = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const chunkSize = 8 * 1024; // 8KB chunks (in bytes, after decoding)
      const totalChunks = Math.ceil(base64Data.length / chunkSize);
      const fileSize = Math.floor((base64Data.length * 3) / 4); // actual decoded size

      console.log(
        `Uploading file of size: ${fileSize} bytes (${totalChunks} chunks)`,
      );

      const ESP32_IP = "http://192.168.4.1"; // no need for :80

      // Step 1: Start upload session
      console.log("Starting upload session...");
      const startResponse = await fetch(`${ESP32_IP}/upload_start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: "gesture_model.h",
          totalSize: fileSize - 1,
        }),
      });

      if (!startResponse.ok) {
        throw new Error(`Failed to start upload: ${startResponse.status}`);
      }

      console.log("Upload session started, sending chunks...");

      // Step 2: Send chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, base64Data.length);
        const chunk = base64Data.slice(start, end);

        console.log(
          `Sending chunk ${i + 1}/${totalChunks} (${chunk.length} base64 chars)`,
        );

        const chunkResponse = await fetch(`${ESP32_IP}/upload_chunk`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chunk, // send as base64 string
            chunkIndex: i,
            filename: "gesture_model.h",
          }),
        });

        if (!chunkResponse.ok) {
          throw new Error(`Chunk ${i + 1} failed: ${chunkResponse.status}`);
        }

        // Update progress (90% for upload, 10% for finalization)
        const progress = ((i + 1) / totalChunks) * 90;
        setTrainingState((prev) => ({
          ...prev,
          progress,
        }));

        // Small delay so ESP32 isn't overwhelmed
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      console.log("All chunks sent, finalizing upload...");

      // Step 3: Finish upload
      const finishResponse = await fetch(`${ESP32_IP}/upload_finish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filename: "gesture_model.h" }),
      });

      if (!finishResponse.ok) {
        throw new Error(`Failed to finish upload: ${finishResponse.status}`);
      }

      console.log("File transfer completed successfully");

      setTrainingState((prev) => ({
        ...prev,
        step: "complete",
        isTraining: false,
        progress: 100,
      }));
    } catch (error) {
      console.error("File transfer failed", error);
      setTrainingState((prev) => ({
        ...prev,
        step: "train",
        isTraining: false,
        progress: 0,
      }));
    }
  };

  const saveGestures = () => {
    if (trainingState.modelAccuracy) {
      const newGestures: SavedGesture[] = trainingState.gestureList.map(
        (gesture) => ({
          id: `${Date.now()}-${gesture.name}`,
          name: gesture.name,
          accuracy: trainingState.modelAccuracy! + (Math.random() - 0.5) * 4, // Slight variation per gesture
          trainedAt: new Date().toISOString().split("T")[0],
          dataPoints: gesture.dataCollected,
        }),
      );

      // Remove existing gestures with same names if retraining
      const gestureNames = trainingState.gestureList.map((g) =>
        g.name.toLowerCase(),
      );
      const updatedGestures = savedGestures.filter(
        (g) => !gestureNames.includes(g.name.toLowerCase()),
      );

      setSavedGestures([...newGestures, ...updatedGestures]);
      resetTraining();

      const gestureList = trainingState.gestureList
        .map((g) => g.name)
        .join(", ");
      Alert.alert(
        "Gestures Saved!",
        `${trainingState.gestureList.length} gestures (${gestureList}) have been saved to your gesture library.`,
      );
    }
  };

  const getStepOrder = (step: TrainingStep): number => {
    const order = { setup: 0, collect: 1, process: 2, train: 3, complete: 4 };
    return order[step];
  };

  const getStepColor = (step: TrainingStep, currentStep: TrainingStep) => {
    const isActive = step === currentStep;
    const isCompleted = getStepOrder(step) < getStepOrder(currentStep);

    if (isCompleted || currentStep === "complete") return Colors.dark.primary;
    if (isActive) return Colors.dark.primary;
    return Colors.dark.textSecondary;
  };

  const getStepIcon = (step: TrainingStep, currentStep: TrainingStep) => {
    const isActive = step === currentStep;
    const isCompleted = getStepOrder(step) < getStepOrder(currentStep);

    if (isCompleted) return "checkmark-circle";
    if (isActive) return "ellipse";
    return "ellipse-outline";
  };

  const resetTraining = () => {
    setTrainingState({
      step: "setup",
      progress: 0,
      isTraining: false,
      modelAccuracy: null,
      gestureList: [],
      currentlyCollecting: null,
    });
    setNewGestureName("");
  };

  const getTotalProgress = () => {
    if (trainingState.step === "setup") return 0;
    if (trainingState.step === "collect") {
      const totalExpected = trainingState.gestureList.length * 1000;
      const totalCollected = trainingState.gestureList.reduce(
        (sum, g) => sum + g.dataCollected,
        0,
      );
      return (totalCollected / totalExpected) * 100;
    }
    return trainingState.progress;
  };

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
        {trainingState.step === "setup" && (

        )}

        {trainingState.step === "collect" && (
          <View>
            <ThemedText type="subtitle" className="mb-4">
              Collect Gesture Data
            </ThemedText>
            <ThemedText
              className="mb-6"
              style={{
                color: Colors.dark.textSecondary,
                lineHeight: 22,
              }}
            >
              Collect data for each gesture by performing them repeatedly. Aim
              for consistent, clear movements.
            </ThemedText>

            {/* Gesture Collection List */}
            {trainingState.gestureList.map((gesture) => (
              <View
                key={gesture.name}
                className="px-4 py-4 mb-4 rounded-2xl"
                style={{
                  backgroundColor: gesture.isComplete
                    ? Colors.dark.primary + "20"
                    : Colors.dark.cardSecondary,
                }}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-x-3">
                    <Ionicons
                      name={
                        gesture.isComplete ? "checkmark-circle" : "hand-left"
                      }
                      color={
                        gesture.isComplete
                          ? Colors.dark.primary
                          : Colors.dark.text
                      }
                      size={24}
                    />
                    <ThemedText style={{ fontWeight: "600" }}>
                      {gesture.name}
                    </ThemedText>
                  </View>
                  <ThemedText
                    style={{
                      color: gesture.isComplete
                        ? Colors.dark.primary
                        : Colors.dark.textSecondary,
                      fontWeight: "600",
                    }}
                  >
                    {gesture.dataCollected}/1000
                  </ThemedText>
                </View>

                {/* Progress bar for this gesture */}
                <View
                  className="h-1.5 rounded-full mb-3"
                  style={{ backgroundColor: Colors.dark.background }}
                >
                  <View
                    className="h-1.5 rounded-full"
                    style={{
                      backgroundColor: gesture.isComplete
                        ? Colors.dark.primary
                        : Colors.dark.textSecondary,
                      width: `${(gesture.dataCollected / 1000) * 100}%`,
                    }}
                  />
                </View>

                <TouchableOpacity
                  className="justify-center items-center py-3 rounded-xl"
                  style={{
                    backgroundColor: gesture.isComplete
                      ? Colors.dark.cardSecondary
                      : trainingState.currentlyCollecting === gesture.name
                        ? Colors.dark.cardSecondary
                        : Colors.dark.primary,
                    opacity: !connectedDevice || gesture.isComplete ? 0.5 : 1,
                  }}
                  onPress={() => startDataCollection(gesture.name)}
                  disabled={
                    !connectedDevice ||
                    gesture.isComplete ||
                    trainingState.currentlyCollecting !== null
                  }
                >
                  {trainingState.currentlyCollecting === gesture.name ? (
                    <View className="flex-row items-center gap-x-3">
                      <ActivityIndicator
                        color={Colors.dark.text}
                        size="small"
                      />
                      <ThemedText
                        style={{
                          color: Colors.dark.text,
                          fontWeight: "600",
                          fontSize: 14,
                        }}
                      >
                        Collecting...
                      </ThemedText>
                    </View>
                  ) : (
                    <ThemedText
                      style={{
                        color: gesture.isComplete
                          ? Colors.dark.textSecondary
                          : !connectedDevice
                            ? Colors.dark.textSecondary
                            : Colors.dark.background,
                        fontWeight: "600",
                        fontSize: 14,
                      }}
                    >
                      {gesture.isComplete ? "Complete" : "Start Collection"}
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            ))}

            {allGesturesComplete && (
              <TouchableOpacity
                className="justify-center items-center py-4 rounded-2xl mt-4"
                style={{ backgroundColor: Colors.dark.primary }}
                onPress={processData}
              >
                <ThemedText
                  style={{
                    color: Colors.dark.background,
                    fontWeight: "600",
                  }}
                >
                  Process All Data
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}

        {trainingState.step === "process" && (
          <View>
            <ThemedText type="subtitle" className="mb-4">
              Processing Data
            </ThemedText>
            <ThemedText
              className="mb-6"
              style={{
                color: Colors.dark.textSecondary,
                lineHeight: 22,
              }}
            >
              Processing collected data from {trainingState.gestureList.length}{" "}
              gestures. This includes cleaning, normalization, and feature
              extraction for all gesture types.
            </ThemedText>

            {trainingState.isTraining && (
              <View className="items-center mb-6">
                <ActivityIndicator color={Colors.dark.primary} size="large" />
                <ThemedText
                  className="mt-3"
                  style={{ color: Colors.dark.textSecondary }}
                >
                  Processing: {trainingState.progress.toFixed(0)}%
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {trainingState.step === "train" && (
          <View>
            <ThemedText type="subtitle" className="mb-4">
              Training Model
            </ThemedText>
            <ThemedText
              className="mb-6"
              style={{
                color: Colors.dark.textSecondary,
                lineHeight: 22,
              }}
            >
              Training a multi-gesture recognition model for{" "}
              {trainingState.gestureList.map((g) => g.name).join(", ")}. This
              creates a model that can distinguish between all your gestures.
            </ThemedText>

            <TouchableOpacity
              className="justify-center items-center py-4 rounded-2xl"
              style={{ backgroundColor: Colors.dark.primary }}
              onPress={trainModel}
              disabled={trainingState.isTraining}
            >
              {trainingState.isTraining ? (
                <View className="flex-row items-center gap-x-3">
                  <ActivityIndicator color={Colors.dark.background} />
                  <ThemedText
                    style={{
                      color: Colors.dark.background,
                      fontWeight: "600",
                    }}
                  >
                    Training... {trainingState.progress.toFixed(0)}%
                  </ThemedText>
                </View>
              ) : (
                <ThemedText
                  style={{
                    color: Colors.dark.background,
                    fontWeight: "600",
                  }}
                >
                  Start Model Training
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        )}

        {trainingState.step === "complete" && (
          <View>
            <View className="items-center mb-6">
              <View
                className="px-4 py-4 rounded-full mb-4"
                style={{
                  backgroundColor: Colors.dark.primary + "20",
                }}
              >
                <Ionicons
                  name="checkmark-circle"
                  color={Colors.dark.primary}
                  size={48}
                />
              </View>
              <ThemedText type="subtitle" className="mb-2">
                Training Complete!
              </ThemedText>
              <ThemedText
                className="text-center"
                style={{ color: Colors.dark.textSecondary }}
              >
                Your {trainingState.gestureList.length}-gesture model has been
                successfully trained
              </ThemedText>
            </View>

            {trainingState.modelAccuracy && (
              <View
                className="px-4 py-4 rounded-2xl mb-6"
                style={{ backgroundColor: Colors.dark.cardSecondary }}
              >
                <View className="flex-row justify-between items-center">
                  <ThemedText style={{ color: Colors.dark.textSecondary }}>
                    Overall Model Accuracy
                  </ThemedText>
                  <ThemedText
                    type="defaultSemiBold"
                    style={{ color: Colors.dark.primary }}
                  >
                    {trainingState.modelAccuracy.toFixed(1)}%
                  </ThemedText>
                </View>
              </View>
            )}

            <View className="flex-row gap-x-4">
              <TouchableOpacity
                className="flex-1 justify-center items-center py-4 rounded-2xl"
                style={{ backgroundColor: Colors.dark.cardSecondary }}
                onPress={resetTraining}
              >
                <ThemedText style={{ fontWeight: "600" }}>
                  Train New Set
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 justify-center items-center py-4 rounded-2xl"
                style={{ backgroundColor: Colors.dark.primary }}
                onPress={saveGestures}
              >
                <ThemedText
                  style={{
                    color: Colors.dark.background,
                    fontWeight: "600",
                  }}
                >
                  Save All Gestures
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </>
  );
}
