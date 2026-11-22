import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import recordings from './waveforms.json';

export const duration = name => recordings[name]?.seconds ?? 0;
export const totalTime = files => files.reduce((sum, file) => sum + duration(file), 0);
const initial = { playing: false, elapsed: 0, error: false };
let stopCurrentPlayer = null;

export function useVoice() {
  const player = useRef(null);
  const sequence = useRef(0);
  const offsetOfPart = useRef(0);
  const activeFile = useRef(null);
  const [state, setState] = useState(initial);

  const interrupt = useCallback(() => {
    sequence.current++;
    const audio = player.current;
    if (audio) {
      audio.ontimeupdate = audio.onended = audio.onerror = audio.onloadedmetadata = null;
      audio.pause();
    }
  }, []);
  const stop = useCallback(() => { interrupt(); setState(initial); }, [interrupt]);
  useEffect(() => () => {
    if (stopCurrentPlayer === stop) stopCurrentPlayer = null;
    interrupt();
  }, [interrupt, stop]);

  const play = useCallback((files, from = 0, onPartEnd) => {
    if (stopCurrentPlayer && stopCurrentPlayer !== stop) stopCurrentPlayer();
    stopCurrentPlayer = stop;
    interrupt();
    const token = sequence.current;
    const full = totalTime(files);
    if (!files.length) { setState(initial); return; }
    const indexed = files.every(file => duration(file) > 0);
    if (indexed && from >= full) { setState({ playing: false, elapsed: full, error: false }); return; }
    const start = indexed ? Math.max(0, from) : 0;
    const audio = player.current ?? new Audio();
    player.current = audio;
    let accumulated = 0;
    let index = 0;
    while (indexed && index < files.length - 1 && accumulated + duration(files[index]) <= start) {
      accumulated += duration(files[index++]);
    }
    setState({ playing: true, elapsed: start, error: false });

    function loadPart(localStart) {
      if (token !== sequence.current) return;
      const part = index;
      offsetOfPart.current = accumulated;
      const active = () => token === sequence.current && index === part;
      const fail = () => {
        if (!active()) return;
        interrupt();
        setState(s => ({ ...s, playing: false, error: true }));
      };
      audio.onerror = fail;
      audio.ontimeupdate = () => {
        if (active()) setState({ playing: true, elapsed: indexed ? Math.min(full, accumulated + audio.currentTime) : accumulated + audio.currentTime, error: false });
      };
      audio.onended = () => {
        if (!active()) return;
        accumulated += duration(files[index++]) || audio.duration || 0;
        if (onPartEnd?.(index===files.length)) return;
        if (index < files.length) loadPart(0);
        else setState({ playing: false, elapsed: indexed ? full : accumulated, error: false });
      };
      audio.onloadedmetadata = () => {
        if (active() && localStart > 0) audio.currentTime = Math.min(localStart, Math.max(0, audio.duration - .04));
      };
      activeFile.current = files[index];
      const file=files[index];
      const revision=recordings[file]?.revision;
      audio.src=import.meta.env.BASE_URL+file+(revision?'?v='+revision:'');
      audio.play().catch(fail);
    }
    loadPart(start - accumulated);
  }, [interrupt, stop]);

  function pause() {
    const exact = player.current && !player.current.paused ? offsetOfPart.current + player.current.currentTime : null;
    interrupt();
    setState(s => ({ ...s, playing: false, elapsed: exact ?? s.elapsed }));
  }

  function seek(files, at, resume) {
    if (resume) play(files, at);
    else {
      interrupt();
      setState({ playing: false, elapsed: Math.min(totalTime(files), Math.max(0, at)), error: false });
    }
  }

  const level = useCallback(() => {
    const audio = player.current, clip = recordings[activeFile.current];
    if (!audio || audio.paused || !clip) return 0;
    const index = Math.min(clip.levels.length-1, Math.floor(audio.currentTime / clip.seconds * clip.levels.length));
    return (clip.levels[index] ?? 0) / 100;
  }, []);

  return { ...state, play, pause, stop, seek, level };
}

export function combinePeaks(files, count = 90) {
  const total = totalTime(files);
  return Array.from({ length: count }, (_, i) => {
    let t = total * (i + .5) / count;
    for (const file of files) {
      const clip = recordings[file];
      if (!clip) continue;
      if (t < clip.seconds) return clip.levels[Math.min(clip.levels.length - 1, Math.floor(t / clip.seconds * clip.levels.length))];
      t -= clip.seconds;
    }
    return 0;
  });
}

const clock = t => Math.floor(t / 60) + ':' + String(Math.floor(t) % 60).padStart(2, '0');
const questionEnd = duration('check-food.mp3');

export function soundCue(files, at) {
  if (files.length !== 1 || !['same-impact.mp3', 'same-calm.mp3'].includes(files[0])) return null;
  if (at >= questionEnd + .89) return 'reply';
  if (files[0] === 'same-impact.mp3' && at >= questionEnd + .20) return 'impact';
  return 'question';
}

export default function AudioDeck({ files, voice, muted, silentSeek = false }) {
  const fileKey = files.join('|');
  const peaks = useMemo(() => combinePeaks(fileKey ? fileKey.split('|') : []), [fileKey]);
  const scrub = useRef(null);
  const full = totalTime(files);
  if (!files.length) return null;
  if (!files.every(file => duration(file) > 0)) return <button type="button" className="text-button"
    disabled={muted} onClick={() => voice.playing ? voice.pause() : voice.play(files)}>{voice.playing ? '음원 일시정지' : '이 장면 음원 듣기'}</button>;
  const progress = Math.max(0, Math.min(1, voice.elapsed / full));
  const cue = soundCue(files, voice.elapsed);
  const cues = cue ? [
    ['question', '마실 질문', 0],
    ...(files[0] === 'same-impact.mp3' ? [['impact', '쿵 소리', questionEnd + .20]] : []),
    ['reply', '할머니 답변', questionEnd + .89],
  ] : [];

  function begin() {
    if (scrub.current) return;
    scrub.current = { resume: voice.playing };
    voice.pause();
  }
  function finish(e) {
    const pending = scrub.current;
    if (!pending) return;
    scrub.current = null;
    voice.seek(files, e.currentTarget.valueAsNumber, pending.resume && !muted);
  }

  return <div className="audio-deck" data-playing={voice.playing} data-cue={voice.playing ? cue : undefined}>
    <div className="audio-controls">
      <button type="button" className="transport" aria-label={voice.playing ? '음원 일시정지' : '이 장면 음원 듣기'}
        disabled={muted} onClick={() => voice.playing ? voice.pause() : voice.play(files, progress >= .999 ? 0 : voice.elapsed)}>
        <i className={voice.playing ? 'pause-glyph' : 'play-glyph'} aria-hidden="true" />
      </button>
      <div className="trace-control" style={{ '--played': (progress * 100).toFixed(2) + '%' }}>
        <div className="trace-bars" aria-hidden="true">{peaks.map((h, i) => <i key={i} style={{ '--level': h + '%' }} />)}</div>
        <div className="trace-bars trace-past" aria-hidden="true">{peaks.map((h, i) => <i key={i} style={{ '--level': h + '%' }} />)}</div>
        <i className="trace-needle" aria-hidden="true" />
        <input type="range" min="0" max={full} step=".05" value={Math.min(full, voice.elapsed)}
          aria-label={muted && silentSeek ? '통화 장면 위치' : '음원 재생 위치'} disabled={muted && !silentSeek} aria-valuetext={clock(voice.elapsed) + ' / ' + clock(full)}
          onPointerDown={begin} onPointerUp={finish} onPointerCancel={finish} onBlur={finish}
          onKeyDown={e => { if (['ArrowLeft','ArrowRight','Home','End','PageUp','PageDown'].includes(e.key)) begin(); }}
          onKeyUp={finish} onChange={e => voice.seek(files, e.currentTarget.valueAsNumber, !scrub.current && voice.playing)} />
      </div>
      <span className="audio-time">{clock(voice.elapsed)} <em>/ {clock(full)}</em></span>
    </div>
    {cues.length > 0 && <div className="cue-points" aria-label="소리 구간 바로 듣기">
      {cues.map(([key,label,at]) => <button key={key} type="button" data-active={cue === key}
        disabled={muted} onClick={() => voice.play(files, at)}>{label}</button>)}
    </div>}
  </div>;
}
