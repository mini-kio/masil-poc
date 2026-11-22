import React from 'react';

export function Workshop() {
  return <section className="installation" id="voice-plan" aria-label="자세한 개발 계획">
    <div className="wrap development">
      <h3>자세한 개발 계획</h3>
      <div>
        <details><summary>집 기기와 가족 앱 연결</summary>
          <p>태블릿 웹앱(PWA)과 라즈베리파이(Pi)가 운영 서버에 먼저 HTTPS·WebSocket으로 접속하고, 서버가 등록된 가족에게 소식과 승인 요청을 전달해요. 집 공유기에서 포트를 열 필요가 없어요. 자가 호스팅을 선택하면 집 서버가 인증된 리버스 터널로 연결돼요.</p>
          <p>가족 계정과 주문 확인은 운영 서버에서 맡고, 태블릿 화면과 라즈베리파이 연결 프로그램, 설치 안내는 오픈소스로 공개할 계획이에요. 주문은 품목·금액·배송지·승인을 확인하고 중복 요청을 걸러요. <a href="https://github.com/mini-kio/masil-poc">시연 소스 보기</a></p>
        </details>
        <details open={window.location.hash === '#voice-plan' || undefined}><summary>목소리와 생활음을 함께 이해하는 AI</summary>
          <ol>
            <li><strong>첫 시제품.</strong> OpenAI Realtime API로 한국어 대화와 말 끊기를 시험해요. 생활음 분류기의 단서와 앞선 대화를 함께 보고 다음 확인 질문을 골라요. <a href="https://developers.openai.com/api/docs/guides/realtime-conversations">음성 대화 문서</a></li>
            <li>
              <p><strong>향후 고도화 · 한국어 방언 대화와 끼어들기.</strong> LFM3-Audio-2B 같은 기존 오디오 모델을 마실의 한국어 대화에 맞게 파인튜닝할 계획이에요. AI Hub의 중·노년층 방언 음성과 전사문을 짝지어 강원도·경상도 말투를 정확히 받아쓰도록 학습해요. 두 사람이 주고받은 대화 자료로는 앞서 나온 물건이나 일정을 기억하고 그에 맞게 한국어로 답하는 법을 익혀요. <a href="https://aihub.or.kr/aihubdata/data/view.do?dataSetSn=71517">AI Hub 방언 자료</a> · <a href="https://huggingface.co/LiquidAI/LFM3-Audio-2B">참고 모델</a></p>
              <p>끼어들기는 말이 겹치기 시작한 순간과 바뀐 요청을 표시한 대화 예시를 따로 만들어 연습해요. 마실이 “쌀 두 봉지를…” 하고 안내할 때 할머니가 “아이다, 한 봉만” 하시면, 안내를 멈추고 “한 봉지만 시킬까요?”라고 다시 확인하는 식이에요. 학습에 쓰지 않은 분들의 목소리로 받아쓰기의 글자 오류율, 고친 수량을 반영한 비율, 끼어든 뒤 마실이 말을 멈추기까지 걸린 시간을 학습 전후로 비교해요. 개선을 확인한 모델을 마실의 안부 대화와 음성 주문에 적용해요.</p>
            </li>
            <li><strong>향후 고도화 · 생활 소리와 말투 맥락 잇기.</strong> 방언 대화를 익힌 오디오 모델이 앞선 대화 뒤에 이어지는 쿵 소리, 물 끓는 소리, 한숨과 목소리 크기를 함께 듣고 다음 확인 질문을 고르도록 학습해요. 평소 반찬 이야기 끝의 “괜찮다”는 대화를 이어 가고, 짧은 충격음 직후의 작은 “괜찮다”는 “어디 부딪히셨어요?”라고 먼저 안부를 묻는 식이에요. 글자 전사문만 넣었을 때와 실제 소리·말투까지 함께 넣었을 때를 비교해, TV나 부엌 소음 속에서 꼭 물어봐야 할 순간을 짚어낸 비율과 불필요한 가족 알림이 줄어든 정도를 검증해요.</li>
          </ol>
        </details>
        <details><summary>가족 목소리와 집 안 센서</summary>
          <p>어르신과 목소리를 녹음한 가족이 모두 동의하면, 먼저 마실이라고 밝힌 뒤 익숙한 가족 목소리로 대화할 수 있어요. 이후에는 충격음과 누수 센서 신호도 연결해요. 먼저 어르신께 괜찮으신지 여쭙고, 도움을 요청하시거나 미리 정한 시간 동안 응답이 없으면 가족에게 연락하는 흐름을 시험할 계획이에요.</p>
        </details>
      </div>
    </div>
  </section>;
}

export function Comparison() {
  return <section className="difference" id="comparison" aria-labelledby="compare-title">
    <div className="wrap difference-layout">
      <div className="difference-copy"><p className="difference-topic">기존 돌봄 서비스와 마실</p>
        <h2 id="compare-title">같은 <em>“괜찮다”</em>도<br/>들린 순간에 따라 달라요.</h2>
        <p>많은 돌봄 서비스가 말벗이 되어 주고 가족에게 안부를 전해요. 생활 소리를 감지하거나 장보기를 도와주는 서비스도 있어요.</p>
        <p>마실이 검증하려는 차이는 <strong>실시간 오디오 이벤트 이해</strong>예요. 앞선 대화, 소리가 난 순서, 대답의 말투를 함께 들어요. 그런 다음 무엇을 할지는 어르신께 직접 물어요.</p>
        <details className="reading-links"><summary>비교에 참고한 공개 자료</summary><p><a href="https://www.navercorp.com/media/pressReleasesDetail?seq=30860">기억을 활용하는 안부 대화</a> · <a href="https://www.sensi.ai/product/">생활음 분석 사례</a> · <a href="https://grampai.com/">음성 장보기 사례</a></p></details>
      </div>
      <figure className="decision-score">
        <figcaption>반찬 이야기를 하던 거실</figcaption>
        <div className="score-sound"><i aria-hidden="true"/>쿵 <small>소리가 난 뒤</small></div>
        <blockquote>“괜찮다.”</blockquote>
        <p className="score-question">마실이 물어요<br/><strong>“어디 부딪히셨어요?”</strong></p>
        <dl className="score-answers">
          <div><dt>“뚜껑 떨어뜨렸다.”</dt><dd>반찬 이야기로 돌아가요.</dd></div>
          <div><dt>“딸한테 전화해도.”</dt><dd>가족에게 연락 요청을 전해요.</dd></div>
        </dl>
      </figure>
    </div>
  </section>;
}
