import { createContext, useContext } from "react";
import {
  TrainingState,
  TrainingStep,
  useTrainingData,
} from "../hooks/useTrainingData";

interface TrainigProviderApi {
  newGestureName: string;
  setNewGestureName: React.Dispatch<React.SetStateAction<string>>;
  addGestureToList: () => void;
  trainingState: TrainingState;
  removeGestureFromList: (gestureName: string) => void;
  startCollectionPhase: () => void;
  startDataCollection: (gestureName: string) => Promise<void>;
  stopDataCollection: () => Promise<void>;
  allGesturesComplete: boolean;
  processData: () => Promise<void>;
  trainModel: () => Promise<void>;
  resetTraining: () => void;
  saveGestures: () => void;
  getStepOrder: (step: TrainingStep) => number;
  getStepColor: (step: TrainingStep, currentStep: TrainingStep) => string;
  getStepIcon: (
    step: TrainingStep,
    currentStep: TrainingStep,
  ) => "ellipse" | "checkmark-circle" | "ellipse-outline";
  getTotalProgress: () => number;
}

const TrainingContext = createContext<TrainigProviderApi | null>(null);

export const TrainingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const training = useTrainingData();
  return (
    <TrainingContext.Provider value={training}>
      {children}
    </TrainingContext.Provider>
  );
};

export const useTrainingContext = () => {
  const context = useContext(TrainingContext);
  if (!context) {
    throw new Error("useTrainingContext must be used within a TrainingProvide");
  }
  return context;
};
