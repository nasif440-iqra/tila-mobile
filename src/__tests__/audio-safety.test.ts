import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("CONT-01: Audio playback try/catch wrappers", () => {
  const sourcePath = path.resolve(__dirname, "../audio/player.ts");
  const source = fs.readFileSync(sourcePath, "utf-8");

  // Extract function bodies for precise checks
  const playVoiceMatch = source.match(
    /async function playVoice\([\s\S]*?\n\}/
  );
  const playSFXMatch = source.match(
    /function playSFX\(source: AudioSource[\s\S]*?\n\}/
  );

  it("playVoice contains try/catch", () => {
    expect(playVoiceMatch).not.toBeNull();
    const body = playVoiceMatch![0];
    expect(body).toMatch(/try\s*\{/);
    expect(body).toMatch(/\}\s*catch/);
  });

  it("playSFX contains try/catch", () => {
    expect(playSFXMatch).not.toBeNull();
    const body = playSFXMatch![0];
    expect(body).toMatch(/try\s*\{/);
    expect(body).toMatch(/\}\s*catch/);
  });

  it("_playing assignment is inside try block (after player.play, before catch)", () => {
    expect(playSFXMatch).not.toBeNull();
    const body = playSFXMatch![0];

    // Extract the try block content (between try { and } catch)
    const tryBlock = body.match(/try\s*\{([\s\S]*?)\}\s*catch/);
    expect(tryBlock).not.toBeNull();
    const tryContent = tryBlock![1];

    // _playing assignment must be inside the try block
    expect(tryContent).toMatch(/_playing\s*=/);

    // player.play() must also be inside the try block, before _playing
    const playIndex = tryContent.indexOf("player.play()");
    const assignIndex = tryContent.indexOf("_playing =");
    expect(playIndex).toBeGreaterThan(-1);
    expect(assignIndex).toBeGreaterThan(playIndex);
  });

  it("playVoice catch handler uses console.warn", () => {
    expect(playVoiceMatch).not.toBeNull();
    const body = playVoiceMatch![0];
    expect(body).toMatch(/console\.warn\("Voice playback failed:"/);
  });

  it("playSFX catch handler uses console.warn", () => {
    expect(playSFXMatch).not.toBeNull();
    const body = playSFXMatch![0];
    expect(body).toMatch(/console\.warn\("SFX playback failed:"/);
  });

  it("catch blocks do not re-throw errors", () => {
    expect(playVoiceMatch).not.toBeNull();
    expect(playSFXMatch).not.toBeNull();

    // Extract catch blocks
    const voiceCatch = playVoiceMatch![0].match(/catch\s*\([^)]*\)\s*\{([\s\S]*?)\}/);
    const sfxCatch = playSFXMatch![0].match(/catch\s*\([^)]*\)\s*\{([\s\S]*?)\}/);

    expect(voiceCatch).not.toBeNull();
    expect(sfxCatch).not.toBeNull();

    expect(voiceCatch![1]).not.toMatch(/\bthrow\b/);
    expect(sfxCatch![1]).not.toMatch(/\bthrow\b/);
  });
});
