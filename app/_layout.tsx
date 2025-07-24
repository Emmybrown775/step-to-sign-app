import { SplashScreen, Stack } from "expo-router";
import "../global.css";
import { useFonts } from "expo-font";
import {
  Livvic_100Thin,
  Livvic_100Thin_Italic,
  Livvic_200ExtraLight,
  Livvic_300Light,
  Livvic_400Regular,
  Livvic_500Medium,
  Livvic_500Medium_Italic,
  Livvic_600SemiBold,
  Livvic_700Bold,
} from "@expo-google-fonts/livvic";
import { useEffect } from "react";
import { BLEProvider } from "../providers/BLEContext";
import { Colors } from "../constants/Colors";
import { AuthProvider } from "../providers/AuthProvider";
import { TrainingProvider } from "../providers/TrainingProvider";

export default function RootLayout() {
  const [loaded] = useFonts({
    Livvic_100Thin,
    Livvic_200ExtraLight,
    Livvic_300Light,
    Livvic_400Regular,
    Livvic_500Medium,
    Livvic_600SemiBold,
    Livvic_700Bold,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  });

  if (!loaded) {
    return null;
  }

  return (
    <BLEProvider>
      <AuthProvider>
        <TrainingProvider>
          <Stack>
            <Stack.Screen
              name="index"
              options={{ title: "Home", headerShown: false }}
            />
            <Stack.Screen
              name="(tabs)"
              options={{ title: "Tabs", headerShown: false }}
            />
            <Stack.Screen
              name="send"
              options={{
                title: "Send",
                headerShown: true,
                headerStyle: {
                  backgroundColor: Colors.dark.background,
                },
                headerShadowVisible: false,
                headerTitleStyle: {
                  fontFamily: "Livvic_500Medium",
                  color: Colors.dark.text,
                },
                headerTitleAlign: "center",
                headerTintColor: Colors.dark.text,
              }}
            />
            <Stack.Screen
              name="success"
              options={{
                title: "Success",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="train_model"
              options={{
                title: "Train Model",
                headerShown: false,
              }}
            />
          </Stack>
        </TrainingProvider>
      </AuthProvider>
    </BLEProvider>
  );
}
