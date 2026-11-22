import { useEffect, useState } from 'react';
import { day, places, cueIndex } from './day.js';
import { captionLayout, clamp01, scrollCue, scrollVelocity } from './storyPacing.js';
import { CLOSEUP, HANDOFF, ROOM_GONE, easeBetween } from './deviceTimeline.js';

const layout=captionLayout(day);
const starts=places.map((_,i)=>day.findIndex(b=>b.place===i));
const last=day.length-1;

export default function useStoryScroll({root,stage,controller,position,portal,controls,narrator,linear}) {
  const [reading,setReading]=useState({index:0,cue:0,target:0,atPortal:false,bridge:false,wakeShown:false});
  useEffect(()=>{
    const ctl=controls.current;
    const stops=Array.from(root.current.querySelectorAll(linear?'.story-caption, .devices-linear':'.chapter-stop'));
    let tops=[], end=0, readingLine=0, frame=0, settle=0, holdTimer=0;
    let displayY=scrollY, previous=performance.now(), ordinal=-1, holdUntil=0, fast=scrollVelocity(scrollY,previous);
    const goal=ctl.goal;
    function locate(y) {
      const line=y+readingLine;
      let i=0;
      while(i+1<tops.length && tops[i+1]<=line) i++;
      const fraction=clamp01((line-tops[i])/Math.max(1,(tops[i+1]??end)-tops[i]));
      return {index:Math.min(i,last),fraction,bridge:i>last};
    }
    function measure() {
      const header=document.querySelector('.masthead').offsetHeight;
      readingLine=header+(linear?Math.min(185,innerHeight*.26):3);
      tops=stops.map(el=>el.getBoundingClientRect().top+scrollY);
      end=tops.at(-1)+stops.at(-1).offsetHeight-(linear?0:stage.current.offsetHeight);
      request();
    }
    function request() { if(!frame) frame=requestAnimationFrame(draw); }
    function draw(now) {
      frame=0;
      const dt=Math.max(0,Math.min(now-previous,120));
      previous=now;
      const y=scrollY;
      if(linear||ctl.seeking||Math.abs(y-displayY)<.65) displayY=y;
      else displayY+=(y-displayY)*(1-Math.exp(-dt/104));
      const raw=locate(y),view=locate(displayY);
      Object.assign(goal,raw,{cue:scrollCue(layout.beats[raw.index],raw.bridge?1:raw.fraction)});
      const sound=narrator.current;
      const usingSound=sound.active && sound.index>=0 && !ctl.seeking && !ctl.skipBridge;
      const requested=layout.beats[view.index].first+scrollCue(layout.beats[view.index],view.bridge?1:view.fraction);
      if(ordinal<0 || linear || ctl.seeking || ctl.snapCaption) ordinal=requested;
      else if(!usingSound && ordinal!==requested && now>=holdUntil) {
        ordinal+=Math.sign(requested-ordinal);
        holdUntil=now+layout.flat[ordinal].hold;
      }
      ctl.snapCaption=false;
      let {index,cue,middle}=layout.flat[ordinal];
      let fraction=index===view.index && ordinal===requested ? view.fraction : middle;
      if(usingSound) {
        index=sound.index;
        cue=cueIndex(day[index],sound.elapsed);
        fraction=clamp01(sound.elapsed/Math.max(.1,day[index].seconds));
        ordinal=layout.beats[index].first+cue;
      }
      const caughtUp=usingSound?index===last && sound.finished:ordinal===layout.flat.length-1;
      const bridge=view.bridge && (linear || ctl.seeking || ctl.skipBridge || caughtUp);
      let p=0;
      if(!linear && bridge) p=.045+.955*view.fraction;
      else if(!linear && index===last && !usingSound && !view.bridge) p=.045*easeBetween(view.fraction,.93,1);
      portal.current.progress=p;
      if(!p) portal.current.source=null;
      portal.current.paint();
      const travel=.15*easeBetween(fraction,0,.63)+.85*easeBetween(fraction,.63,1);
      position.current=p?8+2*easeBetween(p,0,CLOSEUP):Math.min(last,index+travel);
      controller.current?.setProgress(position.current);
      const node=stage.current,spread=easeBetween(p,.10,.26);
      node.dataset.transition=String(p>0);
      node.style.setProperty('--story-out',1-easeBetween(p,0,.058));
      node.style.setProperty('--room-out',1-easeBetween(p,HANDOFF,ROOM_GONE));
      node.style.setProperty('--frame-scale',.91+.09*spread);
      node.style.setProperty('--frame-angle',(-2+2*spread)+'deg');
      node.style.setProperty('--frame-edge',(1-spread)*Math.min(10,innerWidth*.0065)+'px');
      node.style.setProperty('--frame-visibility',1-spread);
      node.style.setProperty('--paper-tone',easeBetween(p,.257,.33)*100+'%');
      node.style.setProperty('--extra-width',17*spread+'%');
      node.style.setProperty('--world-shift',12.5*spread+'%');
      const group=day[index].place;
      const count=(starts[group+1]??day.length)-starts[group];
      node.style.setProperty('--journey',(group+(index-starts[group]+fraction)/count)/places.length);
      const wakeShown=index===0 && (usingSound||fraction>.28);
      setReading(old=>old.index===index && old.cue===cue && old.target===raw.index && old.atPortal===raw.bridge &&
        old.bridge===bridge && old.wakeShown===wakeShown ? old : {index,cue,target:raw.index,atPortal:raw.bridge,bridge,wakeShown});
      if(Math.abs(displayY-y)>.65) request();
      clearTimeout(holdTimer);
      if(!usingSound && ordinal!==requested && !linear) holdTimer=setTimeout(request,Math.max(12,holdUntil-now));
    }
    function finishSeek() {
      cancelAnimationFrame(frame);frame=0;
      displayY=scrollY;
      draw(performance.now());
      ctl.seeking=false;
      ctl.skipBridge=goal.bridge;
      ctl.onSeek?.(goal);
      request();
    }
    function seekAfterMotion() {
      ctl.seeking=true; ctl.snapCaption=true;
      clearTimeout(settle); settle=setTimeout(finishSeek,185);
    }
    function moved() {
      if(!ctl.guided && performance.now()>ctl.autoUntil && fast(scrollY,performance.now(),innerHeight)) seekAfterMotion();
      else if(ctl.seeking) seekAfterMotion();
      if(ctl.skipBridge && locate(scrollY).index<last) ctl.skipBridge=false;
      request();
    }
    function handBack(){ctl.guided=false;ctl.autoUntil=0;}
    function key(e){if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(e.key)) handBack();}
    function link(e){
      if(e.target.closest?.('a[href^="#"]:not(.scroll-invite)')) {handBack();seekAfterMotion();request();}
    }
    ctl.request=request;
    ctl.cancelSeek=()=>{clearTimeout(settle);ctl.seeking=false;};
    measure();
    window.addEventListener('scroll',moved,{passive:true});
    window.addEventListener('wheel',handBack,{passive:true});
    window.addEventListener('touchmove',handBack,{passive:true});
    window.addEventListener('resize',measure);
    window.addEventListener('pageshow',measure);
    document.addEventListener('keydown',key); document.addEventListener('click',link);
    const size=new ResizeObserver(measure); size.observe(root.current);
    return ()=>{
      size.disconnect();ctl.request=null;ctl.cancelSeek=null;ctl.seeking=false;
      cancelAnimationFrame(frame);clearTimeout(holdTimer);clearTimeout(settle);
      window.removeEventListener('scroll',moved); window.removeEventListener('wheel',handBack);
      window.removeEventListener('touchmove',handBack);window.removeEventListener('resize',measure);
      window.removeEventListener('pageshow',measure);document.removeEventListener('keydown',key);document.removeEventListener('click',link);
    };
  },[root,stage,controller,position,portal,controls,narrator,linear]);
  return reading;
}
