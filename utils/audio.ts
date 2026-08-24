/**
 * Audio Playback Utility
 *
 * Shared helper for decoding base64-encoded PCM audio (Int16, mono, 24 kHz)
 * returned by the Gemini TTS model and playing it through the Web Audio API.
 *
 * Used by: App.tsx (AIModal), About.tsx (LocationCommand), PostDetails.tsx (narration)
 */

let audioContext: AudioContext | null = null;

function getAudioContext(sampleRate: number = 24000): AudioContext {
  if (!audioContext || audioContext.state === "closed") {
    audioContext = new (window.AudioContext ||
      window.webkitAudioContext)({ sampleRate });
  }
  return audioContext;
}

/**
 * Decodes a base64-encoded PCM Int16 audio string and plays it via Web Audio API.
 *
 * @param base64    Raw base64-encoded PCM audio data (Int16, mono).
 * @param onEnded   Optional callback fired when playback finishes.
 * @param sampleRate Sample rate of the audio (default 24000 Hz for Gemini TTS).
 */
export async function playBase64Audio(
  base64: string,
  onEnded?: () => void,
  sampleRate: number = 24000
): Promise<void> {
  const ctx = getAudioContext(sampleRate);

  // Decode base64 to binary
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Convert Int16 PCM to Float32 for Web Audio API
  const dataInt16 = new Int16Array(bytes.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, sampleRate);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }

  // Play via AudioBufferSourceNode
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);

  if (onEnded) {
    source.onended = onEnded;
  }

  source.start();
}
