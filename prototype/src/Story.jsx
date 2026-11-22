import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { combinePeaks, useVoice } from './AudioDeck.jsx';
import { day, places, cueIndex } from './day.js';
import useStoryScroll from './useStoryScroll.js';
import Devices, { paintDevices } from './Devices.jsx';

const asset = name => import.meta.env.BASE_URL + name;
const compactQuery = '(prefers-reduced-motion: reduce), (max-height: 600px), (max-width: 350px) and (max-height: 715px)';

const voices = {'할머니':'elder','마실':'masil','딸':'family','생활 소리':'sound'};

function Bubble({ bubble, beat, cue, visible }) {
  const words = beat.cues[cue];
  const peaks = useMemo(() => combinePeaks(beat.files, 32), [beat]);
  return <div className="spatial-bubble" ref={bubble} hidden={!visible} data-speaker={voices[words.speaker]}>
    <div className="bubble-paper" key={beat.id+'-'+cue}>
      <span className="bubble-speaker">{words.speaker}</span>
      <p>{words.text}</p>
      {words.speaker === '생활 소리' && <div className="bubble-wave" aria-hidden="true">
        {peaks.map((h,i)=><i key={i} style={{height:Math.max(10,h)+'%'}}/>)}
      </div>}
    </div>
  </div>;
}

function FamilyCard({ beat, cue }) {
  const interest = beat.id === 'family-call';
  const shared = cue >= (interest ? 3 : 2);
  return <aside className="moment-letter" aria-label="가족 화면">
    <span>가족 화면 · {interest ? (shared ? '관심사 공유' : '공유 여부 확인 중') : (shared ? '수령 확인' : '배송 완료')}</span>
    <p key={beat.id+'-'+shared}>{interest ? (shared ? '요즘 《동백꽃 필 무렵》을 보신대요.' : '전해진 소식이 없어요.')
      : (shared ? '쌀을 잘 받으셨대요.' : '쌀 4kg 한 봉지 · 수령 확인 중')}</p>
  </aside>;
}

function RoomWorld({ controller, position, actor, reading, cue, linear, portal }) {
  const host = useRef(null);
  const pins = useRef([]);
  const bubble = useRef(null);
  const beat = day[reading.index];
  const [status, setStatus] = useState('loading');
  useEffect(() => {
    let closed = false;
    import('./room.js').then(({ mountRoom }) => {
      if (closed) return;
      controller.current = mountRoom(host.current, {
        pins: pins.current, bubble, actor, portal,
        initialProgress: position.current,
        onLost: () => { if (!closed) setStatus('fallback'); },
        onRestored: () => { if (!closed) setStatus('ready'); },
      });
      setStatus('ready');
    }).catch(() => { if (!closed) setStatus('fallback'); });
    return () => {
      closed = true;
      controller.current?.dispose();
      controller.current = null;
    };
  }, [controller, position, actor, portal]);
  useEffect(() => { controller.current?.refresh(); }, [reading.index, cue, linear, controller]);
  return <div className="room-world" data-room={status}>
    <div className="room-light" aria-hidden="true" />
    <img className="room-photo" src={asset('masil-evening.webp')} alt="" width="1200" height="900" />
    <div ref={host} className="world-canvas" aria-hidden="true" />
    {places.slice(1).map((place, i) => <a className="object-pin" key={place.id} ref={el=>{pins.current[i]=el;}}
      hidden={reading.index !== 0 || status !== 'ready'} href={'#'+place.id} aria-label={place.object+' 장면 보기'}>
      <i aria-hidden="true"/><span>{place.object}</span>
    </a>)}
    <Bubble bubble={bubble} beat={beat} cue={cue} visible={!linear && !reading.bridge && (reading.index>0 || reading.wakeShown || actor.current.audio)} />
    {!linear && !reading.bridge && beat.place===3 && <FamilyCard beat={beat} cue={cue}/>}
  </div>;
}

export default function Story() {
  const root = useRef(null), stage = useRef(null), controller = useRef(null);
  const position = useRef(0), actor = useRef({}), layer = useRef(null);
  const portal = useRef({ progress: 0, source: null, webgl: false, owner: 'room', paint: null });
  portal.current.paint = () => paintDevices(layer.current, portal.current);
  const [linear, setLinear] = useState(() => matchMedia(compactQuery).matches);
  const [soundOn, setSoundOn] = useState(false), [onScreen, setOnScreen] = useState(true);
  const reading = useStoryScroll({ root, stage, controller, position, portal, linear });

  const voice = useVoice();
  const activeBeat = useRef(-1), guided = useRef(false), suspended = useRef(null);
  const playback = useRef(voice);
  playback.current = voice;
  const target = soundOn && onScreen && !reading.bridge ? reading.index : -1;
  const currentTarget = useRef(target);
  currentTarget.current = target;
  const beat = day[reading.index], place = places[beat.place];
  const useAudioTime = target >= 0 && activeBeat.current === target && !voice.error;
  const resumeTime = suspended.current?.index === target ? suspended.current.elapsed : 0;
  const cue = target >= 0 && !voice.error
    ? cueIndex(beat, useAudioTime ? voice.elapsed : resumeTime)
    : reading.cue;
  const words = beat.cues[cue];
  actor.current = { line: beat.id+'-'+cue, speaker: words.speaker, place: beat.place,
    audio: useAudioTime && voice.playing, level: voice.level, onCall: beat.id === 'family-call' && cue >= 3 };

  useEffect(() => {
    const media = matchMedia(compactQuery);
    const change = () => setLinear(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);

  useEffect(() => {
    let inView = true;
    const sync = () => {
      const visible = inView && !document.hidden;
      if (!visible) guided.current = false;
      setOnScreen(visible);
    };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); });
    observer.observe(root.current);
    document.addEventListener('visibilitychange', sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, []);

  useEffect(() => {
    const takeControl = () => { guided.current = false; };
    const key = event => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) takeControl();
    };
    const pointer = event => {
      if (event.clientX >= document.documentElement.clientWidth) takeControl();
    };
    const link = event => {
      if (event.target.closest?.('a[href^="#"]:not(.scroll-invite)')) takeControl();
    };
    window.addEventListener('wheel', takeControl, { passive: true });
    window.addEventListener('touchmove', takeControl, { passive: true });
    document.addEventListener('pointerdown', pointer);
    document.addEventListener('keydown', key);
    document.addEventListener('click', link);
    return () => {
      window.removeEventListener('wheel', takeControl);
      window.removeEventListener('touchmove', takeControl);
      document.removeEventListener('pointerdown', pointer);
      document.removeEventListener('keydown', key);
      document.removeEventListener('click', link);
    };
  }, []);

  const startBeat = useCallback((index, from = 0) => {
    activeBeat.current = index;
    suspended.current = null;
    voice.play(day[index].files, from, lastLine => {
      if (lastLine && guided.current && currentTarget.current === index) {
        const next = day[index + 1]?.id ?? 'roadmap';
        if (next === 'roadmap') guided.current = false;
        document.getElementById(next)?.scrollIntoView({
          behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
        });
      }
      return false;
    });
  }, [voice.play]);

  useEffect(() => {
    if (!soundOn || reading.bridge) suspended.current = null;
    if (activeBeat.current === target) return;
    if (activeBeat.current >= 0) {
      if (soundOn && !onScreen && !reading.bridge && playback.current.playing) {
        suspended.current = { index: activeBeat.current, elapsed: playback.current.elapsed };
      }
      activeBeat.current = -1;
      voice.stop();
    }
    if (target < 0) return;
    const saved = suspended.current;
    // Avoid starting a passing room's audio while a menu link scrolls across several rooms.
    const timer = setTimeout(() => startBeat(target, saved?.index === target ? saved.elapsed : 0), 90);
    return () => clearTimeout(timer);
  }, [target, soundOn, onScreen, reading.bridge, startBeat, voice.stop]);

  useEffect(() => { controller.current?.listening(useAudioTime && voice.playing); }, [useAudioTime, voice.playing]);
  useEffect(() => { controller.current?.impact(Boolean(words.impact)); }, [words.impact]);

  function toggleSound() {
    if (soundOn && !voice.error) {
      guided.current = false;
      activeBeat.current = -1;
      suspended.current = null;
      setSoundOn(false);
      voice.stop();
    } else {
      setSoundOn(true);
      startBeat(reading.index);
    }
  }

  return <section className={'reel' + (linear ? ' linear-story' : '')} ref={root} aria-label="할머니 댁의 하루">
    {!linear && <div className="chapter-track" aria-hidden="true">
      {day.map(b => <div id={b.id} key={b.id} className="chapter-stop" style={{'--run': Math.max(b.run,b.cues.length*27)+'svh'}}>
        {b.id === 'morning-meal' && <span id="experience" className="story-alias" />}
      </div>)}
      <div className="chapter-stop device-stop" id="roadmap" />
    </div>}
    <div className="reel-stage" ref={stage} data-chapter={place.id} data-beat={beat.id} data-narration={useAudioTime ? "speaking" : "scroll"}>
      <div className="reel-atmosphere" aria-hidden="true"><div/><div/></div>
      <div className="wrap reel-layout">
        <RoomWorld controller={controller} position={position} actor={actor} reading={reading} cue={cue} linear={linear} portal={portal}/>
        {day.map((b,i) => {
          const Heading=i===0?'h1':'h2';
          return <article className="story-caption" key={b.id} id={linear ? b.id : undefined}
            data-id={places[b.place].id} aria-hidden={!linear && reading.bridge ? true : undefined} hidden={!linear && reading.index!==i}>
            {linear && b.id==='morning-meal' && <span id="experience" className="story-alias"/>}
            <p className="scene-topic"><span/>{b.topic}<time className="small-scene-time">{places[b.place].time}</time></p>
            <Heading>{b.title.map((line,j)=><span className="title-mask" key={line}><span style={{'--line-delay':j*50+'ms'}}>{line}</span></span>)}</Heading>
            <p className="scene-description">{b.body}</p>
            {!i && <a className="scroll-invite" href="#morning" onClick={event=>{
              event.preventDefault();
              guided.current = true;
              setSoundOn(true);
              startBeat(0);
            }}><i aria-hidden="true"/>소리와 함께 하루 따라가기</a>}
            {linear && <div className="plain-cues">
              {b.cues.map((c,j)=><p key={j}><b>{c.speaker}</b>{c.text}</p>)}
            </div>}
          </article>;
        })}
        <div className="scene-clock" aria-hidden="true"><i/>{place.object}<span>{place.time}</span></div>
      </div>
      {!linear && <Devices layer={layer} linear={false}/>}
      <div className="wrap reel-controls" inert={!linear && reading.bridge ? true : undefined}>
        <nav className="chapter-nav" aria-label="하루의 장면 이동">
          {places.map((p,i)=><a key={p.id} href={'#'+p.id} aria-current={i===beat.place?'step':undefined}><i aria-hidden="true"/><span>{p.nav}</span></a>)}
        </nav>
        <button type="button" className="journey-sound" data-playing={voice.playing && useAudioTime} onClick={toggleSound} aria-pressed={soundOn}>
          <i aria-hidden="true"/>{voice.error ? '소리 다시 듣기' : soundOn ? '하루 소리 끄기' : '하루 소리 켜기'}
        </button>
      </div>
    </div>
    {linear && <Devices linear/>}
  </section>;
}
