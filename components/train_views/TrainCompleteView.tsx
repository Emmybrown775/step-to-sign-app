import { TouchableOpacity, View } from "react-native";
import { Colors } from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { useTrainingContext } from "../../providers/TrainingProvider";

export default function TrainCompleteView() {
  const { trainingState, resetTraining, saveGestures } = useTrainingContext();
  return (
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
          <ThemedText style={{ fontWeight: "600" }}>Train New Set</ThemedText>
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
  );
}
