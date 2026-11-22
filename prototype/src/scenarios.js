const masil = (text, audio) => ({ speaker: '마실', text, audio });
const elder = (text, audio) => ({ speaker: '할머니', text, audio });
const sound = (text, audio) => ({ speaker: '집 안 소리', text, audio });
const action = (label, to) => ({ label, to });

const sideDish = masil('할머니, 따님이 가져다주신 반찬은 입에 맞으셨어요?', 'check-food.mp3');
const fine = elder('괜찮다.', 'elder-fine.mp3');
const orderPrompt = '지난번 드신 쌀을 주문할까요? 가족에게 부족하다는 말만 전할 수도 있어요.';
const rice = { one: '쌀 4kg 한 봉지 · 18,900원', two: '쌀 4kg 두 봉지 · 35,800원' };
const delivery = masil('할머니, 오늘 쌀이 도착했대요. 잘 받으셨어요?', 'delivered.mp3');

export const scenarios = {
  compare: {
    label: '같은 말 비교',
    goal: '같은 “괜찮다”를 두 번 들어보고 마실이 어떤 말을 건네는지 비교해 보세요.',
    start: {
      lines: [sideDish], clue: '반찬 맛을 묻는 평소 대화', decision: '두 상황의 소리와 응답을 함께 살펴봐요.',
      choices: [action('평소 대화 듣기', 'calm'), action('쿵 소리 뒤 대화 듣기', 'impact')],
    },
    calm: {
      lines: [sideDish, fine], audio: ['same-calm.mp3'], clue: '반찬 이야기 · 평소 말투', decision: '반찬에 관한 대화를 이어갈 수 있어요.',
      choices: [action('마실의 다음 말 보기', 'dish'), action('쿵 소리 뒤 대화 듣기', 'impact')],
    },
    impact: {
      lines: [sideDish, sound('가까이서 짧게 쿵 소리'), fine],
      audio: ['same-impact.mp3'], clue: '짧은 충격음 · 그 뒤 작은 목소리', decision: '소리의 원인이 여러 가지라 한 번 여쭤봐요.',
      choices: [action('마실의 다음 말 보기', 'check'), action('평소 대화 듣기', 'calm')],
    },
    dish: {
      lines: [fine, masil('다음에도 이 반찬 가져다 달라고 할까요?', 'follow-food.mp3')],
      clue: '반찬 이야기에서 나온 선호', decision: '할머니가 원하시면 가족에게 부탁을 전해요.',
      choices: [action('반찬 이야기 전해 주세요', 'dishSent'), action('쿵 소리 뒤 대화 듣기', 'impact')],
    },
    dishSent: {
      lines: [masil('다음에도 이 반찬을 가져다달라고 전할게요.')],
      clue: '할머니가 반찬 이야기를 전해 달라고 함', decision: '부탁하신 한 가지를 가족에게 전해요.',
      family: { label: '공유한 소식', text: '어머니가 다음에도 이 반찬을 드시고 싶다고 하셨어요.' },
    },
    check: {
      lines: [sound('가까이서 짧게 쿵 소리'), fine, masil('방금 쿵 소리가 났는데, 어디 부딪히셨어요?', 'check-impact.mp3')],
      clue: '충격음 뒤 “괜찮다”', decision: '안부를 묻고 본인이 설명할 때까지 기다려요.',
      choices: [action('냄비 뚜껑이었어요', 'lid'), action('TV에서 난 소리예요', 'tv'), action('딸에게 연락해 줘', 'help'), action('응답 없이 시간 넘기기', 'recheck')],
    },
    lid: {
      lines: [elder('냄비 뚜껑 떨어뜨렸다. 내는 괜찮다.', 'elder-lid.mp3'), masil('아, 뚜껑 소리였군요. 반찬 이야기 계속할까요?')],
      clue: '뚜껑을 떨어뜨렸다는 본인 설명', decision: '평소 대화로 돌아가요.',
      choices: [action('다른 답변으로 비교하기', 'check')],
    },
    tv: {
      lines: [elder('TV에서 난 소리다.'), masil('아, TV 소리였군요. 말씀 계속해 주세요.')],
      clue: 'TV에서 났다는 본인 설명', decision: '평소 대화로 돌아가요.',
      choices: [action('다른 답변으로 비교하기', 'check')],
    },
    help: {
      lines: [elder('내가 넘어졌다. 딸한테 전화 좀 해도.', 'elder-help.mp3'), masil('따님께 지금 연락할게요.')],
      clue: '본인이 넘어졌다고 말하고 통화를 요청함', decision: '본인 말씀과 연락 요청을 지정한 딸에게 전해요.',
      family: { label: '통화 요청', text: '어머니가 넘어졌다고 말씀하시고 통화를 요청하셨어요.', urgent: true, call: true },
    },
    recheck: {
      lines: [masil('방금 쿵 소리가 났는데, 어디 부딪히셨어요?', 'check-impact.mp3')],
      clue: '큰 소리 뒤 첫 안부에 응답이 없음', decision: '예시 대기 시간이 지나 한 번 더 확인해요.',
      choices: [action('응답 없이 한 번 더 시간 넘기기', 'noResponse'), action('괜찮다고 답하고 원인 설명하기', 'lid')],
    },
    noResponse: {
      lines: [sound('예시 시간이 지날 때까지 응답이 들리지 않음')],
      clue: '큰 소리 뒤 두 차례 응답을 확인하지 못함', decision: '가족이 사전에 켜 둔 무응답 알림 규칙을 적용해요.',
      family: { label: '안부 확인 요청', text: '큰 소리가 들린 뒤 어머니의 응답을 확인하지 못했어요. 전화로 확인해 주세요.', urgent: true, call: true },
    },
  },
  kettle: {
    label: '주전자와 타이머',
    goal: '이전에 하신 말씀과 생활 소리가 이어질 때 마실이 어떻게 반응하는지 봐요.',
    start: {
      lines: [elder('이따 차 한 잔 해야겠다.')], clue: '잠시 뒤 차를 끓이겠다는 이전 대화', decision: '이어지는 소리의 맥락으로 살펴봐요.',
      choices: [action('끓는 소리 예시 듣기', 'heard'), action('앞선 대화 없이 들어보기', 'quiet')],
    },
    heard: {
      lines: [sound('부엌에서 물이 끓는 듯한 소리', 'sound-kettle.mp3'), masil('아까 차 드신다고 하셨죠. 물 보러 가실 동안 이야기 잠깐 멈출까요?', 'check-kettle.mp3')],
      clue: '차를 준비하겠다는 말 · 끓는 소리 예시', decision: '지금 어르신이 무엇을 원하시는지 여쭤봐요.',
      choices: [action('3분 뒤에 알려줘', 'timer'), action('지금 주전자 앞이야', 'wait'), action('TV에서 나는 소리야', 'tv')],
    },
    timer: {
      lines: [elder('삼 분 뒤에 알려도.'), masil('네, 삼 분 뒤에 알려드릴게요.')],
      clue: '어르신이 직접 3분을 요청함', decision: '3분 타이머를 시연 화면에 설정해요.',
      choices: [action('3분 후 알림 보기', 'timerDone')],
    },
    timerDone: {
      lines: [masil('할머니, 아까 부탁하신 3분이 지났어요.')], clue: '어르신이 요청한 시간에 도달함', decision: '어르신 화면에서 알려드려요.',
      choices: [action('대화로 돌아가기', 'start')],
    },
    wait: {
      lines: [elder('내 지금 주전자 앞이다.'), masil('네, 잠깐 기다릴게요.')], clue: '이미 주전자 앞에 있다는 설명', decision: '어르신이 다시 말을 걸 때까지 기다려요.',
      choices: [action('이야기 계속하기', 'start')],
    },
    quiet: {
      lines: [sound('잦아드는 실내 소리', 'sound-kettle.mp3')], clue: '소리의 원인을 확인할 단서가 부족함', decision: '조용히 기다려요.',
      choices: [action('차를 끓이는 예시 보기', 'heard')],
    },
    tv: {
      lines: [elder('TV에서 나는 기다.'), masil('아, TV 소리였군요. 말씀 계속해 주세요.')],
      clue: '어르신이 TV 소리라고 설명함', decision: '이야기를 이어가요.',
      choices: [action('차를 끓이는 예시 보기', 'heard')],
    },
  },
  checkin: {
    label: '아침 안부',
    goal: '약속한 시간에 먼저 말을 걸고, 대화 중 나온 건강 이야기를 어떻게 나누는지 봐요.',
    start: {
      lines: [], clue: '어르신과 정한 아침 9시', decision: '약속한 시간에 안부를 묻거나 어르신이 대화를 시작해요.',
      choices: [action('약속한 아침 안부 듣기', 'morning'), action('할머니가 먼저 말 걸기', 'heard')],
    },
    morning: {
      lines: [masil('할머니, 오늘 아침은 어떠세요?', 'first-morning.mp3')], clue: '아침 9시 안부 시간', decision: '오늘 어떠신지 먼저 여쭤봐요.',
      choices: [action('무릎 이야기를 꺼내기', 'heard')],
    },
    heard: {
      lines: [elder('요즘 무릎이 좀 아프다.', 'elder-knee.mp3'), masil('무릎이 좀 불편하셨군요. 가족에게도 이 얘기 전해드릴까요?', 'ask-health-share.mp3')],
      clue: '어르신이 직접 말씀하신 무릎 불편', decision: '어르신께 가족에게 전해도 되는지 여쭤봐요.',
      choices: [action('가족에게 전해 주세요', 'share'), action('오늘은 대화만 할래요', 'private')],
    },
    share: {
      lines: [masil('말씀하신 내용만 가족에게 전할게요.')], clue: '본인 말씀과 공유 허락', decision: '동의한 한 문장을 그대로 전해요.',
      family: { label: '공유한 안부', text: '어머니가 “요즘 무릎이 좀 아프다”고 말씀하셨어요.', call: true },
    },
    private: {
      lines: [masil('네, 이 자리에서 이야기 더 나눠요.')], clue: '어르신이 대화만 원하심', decision: '할머니와 대화를 이어가요.',
    },
  },
  order: {
    label: '생필품 주문',
    goal: '쌀이 떨어져 간다는 말에서 시작해 직접 주문하거나 가족에게 부탁해 보세요.',
    start: {
      lines: [elder('마실아, 집에 쌀이 다 떨어져 간다.', 'ask-rice.mp3'), masil(orderPrompt)],
      clue: '쌀이 부족하다는 말 · 지난번 쌀 4kg 주문', decision: '어르신에게 주문과 전달 중 원하는 방식을 여쭤봐요.',
      choices: [action('지난번 쌀로 주문 알아보기', 'quote'), action('아들에게 말만 전하기', 'tell'), action('오늘은 주문 안 할래요', 'cancel')],
    },
    quote: {
      lines: [masil('할머니, 지난번에 드셨던 4kg짜리 쌀 한 봉지 다시 시켜드릴까요? 배송비까지 18,900원이에요.', 'offer-rice.mp3')],
      clue: rice.one + ' · 시연용 배송지와 결제수단 등록', decision: '배송비 포함 자동 주문 한도는 예시 30,000원이에요.',
      choices: [action('그래, 그거 하나 시키도', 'ordered'), action('두 봉지로 바꿔 줘', 'two'), action('시키지 마라', 'cancel')],
    },
    two: {
      lines: [masil('쌀 두 봉지로 바꿀까요? 배송비를 포함하면 35,800원이라 가족에게 먼저 확인받을게요.', 'voice-offer-two.mp3')],
      clue: rice.two, decision: '예시 한도를 넘어서 가족의 확인이 필요해요.',
      choices: [action('두 봉지로 가족에게 물어봐 줘', 'pending'), action('아니다, 한 포만', 'quote'), action('시키지 마라', 'cancel')],
    },
    pending: {
      lines: [masil('두 봉지는 정해둔 한도를 넘어 가족에게 확인을 부탁드렸어요.', 'voice-family-pending.mp3')],
      clue: rice.two + ' · 어르신이 수량을 확인함', decision: '가족의 승인을 기다려요.',
      family: { label: '승인 대기', text: rice.two, actions: [action('모의 주문 승인', 'approved'), action('이번에는 취소', 'cancel')] },
    },
    ordered: {
      lines: [elder('그래, 그거 하나 시키도.', 'confirm-rice.mp3'), masil('네, 정해둔 한도 안이라 집으로 보내드리도록 주문했어요.', 'voice-auto-ordered.mp3')],
      clue: rice.one + ' · 사전 허용 품목', decision: '어르신 확인으로 모의 주문 한 건을 만들어요.',
      family: { label: '주문 완료', text: rice.one, actions: [action('도착한 상황 보기', 'arrived'), action('배송 전 취소', 'cancel')] },
    },
    approved: {
      lines: [masil('가족이 확인해주셔서 주문이 접수됐어요.', 'voice-family-approved.mp3')],
      clue: rice.two + ' · 가족 승인', decision: '가족이 확인한 주문 한 건을 모의 접수해요.',
      family: { label: '주문 완료', text: rice.two, actions: [action('도착한 상황 보기', 'arrived'), action('배송 전 취소', 'cancel')] },
    },
    tell: {
      lines: [masil('아드님께 쌀이 얼마 안 남았다고 전해드릴까요?')],
      clue: '이번에는 가족이 직접 사고 싶다는 요청', decision: '아들에게 전할 문장을 먼저 여쭤봐요.',
      choices: [action('아들에게만 전해 줘요', 'request'), action('말 안 해도 돼요', 'cancel')],
    },
    request: {
      lines: [masil('쌀이 얼마 안 남았다는 말씀을 아드님께 전했어요.')],
      clue: '아들에게 부족하다는 말만 전해 달라는 확인', decision: '가족 화면에 부탁을 남겨요.',
      family: { label: '부탁이 왔어요', text: '어머니가 쌀이 얼마 안 남았다고 하셨어요.', actions: [action('직접 사서 보냈다고 표시', 'sent')] },
    },
    sent: {
      lines: [masil('아드님이 쌀을 보내셨대요.')], clue: '아들이 직접 구매하고 발송했다고 표시함', decision: '가족이 남긴 진행 상태를 보여줘요.',
      family: { label: '가족이 보냈어요', text: '아들이 쌀을 사서 보냈다고 표시했어요.', actions: [action('도착한 상황 보기', 'arrived')] },
    },
    arrived: {
      lines: [delivery], clue: '배송 완료 표시', decision: '어르신에게 실제로 받으셨는지 여쭤봐요.',
      family: { label: '수령 확인 중', text: '배송은 완료로 표시됐어요. 어머니의 답을 기다리고 있어요.' },
      choices: [action('잘 받았다', 'received'), action('아직 못 받았어', 'missing')],
    },
    received: {
      lines: [elder('응, 잘 받았다.', 'voice-elder-received.mp3'), masil('잘 받으셨다고 가족에게도 알려드렸어요.', 'voice-received-reply.mp3')],
      clue: '어르신이 직접 받았다고 답함', decision: '수령 확인을 가족에게도 보여줘요.',
      family: { label: '수령 확인', text: '어머니가 쌀을 잘 받으셨다고 답하셨어요.' },
    },
    missing: {
      lines: [elder('아직 못 받았다.'), masil('가족에게 아직 받지 못하셨다고 전할게요.')],
      clue: '배송 완료 표시와 어르신 답변이 다름', decision: '가족이 배송 상태를 확인할 수 있도록 표시해요.',
      family: { label: '배송 확인 요청', text: '배송 완료로 표시됐지만 어머니는 아직 받지 못하셨다고 말씀하셨어요.' },
    },
    cancel: {
      lines: [masil('네, 이번 주문을 취소했어요.', 'voice-canceled.mp3')],
      clue: '어르신 또는 가족이 중지를 선택함', decision: '이 장면의 주문 절차를 닫아요.',
      family: { label:'주문 취소', text:'이번 쌀 주문은 취소되었어요.' },
    },
  },
  interest: {
    label: '관심사와 다음 통화',
    goal: '말투와 한숨은 대화의 단서가 되고, 가족이 알게 되는 내용은 어르신이 골라요.',
    start: {
      lines: [elder('요새 저녁마다 동백꽃 필 무렵 보는데, 참 재밌더라.', 'interest.mp3'), sound('잠깐 길게 숨을 내쉬는 예시', 'sound-breath.mp3')],
      clue: '드라마 이야기 · 한숨', decision: '“그 장면 보면서 어떤 생각 드셨어요?”라고 물어볼 수 있어요.',
      choices: [action('드라마 이야기를 더 해요', 'drama'), action('딸 목소리가 듣고 싶어요', 'call')],
    },
    drama: {
      lines: [masil('요즘 보시는 드라마 이야기를 가족에게 전해드릴까요?', 'voice-interest-ask.mp3')],
      clue: '할머니가 요즘 즐겨 보시는 드라마', decision: '이 내용을 가족에게 소개해도 될지 여쭤봐요.',
      choices: [action('드라마 이야기 전해 줘요', 'shared'), action('내 기억에만 남겨요', 'saved'), action('우리끼리만 이야기해요', 'private')],
    },
    shared: {
      lines: [masil('드라마 이야기를 가족에게만 정리해서 전했어요.', 'voice-interest-shared.mp3')],
      clue: '어르신이 드라마 소식 공유를 허락함', decision: '가족이 다음 통화에서 꺼낼 대화 주제를 보여줘요.',
      family: { label: '다음 통화 이야기', text: '요즘 저녁마다 《동백꽃 필 무렵》을 보신대요.', actions: [action('다음 가족 통화 보기', 'nextCall')] },
    },
    nextCall: {
      lines: [{ speaker: '딸', text: '엄마, 그 드라마는 누가 제일 마음에 들어?', audio:'day-daughter.mp3' }, elder('나는 동백이가 제일 마음에 든다. 다음에 오면 같이 보자.','day-watch-together.mp3')],
      clue: '어르신이 공유를 허락한 관심사', decision: '가족과 어르신이 그 이야기로 대화를 시작해요.',
      family: { label: '가족 통화 예시', text: '딸이 다음 방문에 드라마를 같이 보기로 했어요.' },
    },
    saved: {
      lines: [masil('할머니가 요즘 보시는 드라마를 할머니의 기억에만 남겼어요.')],
      clue: '어르신만 볼 수 있는 저장을 선택함', decision: '이 기억은 다음에 할머니와 대화할 때 활용해요.',
      choices: [action('기억 지우기', 'private')],
    },
    private: {
      lines: [masil('알겠어요. 우리 둘이 나눈 이야기로 간직할게요.', 'voice-interest-private.mp3')],
      clue: '어르신이 공유를 원하지 않으심', decision: '그 자리에서 대화를 계속해요.',
    },
    call: {
      lines: [elder('오늘은 딸 목소리가 좀 듣고 싶네.'), masil('따님께 지금 통화하고 싶다고 전해드릴까요?')],
      clue: '통화하고 싶다는 본인 말씀', decision: '연락을 원하시는지 확인해요.',
      choices: [action('지금 통화하고 싶다고 전해요', 'called'), action('조금 이따 이야기해요', 'private')],
    },
    called: {
      lines: [masil('따님에게 통화하고 싶다고 전했어요.')], clue: '어르신이 통화 요청 전달을 허락함', decision: '가족 화면에 통화 요청을 전해요.',
      family: { label: '통화 요청', text: '어머니가 딸 목소리를 듣고 싶다고 하셨어요.', call: true },
    },
  },
  calendar: {
    label: '안부와 일정',
    goal: '가족이 남긴 안부는 다음 대화에서 묻고, 나온 일정은 어르신이 확인해요.',
    start: {
      lines: [], clue: '다음 대화에서 물어볼 질문', decision: '가족이 남긴 문장이 있으면 다음 안부에 덧붙여요.',
      family: { label: '다음 안부에 물어보기', text: '오늘 점심은 잘 드셨는지 여쭤봐 줘.', actions: [action('가족 질문 남기기', 'queued')] },
    },
    queued: {
      lines: [masil('다음 안부에 점심을 잘 드셨는지 여쭤볼게요.')], clue: '가족 질문이 저장됨', decision: '다음 대화 차례를 기다려요.',
      family: { label: '안부 질문을 남겼어요', text: '다음 대화에서 점심을 잘 드셨는지 여쭤볼 예정이에요.' },
      choices: [action('다음 대화 듣기', 'ask')],
    },
    ask: {
      lines: [masil('할머니, 오늘 점심은 잘 챙겨 드셨어요?', 'voice-family-question.mp3'), elder('응, 잘 먹었어. 이번 금요일 두 시에 동네 모임도 있다.', 'voice-elder-meeting.mp3'), masil('금요일 오후 두 시, 동네 모임을 가족 일정에 적어드릴까요?', 'voice-schedule-ask.mp3')],
      clue: '금요일 오후 2시 동네 모임', decision: '어르신에게 날짜와 공유 범위를 확인해요.',
      choices: [action('날짜 맞아요. 가족에게도 남겨요', 'shared'), action('내 일정에만 남겨요', 'private')],
    },
    shared: {
      lines: [masil('금요일 오후 두 시 동네 모임으로 가족 달력에 적어두었어요.', 'voice-schedule-saved.mp3')],
      clue: '어르신이 금요일 2시와 공유를 확인함', decision: '어르신과 가족 달력에 표시해요.',
      family: { label: '가족 일정', text: '금요일 오후 2시 · 동네 모임' },
    },
    private: {
      lines: [masil('금요일 오후 두 시, 할머니 일정에만 적어둘게요.')],
      clue: '어르신이 자신만 볼 일정을 원하심', decision: '어르신 달력에 표시해요.',
    },
  },
};

export function audioFor(scene) {
  return scene.audio ?? scene.lines.flatMap(line => line.audio ? [line.audio] : []);
}
