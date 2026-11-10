// Synthesize synchronized 18-second motion design soundtrack with beats, bass, and SFX
import fs from 'node:fs';

const SAMPLE_RATE = 44100;
const DURATION = 18.0;
const TOTAL_SAMPLES = Math.floor(SAMPLE_RATE * DURATION);

const buffer = new Float32Array(TOTAL_SAMPLES);

// Audio synthesis helper functions
function addSample(i, val) {
  if (i >= 0 && i < TOTAL_SAMPLES) {
    buffer[i] += val;
  }
}

// 1. Synthesize 128 BPM electronic drum beat
// 128 BPM = 2.133 beats/sec, 1 beat = 0.46875s
const BEAT_LEN = 60 / 128;
for (let t = 0; t < DURATION; t += BEAT_LEN / 2) {
  const beatIndex = Math.round(t / (BEAT_LEN / 2));
  const sampleStart = Math.floor(t * SAMPLE_RATE);

  // Kick on main quarter notes (every 2 eighth notes)
  if (beatIndex % 2 === 0) {
    // Punchy 808 kick
    const kickSamples = Math.floor(0.28 * SAMPLE_RATE);
    for (let s = 0; s < kickSamples; s++) {
      const p = s / kickSamples;
      const freq = 140 * Math.exp(-p * 14) + 42;
      const env = Math.exp(-p * 8);
      const amp = Math.sin(2 * Math.PI * freq * (s / SAMPLE_RATE)) * env * 0.45;
      addSample(sampleStart + s, amp);
    }
  }

  // Snare / Clap on beats 2 and 4 (beatIndex % 4 === 2)
  if (beatIndex % 4 === 2) {
    const snareSamples = Math.floor(0.2 * SAMPLE_RATE);
    for (let s = 0; s < snareSamples; s++) {
      const p = s / snareSamples;
      const noise = (Math.random() * 2 - 1) * Math.exp(-p * 15);
      const tone = Math.sin(2 * Math.PI * 220 * (s / SAMPLE_RATE)) * Math.exp(-p * 18);
      addSample(sampleStart + s, (noise * 0.35 + tone * 0.25) * 0.4);
    }
  }

  // Crisp Hi-Hat on every eighth note
  const hatSamples = Math.floor(0.045 * SAMPLE_RATE);
  for (let s = 0; s < hatSamples; s++) {
    const p = s / hatSamples;
    const noise = (Math.random() * 2 - 1) * Math.exp(-p * 35);
    addSample(sampleStart + s, noise * 0.12);
  }
}

// 2. Synth Bass Groove (Groovy pentatonic baseline)
const bassNotes = [55, 55, 65.4, 73.4, 82.4, 73.4, 65.4, 55]; // A1, C2, D2, E2...
for (let t = 0.4; t < DURATION - 0.5; t += BEAT_LEN) {
  const noteIdx = Math.floor(t / BEAT_LEN) % bassNotes.length;
  const freq = bassNotes[noteIdx];
  const sampleStart = Math.floor(t * SAMPLE_RATE);
  const noteSamples = Math.floor(BEAT_LEN * 0.85 * SAMPLE_RATE);
  for (let s = 0; s < noteSamples; s++) {
    const p = s / noteSamples;
    const env = (1 - Math.exp(-p * 30)) * Math.exp(-p * 4.5);
    // Warm saturated saw-like wave
    const phase = (freq * s) / SAMPLE_RATE;
    const wave = (phase % 1 < 0.5 ? 1 : -1) * 0.6 + Math.sin(2 * Math.PI * phase) * 0.4;
    addSample(sampleStart + s, wave * env * 0.22);
  }
}

// 3. Sound Effects Keyed to Motion Beats:

// SFX: Logo bloom whoosh at 0.4s
function addWhoosh(startTime, duration = 0.6, peakFreq = 600) {
  const start = Math.floor(startTime * SAMPLE_RATE);
  const total = Math.floor(duration * SAMPLE_RATE);
  for (let s = 0; s < total; s++) {
    const p = s / total;
    const freq = 120 + peakFreq * Math.sin(Math.PI * p);
    const env = Math.sin(Math.PI * p) ** 2;
    const val = (Math.random() * 2 - 1) * 0.25 + Math.sin(2 * Math.PI * freq * (s / SAMPLE_RATE)) * 0.25;
    addSample(start + s, val * env * 0.4);
  }
}

// SFX: Heavy rubber stamp SLAM (Fibber, Blackout)
function addStampSlam(startTime) {
  const start = Math.floor(startTime * SAMPLE_RATE);
  const total = Math.floor(0.4 * SAMPLE_RATE);
  for (let s = 0; s < total; s++) {
    const p = s / total;
    const thud = Math.sin(2 * Math.PI * 65 * Math.exp(-p * 12) * (s / SAMPLE_RATE)) * Math.exp(-p * 8);
    const snap = (Math.random() * 2 - 1) * Math.exp(-p * 40);
    addSample(start + s, (thud * 0.7 + snap * 0.5) * 0.6);
  }
}

// SFX: Mechanical Lock Click (Strata)
function addLockClick(startTime) {
  const start = Math.floor(startTime * SAMPLE_RATE);
  const total = Math.floor(0.25 * SAMPLE_RATE);
  for (let s = 0; s < total; s++) {
    const p = s / total;
    const clk1 = Math.sin(2 * Math.PI * 1800 * (s / SAMPLE_RATE)) * Math.exp(-p * 60);
    const clk2 = Math.sin(2 * Math.PI * 900 * (s / SAMPLE_RATE)) * Math.exp(-p * 30);
    addSample(start + s, (clk1 * 0.5 + clk2 * 0.4) * 0.45);
  }
}

// SFX: Radar Sonar Ping (Pinpoint)
function addRadarPing(startTime) {
  const start = Math.floor(startTime * SAMPLE_RATE);
  const total = Math.floor(0.6 * SAMPLE_RATE);
  for (let s = 0; s < total; s++) {
    const p = s / total;
    const ping = Math.sin(2 * Math.PI * 1450 * (s / SAMPLE_RATE)) * Math.exp(-p * 6);
    addSample(start + s, ping * 0.35);
  }
}

// SFX: Slide Whistle / Zip (Ballpark)
function addSliderWhoop(startTime) {
  const start = Math.floor(startTime * SAMPLE_RATE);
  const total = Math.floor(0.5 * SAMPLE_RATE);
  for (let s = 0; s < total; s++) {
    const p = s / total;
    const freq = 200 + 1200 * p * p;
    const env = Math.sin(Math.PI * p);
    addSample(start + s, Math.sin(2 * Math.PI * freq * (s / SAMPLE_RATE)) * env * 0.3);
  }
}

// SFX: Rapid Typewriter Clacks (Quipher)
function addTypewriterBurst(startTime, count = 6, interval = 0.08) {
  for (let i = 0; i < count; i++) {
    const t = startTime + i * interval;
    const start = Math.floor(t * SAMPLE_RATE);
    const total = Math.floor(0.04 * SAMPLE_RATE);
    for (let s = 0; s < total; s++) {
      const p = s / total;
      const noise = (Math.random() * 2 - 1) * Math.exp(-p * 70);
      const click = Math.sin(2 * Math.PI * 3200 * (s / SAMPLE_RATE)) * Math.exp(-p * 90);
      addSample(start + s, (noise * 0.4 + click * 0.4) * 0.3);
    }
  }
}

// SFX: Triumphant Outro Chime Chord (Finale)
function addVictoryChords(startTime) {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 major chord
  const start = Math.floor(startTime * SAMPLE_RATE);
  const total = Math.floor(2.2 * SAMPLE_RATE);
  for (let s = 0; s < total; s++) {
    const p = s / total;
    const env = Math.exp(-p * 2.2);
    let chord = 0;
    for (const freq of notes) {
      chord += Math.sin(2 * Math.PI * freq * (s / SAMPLE_RATE));
    }
    addSample(start + s, (chord / notes.length) * env * 0.35);
  }
}

// Schedule the sound effects synchronized with visual cues:
addWhoosh(0.3, 0.7, 700);        // Logo assemble
addWhoosh(1.8, 0.4, 900);        // "MEET ODDLY"
addStampSlam(4.0);               // Fibber: FAKE! stamp
addLockClick(5.4);               // Strata: LOCKED!
addRadarPing(6.4);               // Pinpoint: Scope ping
addRadarPing(7.1);               // Pinpoint: Target locked
addSliderWhoop(7.8);             // Ballpark: Slide whip
addLockClick(8.5);               // Ballpark: Spot on!
addTypewriterBurst(9.4, 8, 0.07);// Quipher: Cryptogram typing
addStampSlam(11.8);              // Blackout: DECLASSIFIED
addWhoosh(14.8, 0.6, 850);       // Finale transition
addVictoryChords(15.2);          // Confetti & Brand Chime

// 4. Soft limiter / master normalize to prevent clipping
let maxPeak = 0;
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  const abs = Math.abs(buffer[i]);
  if (abs > maxPeak) maxPeak = abs;
}
const normFactor = maxPeak > 0 ? 0.92 / maxPeak : 1;

// Write 16-bit PCM Stereo WAV file
const numChannels = 2;
const byteRate = SAMPLE_RATE * numChannels * 2;
const blockAlign = numChannels * 2;
const wavDataSize = TOTAL_SAMPLES * blockAlign;
const wavHeader = Buffer.alloc(44);

wavHeader.write('RIFF', 0);
wavHeader.writeUInt32LE(36 + wavDataSize, 4);
wavHeader.write('WAVE', 8);
wavHeader.write('fmt ', 12);
wavHeader.writeUInt32LE(16, 16); // Subchunk1Size
wavHeader.writeUInt16LE(1, 20);  // PCM format
wavHeader.writeUInt16LE(numChannels, 22);
wavHeader.writeUInt32LE(SAMPLE_RATE, 24);
wavHeader.writeUInt32LE(byteRate, 28);
wavHeader.writeUInt16LE(blockAlign, 32);
wavHeader.writeUInt16LE(16, 34); // BitsPerSample
wavHeader.write('data', 36);
wavHeader.writeUInt32LE(wavDataSize, 40);

const pcmBuffer = Buffer.alloc(wavDataSize);
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  const sample = Math.max(-1, Math.min(1, buffer[i] * normFactor));
  const intVal = Math.floor(sample * 32767);
  // Stereo: write L and R
  pcmBuffer.writeInt16LE(intVal, i * 4);
  pcmBuffer.writeInt16LE(intVal, i * 4 + 2);
}

fs.writeFileSync('soundtrack.wav', Buffer.concat([wavHeader, pcmBuffer]));
console.log('✓ Synthesized synchronized soundtrack: soundtrack.wav (18.0s, 44.1kHz stereo, normalized)');
