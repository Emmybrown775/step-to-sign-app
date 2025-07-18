import {
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { Colors } from "../constants/Colors";

type Prop = TouchableOpacityProps & {
  text: string | undefined;
};

export default function CustomButton({ text, ...rest }: Prop) {
  return (
    <TouchableOpacity {...rest} style={styles.button}>
      <ThemedText style={styles.text} type="link">
        {text}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.dark.tint,
  },

  text: {
    textAlign: "center",
  },
});
