import { StyleSheet, type TextProps, Text } from "react-native";
import { useFonts } from "expo-font";
import { Colors } from "../constants/Colors";

type ThemedTextProp = TextProps & {
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export function ThemedText({
  style,
  type = "default",
  ...rest
}: ThemedTextProp) {
  return (
    <Text
      style={[
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.title : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "link" ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.dark.text,
    fontFamily: "Livvic_400Regular",
    textAlign: "center",
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    color: Colors.dark.text,
    fontFamily: "Livvic_600SemiBold",
  },
  title: {
    fontSize: 32,
    lineHeight: 32,
    color: Colors.dark.text,
    fontFamily: "Livvic_700Bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 20,
    color: Colors.dark.text,
    fontFamily: "Livvic_300Light",
  },
  link: {
    fontSize: 16,
    color: Colors.dark.text,
    fontFamily: "Livvic_500Medium",
  },
});
