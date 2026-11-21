import React, { useEffect, useRef, useState } from 'react';
import { audioFor, scenarios } from './scenarios.js';

const mediaUrl = (name) => import.meta.env.BASE_URL + name;

function useVoice() {
  const player = useRef(null);
  const sequence = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);

  function stop() {
    sequence.current += 1;
    player.current?.pause();
    if (player.current) {
      player.current.onended = null;
      player.current.onerror = null;
    }
    setPlaying(false);
    setAudioError(false);
  }

  function play(files) {
    stop();
    if (!files.length) return;
    const currentSequence = sequence.current;
    const audio = player.current ?? new Audio();
    player.current = audio;
    let index = 0;

    function next() {
      if (currentSequence !== sequence.current) return;
      const file = files[index++];
      if (!file) {
        setPlaying(false);
        return;
      }
      audio.src = mediaUrl(file);
      audio.onended = next;
      const fail = () => {
        if (currentSequence !== sequence.current) return;
        sequence.current += 1;
        setPlaying(false);
        setAudioError(true);
      };
      setPlaying(true);
      audio.onerror = fail;
      audio.play().catch(fail);
    }

    next();
  }

  useEffect(() => () => {
    sequence.current += 1;
    player.current?.pause();
  }, []);

  return { play, stop, playing, audioError };
}

export default function Demo() {
  const [key, setKey] = useState('compare');
  const [stage, setStage] = useState('start');
  const [muted, setMuted] = useState(false);
  const [called, setCalled] = useState(false);
  const voice = useVoice();
  const scenario = scenarios[key];
  const scene = scenario[stage];
  const files = audioFor(scene);

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

  return <section className="demo-section band" id="experience" aria-labelledby="demo-title">
    <div className="wrap">
      <div className="section-head">
        <div>
          <p className="eyebrow">인터랙티브 PoC</p>
          <h2 id="demo-title">할머니가 답하면<br />가족 화면도 바뀌어요.</h2>
        </div>
        <p>상황을 하나 골라 들어보고, 할머니라면 어떤 답을 하실지 눌러 보세요. 음원과 주문·알림은 시연용 예시예요.</p>
      </div>
      <nav className="scenario-tabs" aria-label="시연 상황">
        {Object.entries(scenarios).map(([id, item]) =>
          <button key={id} type="button" aria-pressed={id === key} onClick={() => select(id)}>{item.label}</button>)}
      </nav>
      <div className="scenario-intro">
        <p>{scenario.goal}</p>
        <div className="utilities">
          <button type="button" className="text-button" aria-pressed={muted} onClick={toggleMute}>{muted ? '음성 켜기' : '음성 끄기'}</button>
          <button type="button" className="text-button" onClick={() => select(key)}>다시 시작</button>
        </div>
      </div>
      <div className="demo-grid">
        <article className="elder-panel" aria-label="어르신 화면">
          <header className="elder-head">
            <span className="live-dot" /> 어르신 화면
            <div className={'wave ' + (voice.playing ? 'playing' : '')} aria-hidden="true">
              {[12, 23, 33, 41, 31, 21, 11].map((height, i) => <i key={i} style={{ '--bar': height + 'px', '--delay': i * -83 + 'ms' }} />)}
            </div>
          </header>
          <div className="conversation" aria-live="polite">
            {scene.lines.length ? scene.lines.map((line, i) =>
              <div key={i} className={line.speaker === '집 안 소리' ? 'sound-line' : 'dialogue-line'}>
                <span>{line.speaker}</span><p>{line.text}</p>
              </div>) : <p className="waiting-copy">대화를 시작할 차례예요.</p>}
          </div>
          <div className="elder-actions">
            {showActions(scene.choices)}
            {!muted && files.length > 0 && <button type="button" className="text-button audio-button" onClick={() => voice.playing ? voice.stop() : voice.play(files)}>
              {voice.playing ? '재생 멈추기' : '이 장면 음원 듣기'}
            </button>}
            {voice.audioError && <p className="sound-line" role="status">음원을 불러오지 못했어요. 위 자막으로 상황을 볼 수 있어요.</p>}
          </div>
        </article>

        <article className="family-panel" aria-label="가족 화면">
          <header className="family-head">
            <img src={mediaUrl('masil-mark.webp')} alt="" width="30" height="30" />
            <strong>가족 화면</strong>
          </header>
          <p className="family-inbox">할머니 댁에서 온 소식</p>
          <div className={'receipt ' + (scene.family?.urgent ? 'urgent' : '')} aria-live="polite">
            <span>{scene.family ? scene.family.label : '이 장면에서 가족에게 전한 내용'}</span>
            <strong>{scene.family ? scene.family.text : '새 카드 0건'}</strong>
            {showActions(scene.family?.actions, 'choices family-actions')}
            {scene.family?.call && !called && <button type="button" className="button secondary" onClick={() => setCalled(true)}>전화하기 예시</button>}
            {called && <div className="call-preview">
              <strong>할머니 댁에 전화하는 중 · 모의</strong>
              <button type="button" className="text-button" onClick={() => setCalled(false)}>통화 예시 닫기</button>
            </div>}
          </div>
        </article>
      </div>
      <div className="reason" aria-label="시연 판단 기록">
        <div><span>마실이 들은 것</span><p>{scene.clue}</p></div>
        <div><span>마실이 다음에 하는 일</span><p>{scene.decision}</p></div>
      </div>
    </div>
  </section>;
}
