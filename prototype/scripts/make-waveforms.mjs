import { readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = resolve(root, 'public');
const rate = 8000;
const bins = 96;
const waveforms = {};

for (const name of readdirSync(directory).filter(name => name.endsWith('.mp3')).sort()) {
  const decoded = spawnSync('ffmpeg', ['-nostdin','-v','error','-i',resolve(directory,name),
    '-ac','1','-ar',String(rate),'-f','f32le','-'], { maxBuffer: 32 * 1024 * 1024 });
  if (decoded.error) throw decoded.error;
  if (decoded.status !== 0) throw Error(name + ': ' + decoded.stderr.toString());
  const pcm = decoded.stdout;
  const samples = pcm.length / 4;
  if (samples < bins) throw Error('Recording is too short: ' + name);
  const levels = [];
  let start = 0;
  for (let bin = 0; bin < bins; bin++) {
    const size = Math.floor(samples / bins) + Number(bin < samples % bins);
    let power = 0;
    for (let i = start; i < start + size; i++) power += pcm.readFloatLE(i * 4) ** 2;
    const db = 20 * Math.log10(Math.max(1e-7, Math.sqrt(power / size)));
    levels.push(Math.round(100 * Math.min(1, Math.max(0, (db + 60) / 54)) ** 1.55));
    start += size;
  }
  waveforms[name] = { seconds: Number((samples / rate).toFixed(4)), levels };
}
writeFileSync(resolve(root,'src/waveforms.json'), JSON.stringify(waveforms) + '\n');
console.log('Prepared waveforms for ' + Object.keys(waveforms).length + ' recordings.');
