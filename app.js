'use strict';

const demo = document.querySelector('#experience');
const voicePanel = document.querySelector('#voice-panel');
const familyPanel = document.querySelector('#family-panel');
const soundButton = document.querySelector('#sound-toggle');
const announcement = document.querySelector('#announcement');
const caseButtons = [...demo.querySelectorAll('[data-case]')];
const dialogueLines = window.masilDialogue;
const rice = { name: '쌀 4kg', unitPrice: 16900, delivery: 2000, limit: 30000 };
const money = new Intl.NumberFormat('ko-KR');

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
    let advanced = false;
    const advance = () => {
      if (advanced || id !== playbackId) return;
      advanced = true;
      next(index + 1);
    };
    audio.onended = advance;
    audio.onerror = advance;
    audio.src = line.file;
    audio.play().then(() => {
      if (id === playbackId && !advanced) demo.classList.add('is-speaking');
    }).catch(advance);
  }

  next(0);
}

function addDialogue(...keys) {
  const scenario = scenarios[current];
  const lines = keys.map(key => dialogueLines[key]);
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
  const caption = dialogue(log, '어르신이 쌀을 부탁하시면 마실이 지난 주문 기록을 찾습니다.');
  if (phase === 'idle') {
    return [
      caption + controls(button('ask-rice', '쌀 부탁하기')),
      '<p class="empty">어르신이 주문을 요청하시면 이 화면에 표시됩니다.</p>',
    ];
  }

  const hints = {
    quote: '사전 등록된 품목이며, 시연용 자동 주문 한도는 배송비 포함 30,000원입니다.',
    pending: '배송비 포함 총액이 자동 주문 한도를 넘어 가족 확인이 필요합니다.',
    ordered: route === 'automatic' ? '사전 허용된 품목과 한도 안에서 자동으로 주문이 접수되었습니다.' : '가족 확인을 거쳐 주문이 접수되었습니다.',
    delivered: '마실이 어르신께 물건을 잘 받으셨는지 여쭙고 있습니다.',
    received: '어르신이 물건을 잘 받으셨다고 답하셨습니다.',
    canceled: '이번 주문 요청이 취소되었습니다.',
  };
  const orderCard = `${status(phase, orderStatus[phase])}<div class="summary-card">
    <p class="card-title">${rice.name} · ${quantity}봉</p>
    <p class="total">${money.format(totalPrice(quantity))}원</p>
    <p>배송비 ${money.format(rice.delivery)}원 포함</p>
  </div><p class="family-hint">${hints[phase]}</p>`;
  const cancel = button('cancel-order', '주문 취소', 'secondary');
  const replay = button('replay', '대사 다시 듣기', 'text-button');
  const voiceActions = {
    quote: controls(button('confirm-order', '이대로 주문하기'), cancel, replay),
    pending: controls(cancel, replay),
    ordered: controls(cancel, replay),
    delivered: controls(button('receive-order', '수령 확인하기'), replay),
    received: controls(button('restart-order', '다시 부탁하기', 'secondary'), replay),
    canceled: controls(button('restart-order', '다시 부탁하기', 'secondary'), replay),
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
  const caption = dialogue(log, '요즘 즐겨 보시는 드라마 이야기로 마실과 대화를 시작합니다.');
  const replay = button('replay', '대사 다시 듣기', 'text-button');
  const restart = button('restart-interest', '처음으로 돌아가기', 'secondary');
  const voiceActions = {
    idle: controls(button('tell-interest', '요즘 이야기하기')),
    permission: controls(button('allow-share', '가족에게 공유하기'), button('decline-share', '공유하지 않기', 'secondary'), replay),
    shared: controls(restart, replay),
    private: controls(restart, replay),
  };
  let family = '<p class="empty">어르신이 공유를 허락하신 소식이 이곳에 표시됩니다.</p>';
  if (phase === 'shared') {
    family = `${status(phase, '어르신이 전한 소식')}
      <div class="summary-card"><p class="card-title">요즘 즐겨 보시는 드라마</p><p>저녁마다 〈동백꽃 필 무렵〉을 즐겨 보십니다.</p></div>
      <p class="family-hint">다음 통화에서 자연스럽게 꺼내 보세요. “요즘 보시는 드라마, 어떤 장면이 제일 좋으셨어요?”</p>`;
  } else if (phase === 'private') {
    family = `${status(phase, '공유하지 않음')}
      <p class="empty">어르신이 공유를 원하지 않으셔서 가족 화면에는 전달되지 않았습니다.</p>
      <p class="family-hint">어르신이 허락하신 이야기만 공유되며, 원하지 않는 기억은 언제든 수정하거나 지울 수 있습니다.</p>`;
  }
  return [caption + voiceActions[phase], family];
}

function renderCalendar() {
  const { phase, log } = scenarios.calendar;
  const caption = dialogue(log, phase === 'queued'
    ? '가족이 남긴 안부 질문을 마실이 다음 대화에서 자연스럽게 여쭙습니다.'
    : '먼저 가족 화면에서 안부 질문을 남겨 대화를 시작해 보세요.');
  const replay = button('replay', '대사 다시 듣기', 'text-button');
  const restart = button('restart-calendar', '처음으로 돌아가기', 'secondary');
  const voiceActions = {
    idle: '',
    queued: controls(button('continue-talk', '마실과 대화하기')),
    review: controls(button('save-schedule', '일정에 추가하기'), button('skip-schedule', '추가하지 않기', 'secondary'), replay),
    scheduled: controls(restart, replay),
    skipped: controls(restart, replay),
  };
  const family = phase === 'idle'
    ? '<div class="summary-card"><p class="card-title">“오늘 점심은 잘 챙겨 드셨는지 여쭤봐 줘.”</p><p>가족이 남겨둔 안부를 마실이 대화 중 자연스럽게 여쭙습니다.</p></div>' + controls(button('queue-question', '안부 질문 남기기'))
    : `${status(phase, phase === 'queued' ? '다음 대화에서 질문 예정' : '안부 질문 완료')}
      <div class="summary-card"><p class="card-title">점심은 잘 챙겨 드셨어요?</p></div>
      ${phase === 'scheduled' ? `<p class="family-hint">공유 달력 일정</p><div class="summary-card"><p class="card-title">동네 모임</p><p>금요일 오후 2시</p></div>` : ''}
      ${phase === 'skipped' ? `<p class="family-hint">어르신이 일정 등록을 원하지 않으셔서 공유 달력에는 추가되지 않았습니다.</p>` : ''}`;
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
    if (scenarios.order.phase === 'idle') updatePhase('quote', 'ask-rice', 'offer-rice');
  },
  quantity(target) {
    const order = scenarios.order;
    const quantity = Number(target.dataset.quantity);
    if (!canChangeOrder() || (quantity !== 1 && quantity !== 2) || order.quantity === quantity) return;
    order.quantity = quantity;
    order.route = '';
    updatePhase('quote', quantity === 1 ? 'offer-rice' : 'offer-two');
  },
  'confirm-order'() {
    const order = scenarios.order;
    if (order.phase !== 'quote') return;
    const automatic = totalPrice(order.quantity) <= rice.limit;
    order.route = automatic ? 'automatic' : 'family';
    const reply = order.quantity === 1 ? 'confirm-rice' : 'confirm-two';
    if (automatic) {
      updatePhase('ordered', reply, 'auto-ordered');
    } else {
      updatePhase('pending', reply, 'family-pending');
    }
  },
  'approve-order'() {
    if (scenarios.order.phase === 'pending') updatePhase('ordered', 'family-approved');
  },
  'cancel-order'() {
    if (canChangeOrder() || scenarios.order.phase === 'ordered') updatePhase('canceled', 'cancel-order');
  },
  'deliver-order'() {
    if (scenarios.order.phase === 'ordered') updatePhase('delivered', 'delivered');
  },
  'receive-order'() {
    if (scenarios.order.phase === 'delivered') updatePhase('received', 'received-elder', 'received-reply');
  },
  'restart-order'() {
    scenarios.order = orderStart();
    updatePhase('quote', 'ask-rice', 'offer-rice');
  },
  'tell-interest'() {
    if (scenarios.interest.phase === 'idle') updatePhase('permission', 'interest', 'interest-ask');
  },
  'allow-share'() {
    if (scenarios.interest.phase === 'permission') updatePhase('shared', 'interest-shared');
  },
  'decline-share'() {
    if (scenarios.interest.phase === 'permission') updatePhase('private', 'interest-private');
  },
  'restart-interest'() {
    scenarios.interest = interestStart();
    stopSound();
  },
  'queue-question'() {
    if (scenarios.calendar.phase === 'idle') updatePhase('queued');
  },
  'continue-talk'() {
    if (scenarios.calendar.phase === 'queued') updatePhase('review', 'family-question', 'meeting', 'schedule-ask');
  },
  'save-schedule'() {
    if (scenarios.calendar.phase === 'review') updatePhase('scheduled', 'schedule-saved');
  },
  'skip-schedule'() {
    if (scenarios.calendar.phase === 'review') updatePhase('skipped', 'schedule-skipped');
  },
  'restart-calendar'() {
    scenarios.calendar = calendarStart();
    stopSound();
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
  announcement.textContent = [statusText, latest?.text].filter(Boolean).join('. ') || (phase === 'queued' ? '가족이 안부 질문을 남겼습니다.' : '시연을 처음 상태로 되돌렸습니다.');
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
updateStory();
render();
