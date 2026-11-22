import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { combinePeaks, useVoice } from './AudioDeck.jsx';
import { cueIndex, day, places } from './day.js';
import Devices, { easeBetween, paintDevices } from './Devices.jsx';

const asset = name => import.meta.env.BASE_URL + name;
const compactQuery = '(prefers-reduced-motion: reduce), (max-height: 600px), (max-width: 350px) and (max-height: 715px)';
const bound = v => Math.max(0, Math.min(1, v));
const roomStarts = places.map((_, i) => day.findIndex(beat => beat.place === i));

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

function RoomWorld({ controller, position, actor, reading, dialogueBeat, cue, linear, portal }) {
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
    <Bubble bubble={bubble} beat={dialogueBeat} cue={cue} visible={!linear && !reading.bridge && (reading.index>0 || reading.wakeShown || actor.current.audio)} />
    {!linear && !reading.bridge && beat.place===3 && <FamilyCard beat={beat} cue={dialogueBeat===beat?cue:0}/>}
  </div>;
}

export default function Story() {
  const root = useRef(null);
  const stage = useRef(null);
  const controller = useRef(null);
  const position = useRef(0);
  const actor = useRef({});
  const layer=useRef(null), portal=useRef({progress:0,source:null,paint:null});
  portal.current.paint=()=>paintDevices(layer.current,portal.current.progress,portal.current.source);
  const lastPlayed=useRef(-1), desired=useRef(-1), guided=useRef(false);
  const [spoken,setSpoken]=useState(-1);
  const [reading, setReading] = useState({index:0,cue:0});
  const [linear, setLinear] = useState(() => matchMedia(compactQuery).matches);
  const [soundOn, setSoundOn] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const voice = useVoice();
  const beat = day[reading.index];
  const place = places[beat.place];
  const useAudioTime=soundOn && onScreen && !voice.error && spoken>=0 && !reading.bridge;
  const dialogueBeat=useAudioTime ? day[spoken] : beat;
  const cue=useAudioTime ? cueIndex(dialogueBeat,voice.elapsed) : reading.cue;
  desired.current=soundOn && onScreen && !reading.bridge ? reading.index : -1;

  actor.current={line:dialogueBeat.id+'-'+cue,speaker:dialogueBeat.cues[cue].speaker,place:dialogueBeat.place,
    audio:useAudioTime && voice.playing,level:voice.level,onCall:dialogueBeat.id==='family-call' && cue>=3};

  useEffect(() => {
    const media = matchMedia(compactQuery);
    const change = () => setLinear(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    const element = root.current;
    let visible = true;
    const sync = () => {
      if (!visible || document.hidden) guided.current=false;
      setOnScreen(visible && !document.hidden);
    };
    const observer = new IntersectionObserver(([entry]) => { visible=entry.isIntersecting; sync(); });
    observer.observe(element);
    document.addEventListener('visibilitychange', sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, []);
  useEffect(()=>{
    // A manual gesture takes over from the listening tour without muting the scene.
    const handBack=()=>{guided.current=false;};
    const key=e=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(e.key)) handBack();};
    const link=e=>{if(e.target.closest('a[href^="#"]:not(.scroll-invite)')) handBack();};
    window.addEventListener('wheel',handBack,{passive:true});
    window.addEventListener('touchmove',handBack,{passive:true});
    document.addEventListener('keydown',key);
    document.addEventListener('click',link);
    return ()=>{window.removeEventListener('wheel',handBack);window.removeEventListener('touchmove',handBack);document.removeEventListener('keydown',key);document.removeEventListener('click',link);};
  },[]);
  const startBeat=useCallback(function playBeat(index) {
    lastPlayed.current=index;
    setSpoken(index);
    voice.play(day[index].files,0,lastLine=>{
      const next=desired.current;
      if (next===index) {
        if (guided.current && lastLine) {
          const target=document.getElementById(day[index+1]?.id ?? 'roadmap');
          if (index===day.length-1) guided.current=false;
          target?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
        }
        return false;
      }
      if (next>=0) playBeat(next);
      else { lastPlayed.current=-1; setSpoken(-1); voice.stop(); }
      return true;
    });
  },[voice.play,voice.stop]);
  useEffect(()=>{
    const next=desired.current;
    if (lastPlayed.current===next) return;
    if (next<0) { lastPlayed.current=-1; setSpoken(-1); voice.stop(); return; }
    // On a normal forward scroll, finish the current sentence before entering the next room.
    if (voice.playing && next===lastPlayed.current+1 && lastPlayed.current>=0) return;
    const timer=setTimeout(()=>startBeat(next),120);
    return ()=>clearTimeout(timer);
  },[reading.index,reading.bridge,soundOn,onScreen,voice.playing,voice.stop,startBeat]);
  useEffect(() => { controller.current?.listening(voice.playing); }, [voice.playing]);
  const impact = Boolean(dialogueBeat.cues[cue]?.impact);
  useEffect(() => { controller.current?.impact(impact); }, [impact]);

  function toggleSound() {
    if (soundOn && !voice.error) {
      guided.current=false; desired.current=-1;
      setSoundOn(false);
      voice.stop();
    } else {
      setSoundOn(true);
      desired.current=reading.index;
      startBeat(reading.index);
    }
  }

  useEffect(() => {
    const stops = [...root.current.querySelectorAll(linear ? '.story-caption, .devices-linear' : '.chapter-stop')];
    let frame = 0;
    function read() {
      frame = 0;
      const header = document.querySelector('.masthead').offsetHeight;
      const line = header + (linear ? Math.min(185, innerHeight * .26) : 3);
      const tops = stops.map(node => node.getBoundingClientRect().top);
      let i = 0;
      while (i + 1 < tops.length && tops[i + 1] <= line) i++;
      const length = i + 1 < stops.length ? tops[i+1]-tops[i]
        : stops[i].offsetHeight - (linear ? 0 : stage.current.offsetHeight);
      const fraction = bound((line-tops[i]) / Math.max(1,length));
      const bridge=i===day.length;
      const active=Math.min(day.length-1,i);
      const travel=fraction<.67?.14*fraction/.67:.14+.86*(fraction-.67)/.33;
      const progress=linear ? 0 : bridge ? .105+.895*fraction : active===day.length-1 ? .105*easeBetween(fraction,.91,1) : 0;
      portal.current.progress=progress;
      if (!progress) portal.current.source=null;
      portal.current.paint();
      position.current=progress ? 8+2*easeBetween(progress,0,.52) : Math.min(day.length-1,active+travel);
      controller.current?.setProgress(position.current);
      stage.current.dataset.transition=String(progress>0);
      stage.current.style.setProperty('--story-out',1-easeBetween(progress,0,.10));
      stage.current.style.setProperty('--room-out',1-easeBetween(progress,.28,.51));
      const group=day[active].place;
      const groupLength=(roomStarts[group+1]??day.length)-roomStarts[group];
      stage.current.style.setProperty('--journey',(group+(active-roomStarts[group]+fraction)/groupLength)/places.length);
      const nextCue=cueIndex(day[active],(bridge?1:fraction)*day[active].seconds);
      const wakeShown=active===0 && fraction>.28;
      setReading(previous=>previous.index===active && previous.cue===nextCue && previous.bridge===bridge && previous.wakeShown===wakeShown ? previous : {index:active,cue:nextCue,bridge,wakeShown});
    }
    function schedule() { if (!frame) frame=requestAnimationFrame(read); }
    read();
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule,{passive:true});
    window.addEventListener('pageshow',schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll',schedule);
      window.removeEventListener('resize',schedule);
      window.removeEventListener('pageshow',schedule);
    };
  }, [linear]);

  return <section className={'reel' + (linear ? ' linear-story' : '')} ref={root} aria-label="할머니 댁의 하루">
    {!linear && <div className="chapter-track" aria-hidden="true">
      {day.map(b => <div id={b.id} key={b.id} className="chapter-stop" style={{'--run': b.run+'svh'}}>
        {b.id === 'morning-meal' && <span id="experience" className="story-alias" />}
      </div>)}
      <div className="chapter-stop device-stop" id="roadmap" />
    </div>}
    <div className="reel-stage" ref={stage} data-chapter={place.id} data-beat={beat.id}>
      <div className="reel-atmosphere" aria-hidden="true"><div/><div/></div>
      <div className="wrap reel-layout">
        <RoomWorld controller={controller} position={position} actor={actor} reading={reading} dialogueBeat={dialogueBeat} cue={cue} linear={linear} portal={portal}/>
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
              guided.current=true; desired.current=0; setSoundOn(true); startBeat(0);
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
