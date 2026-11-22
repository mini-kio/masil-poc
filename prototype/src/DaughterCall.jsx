import React, { useEffect, useRef } from 'react';
import './daughter-call.css';

const stages = {
  delivered: { pose:0, status:'새 소식', caption:'엄마가 《동백꽃 필 무렵》을 같이 보자고 하셨어요.' },
  noticed: { pose:1, status:'소식 확인' },
  dialing: { pose:1, status:'엄마에게 전화 거는 중' },
  ringing: { pose:2, status:'연결 기다리는 중', caption:'딸이 수화기를 귀에 대고 기다려요.' },
  answered: { pose:2, status:'통화 연결', caption:'엄마가 전화를 받으셨어요.' },
  talking: { pose:2, status:'통화 중' },
  listening: { pose:2, status:'통화 중', caption:'딸이 엄마의 대답을 듣고 있어요.' },
};
const descriptions = ['휴대폰에 온 소식을 읽는 딸', '휴대폰 화면을 누르는 딸', '전화기를 귀에 댄 딸'];

function Portrait({line, description, audible, level}) {
  const host=useRef(null),portrait=useRef(null),state=useRef({});
  state.current={stage:line.callStage,speaking:line.speaker==='딸',audible,level};
  useEffect(()=>{
    const element=host.current;
    let closed=false,visible=false,pending=false;
    const observer=new IntersectionObserver(([entry])=>{
      visible=entry.isIntersecting;
      if(portrait.current) {portrait.current.show(visible);return;}
      if(!visible||pending) return;
      pending=true;
      import('./daughter.js').then(({mountDaughter})=>{
        pending=false;
        if(!closed && visible) portrait.current=mountDaughter(element,state);
      }).catch(()=>{if(!closed) element.dataset.render='fallback';});
    },{rootMargin:'50px'});
    observer.observe(element);
    return ()=>{closed=true;observer.disconnect();portrait.current?.dispose();portrait.current=null;};
  },[]);
  useEffect(()=>{portrait.current?.refresh();},[line.callStage,audible]);
  return <div ref={host} className="daughter-crop" role="img" aria-label={description} data-render="loading"/>;
}

export default function DaughterCall({ line, compact = false, audible = false, level }) {
  const stage = stages[line?.callStage];
  if (!stage) return null;
  return <figure className={'daughter-call' + (compact ? ' daughter-call-small' : '')} data-call-stage={line.callStage} aria-label="딸의 화면">
    <div className="daughter-avatar">
      <Portrait line={line} description={descriptions[stage.pose]} audible={audible} level={level}/>
      {line.callStage === 'noticed' && <span className="daughter-notice" aria-label="반가워하는 딸">!</span>}
    </div>
    <figcaption key={line.callStage} className="daughter-caption">
      <small>{line.callStage === 'delivered' ? '딸의 휴대폰' : '딸'} · {stage.status}</small>
      <p>{stage.caption ?? line.text}</p>
    </figcaption>
  </figure>;
}
