import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { Colors } from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useBLEContext } from "../../providers/BLEContext";
import { useTrainingContext } from "../../providers/TrainingProvider";

export default function TrainCollectView() {
  const { connectedDevice } = useBLEContext();
  const {
    trainingState,
    startDataCollection,
    allGesturesComplete,
    processData,
  } = useTrainingContext();
  return (
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
        Collect data for each gesture by performing them repeatedly. Aim for
        consistent, clear movements.
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
                name={gesture.isComplete ? "checkmark-circle" : "hand-left"}
                color={
                  gesture.isComplete ? Colors.dark.primary : Colors.dark.text
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
                <ActivityIndicator color={Colors.dark.text} size="small" />
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
  );
}
