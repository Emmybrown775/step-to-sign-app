import React, { createContext, useContext } from "react";
import { STATE, useBLE } from "../hooks/useBluetooth";
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
  publicKey: string;
  client: SuiClient;
  systemState: STATE;
  changeState: (state: STATE) => void;
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
