import React, { useEffect, useRef, useState } from 'react';

const base = import.meta.env.BASE_URL;
const devices = [
  { id:'tablet', label:'태블릿', x:.204, y:.55, title:'태블릿을 식탁에 세워요.',
    text:'집에 있는 태블릿에서 마실 웹앱을 열고 마이크를 켜요. 할머니와 함께 아침 인사를 나눌 시간을 골라요.' },
  { id:'speaker', label:'DIY 스피커', x:.505, y:.65, title:'스피커로 시작해도 좋아요.',
    text:'태블릿 대신 쓰던 스피커를 활용할 수도 있어요. 라즈베리파이에 USB 마이크와 스피커를 연결하면 한쪽은 귀가, 다른 쪽은 목소리가 돼요.' },
  { id:'phone', label:'가족 휴대폰', x:.781, y:.53, title:'첫 안부가 도착했는지 살펴요.',
    text:'가족 휴대폰에서 집 기기를 연결하고 함께 안부를 시험해요. 할머니가 전해도 좋다고 하신 한 문장이 가족 화면에 도착하면 준비가 끝나요.' },
];
const plainSetup = '(prefers-reduced-motion: reduce), (max-height: 620px), (max-width: 350px) and (max-height: 740px)';
const clamp = (value,low,high) => Math.max(low,Math.min(high,value));
const mix = (a,b,t) => a+(b-a)*t;

function Installation() {
  const picture = useRef(null), photo = useRef(null);
  const stops = useRef([]);
  const [active,setActive] = useState(0);
  const [plain,setPlain] = useState(() => matchMedia(plainSetup).matches);
  useEffect(() => {
    const preference=matchMedia(plainSetup);
    const change=() => setPlain(preference.matches);
    preference.addEventListener('change',change);
    return () => preference.removeEventListener('change',change);
  },[]);
  useEffect(() => {
    if (plain) return;
    let frame=0;
    function position() {
      frame=0;
      const header=document.querySelector('.masthead').offsetHeight;
      const sections=stops.current;
      const y=header+3;
      const top=sections.map(s=>s.getBoundingClientRect().top);
      let i=0;
      while (i+1<top.length && top[i+1]<=y) i++;
      const f=clamp((y-top[i])/Math.max(1,(top[i+1]??top[i]+sections[i].offsetHeight)-top[i]),0,1);
      const raw=clamp((f-.40)/.60,0,1);
      const drift=raw*raw*(3-2*raw);
      const here=devices[i], next=devices[Math.min(i+1,devices.length-1)];
      const x=mix(here.x,next.x,drift), focusY=mix(here.y,next.y,drift);
      const box=picture.current, width=box.clientWidth, height=box.clientHeight;
      if (!width || !height) return;
      const zoom=width<640?1.07:1.32;
      const w=Math.max(width,height*3)*zoom, h=w/3;
      const tx=clamp(width*.5-x*w,width-w,0), ty=clamp(height*.57-focusY*h,height-h,0);
      photo.current.style.width=w.toFixed(1)+'px';
      photo.current.style.transform='translate('+tx.toFixed(1)+'px,'+ty.toFixed(1)+'px)';
      box.style.setProperty('--focus-x',(tx+here.x*w).toFixed(1)+'px');
      box.style.setProperty('--focus-y',(ty+here.y*h).toFixed(1)+'px');
      setActive(i);
    }
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(position);};
    const size=new ResizeObserver(schedule);
    size.observe(picture.current);
    position();
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule,{passive:true});
    return ()=>{size.disconnect();cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);};
  },[plain]);
  const step=devices[active];
  return <div className={'setup-walk'+(plain?' setup-plain':'')} data-device={plain?'all':step.id}>
    {!plain && <div className="setup-track" aria-hidden="true">
      {devices.map((d,i)=><div className="setup-stop" id={'setup-'+d.id} key={d.id} ref={n=>{stops.current[i]=n;}}/>)}
    </div>}
    <div className="setup-stage">
      <header className="wrap setup-intro">
        <h2 id="setup-title">식탁에서 <em>가족의 손안까지</em></h2>
        <p>할머니 댁에 마실을 놓는다면, <br/>우리 집에는 어떤 기기가 어울릴까요?</p>
      </header>
      <figure className="setup-photo" ref={picture} aria-label="식탁 위의 태블릿, USB 마이크와 라즈베리파이, 스피커, 가족 휴대폰 설치 예시">
        <img src={base+'masil-install.webp'} ref={photo} width="1920" height="640" loading="lazy" alt="햇빛이 드는 식탁 위에 놓인 두 가지 기기 구성과 가족 휴대폰"/>
        {!plain && <span className="focus-mark" aria-hidden="true" key={step.id}/>}
      </figure>
      {plain ? <ol className="wrap all-setups">{devices.map(d=><li key={d.id} id={'setup-'+d.id}><h3>{d.title}</h3><p>{d.text}</p></li>)}</ol>
        : <div className="wrap setup-caption">
          <nav aria-label="설치할 기기 보기">{devices.map((d,i)=><a key={d.id} href={'#setup-'+d.id} aria-current={i===active?'step':undefined}>{d.label}</a>)}</nav>
          <div className="setup-words" key={step.id}><h3>{step.title}</h3><p>{step.text}</p></div>
        </div>}
    </div>
  </div>;
}

export function Workshop() {
  return <section className="installation" id="roadmap" aria-labelledby="setup-title">
    <Installation/>
    <div className="wrap development">
      <h3>어떻게 만들까요?</h3>
      <div>
        <details><summary>집 기기와 가족 앱 연결</summary>
          <p>태블릿 웹앱(PWA)과 Pi가 운영 서버에 먼저 HTTPS·WebSocket으로 접속하고, 서버가 등록된 가족에게 소식과 승인 요청을 전달해요. 집 공유기에서 포트를 열 필요가 없어요. 자가 호스팅을 선택하면 집 서버가 인증된 리버스 터널로 연결돼요.</p>
          <p>가족 계정과 주문 확인은 운영 서버에서 맡고, 태블릿 화면과 Pi 연결 프로그램, 설치 안내는 오픈소스로 공개할 계획이에요. 주문은 품목·금액·배송지·승인을 확인하고 중복 요청을 걸러요. <a href="https://github.com/mini-kio/masil-poc">시연 소스 보기</a></p>
        </details>
        <details><summary>목소리와 생활음을 함께 이해하는 AI</summary>
          <ol>
            <li><strong>첫 시제품.</strong> OpenAI Realtime API로 한국어 대화와 말 끊기를 시험해요. 생활음 분류기의 단서와 앞선 대화를 함께 보고 다음 확인 질문을 골라요. <a href="https://developers.openai.com/api/docs/guides/realtime-conversations">음성 대화 문서</a></li>
            <li><strong>방언과 소리 이해.</strong> AI Hub의 중·노년층 방언 전사와 대화로 Whisper Large-v3를 추가 학습해 음성 인식 → 대화 판단 → 음성 합성을 시험해요. 오디오 인코더를 언어 모델에 연결한 뒤, 전사만 받은 경우와 원음까지 받은 경우의 수량·거절 이해와 잘못 보낸 알림을 새 화자·기기에서 비교해요. <a href="https://www.aihub.or.kr/aihubdata/data/view.do?dataSetSn=71517">방언 자료</a></li>
            <li><strong>말하면서도 듣기.</strong> 기존 오디오 인코더·코덱과 직접 학습한 VAE 또는 코덱을 비교해요. 다음 발화의 음성 생성부터 한국어 전이중 대화로 넓혀 첫 응답 시간과 끼어들기 반영을 평가해요. <a href="https://huggingface.co/LiquidAI/LFM3-Audio-2B">참고 모델</a></li>
          </ol>
        </details>
        <details><summary>가족 목소리와 집 안 센서</summary>
          <p>어르신과 녹음한 가족이 함께 동의하면 마실이라는 안내와 함께 익숙한 목소리를 쓸 수 있어요. 이후에는 충격음과 누수 센서 신호도 연결해요. 먼저 어르신께 묻고, 도움을 요청하거나 미리 정한 시간 동안 응답이 없으면 가족에게 연락하는 흐름을 시험할 계획이에요.</p>
        </details>
      </div>
    </div>
  </section>;
}

export function Comparison() {
  return <section className="difference" id="comparison" aria-labelledby="compare-title">
    <div className="wrap difference-layout">
      <div className="difference-copy"><p className="difference-topic">기존 돌봄 서비스와 마실</p>
        <h2 id="compare-title">같은 <em>“괜찮다”</em>도<br/>들린 순간이 달라요.</h2>
        <p>많은 돌봄 서비스가 말벗이 되어 주고 가족에게 안부를 전해요. 생활 소리를 감지하거나 장보기를 도와주는 서비스도 있어요.</p>
        <p>마실이 검증하려는 차이는 <strong>실시간 오디오 이벤트 이해</strong>예요. 앞선 대화, 소리가 난 순서, 대답의 말투를 함께 들어요. 그런 다음 무엇을 할지는 어르신께 직접 물어요.</p>
        <details className="reading-links"><summary>비교에 참고한 공개 자료</summary><p><a href="https://www.navercorp.com/media/pressReleasesDetail?seq=30860">기억을 활용하는 안부 대화</a> · <a href="https://www.sensi.ai/product/">생활음 분석 사례</a> · <a href="https://grampai.com/">음성 장보기 사례</a></p></details>
      </div>
      <figure className="decision-score">
        <figcaption>반찬 이야기를 하던 거실</figcaption>
        <div className="score-sound"><i aria-hidden="true"/>쿵 <small>소리가 난 뒤</small></div>
        <blockquote>“괜찮다.”</blockquote>
        <p className="score-question">마실이 물어요<br/><strong>“어디 부딪히셨어요?”</strong></p>
        <dl className="score-answers">
          <div><dt>“뚜껑 떨어뜨렸다.”</dt><dd>반찬 이야기로 돌아가요.</dd></div>
          <div><dt>“딸한테 전화해도.”</dt><dd>가족에게 연락 요청을 전해요.</dd></div>
        </dl>
      </figure>
    </div>
  </section>;
}
