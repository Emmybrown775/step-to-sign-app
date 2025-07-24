import { TextInput, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { Colors } from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useTrainingContext } from "../../providers/TrainingProvider";

export default function TrainSetupView() {
  const {
    newGestureName,
    setNewGestureName,
    addGestureToList,
    trainingState,
    removeGestureFromList,
    startCollectionPhase,
  } = useTrainingContext();

  return (
    <View>
      <ThemedText type="subtitle" className="mb-4">
        Setup Gesture Training
      </ThemedText>
      <ThemedText
        className="mb-6"
        style={{
          color: Colors.dark.textSecondary,
          lineHeight: 22,
        }}
      >
        Add multiple gestures to train together. This creates a more robust
        model that can distinguish between different gestures.
      </ThemedText>

      {/* Add Gesture Input */}
      <View className="flex-row gap-x-3 mb-6">
        <TextInput
          className="flex-1 px-4 py-4 rounded-2xl text-white"
          style={{
            backgroundColor: Colors.dark.cardSecondary,
            fontSize: 16,
          }}
          placeholder="Enter gesture name..."
          placeholderTextColor={Colors.dark.textSecondary}
          value={newGestureName}
          onChangeText={setNewGestureName}
          maxLength={30}
        />
        <TouchableOpacity
          className="px-6 justify-center items-center rounded-2xl"
          style={{
            backgroundColor: newGestureName.trim()
              ? Colors.dark.primary
              : Colors.dark.cardSecondary,
          }}
          onPress={addGestureToList}
          disabled={!newGestureName.trim()}
        >
          <Ionicons
            name="add"
            color={
              newGestureName.trim()
                ? Colors.dark.background
                : Colors.dark.textSecondary
            }
            size={24}
          />
        </TouchableOpacity>
      </View>

      {/* Gesture List */}
      {trainingState.gestureList.length > 0 && (
        <View className="mb-6">
          <ThemedText className="mb-3" style={{ fontWeight: "600" }}>
            Gestures to Train ({trainingState.gestureList.length})
          </ThemedText>
          {trainingState.gestureList.map((gesture) => (
            <View
              key={gesture.name}
              className="flex-row items-center justify-between px-4 py-3 mb-2 rounded-2xl"
              style={{ backgroundColor: Colors.dark.cardSecondary }}
            >
              <View className="flex-row items-center gap-x-3">
                <Ionicons
                  name="hand-left"
                  color={Colors.dark.primary}
                  size={20}
                />
                <ThemedText>{gesture.name}</ThemedText>
              </View>
              <TouchableOpacity
                onPress={() => removeGestureFromList(gesture.name)}
              >
                <Ionicons
                  name="close"
                  color={Colors.dark.textSecondary}
                  size={20}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        className="justify-center items-center py-4 rounded-2xl"
        style={{
          backgroundColor:
            trainingState.gestureList.length > 0
              ? Colors.dark.primary
              : Colors.dark.cardSecondary,
        }}
        onPress={startCollectionPhase}
        disabled={trainingState.gestureList.length === 0}
      >
        <ThemedText
          style={{
            color:
              trainingState.gestureList.length > 0
                ? Colors.dark.background
                : Colors.dark.textSecondary,
            fontWeight: "600",
          }}
        >
          Start Data Collection
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}
