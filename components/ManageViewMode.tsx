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

interface SavedGesture {
  id: string;
  name: string;
  accuracy: number;
  trainedAt: string;
  dataPoints: number;
}

export default function ManageViewMode() {
  const { connectedDevice, sendMessage } = useBLEContext();

  const [testingGesture, setTestingGesture] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    gesture: string;
    confidence: number;
  } | null>(null);

  // Mock saved gestures - in a real app, this would come from storage/database
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

  const testGesture = (gestureName: string) => {
    if (!connectedDevice) {
      Alert.alert(
        "Device Not Connected",
        "Please connect your BLE device to test gestures.",
      );
      return;
    }

    setTestingGesture(gestureName);
    sendMessage(`test_gesture:${gestureName}`);

    // Simulate gesture recognition
    setTimeout(() => {
      const confidence = 75 + Math.random() * 20; // 75-95% confidence
      const recognizedCorrectly = confidence > 80;

      setTestResult({
        gesture: recognizedCorrectly ? gestureName : "Unknown",
        confidence: confidence,
      });

      setTimeout(() => {
        setTestingGesture(null);
        setTestResult(null);
      }, 3000);
    }, 2000);
  };

  const deleteGesture = (gestureId: string) => {
    const gesture = savedGestures.find((g) => g.id === gestureId);
    if (!gesture) return;

    Alert.alert(
      "Delete Gesture",
      `Are you sure you want to delete "${gesture.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setSavedGestures((prev) => prev.filter((g) => g.id !== gestureId));
          },
        },
      ],
    );
  };

  return (
    <View>
      {/* Test Result Modal */}
      {testResult && (
        <View
          className="px-5 py-4 rounded-3xl mb-6 shadow-sm"
          style={{
            backgroundColor:
              testResult.gesture !== "Unknown"
                ? Colors.dark.primary + "20"
                : "#ff6b6b20",
          }}
        >
          <View className="flex-row items-center gap-x-3">
            <Ionicons
              name={
                testResult.gesture !== "Unknown"
                  ? "checkmark-circle"
                  : "close-circle"
              }
              color={
                testResult.gesture !== "Unknown"
                  ? Colors.dark.primary
                  : "#ff6b6b"
              }
              size={24}
            />
            <View className="flex-1">
              <ThemedText
                style={{
                  color:
                    testResult.gesture !== "Unknown"
                      ? Colors.dark.primary
                      : "#ff6b6b",
                  fontWeight: "600",
                }}
              >
                {testResult.gesture !== "Unknown"
                  ? `Recognized: ${testResult.gesture}`
                  : "Gesture not recognized"}
              </ThemedText>
              <ThemedText
                style={{
                  color: Colors.dark.textSecondary,
                  fontSize: 12,
                }}
              >
                Confidence: {testResult.confidence.toFixed(1)}%
              </ThemedText>
            </View>
          </View>
        </View>
      )}

      {savedGestures.length === 0 ? (
        <View
          className="px-6 py-8 rounded-3xl shadow-lg items-center"
          style={{ backgroundColor: Colors.dark.card }}
        >
          <Ionicons
            name="hand-left-outline"
            color={Colors.dark.textSecondary}
            size={48}
            style={{ marginBottom: 16 }}
          />
          <ThemedText type="subtitle" className="mb-2">
            No Gestures Yet
          </ThemedText>
          <ThemedText
            className="text-center mb-6"
            style={{ color: Colors.dark.textSecondary }}
          >
            Train your first gesture to get started with gesture recognition.
          </ThemedText>
          <TouchableOpacity
            className="px-6 py-3 rounded-2xl"
            style={{ backgroundColor: Colors.dark.primary }}
            // onPress={() => setViewMode("train")}
          >
            <ThemedText
              style={{ color: Colors.dark.background, fontWeight: "600" }}
            >
              Train First Gesture
            </ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {savedGestures.map((gesture) => (
            <View
              key={gesture.id}
              className="px-6 py-5 rounded-3xl mb-4 shadow-lg"
              style={{ backgroundColor: Colors.dark.card }}
            >
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1">
                  <ThemedText
                    type="defaultSemiBold"
                    className="mb-1"
                    style={{ fontSize: 18 }}
                  >
                    {gesture.name}
                  </ThemedText>
                  <ThemedText
                    style={{
                      color: Colors.dark.textSecondary,
                      fontSize: 12,
                    }}
                  >
                    Trained on {gesture.trainedAt} • {gesture.dataPoints}{" "}
                    samples
                  </ThemedText>
                </View>
                <View
                  className="px-3 py-1 rounded-xl"
                  style={{
                    backgroundColor:
                      gesture.accuracy > 90
                        ? Colors.dark.primary + "20"
                        : Colors.dark.cardSecondary,
                  }}
                >
                  <ThemedText
                    style={{
                      color:
                        gesture.accuracy > 90
                          ? Colors.dark.primary
                          : Colors.dark.text,
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    {gesture.accuracy.toFixed(1)}%
                  </ThemedText>
                </View>
              </View>

              <View className="flex-row gap-x-3">
                <TouchableOpacity
                  className="flex-1 justify-center items-center py-3 rounded-xl"
                  style={{
                    backgroundColor:
                      testingGesture === gesture.name
                        ? Colors.dark.cardSecondary
                        : Colors.dark.primary,
                    opacity: !connectedDevice || testingGesture ? 0.6 : 1,
                  }}
                  onPress={() => testGesture(gesture.name)}
                  disabled={!connectedDevice || testingGesture !== null}
                >
                  {testingGesture === gesture.name ? (
                    <View className="flex-row items-center gap-x-2">
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
                        Testing...
                      </ThemedText>
                    </View>
                  ) : (
                    <ThemedText
                      style={{
                        color:
                          !connectedDevice || testingGesture
                            ? Colors.dark.textSecondary
                            : Colors.dark.background,
                        fontWeight: "600",
                        fontSize: 14,
                      }}
                    >
                      Test
                    </ThemedText>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  className="px-4 py-3 rounded-xl"
                  style={{ backgroundColor: Colors.dark.cardSecondary }}
                  onPress={() => {}}
                >
                  <Ionicons name="refresh" color={Colors.dark.text} size={16} />
                </TouchableOpacity>

                <TouchableOpacity
                  className="px-4 py-3 rounded-xl"
                  style={{ backgroundColor: Colors.dark.cardSecondary }}
                  onPress={() => deleteGesture(gesture.id)}
                >
                  <Ionicons name="trash-outline" color="#ff6b6b" size={16} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Add New Gesture Button */}
          <TouchableOpacity
            className="px-6 py-4 rounded-3xl shadow-lg items-center"
            style={{ backgroundColor: Colors.dark.cardSecondary }}
            // onPress={() => setViewMode("train")}
          >
            <View className="flex-row items-center gap-x-3">
              <Ionicons
                name="add-circle"
                color={Colors.dark.primary}
                size={24}
              />
              <ThemedText
                style={{ color: Colors.dark.primary, fontWeight: "600" }}
              >
                Train New Gesture
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
