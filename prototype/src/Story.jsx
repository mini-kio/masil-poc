import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { combinePeaks, useVoice } from './AudioDeck.jsx';
import { day, places } from './day.js';
import useStoryScroll from './useStoryScroll.js';
import { nextNarratedBeat } from './storyPacing.js';
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
  const root=useRef(null),stage=useRef(null),controller=useRef(null),position=useRef(0),actor=useRef({});
  const layer=useRef(null),portal=useRef({progress:0,source:null,webgl:false,owner:'room',paint:null});
  portal.current.paint=()=>paintDevices(layer.current,portal.current);
  const controls=useRef({goal:{index:0,cue:0,bridge:false},seeking:false,guided:false,autoUntil:0,skipBridge:false,snapCaption:false});
  const narrator=useRef({});
  const played=useRef(-1),done=useRef(false),resume=useRef(null);
  const [spoken,setSpoken]=useState(-1);
  const [linear,setLinear]=useState(()=>matchMedia(compactQuery).matches);
  const [soundOn,setSoundOn]=useState(false),[onScreen,setOnScreen]=useState(true);
  const voice=useVoice();
  const useAudioTime=soundOn && onScreen && !voice.error && spoken>=0;
  narrator.current={index:spoken,elapsed:voice.elapsed,active:useAudioTime,finished:done.current};
  const reading=useStoryScroll({root,stage,controller,position,portal,controls,narrator,linear});
  const beat=day[reading.index],cue=reading.cue,place=places[beat.place];
  actor.current={line:beat.id+'-'+cue,speaker:beat.cues[cue].speaker,place:beat.place,
    audio:useAudioTime && voice.playing,level:voice.level,onCall:beat.id==='family-call' && cue>=3};

  useEffect(()=>{
    const media=matchMedia(compactQuery),change=()=>setLinear(media.matches);
    media.addEventListener('change',change);return ()=>media.removeEventListener('change',change);
  },[]);
  useEffect(()=>{
    let inView=true;
    const sync=()=>{ const active=inView&&!document.hidden; if(!active) controls.current.guided=false; setOnScreen(active); };
    const observer=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;sync();});
    observer.observe(root.current); document.addEventListener('visibilitychange',sync);
    return ()=>{observer.disconnect();document.removeEventListener('visibilitychange',sync);};
  },[]);

  const startBeat=useCallback(function playBeat(index,from=0) {
    const ctl=controls.current;
    played.current=index;done.current=false;resume.current=null;setSpoken(index);
    voice.play(day[index].files,from,lastLine=>{
      if(!lastLine) return false;
      done.current=true;
      ctl.request?.();
      if(ctl.seeking) return false;
      const next=nextNarratedBeat(index,ctl.goal.index);
      if(next!==index) { playBeat(next); return true; }
      if(ctl.guided) {
        ctl.autoUntil=performance.now()+1400;
        if(index===day.length-1) ctl.guided=false;
        document.getElementById(day[index+1]?.id??'roadmap')?.scrollIntoView({
          behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'
        });
      }
      return false;
    });
  },[voice.play]);

  controls.current.onSeek=goal=>{
    if(!soundOn || !onScreen) return;
    if(goal.bridge) {
      played.current=-1;done.current=false;resume.current=null;setSpoken(-1);voice.stop();
    } else startBeat(goal.index,day[goal.index].cues[goal.cue].at);
  };
  useEffect(()=>{
    const ctl=controls.current;
    if(!soundOn||!onScreen) {
      if(played.current>=0) {
        if(soundOn&&!onScreen&&!done.current) resume.current={index:played.current,elapsed:voice.elapsed};
        if(!soundOn) resume.current=null;
        played.current=-1;done.current=false;setSpoken(-1);voice.stop();
      }
      return;
    }
    if(ctl.seeking||voice.error||ctl.skipBridge&&reading.atPortal) return;
    const target=ctl.goal.index;
    if(played.current<0) {
      if(ctl.goal.bridge && !resume.current) return;
      const saved=resume.current;
      startBeat(saved?.index??target,saved?.elapsed??0);
    } else if(done.current && played.current!==target) {
      startBeat(nextNarratedBeat(played.current,target));
    }
  },[soundOn,onScreen,reading.target,reading.atPortal,voice.playing,voice.error,voice.elapsed,voice.stop,startBeat]);
  useEffect(()=>{controls.current.request?.();},[useAudioTime,spoken,voice.elapsed,voice.playing,voice.error]);
  useEffect(()=>{controller.current?.listening(useAudioTime&&voice.playing);},[useAudioTime,voice.playing]);
  const impact=Boolean(beat.cues[cue].impact);
  useEffect(()=>{controller.current?.impact(impact);},[impact]);

  function toggleSound() {
    const ctl=controls.current;
    if(soundOn&&!voice.error) {
      ctl.guided=false;ctl.snapCaption=true;resume.current=null;
      setSoundOn(false);voice.stop();
    } else {
      ctl.cancelSeek?.();ctl.skipBridge=false;setSoundOn(true);startBeat(reading.index);
    }
    ctl.request?.();
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
        <RoomWorld controller={controller} position={position} actor={actor} reading={reading} dialogueBeat={beat} cue={cue} linear={linear} portal={portal}/>
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
              controls.current.cancelSeek?.();controls.current.guided=true; controls.current.skipBridge=false;
              setSoundOn(true); startBeat(0);
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
