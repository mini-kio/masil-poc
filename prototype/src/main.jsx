import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Demo from './Demo.jsx';
import './styles.css';

const asset = (name) => import.meta.env.BASE_URL + name;
const story = [
  { id: 'home', title: '할머니 댁', time: '오전 9시', caption: '식탁에 있는 마실로 하루를 시작해요.' },
  { id: 'morning', title: '거실에서 안부', time: '오전 9시', caption: '약속한 시간이 되면 마실이 먼저 안부를 물어요.' },
  { id: 'kitchen', title: '부엌의 생활 소리', time: '오전 10시', caption: '앞서 차를 준비한다던 말과 지금의 소리를 함께 살펴요.' },
  { id: 'family', title: '가족 화면', time: '저녁 7시', caption: '할머니가 전하고 싶었던 이야기로 다음 통화를 시작해요.' },
];

const comparisons = [
  ['클로바 케어콜', '지난 통화에서 기록한 건강·식사·수면을 다음 안부에 활용', 'https://www.navercorp.com/media/pressReleasesDetail?seq=30860'],
  ['Sensi.AI', '돌봄 중 이상 신호를 파악하고 관련 음원과 전사, 권장 조치를 제공', 'https://www.sensi.ai/product/'],
  ['Grampai', '전화로 식료품 주문, 주문 전 총액 안내와 배송 추적', 'https://grampai.com/'],
  ['다솜탭', '태블릿형 돌봄 제품과 대화·일정·건강관리, 보호자 앱', 'https://1thefull.com/faq'],
  ['Home Assistant Assist', '기존 기기에 연결 가능한 공개형 음성 제어와 로컬 처리', 'https://www.home-assistant.io/voice_control/voice_remote_local_assistant'],
  ['효돌', '돌봄 인형과 전용 앱의 활동·복약·식사 정보 및 알림', 'https://www.hyodolshop.com/hyodol'],
  ['케어링 보이스', '정해 둔 안부 전화와 주간 가족 리포트', 'https://mindful.caring.co.kr/app/'],
  ['ElliQ', '어르신용 동반 로봇과 가족·돌봄 앱', 'https://elliq.com/pages/caregivers'],
  ['Sentai', '음성 말벗과 가족 앱의 활동·장보기 목록 공유', 'https://sentai.co.uk/'],
  ['Alexa Routines', '지원 기기에서 정해 둔 소리나 시간으로 루틴 시작', 'https://digprjsurvey.amazon.com/csad/help/node/GJWYQVSUF3W9V7N9'],
];

function Room({ current }) {
  const host = useRef(null);
  const room = useRef(null);
  const [status, setStatus] = useState('loading');
  const liveView = useRef(current);
  liveView.current = current;

  useEffect(() => {
    let closed = false;
    import('./room.js').then(({ mountRoom }) => {
      if (closed) return;
      room.current = mountRoom(host.current, { onLost: () => setStatus('fallback') });
      room.current.view(liveView.current);
      setStatus('ready');
    }).catch(() => { if (!closed) setStatus('fallback'); });
    return () => {
      closed = true;
      room.current?.dispose();
      room.current = null;
    };
  }, []);

  useEffect(() => room.current?.view(current), [current]);
  const chapter = story.find(s => s.id === current) ?? story[0];

  return <figure className="room-frame" data-room={status}>
    <div className="room-title">
      <span><i className="live-dot" />{chapter.title}</span>
      <time>{chapter.time}</time>
    </div>
    <div className="room-visual">
      <img className="room-fallback" src={asset('masil-evening.webp')} alt="" width="1200" height="900" />
      <div ref={host} className="room-canvas" aria-hidden="true" />
    </div>
    <figcaption>
      <span>{chapter.caption}</span>
      <div className="scene-links" aria-label="집 안 장면 이동">
        <a href="#morning" aria-current={current === 'morning' ? 'location' : undefined}>거실</a>
        <a href="#kitchen" aria-current={current === 'kitchen' ? 'location' : undefined}>부엌</a>
        <a href="#family" aria-current={current === 'family' ? 'location' : undefined}>가족</a>
      </div>
    </figcaption>
  </figure>;
}

function Story() {
  const wrapper = useRef(null);
  const [current, setCurrent] = useState('home');

  useEffect(() => {
    const root = wrapper.current;
    const chapters = [...root.querySelectorAll('[data-chapter]')];
    let frame = 0;

    function read() {
      frame = 0;
      const readingY = Math.min(window.innerHeight * .49, 350);
      const active = chapters.filter(chapter => chapter.getBoundingClientRect().top <= readingY).at(-1);
      setCurrent(active?.dataset.chapter ?? 'home');
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(read);
    }

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    read();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return <section className="story" ref={wrapper} aria-label="할머니 댁의 하루">
    <div className="wrap story-grid">
      <article className="hero" data-chapter="home">
        <p className="eyebrow">어르신을 위한 AI 생활 도우미</p>
        <h1>말과 생활 소리를<br />함께 듣는 마실</h1>
        <p>혼자 있는 시간이 긴 어르신에게 먼저 안부를 묻고, 대화와 집 안 소리에서 얻은 단서를 확인해 가족의 도움으로 이어줘요.</p>
        <div className="hero-actions"><a className="button primary" href="#experience">직접 시연하기</a><a className="text-button" href="#morning">할머니의 하루 보기</a></div>
      </article>

      <aside className="story-visual"><Room current={current} /></aside>

      <article className="story-step" id="morning" data-chapter="morning">
        <p className="eyebrow">아침 안부</p>
        <h2>아침 9시, 먼저<br />안부를 여쭤봐요.</h2>
        <p>마실은 약속한 시간에 인사하고, 어르신이 기억해 달라고 한 이야기를 다음 질문에 써요. 오늘 무릎이 불편하다고 하시면 가족에게 전해도 될지 여쭤봐요.</p>
        <blockquote>“할머니, 오늘 아침은 어떠세요?”</blockquote>
      </article>
      <article className="story-step" id="kitchen" data-chapter="kitchen">
        <p className="eyebrow">생활 소리</p>
        <h2>같은 “괜찮다” 뒤에<br />어떤 말이 올까요?</h2>
        <p>반찬 맛을 물었을 때와 쿵 소리가 난 뒤에 들은 같은 말. 마실은 대화와 주변 소리를 함께 살펴 이어서 이야기할지, 한 번 더 안부를 여쭐지 골라요.</p>
        <a className="text-button" href="#experience">두 예시 들어보기</a>
      </article>
      <article className="story-step" id="family" data-chapter="family">
        <p className="eyebrow">가족에게 닿는 하루</p>
        <h2>부탁은 할 일로,<br />소식은 대화로.</h2>
        <p>쌀이 떨어져 간다는 말은 원하는 방식에 따라 주문이나 가족에게 전할 부탁으로 이어져요. 공유에 동의한 드라마 이야기는 다음 가족 통화의 첫마디가 될 수 있어요.</p>
        <blockquote>“엄마, 그 드라마는 누가 제일 마음에 들어?”</blockquote>
      </article>
    </div>
  </section>;
}

function Plan() {
  const [device, setDevice] = useState('tablet');
  return <section className="band setup" id="roadmap" aria-labelledby="setup-title">
    <div className="wrap">
      <div className="section-head">
        <div><p className="eyebrow">설치와 개발 계획</p><h2 id="setup-title">집에 있는 기기로<br />시작할 수 있도록</h2></div>
        <p>태블릿과 스피커 연결 방식을 열어 두고, 집 기기와 가족 앱이 주고받는 이벤트 형식을 공개해 다른 집에서도 같은 시나리오를 시험할 수 있게 할 계획이에요.</p>
      </div>
      <div className="install-grid">
        <article className="install-card">
          <div className="device-switch" aria-label="설치 방식">
            <button type="button" aria-pressed={device === 'tablet'} onClick={() => setDevice('tablet')}>기존 태블릿</button>
            <button type="button" aria-pressed={device === 'speaker'} onClick={() => setDevice('speaker')}>DIY 스피커</button>
          </div>
          <h3>{device === 'tablet' ? '태블릿에서 웹앱 열기' : '일반 스피커와 작은 연결 장치'}</h3>
          <ol>{(device === 'tablet'
            ? ['태블릿에서 마실 웹앱을 열고 마이크 권한을 확인해요.', '가족 앱에서 연결할 어르신을 지정하고 안부 시간을 맞춰요.', '어르신과 함께 안부 대화와 가족 알림을 시험해 봐요.']
            : ['USB 마이크와 스피커를 라즈베리파이 같은 소형 기기에 연결해요.', '기기 연결 프로그램을 설치하고 가족 앱과 연결해요.', 'TV 소리와 뚜껑 소리로 마이크 위치와 알림 규칙을 맞춰요.']
          ).map(text => <li key={text}>{text}</li>)}</ol>
          <span className="muted-note">가정용 설치 구성 예시</span>
        </article>
        <article className="install-card code-card">
          <h3>기기와 AI를 이어주는 이벤트</h3>
          <p>집에서 얻은 단서와 확인 결과를 한 형식으로 적어요. 음성 모델을 바꿔도 가족 화면은 같은 결과를 받아요.</p>
          <pre>{JSON.stringify({ kind: 'home_sound', clue: 'impact', state: 'needs_check', next: 'ask_resident' }, null, 2)}</pre>
          <p>웹 PoC 소스가 공개되어 있어요. 연결 코드, 설치 안내와 재배포 가능한 평가 사례의 오픈소스화를 검토해요. <a href="https://github.com/mini-kio/masil-poc">GitHub 저장소</a></p>
        </article>
      </div>
      <details className="accordion">
        <summary>오디오 모델 개발 순서와 평가</summary>
        <ol className="research-steps">
          <li><strong>대화와 소리의 흐름을 검증해요.</strong> OpenAI Realtime API로 한국어 음성 대화와 끼어들기를 시험하고, 생활음 분류기에서 얻은 단서를 함께 넣어요. 주문과 가족 알림은 확인 결과를 검증하는 서버 규칙을 거쳐요. <a href="https://developers.openai.com/api/docs/guides/realtime-conversations">OpenAI Realtime 문서</a></li>
          <li><strong>원음이 다음 질문에 주는 영향을 비교해요.</strong> AI Hub의 중·노년층 방언 전사·2인 대화와 사용 조건을 확인한 생활음 자료를 준비해요. 기존 오디오 인코더를 연결하고 언어 모델의 어댑터를 미세조정해요. 전사만 준 경우와 원음도 준 경우의 수량·부정 이해, 잘못 보낸 알림, 놓친 연락을 새 화자와 기기로 비교해요. <a href="https://www.aihub.or.kr/aihubdata/data/view.do?dataSetSn=71517">AI Hub 방언 데이터</a> · <a href="https://research.google.com/audioset/ontology/">AudioSet 소리 분류</a></li>
          <li><strong>음성 생성과 전이중 대화로 넓혀요.</strong> 다음 발화의 음성을 생성하는 시험을 한 뒤, 상대가 말을 끊거나 고쳐 말할 때 재생을 멈추고 다시 듣는 방식을 검증해요. 기존 코덱과 직접 학습한 VAE 또는 코덱을 비교할 때는 음질과 첫 응답 지연, 끼어들기 반영을 함께 재요. <a href="https://kyutai.org/assets/pdfs/Moshi.pdf">Kyutai Moshi 연구</a></li>
        </ol>
        <p className="muted-note">가족 목소리는 목소리 주인과 어르신이 함께 동의했을 때 사용하고, 마실이 그 목소리로 읽는다는 점을 먼저 알려요.</p>
      </details>
    </div>
  </section>;
}

function Competition() {
  return <section className="band comparison" id="comparison" aria-labelledby="compare-title">
    <div className="wrap">
      <div className="section-head">
        <div><p className="eyebrow">기존 서비스와 비교</p><h2 id="compare-title">마실에서<br />확인하고 싶은 경험</h2></div>
        <p>쉽게 설치한 집 기기에서 방언과 생활 소리를 함께 듣고, 본인에게 한 번 확인한 뒤 가족에게 어떤 도움을 부탁할지 고르는 과정이에요.</p>
      </div>
      <div className="comparison-grid">
        {comparisons.slice(0, 3).map(([name, text, url]) => <article key={name}>
          <h3>{name}</h3><p>{text}</p><a href={url}>공식 기능 보기</a>
        </article>)}
      </div>
      <details className="accordion">
        <summary>태블릿·음성·생활음 관련 사례 더 보기</summary>
        <dl className="other-products">{comparisons.slice(3).map(([name, text, url]) =>
          <div key={name}><dt><a href={url}>{name}</a></dt><dd>{text}</dd></div>)}</dl>
      </details>
      <p className="muted-note">비교는 각 서비스를 소개하는 공식 자료에 공개된 범위 기준이에요. 2026년 11월 21일 확인.</p>
    </div>
  </section>;
}

function App() {
  useEffect(() => {
    const target = document.getElementById(location.hash.slice(1));
    if (target) requestAnimationFrame(() => target.scrollIntoView({ behavior: 'instant' }));
  }, []);

  return <>
    <div id="top" aria-hidden="true" />
    <a className="skip" href="#experience">시연 바로 가기</a>
    <header className="masthead">
      <div className="wrap masthead-inner">
        <a className="brand" href="#top" aria-label="마실 첫 화면"><img src={asset('masil-logo.webp')} alt="마실" width="330" height="144" /></a>
        <nav aria-label="주 메뉴">
          <a href="#experience">시연</a>
          <a href="#roadmap">설치와 개발</a>
          <a href="#comparison">서비스 비교</a>
        </nav>
      </div>
    </header>
    <main><Story /><Demo /><Plan /><Competition /></main>
    <footer className="band"><div className="wrap footer-inner">
      <a className="brand" href="#top"><img src={asset('masil-logo.webp')} alt="마실" width="330" height="144" /></a>
      <p>2026 엘리스 AI 챌린지 · 시연 음성 <a href="https://elevenlabs.io/">ElevenLabs</a></p>
    </div></footer>
  </>;
}

createRoot(document.querySelector('#root')).render(<App />);
