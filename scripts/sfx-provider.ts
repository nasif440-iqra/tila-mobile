import * as https from "https";
import * as fs from "fs";
import * as path from "path";

// ── Provider interface ──

export interface SFXProvider {
  generate(prompt: string, durationSeconds: number): Promise<Buffer>;
}

// ── ElevenLabs Sound Effects provider ──

const ELEVENLABS_URL = "https://api.elevenlabs.io/v1/sound-generation";

export function createElevenLabsProvider(apiKey: string): SFXProvider {
  return {
    async generate(prompt: string, durationSeconds: number): Promise<Buffer> {
      const body = JSON.stringify({
        text: prompt,
        duration_seconds: durationSeconds,
      });

      return new Promise((resolve, reject) => {
        const req = https.request(
          ELEVENLABS_URL,
          {
            method: "POST",
            headers: {
              "xi-api-key": apiKey,
              "Content-Type": "application/json",
              Accept: "audio/mpeg",
            },
          },
          (res) => {
            if (res.statusCode !== 200) {
              let errorBody = "";
              res.on("data", (chunk) => (errorBody += chunk));
              res.on("end", () =>
                reject(
                  new Error(
                    `ElevenLabs API error ${res.statusCode}: ${errorBody}`
                  )
                )
              );
              return;
            }

            const chunks: Buffer[] = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => resolve(Buffer.concat(chunks)));
          }
        );

        req.on("error", reject);
        req.write(body);
        req.end();
      });
    },
  };
}

// ── Provider factory ──

export function createProvider(
  providerName: string,
  apiKey: string
): SFXProvider {
  switch (providerName) {
    case "elevenlabs":
      return createElevenLabsProvider(apiKey);
    default:
      throw new Error(`Unknown SFX provider: ${providerName}`);
  }
}
