import waveforms from './waveforms.json';

const length = file => waveforms[file]?.seconds ?? 0;
const line = (file, speaker, text) => ({ file, speaker, text });
function dialogue(...lines) {
  let time = 0;
  const cues = lines.map(({ file, speaker, text }) => {
    const cue = { at: time, speaker, text };
    time += length(file);
    return cue;
  });
  return { files: lines.map(l => l.file), cues, seconds: time };
}

function sameWords(impact) {
  const file = impact ? 'same-impact.mp3' : 'same-calm.mp3';
  const end = length('check-food.mp3');
  const follow = impact ? 'check-impact.mp3' : 'follow-food.mp3';
  const last = impact ? '방금 쿵 소리가 났는데, 어디 부딪히셨어요?' : '다음에도 이 반찬 가져다 달라고 할까요?';
  const cues = [
    { at: 0, speaker: '마실', text: '할머니, 따님이 가져다주신 반찬은 입에 맞으셨어요?' },
    ...(impact ? [{ at: end + .20, speaker: '생활 소리', text: '가까운 곳에서 들린 쿵 소리', impact: true }] : []),
    { at: end + .89, speaker: '할머니', text: '괜찮다.' },
    { at: length(file), speaker: '마실', text: last },
  ];
  return { files: [file,follow], seconds: length(file) + length(follow), cues };
}

export const places = [
  { id: 'home', nav: '집 전체', object: '할머니 댁', time: '오전 9시' },
  { id: 'morning', nav: '거실', object: '거실 스피커', time: '오전 9시' },
  { id: 'kitchen', nav: '부엌', object: '부엌 주전자', time: '오전 10시' },
  { id: 'family', nav: '가족', object: '가족 휴대폰', time: '저녁 7시' },
];

export const day = [
  { id: 'home', place: 0, run: 76, topic: '어르신을 위한 AI 생활 도우미', title: ['말과 생활 소리를','함께 듣는 마실'],
    body: '할머니 댁을 천천히 둘러보세요. 아래로 스크롤하면 거실의 아침 인사부터 저녁 가족 통화까지 이어져요.',
    ...dialogue(line('first-morning.mp3','마실','할머니, 오늘 아침은 어떠세요?')) },
  { id: 'morning', place: 1, run: 66, topic: '거실에서 시작하는 아침', title: ['“할머니, 오늘','아침은 어떠세요?”'],
    body: '약속한 시간이 되자 스피커에 불이 들어와요. 할머니가 무릎 이야기를 꺼내자 마실은 가족에게 전해도 될지 먼저 물어요.',
    ...dialogue(line('first-morning.mp3','마실','할머니, 오늘 아침은 어떠세요?'),line('elder-knee.mp3','할머니','요즘 무릎이 좀 아프다.'),line('ask-health-share.mp3','마실','무릎이 좀 불편하셨군요. 가족에게도 이 얘기 전해드릴까요?')) },
  { id: 'morning-meal', place: 1, run: 59, topic: '거실의 반찬 이야기', title: ['조용한 거실에서','“괜찮다.”'],
    body: '딸이 가져다준 반찬 맛을 묻자 평소 말투로 대답하세요. 마실은 다음에도 이 반찬을 부탁할지 여쭤봐요.',
    ...sameWords(false) },
  { id: 'morning-impact', place: 1, run: 69, topic: '같은 말에 더해진 소리', title: ['쿵, 소리가 난 뒤','“괜찮다.”'],
    body: '이번에는 같은 질문 뒤에 쿵 소리가 나고 할머니의 목소리가 작아져요. 마실은 소리가 난 까닭을 한 번 확인해요.',
    ...sameWords(true) },
  { id: 'morning-answer', place: 1, run: 52, topic: '할머니가 알려준 상황', title: ['“냄비 뚜껑','떨어뜨렸다.”'],
    body: '할머니가 직접 설명해 주셨어요. 마실은 반찬 이야기로 돌아가고, 이 장면에서 가족에게 보내는 알림은 0건이에요.',
    ...dialogue(line('elder-lid.mp3','할머니','냄비 뚜껑 떨어뜨렸다. 내는 괜찮다.')) },
  { id: 'kitchen', place: 2, run: 69, topic: '부엌의 주전자', title: ['차 한 잔 하신다던','참이었죠.'],
    body: '차를 준비하겠다는 말 뒤에 물 끓는 소리가 들려요. 마실은 주전자를 보러 가실 동안 잠깐 기다릴지 물어요.',
    ...dialogue(line('sound-kettle.mp3','생활 소리','물이 끓는 듯한 소리'),line('check-kettle.mp3','마실','아까 차 드신다고 하셨죠. 물 보러 가실 동안 이야기 잠깐 멈출까요?')) },
  { id: 'kitchen-rice', place: 2, run: 72, topic: '쌀통 앞에서', title: ['“마실아, 집에 쌀이','다 떨어져 간다.”'],
    body: '지난번 쌀 한 봉지는 배송비까지 18,900원이에요. 할머니가 상품과 수량을 직접 확인한 뒤에야 정해 둔 한도 안에서 모의 주문을 접수해요.',
    ...dialogue(line('ask-rice.mp3','할머니','마실아, 집에 쌀이 다 떨어져 간다.'),line('offer-rice.mp3','마실','할머니, 지난번에 드셨던 4kg짜리 쌀 한 봉지 다시 시켜드릴까요? 배송비까지 18,900원이에요.'),line('confirm-rice.mp3','할머니','그래, 그거 하나 시키도.')) },
  { id: 'family', place: 3, run: 64, topic: '가족에게 도착한 소식', title: ['쌀이 도착하고,','안부가 닿아요.'],
    body: '가족 휴대폰에는 주문 상태가 보여요. 배송 후 할머니가 받았다고 답하시면 가족 카드에도 수령 확인이 도착해요.',
    ...dialogue(line('delivered.mp3','마실','할머니, 오늘 쌀이 도착했대요. 잘 받으셨어요?'),line('voice-elder-received.mp3','할머니','응, 잘 받았다.'),line('voice-received-reply.mp3','마실','잘 받으셨다고 가족에게도 알려드렸어요.')) },
  { id: 'family-call', place: 3, run: 68, topic: '이어지는 저녁 통화', title: ['“엄마, 그 드라마는','누가 제일 좋아?”'],
    body: '할머니가 드라마 이야기를 전해도 좋다고 하셨어요. 저녁에 딸이 전화해, 다음에 같이 볼 이야기를 나눠요.',
    ...dialogue(line('interest.mp3','할머니','요새 저녁마다 동백꽃 필 무렵 보는데, 참 재밌더라.'),line('voice-interest-ask.mp3','마실','요즘 보시는 드라마 이야기를 가족에게 전해드릴까요?'),line('day-share-yes.mp3','할머니','그래, 요새 그 드라마 본다고 전해도.'),line('day-daughter.mp3','딸','엄마, 그 드라마는 누가 제일 마음에 들어?'),line('day-watch-together.mp3','할머니','나는 동백이가 제일 마음에 든다. 다음에 오면 같이 보자.')) },
];

export function cueIndex(beat, seconds) {
  let i = 0;
  while (i + 1 < beat.cues.length && seconds >= beat.cues[i + 1].at) i++;
  return i;
}
