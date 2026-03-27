import { View, Text, Pressable, StyleSheet } from "react-native";
import { useAudioPlayer } from "expo-audio";
import { useEffect } from "react";
import { configureAudioSession, getSFXAsset, getLetterAsset } from "../src/audio/player";
import { useColors } from "../src/design/theme";
import { typography } from "../src/design/tokens";

export default function AudioTestScreen() {
  const colors = useColors();

  useEffect(() => {
    configureAudioSession();
  }, []);

  const correctPlayer = useAudioPlayer(getSFXAsset("correct"));
  const wrongPlayer = useAudioPlayer(getSFXAsset("wrong"));
  const baNamePlayer = useAudioPlayer(getLetterAsset(2, "name")!);
  const baSoundPlayer = useAudioPlayer(getLetterAsset(2, "sound")!);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[typography.heading1, { color: colors.text, marginBottom: 32 }]}>
        Audio Spike Test
      </Text>

      <Pressable
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={() => correctPlayer.play()}
      >
        <Text style={[styles.buttonText, { color: colors.white }]}>
          Play "Correct" SFX
        </Text>
      </Pressable>

      <Pressable
        style={[styles.button, { backgroundColor: colors.danger }]}
        onPress={() => wrongPlayer.play()}
      >
        <Text style={[styles.buttonText, { color: colors.white }]}>
          Play "Wrong" SFX
        </Text>
      </Pressable>

      <Pressable
        style={[styles.button, { backgroundColor: colors.primaryLight }]}
        onPress={() => baNamePlayer.play()}
      >
        <Text style={[styles.buttonText, { color: colors.white }]}>
          Play "Ba" Name
        </Text>
      </Pressable>

      <Pressable
        style={[styles.button, { backgroundColor: colors.accent }]}
        onPress={() => baSoundPlayer.play()}
      >
        <Text style={[styles.buttonText, { color: colors.white }]}>
          Play "Ba" Sound
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginBottom: 16,
    minWidth: 240,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "600",
  },
});
