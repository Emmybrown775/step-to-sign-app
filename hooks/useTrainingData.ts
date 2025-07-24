import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useBLEContext } from "../providers/BLEContext";
import * as FileSystem from "expo-file-system";
import { Colors } from "../constants/Colors";

export interface TrainingState {
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

export type TrainingStep =
  | "setup"
  | "collect"
  | "process"
  | "train"
  | "complete";
export function useTrainingData() {
  const {
    currentTrainingSession,
    getAllImuData,
    startTrainingSession,
    stopTrainingSession,
    getTrainingSessionProgress,
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
        "https://687c07dbe702.ngrok-free.app/train",
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

  return {
    newGestureName,
    setNewGestureName,
    addGestureToList,
    trainingState,
    removeGestureFromList,
    startCollectionPhase,
    startDataCollection,
    stopDataCollection,
    allGesturesComplete,
    processData,
    trainModel,
    resetTraining,
    saveGestures,
    getStepOrder,
    getStepColor,
    getStepIcon,
    getTotalProgress,
  };
}
