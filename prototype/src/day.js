import waveforms from './waveforms.json';
import { connectCall, daughterReads } from './familyCall.js';

const line = (audio,speaker,text,impact=false) => ({audio,speaker,text,impact});
function dialogue(...lines) {
  let seconds=0;
  const cues=lines.map(item=>{
    const cue={...item,at:seconds};
    seconds+=waveforms[item.audio]?.seconds??0;
    return cue;
  });
  return {files:lines.map(l=>l.audio),cues,seconds};
}
export const places = [
  { id:'home',nav:'집 전체',object:'할머니 댁',time:'오전 9시' },
  { id:'morning',nav:'거실',object:'거실 스피커',time:'오전 9시' },
  { id:'kitchen',nav:'부엌',object:'부엌 주전자',time:'오전 10시' },
  { id:'family',nav:'가족',object:'저녁 식탁',time:'저녁 7시' },
];
export const day = [
  { id:'home',place:0,run:73,topic:'어르신을 위한 AI 생활 도우미',title:['말과 생활 소리를','함께 듣는 마실'],
    body:'스크롤로 할머니 댁을 둘러보세요. 아침 소파에서 시작한 멸치볶음 이야기가 저녁 무렵 딸의 전화로 이어져요.',
    ...dialogue(line('day-wake.mp3','할머니','마실아, 니도 일어났나?')) },
  { id:'morning',place:1,run:76,topic:'아침 식사를 마치고',title:['“니도','일어났나?”'],
    body:'소파에 앉아 마실을 부르셨어요. 어제 딸이 반찬을 가져오기로 했다는 걸 마실도 기억해요.',
    ...dialogue(line('day-morning.mp3','마실','네, 할머니. 어제 따님이 반찬 가져오신다고 했죠?'),
      line('day-anchovy.mp3','할머니','맞다. 멸치볶음 해 왔더라. 아침에 밥이랑 묵었다.')) },
  { id:'morning-meal',place:1,run:75,topic:'거실의 반찬 이야기',title:['“괜찮다.','딱 내 입맛이다.”'],
    body:'할머니가 아침에 드신 건 딸의 멸치볶음이에요. 반찬 이야기를 하다 따뜻한 차 한 잔이 생각나셨어요.',
    ...dialogue(line('day-taste.mp3','마실','이번엔 간이 좀 어떠셨어요?'),
      line('day-just-right.mp3','할머니','괜찮다. 딱 내 입맛이다.'),
      line('day-tea.mp3','할머니','밥도 묵었으니 차나 한 잔 해야겠다.')) },
  { id:'morning-impact',place:1,run:68,topic:'찻잔을 찾던 순간',title:['쿵, 소리가 난 뒤','“괜찮다.”'],
    body:'이번에는 짧은 소리 뒤에 작은 목소리가 따라와요. 마실이 할머니의 말을 기다렸다가 한 번 여쭤봐요.',
    ...dialogue(line('day-clatter.mp3','생활 소리','가까이서 짧게 난 쿵 소리',true),
      line('day-startle.mp3','할머니','아이고… 괜찮다.'),
      line('day-bump.mp3','마실','할머니, 방금 쿵 소리가 났는데 어디 부딪히셨어요?')) },
  { id:'morning-answer',place:1,run:74,topic:'할머니의 대답',title:['“뚜껑 떨어뜨렸다.','나는 멀쩡하다.”'],
    body:'할머니가 소리의 까닭을 알려주셨어요. 가족에게 연락할 일은 없고, 둘은 다시 차 이야기로 돌아와요.',
    ...dialogue(line('day-lid.mp3','할머니','아이다. 냄비 뚜껑 떨어뜨렸다. 나는 멀쩡하다.'),
      line('day-water.mp3','마실','다행이에요. 물은 올려놓으셨어요?'),
      line('day-ready.mp3','할머니','응, 이제 끓을 기다.')) },
  { id:'kitchen',place:2,run:72,topic:'물이 끓는 부엌',title:['주전자가 먼저','대답했어요.'],
    body:'조금 전 올려놓은 물이 끓어요. 할머니가 차를 따르다 쌀통을 슬쩍 들어 보셨어요.',
    ...dialogue(line('sound-kettle.mp3','생활 소리','주전자에서 보글보글 물이 끓어요.'),
      line('day-pour.mp3','마실','물 끓는 소리 나네요. 천천히 따르세요.'),
      line('day-rice-bin.mp3','할머니','그래. 어이구, 쌀통이 와 이리 가볍노.')) },
  { id:'kitchen-rice',place:2,run:92,topic:'쌀통 옆에서',title:['“마실아, 집에 쌀이','다 떨어져 간다.”'],
    body:'늘 드시던 쌀 4kg 한 봉지예요. 할머니가 상품과 배송비를 들은 뒤 수량을 확인하면, 정해 둔 한도 안에서 모의 주문이 접수돼요.',
    ...dialogue(line('day-order.mp3','할머니','마실아, 집에 쌀이 다 떨어져 간다.'),
      line('day-price.mp3','마실','지난번 드신 4kg짜리 쌀 한 봉지예요. 배송비까지 18,900원인데, 같은 걸로 시켜 드릴까요?'),
      line('day-yes.mp3','할머니','그래, 그거 하나 시키도.'),
      line('day-ordered.mp3','마실','네, 한 봉지 주문했어요.')) },
  { id:'family',place:3,run:73,topic:'그날 저녁 식탁',title:['쌀이 도착한','저녁이에요.'],
    body:'아침에 주문한 쌀이 문 앞에 놓였어요. 할머니가 잘 받았다고 말씀하신 뒤 가족 화면에 수령 확인이 떠요.',
    ...dialogue(line('day-knock.mp3','마실','할머니, 아침에 시킨 쌀이 왔대요. 문 앞에 있던가요?'),
      line('day-supper.mp3','할머니','응, 잘 받았다. 밥 안쳐 놓고 드라마 볼라꼬.'),
      line('day-received.mp3','마실','잘 받으셨다고 가족에게도 알려 드릴게요. 오늘은 무슨 드라마 보세요?')) },
  { id:'family-news',place:3,run:110,topic:'저녁 드라마 이야기',title:['“담에 오면 내하고','같이 보자 캐라.”'],
    body:'할머니가 즐겨 보시는 드라마가 있어요. 마실이 딸에게 어떤 이야기를 전해도 될지 여쭤봐요.',
    ...dialogue(line('day-drama.mp3','할머니','동백꽃 필 무렵, 그거 볼수록 재밌데이.'),
      line('day-share.mp3','마실','따님한테도 요즘 그 드라마 보신다고 전해 드릴까요?'),
      line('day-together.mp3','할머니','그래. 담에 오면 내하고 같이 보자 캐라.'),
      ...daughterReads) },
  { id:'family-call',place:3,run:110,topic:'두 집의 저녁 식탁',title:['딸이 먼저 건','저녁 전화'],
    body:'딸이 엄마에게 전화를 걸어요. 할머니가 벨소리를 듣고 받으시면 아침에 먹은 멸치볶음 이야기도 다시 나와요.',
    ...dialogue(...connectCall,
      { ...line('day-call.mp3','딸','엄마, 동백이 본다며? 다음 주에 멸치볶음 가져갈까?'),callStage:'talking' },
      { ...line('day-come.mp3','할머니','멸치볶음은 됐다. 니만 온나. 밥은 내가 해 놓을게.'),callStage:'listening' }) },
];
export function cueIndex(beat,seconds) {
  let i=0;
  while(i+1<beat.cues.length && seconds>=beat.cues[i+1].at) i++;
  return i;
}
