# TouchSensor

FRORE 제품의 물리 터치 인터랙션을 웹에서 재현한다. 버튼을 누르는 동안만 LED 전원을 켜고 손을 떼면 끈다.

- SensorMoon의 현재 센서값 아래, `space-6` 간격으로 배치
- 버튼 문구는 "터치 센서", 상태 문구는 "누르는 동안 켜짐"
- 버튼은 사각, radius 0, 테두리 없음, 최소 높이 44px, 패딩 `space-3 space-6`
- 기본 상태는 `--ink` 채움과 `--surface` 글자, 누르는 동안 `--brand` 채움과 `--on-brand` 글자
- 포인터 캡처를 사용해 버튼 밖에서 손을 떼어도 OFF 처리
- Space와 Enter 키 입력을 지원하고 `aria-pressed`로 누름 상태 전달
- 전원 변경 실패 시 이전 상태로 되돌리고 "전원 변경 실패, 다시 시도"를 `t-caption` `--danger`로 표시
- `setLedPower` 요청은 순서대로 처리해 빠른 입력에서도 최종 상태가 뒤집히지 않게 한다
