import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import { useEffect, useState } from "react";
import { useAudioPlayer } from "expo-audio";
import { ArabicText, Button, Card, HearButton } from "../../src/design/components";
import { useColors } from "../../src/design/theme";
import { typography, spacing } from "../../src/design/tokens";
import { useDatabase } from "../../src/db/provider";
import { configureAudioSession, getSFXAsset, getLetterAsset } from "../../src/audio/player";

export default function FoundationTestScreen() {
  const colors = useColors();
  const db = useDatabase();
  const [dbStatus, setDbStatus] = useState("checking...");

  const correctPlayer = useAudioPlayer(getSFXAsset("correct"));
  const baNamePlayer = useAudioPlayer(getLetterAsset(2, "name")!);

  useEffect(() => {
    configureAudioSession();
    checkDatabase();
  }, []);

  async function checkDatabase() {
    try {
      const result = await db.getFirstAsync<{ version: number }>(
        "SELECT MAX(version) as version FROM schema_version"
      );
      setDbStatus(`OK — schema v${result?.version ?? "?"}`);
    } catch (e: any) {
      setDbStatus(`Error: ${e.message}`);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={styles.content}
    >
      <Text style={[typography.heading1, { color: colors.text }]}>
        Foundation Test
      </Text>
      <Text style={[typography.body, { color: colors.textSoft, marginTop: spacing.sm }]}>
        Verifying all Layer 1 systems
      </Text>

      {/* Typography */}
      <Card style={{ marginTop: spacing.xl }}>
        <Text style={[typography.heading3, { color: colors.text }]}>Typography</Text>
        <Text style={[typography.body, { color: colors.textSoft, marginTop: spacing.sm }]}>
          Inter body text renders correctly
        </Text>
        <Text style={[typography.heading2, { color: colors.text, marginTop: spacing.sm }]}>
          Lora heading renders correctly
        </Text>
        <ArabicText size="large" style={{ marginTop: spacing.md }}>
          بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
        </ArabicText>
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
          Amiri Arabic renders correctly (RTL)
        </Text>
      </Card>

      {/* Colors */}
      <Card style={{ marginTop: spacing.lg }}>
        <Text style={[typography.heading3, { color: colors.text }]}>Colors</Text>
        <View style={styles.colorRow}>
          {(["primary", "primaryLight", "accent", "danger"] as const).map((name) => (
            <View
              key={name}
              style={[styles.swatch, { backgroundColor: colors[name] }]}
            />
          ))}
        </View>
      </Card>

      {/* Database */}
      <Card style={{ marginTop: spacing.lg }}>
        <Text style={[typography.heading3, { color: colors.text }]}>Database</Text>
        <Text style={[typography.body, { color: colors.textSoft, marginTop: spacing.sm }]}>
          Status: {dbStatus}
        </Text>
      </Card>

      {/* Audio */}
      <Card style={{ marginTop: spacing.lg }}>
        <Text style={[typography.heading3, { color: colors.text }]}>Audio</Text>
        <View style={styles.audioRow}>
          <HearButton
            onPlay={async () => { await correctPlayer.seekTo(0); correctPlayer.play(); }}
            accessibilityLabel="Play correct sound"
          />
          <HearButton
            onPlay={async () => { await baNamePlayer.seekTo(0); baNamePlayer.play(); }}
            accessibilityLabel="Play Ba letter name"
          />
        </View>
      </Card>

      {/* Buttons */}
      <Card style={{ marginTop: spacing.lg }}>
        <Text style={[typography.heading3, { color: colors.text }]}>Buttons</Text>
        <Button
          title="Primary Button"
          onPress={() => Alert.alert("Pressed!", "Haptic feedback should fire")}
          style={{ marginTop: spacing.md }}
        />
        <Button
          title="Secondary Button"
          variant="secondary"
          onPress={() => {}}
          style={{ marginTop: spacing.sm }}
        />
        <Button
          title="Disabled Button"
          disabled
          onPress={() => {}}
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      <View style={{ height: spacing.xxxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    paddingTop: 60,
  },
  colorRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  audioRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
  },
});
