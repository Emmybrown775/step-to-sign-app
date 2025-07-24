import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BleError,
  BleManager,
  Characteristic,
  Device,
} from "react-native-ble-plx";
import { Alert, PermissionsAndroid } from "react-native";
import * as ExpoDevice from "expo-device";
import BluetoothStateManager from "react-native-bluetooth-state-manager";
import { router } from "expo-router";
import { Buffer } from "buffer";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { useAuthContext } from "../providers/AuthProvider";
import { fromHex, MIST_PER_SUI } from "@mysten/sui/utils";
import { blake2b } from "blakejs";

const NUS_SERVICE_UUID = "12345678-1234-1234-1234-123456789abc";
const NUS_RX_CHARACTERISTIC_UUID = "87654321-4321-4321-4321-cba987654321"; // Write
const NUS_TX_CHARACTERISTIC_UUID = "11111111-2222-3333-4444-555555555555"; // Notify
const NUS_IMU_TX_CHARACTERISTIC_UUID = "6E400004-B5A3-F393-E0A9-E50E24DCCA9E";
const FILE_TRANSFER_CHAR_UUID = "6E400005-B5A3-F393-E0A9-E50E24DCCA9E";
const CONTROL_CHAR_UUID = "6E400006-B5A3-F393-E0A9-E50E24DCCA9E";

// BLE chunk size (MTU - 3 bytes for ATT header)
const BLE_CHUNK_SIZE = 20;

// IMU data structure matching ESP32
export interface IMUData {
  timestamp: number;
  ax: number;
  ay: number;
  az: number;
  gx: number;
  gy: number;
  gz: number;
  label: string;
}

interface IMUBatch {
  samples: IMUData[];
  count: number;
}

// Training-specific interfaces
export interface TrainingSession {
  gestureName: string;
  data: IMUData[];
  isActive: boolean;
  targetSamples: number;
}

export enum STATE {
  IDLE,
  AWAITING_SIG,
  BROADCASTING_TX,
}

export function useBLE() {
  const bleManager = useMemo(() => new BleManager(), []);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [publicKey, setPublickKey] = useState<string | null>(null);
  const [systemState, setSystemState] = useState<STATE>(STATE.IDLE);
  const [imuStreamingEnabled, setImuStreamingEnabled] = useState(false);
  const [imuData, setImuData] = useState<IMUData[]>([]);
  const imuDataRef = useRef<IMUData[]>([]);
  const allImuDataRef = useRef<IMUData[]>([]); // Store ALL data here
  const client = new SuiClient({ url: getFullnodeUrl("testnet") });
  const maxDisplaySamples = 500; // How many to show in UI
  const maxTotalSamples = 10000;
  const connectedDeviceRef = useRef<Device | null>(null);
  const bleManagerRef = useRef(bleManager);

  // Training-specific state
  const [currentTrainingSession, setCurrentTrainingSession] =
    useState<TrainingSession | null>(null);
  const [trainingData, setTrainingData] = useState<Map<string, IMUData[]>>(
    new Map(),
  );
  const trainingSessionRef = useRef<TrainingSession | null>(null);

  // State to store BLE message chunks
  const [bleBuffer, setBleBuffer] = useState("");
  useEffect(() => {
    connectedDeviceRef.current = connectedDevice;
  }, [connectedDevice]);

  const requestAndroidPermission = async () => {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ];
    const results = await PermissionsAndroid.requestMultiple(permissions);
    return Object.values(results).every(
      (result) => result === PermissionsAndroid.RESULTS.GRANTED,
    );
  };

  const requestPermissions = async () => {
    if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      return await requestAndroidPermission();
    }
  };

  const scanForPheripherals = () => {
    console.log("Starting BLE scan...");
    bleManager.stopDeviceScan();
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error(error);
        return;
      }

      if (device.name && device.name.includes("Step-to-Sign")) {
        setAllDevices((prevState) => {
          return prevState.some((d) => d.id === device.id)
            ? prevState
            : [...prevState, device];
        });
      }
    });
  };

  const enableBluetooth = () => {
    BluetoothStateManager.requestToEnable()
      .then(() => {
        scanForPheripherals();
      })
      .catch(() => {
        console.log("User Aborted");
      });
  };

  const promptToEnable = () => {
    Alert.alert("Bluetooth Required", "Please Enable Bluetooth to continue", [
      { text: "Turn On", onPress: enableBluetooth },
      { text: "Exit App", onPress: () => {} },
    ]);
  };

  const checkBluetoothState = () => {
    bleManager.onStateChange((state) => {
      if (state === "PoweredOn") {
        scanForPheripherals();
      } else {
        promptToEnable();
      }
    }, true);
  };

  // Helper to detect if the buffer has a complete message framed with < >
  const isMessageComplete = (data: string) =>
    data.includes("<") &&
    data.includes(">") &&
    data.indexOf("<") < data.indexOf(">");

  // Parse binary IMU data
  const parseIMUData = useCallback((buffer: Buffer): IMUData | null => {
    try {
      if (buffer.length !== 18) {
        console.warn(`Invalid IMU data length: ${buffer.length}, expected 18`);
        return null;
      }

      // Parse according to the C struct layout
      const timestamp = buffer.readUInt32LE(0);
      const ax = buffer.readInt16LE(4) / 1000.0; // Scale back from integer
      const ay = buffer.readInt16LE(6) / 1000.0;
      const az = buffer.readInt16LE(8) / 1000.0;
      const gx = buffer.readInt16LE(10) / 1000.0;
      const gy = buffer.readInt16LE(12) / 1000.0;
      const gz = buffer.readInt16LE(14) / 1000.0;
      const label = trainingSessionRef.current.gestureName;
      const reserved = buffer.readUInt8(17);

      return { timestamp, ax, ay, az, gx, gy, gz, label };
    } catch (error) {
      console.error("Error parsing IMU data:", error);
      return null;
    }
  }, []);

  const connectToDevice = async (device: Device) => {
    try {
      const deviceConnection = await bleManager.connectToDevice(device.id);
      setConnectedDevice(deviceConnection);
      await deviceConnection.discoverAllServicesAndCharacteristics();
      bleManager.stopDeviceScan();

      // Monitor regular TX characteristic for commands/responses
      deviceConnection.monitorCharacteristicForService(
        NUS_SERVICE_UUID,
        NUS_TX_CHARACTERISTIC_UUID,
        textMessageCallback,
      );

      // Monitor IMU characteristic for high-frequency data
      deviceConnection.monitorCharacteristicForService(
        NUS_SERVICE_UUID,
        NUS_IMU_TX_CHARACTERISTIC_UUID,
        imuDataCallback,
      );

      // Send default message on connect
      const message = "get_address";
      const base64Message = Buffer.from(message).toString("base64");

      await deviceConnection.writeCharacteristicWithResponseForService(
        NUS_SERVICE_UUID,
        NUS_RX_CHARACTERISTIC_UUID,
        base64Message,
      );
    } catch (error) {
      console.error(error);
    }
  };

  // Callback for text messages (commands, responses)
  const textMessageCallback = (
    error: BleError,
    characteristics: Characteristic,
  ) => {
    if (error) {
      console.error("Text notification error", error);
      return;
    }

    const base64Value = characteristics.value;
    if (base64Value) {
      const chunk = Buffer.from(base64Value, "base64").toString("utf-8");
      console.log("🔹 BLE Text Chunk Received:", chunk);

      setBleBuffer((prevBuffer) => {
        const updatedBuffer = prevBuffer + chunk;

        // If message is complete (framed with < >)
        if (isMessageComplete(updatedBuffer)) {
          const fullMessage = updatedBuffer.substring(
            updatedBuffer.indexOf("<") + 1,
            updatedBuffer.indexOf(">"),
          );

          console.log("✅ Full BLE Message:", fullMessage);

          // Route message by type
          if (fullMessage.startsWith("SUI:")) {
            const address = fullMessage.replace("SUI:", "");

            const key = Buffer.from(address, "hex");

            if (key.length !== 32) {
              throw new Error("Invalid public key length. Expected 32 bytes.");
            }

            const schemeFlag = Buffer.from([0x00]); // Ed25519
            const toHash = Buffer.concat([schemeFlag, key]);

            const hash = blake2b(toHash, null, 32);
            console.log(
              "✅ Sui Address:",
              "0x" + Buffer.from(hash).toString("hex"),
            );
            setPublickKey("0x" + Buffer.from(hash).toString("hex"));
          } else if (fullMessage.startsWith("SIG:")) {
            const signature = fullMessage.replace("SIG:", "").split("msg");
            setSystemState(STATE.BROADCASTING_TX);
            broadcastTX(signature[0], signature[1]);
            console.log("✍️ Signature received:", signature);
          } else if (fullMessage === "IMU_STOPPED") {
            console.log("IMU stopped");
            console.log("Got :" + getImuDataStats().totalSamples);
            // Handle training session completion
            handleIMUSessionStop();
          }

          return ""; // Clear buffer
        }

        return updatedBuffer;
      });
    }
  };

  // Handle IMU session stop for training
  const handleIMUSessionStop = useCallback(() => {
    if (trainingSessionRef.current) {
      const session = trainingSessionRef.current;
      console.log(
        `Training session for ${session.gestureName} completed with ${session.data.length} samples`,
      );

      // Update training data map
      setTrainingData((prev) => {
        const newMap = new Map(prev);
        newMap.set(session.gestureName, [...session.data]);
        return newMap;
      });

      // Clear current session
      setCurrentTrainingSession(null);
      trainingSessionRef.current = null;
      setImuStreamingEnabled(false);
    }
  }, []);

  // Callback for IMU data (binary) - Enhanced for training
  const imuDataCallback = useCallback(
    (error: BleError | null, characteristics: Characteristic | null) => {
      if (error) {
        console.error("IMU notification error", error);
        return;
      }

      const base64Value = characteristics?.value;
      if (base64Value) {
        const buffer = Buffer.from(base64Value, "base64");
        const parsed = parseIMUData(buffer);

        if (parsed) {
          console.log("📊 IMU Sample:", parsed);

          // Store in the large buffer (keep up to maxTotalSamples)
          allImuDataRef.current = [
            ...allImuDataRef.current.slice(-(maxTotalSamples - 1)),
            parsed,
          ];

          // Update UI state with recent samples only
          setImuData((prev) => {
            const newData = [...prev.slice(-(maxDisplaySamples - 1)), parsed];
            imuDataRef.current = newData; // Keep ref in sync for compatibility
            return newData;
          });

          // Handle training session data
          if (
            trainingSessionRef.current &&
            trainingSessionRef.current.isActive
          ) {
            trainingSessionRef.current.data.push(parsed);

            // Update the training session state
            setCurrentTrainingSession((prev) => {
              if (prev) {
                return {
                  ...prev,
                  data: [...prev.data, parsed],
                };
              }
              return prev;
            });

            // Check if we've reached the target samples
            if (
              trainingSessionRef.current.data.length >=
              trainingSessionRef.current.targetSamples
            ) {
              console.log(
                `Target samples reached for ${trainingSessionRef.current.gestureName}`,
              );
              stopTrainingSession();
            }
          }
        }
      }
    },
    [parseIMUData, maxDisplaySamples, maxTotalSamples, connectedDevice],
  );

  const sendMessage = useCallback(async (message: string) => {
    const device = connectedDeviceRef.current;

    if (!device) {
      console.error("❌ No device connected");
      throw new Error("No device connected");
    }

    console.log("📤 Sending message:", message, "to device:", device.id);

    try {
      if (message.length <= BLE_CHUNK_SIZE) {
        const base64Message = Buffer.from(message).toString("base64");
        await device.writeCharacteristicWithoutResponseForService(
          NUS_SERVICE_UUID,
          NUS_RX_CHARACTERISTIC_UUID,
          base64Message,
        );
        console.log("📤 Sent:", message);
        return;
      }

      // For long messages, send in chunks
      console.log("📤 Sending long message in chunks:", message);
      for (let i = 0; i < message.length; i += BLE_CHUNK_SIZE) {
        const chunk = message.substring(i, i + BLE_CHUNK_SIZE);
        const base64Chunk = Buffer.from(chunk).toString("base64");

        await device.writeCharacteristicWithoutResponseForService(
          NUS_SERVICE_UUID,
          NUS_RX_CHARACTERISTIC_UUID,
          base64Chunk,
        );

        console.log("📤 Sent chunk:", chunk);
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    } catch (error) {
      console.error("❌ Send Error:", error);
      throw error;
    }
  }, []);

  const sendControlMessage = useCallback(async (message: string) => {
    const device = connectedDeviceRef.current;

    if (!device) {
      console.error("❌ No device connected");
      throw new Error("No device connected");
    }

    try {
      if (message.length <= BLE_CHUNK_SIZE) {
        const base64Message = Buffer.from(message).toString("base64");
        await device.writeCharacteristicWithResponseForService(
          NUS_SERVICE_UUID,
          CONTROL_CHAR_UUID,
          base64Message,
        );
        console.log("📤 Sent:", message);
        return;
      }

      // For long messages, send in chunks
      console.log("📤 Sending long message in chunks:", message);
      for (let i = 0; i < message.length; i += BLE_CHUNK_SIZE) {
        const chunk = message.substring(i, i + BLE_CHUNK_SIZE);
        const base64Chunk = Buffer.from(chunk).toString("base64");

        await device.writeCharacteristicWithResponseForService(
          NUS_SERVICE_UUID,
          CONTROL_CHAR_UUID,
          base64Chunk,
        );

        console.log("📤 Sent chunk:", chunk);
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    } catch (error) {
      console.error("❌ Send Error:", error);
      throw error;
    }
  }, []);

  const sendTransferMessage = useCallback(async (message: string) => {
    const device = connectedDeviceRef.current;

    if (!device) {
      console.error("❌ No device connected");
      throw new Error("No device connected");
    }

    console.log("📤 Sending message:", message, "to device:", device.id);

    try {
      if (message.length <= BLE_CHUNK_SIZE) {
        const base64Message = Buffer.from(message).toString("base64");
        await device.writeCharacteristicWithResponseForService(
          NUS_SERVICE_UUID,
          FILE_TRANSFER_CHAR_UUID,
          base64Message,
        );
        console.log("📤 Sent:", message);
        return;
      }

      // For long messages, send in chunks
      console.log("📤 Sending long message in chunks:", message);
      for (let i = 0; i < message.length; i += BLE_CHUNK_SIZE) {
        const chunk = message.substring(i, i + BLE_CHUNK_SIZE);
        const base64Chunk = Buffer.from(chunk).toString("base64");

        await device.writeCharacteristicWithResponseForService(
          NUS_SERVICE_UUID,
          FILE_TRANSFER_CHAR_UUID,
          base64Chunk,
        );

        console.log("📤 Sent chunk:", chunk);
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    } catch (error) {
      console.error("❌ Send Error:", error);
      throw error;
    }
  }, []);

  // Training-specific functions
  const startTrainingSession = useCallback(
    async (gestureName: string, targetSamples: number = 1000) => {
      if (!connectedDeviceRef.current) {
        throw new Error("Device not connected");
      }

      console.log(`Starting training session for gesture: ${gestureName}`);

      const newSession: TrainingSession = {
        gestureName,
        data: [],
        isActive: true,
        targetSamples,
      };

      setCurrentTrainingSession(newSession);
      trainingSessionRef.current = newSession;
      setImuStreamingEnabled(true);

      // Send command to start IMU streaming
      await sendMessage("start_imu");

      return newSession;
    },
    [],
  );

  const stopTrainingSession = useCallback(async () => {
    if (!trainingSessionRef.current) {
      console.log("No active training session to stop");
      return;
    }

    console.log(
      `Stopping training session for ${trainingSessionRef.current.gestureName}`,
    );

    // Send command to stop IMU streaming
    await sendMessage("stop_imu");

    // The handleIMUSessionStop will be called when we receive the IMU_STOPPED message
  }, []);

  const getTrainingSessionProgress = useCallback(() => {
    if (!currentTrainingSession) return 0;
    return (
      (currentTrainingSession.data.length /
        currentTrainingSession.targetSamples) *
      100
    );
  }, [currentTrainingSession]);

  const getTrainingDataForGesture = useCallback(
    (gestureName: string) => {
      return trainingData.get(gestureName) || [];
    },
    [trainingData],
  );

  const getAllTrainingData = useCallback(() => {
    const allData: { [gestureName: string]: IMUData[] } = {};
    trainingData.forEach((data, gestureName) => {
      allData[gestureName] = data;
    });
    return allData;
  }, [trainingData]);

  const clearTrainingData = useCallback((gestureName?: string) => {
    if (gestureName) {
      setTrainingData((prev) => {
        const newMap = new Map(prev);
        newMap.delete(gestureName);
        return newMap;
      });
    } else {
      setTrainingData(new Map());
    }
  }, []);

  const getAllImuData = useCallback<() => IMUData[]>(() => {
    return allImuDataRef.current;
  }, []);

  const exportImuData = useCallback(() => {
    const data = allImuDataRef.current;
    console.log(`Exporting ${data.length} IMU samples`);
    return {
      totalSamples: data.length,
      data: data,
      exportTime: new Date().toISOString(),
    };
  }, []);

  const clearIMUData = () => {
    setImuData([]);
    allImuDataRef.current = []; // Clear the large buffer too
    imuDataRef.current = []; // Clear compatibility ref
  };

  // Function to get data statistics
  const getImuDataStats = useCallback(() => {
    const allData = allImuDataRef.current;
    const displayData = imuData;

    return {
      totalSamples: allData.length,
      displaySamples: displayData.length,
      memoryUsageKB: Math.round((allData.length * 32) / 1024), // Rough estimate
      oldestTimestamp: allData.length > 0 ? allData[0].timestamp : null,
      newestTimestamp:
        allData.length > 0 ? allData[allData.length - 1].timestamp : null,
    };
  }, [imuData]);

  // Updated sendMessage function to handle chunking

  const disconnectFromDevice = async () => {
    try {
      if (connectedDevice) {
        await bleManager.cancelDeviceConnection(connectedDevice.id);
        setConnectedDevice(null);
        setImuStreamingEnabled(false);
        // Clear buffers on disconnect
        setBleBuffer("");
        setImuData([]);
        // Clear training session
        setCurrentTrainingSession(null);
        trainingSessionRef.current = null;
      }
    } catch (error) {
      console.error(error);
    }
  };

  async function broadcastTX(sig: string, msg: string): Promise<boolean> {
    const cSignature = suiSignatureHexToBase64(sig);
    try {
      const result = await client.executeTransactionBlock({
        transactionBlock: fromHex(msg),
        signature: cSignature,
        options: {
          showEffects: true,
          showEvents: true,
          showBalanceChanges: true,
          showInput: true,
          showObjectChanges: true,
        },
      });

      let amount =
        Number(BigInt(result.balanceChanges[0].amount)) / Number(MIST_PER_SUI);
      let recipient = null;
      const txHash = result.digest;

      // Alternative: Get from object changes
      if (!amount && result.objectChanges) {
        for (const change of result.objectChanges) {
          if (change.type === "created") {
            recipient = change.sender;
            break;
          }
        }
      }

      router.push(
        `/success?amount=${amount}&recipient=${recipient}&txHash=${txHash}`,
      );
    } catch (error) {
      console.error(error);
      return false;
    } finally {
      changeState(STATE.IDLE);
    }

    return true;
  }

  function suiSignatureHexToBase64(hex: string): string {
    if (hex.startsWith("0x")) hex = hex.slice(2);
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return Buffer.from(bytes).toString("base64");
  }

  const changeState = async (state: STATE) => {
    setSystemState(state);
  };

  return {
    scanForPheripherals,
    requestPermissions,
    connectToDevice,
    allDevices,
    connectedDevice,
    disconnectFromDevice,
    checkBluetoothState,
    sendMessage,
    sendControlMessage,
    sendTransferMessage,
    publicKey,
    client,
    systemState,
    changeState,

    // IMU-related exports
    imuStreamingEnabled,
    imuData,
    clearIMUData,
    getAllImuData,
    exportImuData,
    getImuDataStats,

    // Training-specific exports
    currentTrainingSession,
    startTrainingSession,
    stopTrainingSession,
    getTrainingSessionProgress,
    getTrainingDataForGesture,
    getAllTrainingData,
    clearTrainingData,
    trainingData: Array.from(trainingData.entries()).reduce(
      (obj, [key, value]) => {
        obj[key] = value;
        return obj;
      },
      {} as { [key: string]: IMUData[] },
    ),
  };
}
