'use strict';

const demo = document.querySelector('#experience');
const voicePanel = document.querySelector('#voice-panel');
const familyPanel = document.querySelector('#family-panel');
const soundButton = document.querySelector('#sound-toggle');
const announcement = document.querySelector('#announcement');
const caseButtons = [...demo.querySelectorAll('[data-case]')];
const recorded = window.masilVoiceFiles || {};
const rice = { name: '쌀 4kg', unitPrice: 16900, delivery: 2000, limit: 30000 };
const money = new Intl.NumberFormat('ko-KR');

const elder = (text, sample = '') => ({ speaker: '어르신', text, sample });
const masil = (text, sample = '') => ({ speaker: '마실', text, sample });
const requestLine = elder('마실아, 집에 쌀이 다 떨어져 간다.', 'ask-rice');
const answerLine = elder('그래, 그거 하나 시키도.', 'confirm-rice');
const deliveredLine = masil('할머니, 오늘 쌀이 도착했대요. 잘 받으셨어요?', 'delivered');
const dramaLine = elder('요새 저녁마다 동백꽃 필 무렵 보는데, 참 재밌더라.', 'interest');
const shareLine = masil('요즘 보시는 드라마 이야기를 가족에게 전해드릴까요?');
const familyQuestion = masil('할머니, 오늘 점심은 잘 챙겨 드셨어요?');
const meetLine = elder('응, 잘 먹었어. 이번 금요일 두 시에 동네 모임도 있다.');
const scheduleLine = masil('금요일 오후 두 시 동네 모임을 가족 일정에 적어드릴까요?');

const orderStart = () => ({ phase: 'idle', quantity: 1, route: '', log: [], spoken: [] });
const interestStart = () => ({ phase: 'idle', log: [], spoken: [] });
const calendarStart = () => ({ phase: 'idle', log: [], spoken: [] });
const initializers = { order: orderStart, interest: interestStart, calendar: calendarStart };
const scenarios = { order: orderStart(), interest: interestStart(), calendar: calendarStart() };
let current = 'order';
let soundOn = true;

const audio = new Audio();
audio.preload = 'none';
let playbackId = 0;

function stopSound() {
  playbackId += 1;
  audio.onended = null;
  audio.onerror = null;
  audio.pause();
  window.speechSynthesis?.cancel();
  demo.classList.remove('is-speaking');
}

function playSpeech(lines) {
  stopSound();
  if (!soundOn || !lines.length) return;
  const id = playbackId;

  function next(index) {
    if (id !== playbackId) return;
    const line = lines[index];
    if (!line) {
      demo.classList.remove('is-speaking');
      return;
    }
    const advance = () => next(index + 1);
    let fallbackStarted = false;
    const speakInBrowser = () => {
      if (id !== playbackId || fallbackStarted) return;
      fallbackStarted = true;
      audio.onended = null;
      audio.onerror = null;
      const synthesis = window.speechSynthesis;
      const koreanVoice = synthesis?.getVoices().find(voice => /^ko(?:[-_]|$)/i.test(voice.lang));
      if (!koreanVoice) {
        advance();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(line.text);
      utterance.lang = 'ko-KR';
      utterance.voice = koreanVoice;
      utterance.rate = line.speaker === '어르신' ? .87 : .92;
      utterance.onend = advance;
      utterance.onerror = advance;
      synthesis.speak(utterance);
    };
    demo.classList.add('is-speaking');
    if (line.sample && recorded[line.sample]) {
      audio.onended = advance;
      audio.onerror = speakInBrowser;
      audio.src = recorded[line.sample];
      audio.play().catch(speakInBrowser);
    } else {
      speakInBrowser();
    }
  }

  next(0);
}

function addDialogue(...lines) {
  const scenario = scenarios[current];
  scenario.log.push(...lines);
  scenario.spoken = lines;
  playSpeech(lines);
}

function button(action, label, kind = 'primary', extra = '') {
  return `<button class="button ${kind}" type="button" data-action="${action}" ${extra}>${label}</button>`;
}

function controls(...buttons) {
  return `<div class="button-row">${buttons.join('')}</div>`;
}

function status(phase, label) {
  return `<span class="chip" data-status="${phase}">${label}</span>`;
}

function dialogue(log, placeholder) {
  if (!log.length) return `<p class="empty">${placeholder}</p>`;
  return `<ul class="chat" aria-label="최근 대화">${log.slice(-3).map(line => `
    <li class="${line.speaker === '어르신' ? 'elder' : 'masil'}">
      <span class="speaker-label">${line.speaker}</span>
      <p>${line.text}</p>
    </li>`).join('')}</ul>`;
}

function totalPrice(quantity) {
  return rice.unitPrice * quantity + rice.delivery;
}

function offer(quantity) {
  if (quantity === 1) {
    return masil('할머니, 지난번에 드셨던 4kg짜리 쌀 한 봉지 다시 시켜드릴까요? 배송비까지 18,900원이에요.', 'offer-rice');
  }
  return masil(`쌀 두 봉지로 바꿀까요? 배송비를 포함하면 ${money.format(totalPrice(quantity))}원이라 가족에게 먼저 확인받을게요.`);
}

function quantityPicker(quantity) {
  return `<div class="qty-pick" role="group" aria-label="쌀 주문 수량">
    <span>주문 수량</span>
    ${button('quantity', '1봉', 'secondary', `data-quantity="1" aria-pressed="${quantity === 1}"`)}
    ${button('quantity', '2봉', 'secondary', `data-quantity="2" aria-pressed="${quantity === 2}"`)}
  </div>`;
}

const orderStatus = {
  quote: '어르신 확인 전',
  pending: '가족 확인 대기',
  ordered: '모의 주문 접수',
  delivered: '배송 완료',
  received: '수령 확인 완료',
  canceled: '주문 취소',
};

function renderOrder() {
  const { phase, quantity, route, log } = scenarios.order;
  const caption = dialogue(log, '어르신이 쌀을 부탁하면 마실이 지난 주문을 찾아요.');
  if (phase === 'idle') {
    return [
      caption + controls(button('ask-rice', '쌀 부탁하기')),
      '<p class="empty">주문을 요청하면 여기서 보실 수 있어요.</p>',
    ];
  }

  const hints = {
    quote: '사전 등록한 품목으로, 시연 자동 주문 한도는 배송비 포함 30,000원이에요.',
    pending: '배송비를 포함한 총액이 한도를 넘어 가족 확인이 필요해요.',
    ordered: route === 'automatic' ? '사전 허용한 품목과 한도 안에서 자동으로 주문이 접수됐어요.' : '가족이 확인한 뒤 주문이 접수됐어요.',
    delivered: '마실이 어르신에게 물건을 잘 받았는지 묻고 있어요.',
    received: '어르신이 잘 받았다고 답하셨어요.',
    canceled: '이 요청은 취소됐어요.',
  };
  const orderCard = `${status(phase, orderStatus[phase])}<div class="summary-card">
    <p class="card-title">${rice.name} · ${quantity}봉</p>
    <p class="total">${money.format(totalPrice(quantity))}원</p>
    <p>배송비 ${money.format(rice.delivery)}원 포함</p>
  </div><p class="family-hint">${hints[phase]}</p>`;
  const cancel = button('cancel-order', '주문 취소', 'secondary');
  const replay = button('replay', '대사 다시 듣기', 'text-button');
  const voiceActions = {
    quote: controls(button('confirm-order', '이대로 주문'), cancel, replay),
    pending: controls(cancel, replay),
    ordered: controls(cancel, replay),
    delivered: controls(button('receive-order', '잘 받았어요'), replay),
    received: controls(button('restart-order', '다시 부탁하기', 'secondary')),
    canceled: controls(button('restart-order', '다시 부탁하기', 'secondary')),
  };
  const familyActions = {
    pending: controls(button('approve-order', '모의 주문 승인')),
    ordered: controls(button('deliver-order', '배송 완료 시연', 'secondary')),
  };
  const quantityControl = phase === 'quote' || phase === 'pending' ? quantityPicker(quantity) : '';
  return [caption + quantityControl + voiceActions[phase], orderCard + (familyActions[phase] || '')];
}

function renderInterest() {
  const { phase, log } = scenarios.interest;
  const caption = dialogue(log, '요즘 즐겨 보는 드라마 이야기로 마실과 대화를 시작해요.');
  const voiceActions = {
    idle: controls(button('tell-interest', '요즘 이야기하기')),
    permission: controls(button('allow-share', '가족에게 전해줘'), button('decline-share', '이번엔 간직할래', 'secondary'), button('replay', '대사 다시 듣기', 'text-button')),
    shared: '',
    private: '',
  };
  let family = '<p class="empty">어르신이 공유를 허락하신 소식이 여기에 나타나요.</p>';
  if (phase === 'shared') {
    family = `${status(phase, '어르신이 전한 소식')}
      <div class="summary-card"><p class="card-title">요즘 즐겨 보는 드라마</p><p>저녁마다 〈동백꽃 필 무렵〉을 즐겨 보세요.</p></div>
      <p class="family-hint">다음 통화에서 물어보세요. “요즘 보시는 드라마, 어떤 장면이 제일 좋았어요?”</p>`;
  }
  return [caption + voiceActions[phase], family];
}

function renderCalendar() {
  const { phase, log } = scenarios.calendar;
  const caption = dialogue(log, phase === 'queued'
    ? '가족이 남긴 질문을 마실이 다음 대화에서 여쭤봐요.'
    : '가족 화면에서 안부 질문을 남겨 대화를 시작해 보세요.');
  const voiceActions = {
    idle: '',
    queued: controls(button('continue-talk', '마실과 대화하기')),
    review: controls(button('save-schedule', '그 일정 적어줘'), button('skip-schedule', '이번엔 됐어요', 'secondary')),
    scheduled: '',
    skipped: '',
  };
  const family = phase === 'idle'
    ? '<div class="summary-card"><p class="card-title">점심은 잘 챙겨 드셨는지 여쭤봐 줘.</p></div>' + controls(button('queue-question', '이 안부 질문 남기기'))
    : `${status(phase, phase === 'queued' ? '다음 대화에 질문 예정' : '어르신에게 질문 완료')}
      <div class="summary-card"><p class="card-title">점심은 잘 챙겨 드셨어요?</p></div>
      ${phase === 'scheduled' ? `<p class="family-hint">공유 일정</p><div class="summary-card"><p class="card-title">동네 모임</p><p>금요일 오후 2시</p></div>` : ''}`;
  return [caption + voiceActions[phase], family];
}

const renderers = { order: renderOrder, interest: renderInterest, calendar: renderCalendar };

function render() {
  caseButtons.forEach(element => element.setAttribute('aria-pressed', String(element.dataset.case === current)));
  const [voice, family] = renderers[current]();
  voicePanel.innerHTML = voice;
  familyPanel.innerHTML = family;
}

function updatePhase(phase, ...lines) {
  scenarios[current].phase = phase;
  if (lines.length) addDialogue(...lines);
}

function canChangeOrder() {
  return ['quote', 'pending'].includes(scenarios.order.phase);
}

const actions = {
  'ask-rice'() {
    if (scenarios.order.phase === 'idle') updatePhase('quote', requestLine, offer(1));
  },
  quantity(target) {
    const order = scenarios.order;
    const quantity = Number(target.dataset.quantity);
    if (!canChangeOrder() || (quantity !== 1 && quantity !== 2) || order.quantity === quantity) return;
    order.quantity = quantity;
    order.route = '';
    updatePhase('quote', offer(quantity));
  },
  'confirm-order'() {
    const order = scenarios.order;
    if (order.phase !== 'quote') return;
    const automatic = totalPrice(order.quantity) <= rice.limit;
    order.route = automatic ? 'automatic' : 'family';
    const reply = order.quantity === 1 ? answerLine : elder('그래, 두 봉지로 시켜도.');
    if (automatic) {
      updatePhase('ordered', reply, masil('네, 정해둔 한도 안이라 집으로 보내드리도록 주문했어요.'));
    } else {
      updatePhase('pending', reply, masil('두 봉지는 정해둔 한도를 넘어 가족에게 확인을 부탁드렸어요.'));
    }
  },
  'approve-order'() {
    if (scenarios.order.phase === 'pending') updatePhase('ordered', masil('가족이 확인해주셔서 주문이 접수됐어요.'));
  },
  'cancel-order'() {
    if (canChangeOrder() || scenarios.order.phase === 'ordered') updatePhase('canceled', masil('네, 이번 주문을 취소했어요.'));
  },
  'deliver-order'() {
    if (scenarios.order.phase === 'ordered') updatePhase('delivered', deliveredLine);
  },
  'receive-order'() {
    if (scenarios.order.phase === 'delivered') updatePhase('received', elder('응, 잘 받았어.'), masil('잘 받으셨다고 가족에게도 알려드렸어요.'));
  },
  'restart-order'() {
    scenarios.order = orderStart();
    updatePhase('quote', requestLine, offer(1));
  },
  'tell-interest'() {
    if (scenarios.interest.phase === 'idle') updatePhase('permission', dramaLine, shareLine);
  },
  'allow-share'() {
    if (scenarios.interest.phase === 'permission') updatePhase('shared', masil('드라마 이야기를 가족에게만 정리해서 전했어요.'));
  },
  'decline-share'() {
    if (scenarios.interest.phase === 'permission') updatePhase('private', masil('알겠어요. 우리 둘이 나눈 이야기로 간직할게요.'));
  },
  'queue-question'() {
    if (scenarios.calendar.phase === 'idle') updatePhase('queued');
  },
  'continue-talk'() {
    if (scenarios.calendar.phase === 'queued') updatePhase('review', familyQuestion, meetLine, scheduleLine);
  },
  'save-schedule'() {
    if (scenarios.calendar.phase === 'review') updatePhase('scheduled', masil('금요일 오후 두 시 동네 모임으로 가족 달력에 적어두었어요.'));
  },
  'skip-schedule'() {
    if (scenarios.calendar.phase === 'review') updatePhase('skipped', masil('네, 이번 일정은 이야깃거리로 둘게요.'));
  },
  reset() {
    scenarios[current] = initializers[current]();
    stopSound();
  },
  replay() {
    playSpeech(scenarios[current].spoken);
  },
};

function restoreFocus(target, panel) {
  if (!panel || panel === demo || target.isConnected) return;
  const available = [...panel.querySelectorAll('button')];
  const match = available.find(el => el.dataset.action === target.dataset.action && el.dataset.quantity === target.dataset.quantity);
  const next = match || available[0] || demo.querySelector('[data-action="reset"]');
  next?.focus({ preventScroll: true });
}

demo.addEventListener('click', event => {
  const target = event.target.closest('button');
  if (!target) return;
  if (target === soundButton) {
    soundOn = !soundOn;
    soundButton.textContent = soundOn ? '음성 켜짐' : '음성 꺼짐';
    soundButton.setAttribute('aria-pressed', String(soundOn));
    if (soundOn) playSpeech(scenarios[current].spoken);
    else stopSound();
    return;
  }
  if (target.dataset.case) {
    stopSound();
    current = target.dataset.case;
    render();
    announcement.textContent = `${target.textContent} 체험으로 이동했습니다.`;
    return;
  }
  const action = target.dataset.action;
  if (!Object.hasOwn(actions, action)) return;
  const panel = target.closest('.device-body');
  actions[action](target);
  const phase = scenarios[current].phase;
  if (action === 'replay') return;
  render();
  restoreFocus(target, panel);
  const latest = scenarios[current].log.at(-1);
  const statusText = current === 'order' ? orderStatus[phase] : '';
  announcement.textContent = [statusText, latest?.text].filter(Boolean).join('. ') || (phase === 'queued' ? '가족이 안부 질문을 남겼어요.' : '시연을 다시 시작했습니다.');
});

const story = document.querySelector('.story-canvas');
const listen = document.querySelector('[data-step="listen"]');
const connect = document.querySelector('[data-step="connect"]');
const plainStory = window.matchMedia('(max-width: 670px), (prefers-reduced-motion: reduce)');
let updateQueued = false;

function updateStory() {
  updateQueued = false;
  function progress(section) {
    return Math.max(0, Math.min(1, (window.innerHeight * .81 - section.getBoundingClientRect().top) / (window.innerHeight * .36)));
  }
  story.style.setProperty('--listen', plainStory.matches ? 1 : progress(listen));
  story.style.setProperty('--connect', plainStory.matches ? 1 : progress(connect));
}

function scheduleStory() {
  if (updateQueued) return;
  updateQueued = true;
  requestAnimationFrame(updateStory);
}

window.addEventListener('scroll', scheduleStory, { passive: true });
window.addEventListener('resize', scheduleStory, { passive: true });
plainStory.addEventListener('change', scheduleStory);
if (Object.keys(recorded).length) document.querySelector('#voice-credit').hidden = false;
updateStory();
render();
