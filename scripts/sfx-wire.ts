import * as fs from "fs";
import * as path from "path";

interface ManifestEntry {
  id: string;
  file: string;
  category: string;
  intensity: string;
}

const PLAYER_PATH = path.resolve(__dirname, "../src/audio/player.ts");

// Haptics mapping by intensity
const HAPTICS: Record<string, string | null> = {
  low: null,
  medium: '  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);',
  high: '  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);',
};

function toHelperName(id: string): string {
  // "wird_text_appear" -> "playWirdTextAppear"
  return (
    "play" +
    id
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join("")
  );
}

export function wireNewSounds(entries: ManifestEntry[]): {
  added: string[];
  skipped: string[];
} {
  let source = fs.readFileSync(PLAYER_PATH, "utf-8");
  const added: string[] = [];
  const skipped: string[] = [];

  for (const entry of entries) {
    // Check if already in SFX_ASSETS
    if (source.includes(`${entry.id}: require(`)) {
      skipped.push(entry.id);
      continue;
    }

    // Insert require line before the closing "} as const;"
    const requireLine = `  ${entry.id}: require("../../assets/audio/effects/${entry.file}"),`;
    source = source.replace(
      "} as const;",
      `${requireLine}\n} as const;`
    );

    // Insert helper function before the final "// ── Voice helpers ──" section
    const helperName = toHelperName(entry.id);
    const hapticLine = HAPTICS[entry.intensity];
    const helperFn = [
      "",
      `export function ${helperName}(): void {`,
      `  playSFX(SFX_ASSETS.${entry.id});`,
      hapticLine,
      "}",
    ]
      .filter((line) => line !== null)
      .join("\n");

    source = source.replace(
      "// ── Voice helpers ──",
      `${helperFn}\n\n// ── Voice helpers ──`
    );

    added.push(entry.id);
  }

  if (added.length > 0) {
    fs.writeFileSync(PLAYER_PATH, source, "utf-8");
  }

  return { added, skipped };
}
