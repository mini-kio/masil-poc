import React from 'react';

const asset = file => import.meta.env.BASE_URL + file;
const mix = (a,b,t) => a+(b-a)*t;
export function easeBetween(x,start,end) {
  const t=Math.max(0,Math.min(1,(x-start)/(end-start)));
  return t*t*(3-2*t);
}

// Keep the HTML screen on the projected tablet until it moves into the family view.
export function paintDevices(element,progress,source) {
  if (!element) return;
  if (!progress) { element.hidden=true; return; }
  element.hidden=false;
  const bounds=element.getBoundingClientRect(), w=bounds.width,h=bounds.height;
  if (!w||!h) return;
  const mobile=w<790;
  const grow=easeBetween(progress,.20,.51), fold=easeBetween(progress,.48,.78);
  const enter=easeBetween(progress,.19,.31), phone=easeBetween(progress,.51,.72);
  const roomExit=easeBetween(progress,.20,.52), plan=easeBetween(progress,.72,.94);
  const awareness=easeBetween(progress,.014,.10)*(1-easeBetween(progress,.22,.36));
  const tw=Math.min(w*(mobile?.92:.65),h*1.12,825), th=tw*.625;
  const pw=Math.min(mobile?w*.48:w*.24,h*(mobile?.255:.32),285), ph=pw*1.94;
  const fallback={x:w*(mobile?.53:.70),y:h*(mobile?.62:.57),w:w*.17,h:w*.11};
  const from=source?{...source,x:source.x-bounds.left,y:source.y-bounds.top}:fallback;
  const tabletX=mix(from.x,w*.5,grow), tabletY=mix(from.y,h*.48,grow);
  const deviceW=mix(mix(from.w,tw,grow),pw,fold), deviceH=mix(mix(from.h,th,grow),ph,fold);
  const x=mix(tabletX,w*(mobile?.50:.716),fold), y=mix(tabletY,h*(mobile?.336:.51),fold);
  const values={'--glass-x':x+'px','--glass-y':y+'px','--glass-w':deviceW+'px','--glass-h':deviceH+'px',
    '--glass-radius':mix(Math.min(18,deviceW*.045),pw*.135,fold)+'px','--glass-rim':Math.max(2,Math.min(9,deviceW*.018))+'px',
    '--device-alpha':enter,'--phone-face':phone,'--pad-face':1-phone,'--paper-alpha':roomExit,'--plan-alpha':plan,
    '--plan-offset':(1-plan)*34+'px','--lead-alpha':awareness,'--glass-angle':(-2*(1-grow))+'deg'};
  for (const [key,val] of Object.entries(values)) element.style.setProperty(key,val);
  const phase=progress<.50?'pad':progress<.80?'phone':'development';
  if(element.dataset.phase!==phase) {
    element.dataset.phase=phase;
    element.querySelector('.build-arrival').setAttribute('aria-hidden',String(phase!=='development'));
  }
}

function Screen({ kind }) {
  const phone=kind==='phone';
  return <div className={'device-face '+(phone?'phone-face':'pad-face')}>
    {phone && <div className="handset-status" aria-hidden="true">7:12 <i/></div>}
    <div className="device-app"><img src={asset('masil-mark.webp')} alt="" width="28" height="29"/>{phone?'가족 화면':'마실 패드'}</div>
    <div className="device-message"><span>{phone?'할머니가 전한 소식':'가족에게 전한 한마디'}</span>
      <strong>“담에 오면 내하고<br/>같이 보자 캐라.”</strong>
      <p>{phone?'요즘 《동백꽃 필 무렵》을 보신대요.':'할머니가 허락하신 드라마 이야기'}</p>
    </div>
    {phone && <div className="phone-receipt"><i/>쌀 4kg 한 봉지 · 수령 확인</div>}
  </div>;
}

function BuildIntro() {
  return <div className="build-intro">
    <h2>어떻게 만들까요?</h2>
    <ol>
      <li><strong>집 기기 준비</strong><span>쓰던 태블릿에 웹앱을 열어요. DIY 스피커는 라즈베리파이에 USB 마이크와 스피커를 꽂아요.</span></li>
      <li><strong>가족 연결</strong><span>집 기기가 먼저 서버에 접속하고 가족 휴대폰을 연결해요.</span></li>
      <li><strong>첫 안부 시험</strong><span>함께 안부를 나눈 뒤 허락한 소식이 가족 화면에 닿는지 살펴요.</span></li>
    </ol>
  </div>;
}

export default function Devices({layer,linear}) {
  if(linear) return <section className="devices-linear" id="roadmap" aria-label="마실 패드에서 가족 휴대폰으로">
    <div className="wrap"><div className="linear-pair"><div className="still-device still-pad"><Screen kind="pad"/></div>
      <div className="still-device still-phone"><Screen kind="phone"/></div></div><BuildIntro/></div>
  </section>;
  return <div className="device-transition" ref={layer} hidden>
    <div className="device-wash"/>
    <p className="device-lead">할머니가 패드에 남긴<br/><strong>가족에게 전할 한마디.</strong></p>
    <div className="travelling-device" aria-hidden="true"><Screen kind="pad"/><Screen kind="phone"/></div>
    <div className="build-arrival"><BuildIntro/></div>
  </div>;
}
