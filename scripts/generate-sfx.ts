import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { createProvider, type SFXProvider } from "./sfx-provider";
import {
  checkFfmpeg,
  postProcess,
  normalizeExisting,
} from "./sfx-postprocess";
import { wireNewSounds } from "./sfx-wire";

dotenv.config();

// ── Types ──

interface ManifestEntry {
  id: string;
  file: string;
  prompt: string;
  category: string;
  intensity: string;
  maxDurationMs: number;
}

interface Config {
  provider: string;
  outputDir: string;
  format: string;
  sampleRate: number;
  bitDepth: number;
  channels: number;
  targetLUFS: number;
  truePeak: number;
  loudnessRange: number;
  fadeInMs: number;
  fadeOutMs: number;
}

// ── Load files ──

const SCRIPTS_DIR = __dirname;
const ROOT_DIR = path.resolve(SCRIPTS_DIR, "..");

function loadManifest(): ManifestEntry[] {
  const raw = fs.readFileSync(
    path.join(SCRIPTS_DIR, "sfx-manifest.json"),
    "utf-8"
  );
  return JSON.parse(raw);
}

function loadConfig(): Config {
  const raw = fs.readFileSync(
    path.join(SCRIPTS_DIR, "sfx-config.json"),
    "utf-8"
  );
  return JSON.parse(raw);
}

// ── CLI arg parsing ──

interface CLIArgs {
  all: boolean;
  id: string | null;
  category: string | null;
  normalizeOnly: boolean;
  dryRun: boolean;
  wire: boolean;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const result: CLIArgs = {
    all: false,
    id: null,
    category: null,
    normalizeOnly: false,
    dryRun: false,
    wire: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--all":
        result.all = true;
        break;
      case "--id":
        result.id = args[++i];
        break;
      case "--category":
        result.category = args[++i];
        break;
      case "--normalize-only":
        result.normalizeOnly = true;
        break;
      case "--dry-run":
        result.dryRun = true;
        break;
      case "--wire":
        result.wire = true;
        break;
      default:
        console.error(`Unknown argument: ${args[i]}`);
        process.exit(1);
    }
  }

  if (!result.all && !result.id && !result.category && !result.normalizeOnly) {
    console.error(
      "Usage:\n" +
        "  --all                 Generate all sounds\n" +
        "  --id <sound_id>      Generate a single sound\n" +
        "  --category <cat>     Generate sounds in a category\n" +
        "  --normalize-only     Re-normalize existing files (no API calls)\n" +
        "  --dry-run            Show what would happen\n" +
        "  --wire               Auto-update player.ts with new entries\n"
    );
    process.exit(1);
  }

  return result;
}

// ── Filter manifest entries ──

function filterEntries(
  manifest: ManifestEntry[],
  args: CLIArgs
): ManifestEntry[] {
  if (args.all || args.normalizeOnly) return manifest;
  if (args.id) {
    const entry = manifest.find((e) => e.id === args.id);
    if (!entry) {
      console.error(`Sound ID "${args.id}" not found in manifest.`);
      console.error(
        "Available IDs: " + manifest.map((e) => e.id).join(", ")
      );
      process.exit(1);
    }
    return [entry];
  }
  if (args.category) {
    const entries = manifest.filter((e) => e.category === args.category);
    if (entries.length === 0) {
      console.error(`No sounds found in category "${args.category}".`);
      console.error(
        "Available categories: " +
          [...new Set(manifest.map((e) => e.category))].join(", ")
      );
      process.exit(1);
    }
    return entries;
  }
  return manifest;
}

// ── Main ──

async function main(): Promise<void> {
  const args = parseArgs();
  const config = loadConfig();
  const manifest = loadManifest();
  const entries = filterEntries(manifest, args);
  const outputDir = path.resolve(ROOT_DIR, config.outputDir);

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`\n🔊 Tila SFX Pipeline\n`);

  // Normalize-only mode: skip API, just re-process existing files
  if (args.normalizeOnly) {
    checkFfmpeg();
    console.log(`Re-normalizing ${entries.length} existing files...\n`);
    for (const entry of entries) {
      const filePath = path.join(outputDir, entry.file);
      if (!fs.existsSync(filePath)) {
        console.log(`  ⏭  ${entry.id} — file not found, skipping`);
        continue;
      }
      if (args.dryRun) {
        console.log(`  🔍 ${entry.id} — would normalize ${entry.file}`);
        continue;
      }
      normalizeExisting(filePath, {
        targetLUFS: config.targetLUFS,
        truePeak: config.truePeak,
        loudnessRange: config.loudnessRange,
        fadeInMs: config.fadeInMs,
        fadeOutMs: config.fadeOutMs,
        sampleRate: config.sampleRate,
        bitDepth: config.bitDepth,
        channels: config.channels,
        maxDurationMs: entry.maxDurationMs,
      });
      console.log(`  ✅ ${entry.id} — normalized`);
    }
    console.log(`\nDone!\n`);
    return;
  }

  // Generation mode
  checkFfmpeg();

  const apiKey = process.env.SFX_API_KEY;
  if (!apiKey) {
    console.error(
      "❌ SFX_API_KEY not set. Create a .env file with your ElevenLabs API key.\n" +
        "   See .env.example for the format."
    );
    process.exit(1);
  }

  const provider = createProvider(config.provider, apiKey);

  console.log(
    `Generating ${entries.length} sound(s) via ${config.provider}...\n`
  );

  let successCount = 0;
  let failCount = 0;

  for (const entry of entries) {
    const outputPath = path.join(outputDir, entry.file);

    if (args.dryRun) {
      console.log(`  🔍 ${entry.id}`);
      console.log(`     Prompt: "${entry.prompt}"`);
      console.log(
        `     Duration: ${entry.maxDurationMs}ms → ${outputPath}`
      );
      console.log();
      continue;
    }

    process.stdout.write(`  ⏳ ${entry.id} — generating...`);

    try {
      // Generate raw audio from API
      const durationSeconds = entry.maxDurationMs / 1000;
      const rawAudio = await provider.generate(entry.prompt, durationSeconds);

      // Write raw audio to temp file (API returns MP3)
      const tmpRaw = path.join(
        outputDir,
        `.tmp-${entry.id}-${Date.now()}.mp3`
      );
      fs.writeFileSync(tmpRaw, rawAudio);

      // Post-process: normalize, trim, fade, convert to WAV
      postProcess(tmpRaw, outputPath, {
        targetLUFS: config.targetLUFS,
        truePeak: config.truePeak,
        loudnessRange: config.loudnessRange,
        fadeInMs: config.fadeInMs,
        fadeOutMs: config.fadeOutMs,
        sampleRate: config.sampleRate,
        bitDepth: config.bitDepth,
        channels: config.channels,
        maxDurationMs: entry.maxDurationMs,
      });

      // Clean up temp file
      fs.unlinkSync(tmpRaw);

      process.stdout.write(`\r  ✅ ${entry.id} — saved to ${entry.file}\n`);
      successCount++;
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : String(error);
      process.stdout.write(`\r  ❌ ${entry.id} — ${msg}\n`);
      failCount++;
    }
  }

  if (!args.dryRun) {
    console.log(
      `\n${successCount} generated, ${failCount} failed.\n`
    );
  }

  // Auto-wire new sounds into player.ts
  if (args.wire && !args.dryRun) {
    console.log("Wiring new sounds into player.ts...\n");
    const { added, skipped } = wireNewSounds(entries);
    if (added.length > 0) {
      console.log(`  Added: ${added.join(", ")}`);
    }
    if (skipped.length > 0) {
      console.log(`  Already wired: ${skipped.join(", ")}`);
    }
    console.log();
  }

  console.log("Done!\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
