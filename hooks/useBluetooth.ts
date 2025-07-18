import { useMemo, useState } from "react";
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

// BLE chunk size (MTU - 3 bytes for ATT header)
const BLE_CHUNK_SIZE = 20;

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
  const client = new SuiClient({ url: getFullnodeUrl("testnet") });

  // State to store BLE message chunks
  const [bleBuffer, setBleBuffer] = useState("");

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

  const connectToDevice = async (device: Device) => {
    try {
      const deviceConnection = await bleManager.connectToDevice(device.id);
      setConnectedDevice(deviceConnection);
      await deviceConnection.discoverAllServicesAndCharacteristics();
      bleManager.stopDeviceScan();

      deviceConnection.monitorCharacteristicForService(
        NUS_SERVICE_UUID,
        NUS_TX_CHARACTERISTIC_UUID,
        callback,
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

  const callback = (error: BleError, characteristics: Characteristic) => {
    if (error) {
      console.error("Notification error", error);
      return;
    }

    const base64Value = characteristics.value;
    if (base64Value) {
      const chunk = Buffer.from(base64Value, "base64").toString("utf-8");
      console.log("🔹 BLE Chunk Received:", chunk);

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
          }

          return ""; // Clear buffer
        }

        return updatedBuffer;
      });
    }
  };

  // Updated sendMessage function to handle chunking
  const sendMessage = async (message: string) => {
    if (!connectedDevice) {
      console.error("❌ No device connected");
      return;
    }

    try {
      // For short messages, send directly
      if (message.length <= BLE_CHUNK_SIZE) {
        const base64Message = Buffer.from(message).toString("base64");
        await connectedDevice.writeCharacteristicWithoutResponseForService(
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

        await connectedDevice.writeCharacteristicWithoutResponseForService(
          NUS_SERVICE_UUID,
          NUS_RX_CHARACTERISTIC_UUID,
          base64Chunk,
        );

        console.log("📤 Sent chunk:", chunk);

        // Small delay to prevent overwhelming the ESP32
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    } catch (error) {
      console.error("❌ Send Error:", error);
    }
  };

  const disconnectFromDevice = async () => {
    try {
      if (connectedDevice) {
        await bleManager.cancelDeviceConnection(connectedDevice.id);
        setConnectedDevice(null);
        // Clear buffer on disconnect
        setBleBuffer("");
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
    publicKey,
    client,
    systemState,
    changeState,
  };
}
