import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { Colors } from "../../constants/Colors";
import { useTrainingContext } from "../../providers/TrainingProvider";

export default function TrainProcessView() {
  const { trainingState, processData } = useTrainingContext();
  return (
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
        gestures. This includes cleaning, normalization, and feature extraction
        for all gesture types.
      </ThemedText>

      <TouchableOpacity
        className="justify-center items-center py-4 rounded-2xl"
        style={{ backgroundColor: Colors.dark.primary }}
        onPress={processData}
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
              Processing... {trainingState.progress.toFixed(0)}%
            </ThemedText>
          </View>
        ) : (
          <ThemedText
            style={{
              color: Colors.dark.background,
              fontWeight: "600",
            }}
          >
            Process Data
          </ThemedText>
        )}
      </TouchableOpacity>
    </View>
  );
}
