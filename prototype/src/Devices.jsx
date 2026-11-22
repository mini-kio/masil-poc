import React, { useEffect, useRef } from 'react';
import { drawPad } from './padArtwork.js';
import { easeBetween, HANDOFF, ROOM_GONE, phoneScroll, stages } from './deviceTimeline.js';

const base=import.meta.env.BASE_URL;
const blend=(a,b,t)=>a+(b-a)*t;
const settings=[
  {key:'payment',title:'쌀 한 봉지를 부탁할 때',text:'가족이 예시 카드를 등록하고 자동 주문할 품목과 금액을 정해요. 새 물건이나 한도를 넘는 주문은 가족이 확인해요.'},
  {key:'address',title:'쌀을 받을 우리 집',text:'할머니 댁 배송지와 물건을 놓을 곳을 한 번 정해 두면, 주문할 때마다 주소를 다시 말씀하실 필요가 없어요.'},
  {key:'profile',title:'처음 말을 걸기 전에',text:'할머니와 함께 안부를 묻기 좋은 시간, 익숙한 말투와 좋아하는 이야기를 골라요. 가족에게 전할 소식은 그때마다 여쭤봐요.'},
];

export function paintDevices(element,portal) {
  if (!element) return;
  const p=portal.progress;
  element.hidden=p<=0;
  if (!p) return;
  const bounds=element.getBoundingClientRect(), w=bounds.width,h=bounds.height;
  if (!w||!h) return;
  const mobile=w<790;
  const owner=portal.webgl ? portal.owner : 'screen';
  element.dataset.owner=owner;
  const centre=easeBetween(p,ROOM_GONE,.451), fold=easeBetween(p,.475,.556);
  const plan=easeBetween(p,.919,.982), page=phoneScroll(p);
  const tw=Math.min(w*(mobile?.93:.75),h*1.26,940), th=tw*.648;
  const phoneW=Math.min(mobile?w*.76:w*.25,h*(mobile?.349:.385),330);
  const finalW=Math.min(mobile?w*.51:w*.23,h*(mobile?.246:.32),285);
  const pw=blend(phoneW,finalW,plan), ph=pw*1.94;
  const fallbackScale=blend(.24,.91,easeBetween(p,0,HANDOFF));
  const from=portal.source?{...portal.source,x:portal.source.x-bounds.left,y:portal.source.y-bounds.top}
    :{x:w*(mobile?.5:.63),y:h*(mobile?.58:.5),w:tw*fallbackScale,h:th*fallbackScale};
  const tabletX=blend(from.x,w*.50,centre),tabletY=blend(from.y,h*.49,centre);
  const deviceW=blend(blend(from.w,tw,centre),pw,fold),deviceH=blend(blend(from.h,th,centre),ph,fold);
  const x=blend(tabletX,w*(mobile?.5:.705),fold),y=blend(tabletY,h*(mobile?blend(.41,.333,plan):.50),fold);
  const bank=easeBetween(p,.603,.657),addr=easeBetween(p,.706,.76),prefs=easeBetween(p,.806,.877);
  const name=stages[Math.round(page)];
  const phase=p<.50?'pad':p<.57?'phone':(name==='inbox'?'phone':name==='saved'?'development':name);
  const values={'--glass-x':x+'px','--glass-y':y+'px','--glass-w':deviceW+'px','--glass-h':deviceH+'px',
    '--glass-radius':blend(deviceW*.043,pw*.128,fold)+'px','--glass-rim-x':blend(deviceW*.027,pw*.022,fold)+'px',
    '--glass-rim-y':blend(deviceH*.045,pw*.022,fold)+'px','--glass-shadow':easeBetween(p,ROOM_GONE,.46),
    '--phone-reveal':100*easeBetween(p,.492,.552)+'%','--page-shift':(-100*page)+'%',
    '--paper-alpha':owner==='screen'?easeBetween(p,HANDOFF,ROOM_GONE):0,'--plan-alpha':plan,'--plan-offset':(1-plan)*24+'px',
    '--lead-alpha':easeBetween(p,.012,.07)*(1-easeBetween(p,.22,.28)),
    '--setup-alpha':easeBetween(p,.544,.585)*(1-easeBetween(p,.899,.94)),
    '--bank-progress':bank,'--address-progress':addr,'--profile-progress':prefs};
  for(const [k,v] of Object.entries(values)) element.style.setProperty(k,v);
  if(element.dataset.phase!==phase) {
    element.dataset.phase=phase;
    element.querySelector('.build-arrival').setAttribute('aria-hidden',String(phase!=='development'));
    for (const section of element.querySelectorAll('[data-copy]')) section.hidden=section.dataset.copy!==phase;
  }
  element.dataset.bankSaved=String(bank>.94);
  element.dataset.addressSaved=String(addr>.94);
  element.dataset.profileSaved=String(prefs>.94);
}

function PadPrint() {
  const ref=useRef(null);
  useEffect(()=>{drawPad(ref.current,true);},[]);
  return <canvas className="pad-print" ref={ref} role="img" aria-label="마실 패드에 어르신이 가족에게 전해도 좋다고 한 드라마 이야기가 떠 있어요." />;
}

function Field({label,children}) {
  return <div className="phone-field"><small>{label}</small><strong>{children}</strong></div>;
}

function SaveState({type}) {
  return <div className={'save-state '+type+'-state'}><span>설정 중</span><b>✓ 저장했어요</b><i/></div>;
}

function FamilyPage({page}) {
  if(page==='inbox') return <div className="phone-page inbox-page"><h3>할머니의 소식</h3>
    <div className="phone-note"><small>가족에게 전한 한마디</small><strong>“담에 오면 내하고<br/>같이 보자 캐라.”</strong><p>요즘 《동백꽃 필 무렵》을 보신대요.</p></div>
    <div className="phone-receipt"><i/>쌀 4kg 한 봉지 · 수령 확인</div></div>;
  if(page==='payment') return <div className="phone-page"><h3>결제 수단</h3>
    <div className="sample-bank"><span>마실 예시 카드</span><i aria-hidden="true"/><strong>•••• &nbsp;2048</strong></div>
    <Field label="자동 주문 허용">늘 드시던 쌀</Field><Field label="한 번에 쓸 수 있는 금액">30,000원까지</Field>
    <SaveState type="bank"/></div>;
  if(page==='address') return <div className="phone-page"><h3>받으실 주소</h3>
    <div className="address-label"><i aria-hidden="true"/><span>할머니 댁 · 예시 배송지</span></div>
    <div className="address-line"><Field label="배송지">마실시 다정로 12</Field></div>
    <Field label="배송 메모">문 앞에 놓아 주세요.</Field><SaveState type="address"/></div>;
  if(page==='profile') return <div className="phone-page"><h3>할머니와 대화할 때</h3>
    <Field label="익숙한 말투">경상도 말투</Field><Field label="안부 시간">오전 9시</Field>
    <Field label="좋아하는 이야기">동백꽃 필 무렵 · 따뜻한 차</Field>
    <div className="permission-line"><i aria-hidden="true"/>가족 공유는 먼저 여쭤보기</div><SaveState type="profile"/></div>;
  return <div className="phone-page saved-page"><div className="saved-tick" aria-hidden="true">✓</div><h3>우리 집 설정 완료</h3>
    <Field label="결제 수단">예시 카드 ···· 2048</Field><Field label="배송지">할머니 댁</Field>
    <Field label="다음 안부">오전 9시 · 경상도 말투</Field></div>;
}

function PhoneChrome({children}) {
  return <div className="handset-face"><div className="handset-status" aria-hidden="true">7:12 <i/></div>
    <div className="device-app"><img src={base+'masil-mark.webp'} alt="" width="28" height="29"/>가족 화면</div>
    {children}<i className="phone-home-bar" aria-hidden="true"/></div>;
}
function BuildIntro() {
  return <div className="build-intro"><h2>어떻게 만들까요?</h2>
    <ol><li><strong>집 기기 준비</strong><span>쓰던 태블릿에 웹앱을 열어요. DIY 스피커는 라즈베리파이에 USB 마이크와 스피커를 꽂아요.</span></li>
      <li><strong>가족 연결</strong><span>집 기기가 먼저 서버에 접속하고 가족 휴대폰을 연결해요.</span></li>
      <li><strong>첫 안부 시험</strong><span>함께 안부를 나눈 뒤 허락한 소식이 가족 화면에 닿는지 살펴요.</span></li></ol></div>;
}

export default function Devices({layer,linear}) {
  if(linear) return <section className="devices-linear" id="roadmap" aria-label="마실 패드와 가족 설정"><div className="wrap">
    <div className="linear-pair"><div className="still-device still-pad"><PadPrint/></div>
      <div className="still-device still-phone"><PhoneChrome><FamilyPage page="inbox"/></PhoneChrome></div></div>
    <div className="linear-settings">{settings.map(s=><article key={s.key}><h3>{s.title}</h3><p>{s.text}</p>
      <FamilyPage page={s.key}/></article>)}</div><BuildIntro/></div></section>;
  return <div className="device-transition" ref={layer} hidden>
    <div className="device-wash"/><p className="device-lead">할머니가 패드에 남긴<br/><strong>가족에게 전할 한마디.</strong></p>
    <div className="travelling-device" aria-hidden="true"><PadPrint/><div className="phone-aperture"><PhoneChrome>
      <div className="phone-viewport"><div className="phone-pages">{stages.map(k=><FamilyPage key={k} page={k}/>)}</div></div>
    </PhoneChrome></div></div>
    <div className="setup-narration"><div data-copy="phone" hidden><h2>가족 화면에 도착했어요.</h2><p>할머니가 전해 달라고 하신 바로 그 한마디예요. 조금 더 내리면 이 집의 주문과 대화 설정을 볼 수 있어요.</p></div>
      {settings.map(s=><div key={s.key} data-copy={s.key} hidden><h2>{s.title}</h2><p>{s.text}</p></div>)}</div>
    <div className="build-arrival"><BuildIntro/></div>
  </div>;
}
