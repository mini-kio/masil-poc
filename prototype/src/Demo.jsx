import React, { useEffect, useRef, useState } from 'react';
import { audioFor, scenarios } from './scenarios.js';
import AudioDeck, { duration, soundCue, useVoice } from './AudioDeck.jsx';
import DaughterCall from './DaughterCall.jsx';
import { callLineAt, isCallSound } from './familyCall.js';

const mediaUrl = name => import.meta.env.BASE_URL + name;

export default function Demo({ initialCase = 'compare' }) {
  const [key, setKey] = useState(initialCase);
  const [stage, setStage] = useState('start');
  const [muted, setMuted] = useState(false);
  const [called, setCalled] = useState(false);
  const root = useRef(null);
  const voice = useVoice();
  const scenario = scenarios[key];
  const scene = scenario[stage];
  const files = audioFor(scene);
  const cue = voice.playing ? soundCue(files, voice.elapsed) : null;
  const callLine = scene.lines[0]?.callStage ? callLineAt(scene.lines, voice.elapsed, duration) : null;
  const received = Boolean(scene.family && !['start', 'queued'].includes(stage));

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) voice.stop();
    }, { rootMargin: '25px' });
    observer.observe(root.current);
    return () => observer.disconnect();
  }, [voice.stop]);

  function select(id) {
    voice.stop();
    setKey(id);
    setStage('start');
    setCalled(false);
  }
  function advance(next) {
    if (!scenario[next]) return;
    setStage(next);
    setCalled(false);
    if (muted) voice.stop();
    else voice.play(audioFor(scenario[next]));
  }
  function toggleMute() {
    if (!muted) voice.stop();
    setMuted(!muted);
  }

  const showActions = (actions, group = 'choices') =>
    actions?.length ? <div className={group}>{actions.map(({ label, to }, index) =>
      <button key={to} type="button" className={'button ' + (index === 0 ? 'primary' : 'secondary')} onClick={() => advance(to)}>
        {label}
      </button>)}</div> : null;

  return <section ref={root} className="demo-section" aria-labelledby="demo-title">
    <div className="wrap">
      <header className="console-heading">
        <div><h2 id="demo-title">상황별 선택 시연</h2></div>
        <p>상황을 듣고 할머니의 답을 골라 보세요. 옆의 가족 휴대폰에 어떤 소식이 닿을지 달라져요. 주문과 알림은 시연용이에요.</p>
      </header>
      <div className="console-layout">
        <nav className="scenario-tabs" aria-label="시연 상황">
          {Object.entries(scenarios).map(([id, item]) =>
            <button key={id} type="button" aria-pressed={id === key} onClick={() => select(id)}><i aria-hidden="true" />{item.label}</button>)}
        </nav>
        <div className="console-work">
          <div className="scenario-intro">
            <h3>{scenario.label}</h3>
            <div className="utilities">
              <button type="button" className="text-button" aria-pressed={muted} onClick={toggleMute}>{muted ? '음성 켜기' : '음성 끄기'}</button>
              <button type="button" className="text-button" onClick={() => select(key)}>다시 시작</button>
            </div>
          </div>
          <p className="scenario-goal">{scenario.goal}</p>
          <div className="demo-grid">
            <article className="elder-panel" aria-label="어르신 화면" data-impact={cue === 'impact'}>
              <header className="elder-head"><span className="live-dot" />어르신 화면
                <span className={'wave ' + (voice.playing ? 'playing' : '')} aria-hidden="true">
                  {[7,13,22,28,20,13,7].map((height, i) => <i key={i} style={{ '--bar': height + 'px', '--delay': i * -75 + 'ms' }} />)}
                </span>
              </header>
              <AudioDeck key={key + '/' + stage} files={files} voice={voice} muted={muted} silentSeek={Boolean(callLine)} />
              <div className="conversation" aria-live="polite">
                {scene.lines.length ? scene.lines.map((line, i) => {
                  const isSound = line.speaker === '집 안 소리' || isCallSound(line.speaker);
                  const lit = callLine ? line === callLine : cue === (isSound ? 'impact' : line.speaker === '마실' ? 'question' : 'reply');
                  return <div key={key + stage + i} data-lit={lit} className={isSound ? 'sound-line' : 'dialogue-line'}>
                    <span>{line.speaker}</span><p>{line.text}</p>
                  </div>;
                }) : <p className="waiting-copy">대화를 시작할 차례예요.</p>}
              </div>
              <div className="elder-actions">
                {showActions(scene.choices)}
                {voice.error && <p className="sound-line" role="status">음원을 불러오지 못했어요. 자막으로 계속 볼 수 있어요.</p>}
              </div>
            </article>

            <div className="phone-bay">
              {received && <i key={key + stage} className="transfer-signal" aria-hidden="true" />}
              <article className="family-panel" aria-label="가족 화면">
                <i className="phone-ear" aria-hidden="true" />
                <header className="family-head"><img src={mediaUrl('masil-mark.webp')} alt="" width="26" height="27" /><strong>가족 화면</strong></header>
                <p className="family-inbox">할머니 댁에서 온 소식</p>
                <div aria-live="polite" className="inbox-content">
                  <div key={key + '/' + stage} className={'receipt' + (scene.family?.urgent ? ' urgent' : '')}
                    data-arrived={received} data-empty={!scene.family}>
                    <span>{scene.family ? scene.family.label : '이 장면에서 가족에게 전한 내용'}</span>
                    {callLine
                      ? <DaughterCall line={callLine} compact audible={voice.playing && !muted} level={voice.level}/>
                      : <strong>{scene.family ? scene.family.text : '새 카드 0건'}</strong>}
                    {showActions(scene.family?.actions, 'choices family-actions')}
                    {scene.family?.call && !called && <button type="button" className="button secondary" onClick={() => setCalled(true)}>전화하기 예시</button>}
                    {called && <div className="call-preview"><strong>할머니 댁에 전화하는 중 · 모의</strong>
                      <button type="button" className="text-button" onClick={() => setCalled(false)}>통화 예시 닫기</button></div>}
                  </div>
                </div>
                <i className="phone-home" aria-hidden="true" />
              </article>
            </div>
          </div>
          <div className="reason" aria-label="시연 판단 기록">
            <div><span>마실이 들은 것</span><p>{scene.clue}</p></div>
            <div><span>마실이 다음에 하는 일</span><p>{scene.decision}</p></div>
          </div>
        </div>
      </div>
    </div>
  </section>;
}
