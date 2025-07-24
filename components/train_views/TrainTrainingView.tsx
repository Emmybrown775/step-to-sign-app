import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { Colors } from "../../constants/Colors";
import { useTrainingContext } from "../../providers/TrainingProvider";
import { useEffect, useState } from "react";
import { useBLEContext } from "../../providers/BLEContext";

type TransferStep = "waiting" | "ready" | "error";

export default function TrainTrainingView() {
  const { trainingState, trainModel } = useTrainingContext();
  const { sendMessage, waitForTrainAck } = useBLEContext();
  const [transferStep, setTransferStep] = useState<TransferStep>("waiting");

  useEffect(() => {
    sendMessage("<TRAIN_START>");

    waitForTrainAck(() => {
      console.log("HEREEEE");
      setTransferStep("ready");
    });
  }, []);

  return (
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
        {transferStep === "waiting" && "Talking to your shoe, please wait"}

        {transferStep === "ready" &&
          `Training a multi-gesture recognition model for
        ${trainingState.gestureList.map((g) => g.name).join(", ")}. This creates
        a model that can distinguish between all your gestures.`}
      </ThemedText>

      {transferStep === "waiting" && (
        <TouchableOpacity
          className="justify-center items-center py-4 rounded-2xl"
          style={{ backgroundColor: Colors.dark.primary }}
          disabled={true}
        >
          <ThemedText
            style={{
              color: Colors.dark.background,
              fontWeight: "600",
            }}
          >
            Waiting...
          </ThemedText>
        </TouchableOpacity>
      )}

      {transferStep === "ready" && (
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
      )}
    </View>
  );
}
