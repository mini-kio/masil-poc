import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Story from './Story.jsx';
import Demo from './Demo.jsx';
import { Comparison, Workshop } from './Sections.jsx';
import './styles.css';
import './story.css';
import './console.css';
import './sections.css';
import './devices.css';

const asset = name => import.meta.env.BASE_URL + name;
const navigation = [['experience', '시연'], ['roadmap', '설치와 개발'], ['comparison', '서비스 비교']];

function Header() {
  const [section, setSection] = useState('');
  useEffect(() => {
    let frame = 0;
    function read() {
      frame = 0;
      const current = navigation.map(([id]) => document.getElementById(id))
        .filter(el => el && el.getBoundingClientRect().top <= Math.min(200, innerHeight * .3)).at(-1);
      setSection(current?.id ?? '');
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(read); }
    read();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);
  return <header className="masthead"><div className="wrap masthead-inner">
    <a className="brand" href="#top" aria-label="마실 첫 화면"><img src={asset('masil-logo.webp')} alt="마실" width="330" height="144" /></a>
    <nav aria-label="주 메뉴">{navigation.map(([id, text]) => <a href={'#' + id} key={id} aria-current={section === id ? 'location' : undefined}>{text}</a>)}</nav>
  </div></header>;
}

function App() {
  const [choicesOpen, setChoicesOpen] = useState(false);
  useEffect(() => {
    const target = document.getElementById(location.hash.slice(1));
    const frame = target ? requestAnimationFrame(() => target.scrollIntoView({ behavior: 'instant' })) : 0;
    return () => cancelAnimationFrame(frame);
  }, []);
  return <>
    <div id="top" aria-hidden="true" />
    <a className="skip" href="#experience">시연 바로 가기</a>
    <Header />
    <main>
      <Story />
      <Workshop />
      <section className="practice-region" id="choices" aria-label="선택 시연">
        <div className="wrap practice-gate">
          <p>할머니의 답이 달라지면 가족에게 어떤 소식이 갈까요?</p>
          <button type="button" aria-expanded={choicesOpen} aria-controls="choice-demo"
            onClick={() => setChoicesOpen(open => !open)}>{choicesOpen ? '선택 시연 접기' : '다른 답 골라보기'}</button>
        </div>
        <div id="choice-demo" hidden={!choicesOpen}>{choicesOpen && <Demo initialCase="compare" />}</div>
      </section>
      <Comparison />
    </main>
    <footer><div className="wrap footer-inner">
      <a className="brand" href="#top"><img src={asset('masil-logo.webp')} alt="마실" width="330" height="144" /></a>
      <p>2026 엘리스 AI 챌린지 · 시연 음성 <a href="https://elevenlabs.io/">ElevenLabs</a></p>
    </div></footer>
  </>;
}

createRoot(document.querySelector('#root')).render(<App />);
