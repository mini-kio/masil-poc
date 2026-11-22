// The scroll story and the family-app demo play the same events in the same order.
export const daughterReads = [
  { callStage:'delivered', speaker:'가족 소식', audio:'sound-family-message.mp3', text:'딸의 휴대폰에 “담에 오면 내하고 같이 보자 캐라.”라는 소식이 도착했어요.' },
  { callStage:'noticed', speaker:'딸', audio:'day-daughter-notice.mp3', text:'어? 엄마도 그 드라마 보고 계셨네!' },
];

export const connectCall = [
  { callStage:'dialing', speaker:'딸', audio:'day-daughter-dial.mp3', text:'엄마한테 전화해 봐야겠다.' },
  { callStage:'ringing', speaker:'전화벨', audio:'sound-incoming-call.mp3', text:'따르릉. 할머니 휴대폰에 딸의 전화가 와요.' },
  { callStage:'answered', speaker:'할머니', audio:'day-grandma-answer.mp3', text:'여보세요? 우리 딸이가?' },
];

export function isConnected(stage) {
  return stage === 'answered' || stage === 'talking' || stage === 'listening';
}

export function isCallSound(speaker) {
  return speaker === '가족 소식' || speaker === '전화벨';
}

export function callLineAt(lines, elapsed, duration) {
  let end = 0;
  for (const line of lines) {
    end += duration(line.audio);
    if (elapsed < end) return line;
  }
  return lines.at(-1);
}
