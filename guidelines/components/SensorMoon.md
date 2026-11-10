# SensorMoon (FRORE 조명 오브젝트)

검은 바탕 정가운데에 떠 있는 FRORE 조명. 센서값에 따라 밝기와 주변 빛이 바뀌는 실제 제품의 디지털 쌍둥이다. 컴포넌트명과 `moon` CSS 클래스는 기존 API 호환을 위해 유지한다.

- 이미지 `public/images/lamp.png` (800×800, 투명 배경). `<div class="moon"><img src="/images/lamp.png" alt=""></div>`
- 위치: 화면 정가운데. 감싸는 `<section aria-label="조명 상태">`는 min-height 70vh, flex 세로 정렬로 가로 세로 가운데. 소제목 없음
- level = clamp((value − SENSOR_MIN) / (SENSOR_MAX − SENSOR_MIN), 0, 1) → `.moon`의 `--level` 스타일 변수
- 전원 ON 상태에서는 센서값이 없거나 최솟값이어도 조명이 보이도록 level을 최소 0.35로 유지
- 밝기 0.25 + 0.75 × level, 빛 drop-shadow level × 48px `--moon-glow` (styles.md의 `.moon` 그대로)
- 전원 OFF: `data-power="off"` → 밝기 0.12, 흑백, 빛 없음
- 위아래 10px, 6초 주기로 천천히 떠 있음. reduced-motion이면 멈춤
- 조명 아래 space-6 간격으로 현재값 `t-value` (천 단위 콤마, 값 없으면 "—")
- 현재값 아래에 TouchSensor를 배치한다
- `role="img"`, `aria-label="조명 밝기 NN%"`, 꺼지면 "조명 꺼짐"
- 응용: 같은 규격(정사각, 투명 배경) 이미지로 바꾸면 다른 제품 오브제로 쓸 수 있다
