import React, { createContext, useContext } from "react";
import { IMUData, STATE, TrainingSession, useBLE } from "../hooks/useBluetooth";
import { SuiClient } from "@mysten/sui/client";

interface BluetoothLowEnergyApi {
  scanForPheripherals: () => void;
  requestPermissions: () => Promise<boolean>;
  connectToDevice: (device: any) => Promise<void>;
  disconnectFromDevice: () => void;
  allDevices: any[];
  connectedDevice: any | null;
  checkBluetoothState: () => void;
  sendMessage: (message: String) => Promise<void>;
  sendControlMessage: (message: String) => Promise<void>;
  sendTransferMessage: (message: String) => Promise<void>;

  publicKey: string;
  client: SuiClient;
  systemState: STATE;
  changeState: (state: STATE) => void;

  imuStreamingEnabled: boolean;
  clearIMUData: () => void;
  getAllImuData: () => IMUData[];

  currentTrainingSession: TrainingSession;
  startTrainingSession: (
    gestureName: string,
    targetSamples?: number,
  ) => Promise<TrainingSession>;
  stopTrainingSession: () => Promise<void>;
  getTrainingSessionProgress: () => number;
  getTrainingDataForGesture: (gestureName: string) => IMUData[];
  getAllTrainingData: () => {
    [gestureName: string]: IMUData[];
  };
  clearTrainingData: (gestureName?: string) => void;
  trainingData: {
    [key: string]: IMUData[];
  };
}

const BLEContext = createContext<BluetoothLowEnergyApi | null>(null);

export const BLEProvider = ({ children }: { children: React.ReactNode }) => {
  const ble = useBLE();

  return <BLEContext.Provider value={ble}>{children}</BLEContext.Provider>;
};

export const useBLEContext = () => {
  const context = useContext(BLEContext);
  if (!context) {
    throw new Error("useBLEContext must be used within a BLEProvider");
  }
  return context;
};
