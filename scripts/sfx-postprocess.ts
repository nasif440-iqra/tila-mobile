import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

interface PostProcessOptions {
  targetLUFS: number;
  truePeak: number;
  loudnessRange: number;
  fadeInMs: number;
  fadeOutMs: number;
  sampleRate: number;
  bitDepth: number;
  channels: number;
  maxDurationMs: number;
}

// ── Check ffmpeg is available ──

export function checkFfmpeg(): void {
  try {
    execSync("ffmpeg -version", { stdio: "pipe" });
  } catch {
    console.error(
      "\n❌ ffmpeg is not installed or not in PATH.\n\n" +
        "Install it:\n" +
        "  macOS:   brew install ffmpeg\n" +
        "  Windows: winget install ffmpeg  (or download from https://ffmpeg.org)\n" +
        "  Linux:   sudo apt install ffmpeg\n"
    );
    process.exit(1);
  }
}

// ── Get duration of an audio file in seconds ──

function getDuration(filePath: string): number {
  const output = execSync(
    `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`,
    { encoding: "utf-8" }
  ).trim();
  return parseFloat(output);
}

// ── Post-process a single audio file ──

export function postProcess(
  inputPath: string,
  outputPath: string,
  options: PostProcessOptions
): void {
  const tmpDir = os.tmpdir();
  const tmpNormalized = path.join(tmpDir, `sfx-norm-${Date.now()}.wav`);

  // Step 1: Convert to WAV and trim silence
  const trimFilter = [
    "silenceremove=start_periods=1:start_silence=0.01:start_threshold=-50dB",
    "silenceremove=stop_periods=1:stop_silence=0.01:stop_threshold=-50dB",
  ].join(",");

  execSync(
    `ffmpeg -y -i "${inputPath}" -af "${trimFilter}" -ar ${options.sampleRate} -sample_fmt s${options.bitDepth} -ac ${options.channels} "${tmpNormalized}"`,
    { stdio: "pipe" }
  );

  // Step 2: Get duration after trimming, enforce max
  let duration = getDuration(tmpNormalized);
  const maxDuration = options.maxDurationMs / 1000;

  let durationFilter = "";
  if (duration > maxDuration) {
    // Truncate and add fade-out at the end
    durationFilter = `atrim=0:${maxDuration}`;
    duration = maxDuration;
  }

  // Step 3: Normalize volume + add fades
  const fadeIn = options.fadeInMs / 1000;
  const fadeOut = options.fadeOutMs / 1000;
  const fadeOutStart = Math.max(0, duration - fadeOut);

  const finalFilter = [
    `loudnorm=I=${options.targetLUFS}:TP=${options.truePeak}:LRA=${options.loudnessRange}`,
    durationFilter,
    `afade=t=in:d=${fadeIn}`,
    `afade=t=out:st=${fadeOutStart}:d=${fadeOut}`,
  ]
    .filter(Boolean)
    .join(",");

  execSync(
    `ffmpeg -y -i "${tmpNormalized}" -af "${finalFilter}" -ar ${options.sampleRate} -sample_fmt s${options.bitDepth} -ac ${options.channels} "${outputPath}"`,
    { stdio: "pipe" }
  );

  // Clean up temp file
  fs.unlinkSync(tmpNormalized);
}

// ── Normalize-only mode: re-process existing files without regenerating ──

export function normalizeExisting(
  filePath: string,
  options: PostProcessOptions
): void {
  const tmpInput = filePath + ".bak";
  fs.copyFileSync(filePath, tmpInput);
  try {
    postProcess(tmpInput, filePath, options);
  } finally {
    fs.unlinkSync(tmpInput);
  }
}
