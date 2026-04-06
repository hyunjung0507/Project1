# 창문형 에어컨 설치 안내 PWA

> 모바일 우선 한국어 웹앱 — 고객이 단계별 입력만으로 설치 가능 여부, 필요 키트/모델, 영상 가이드를 바로 확인할 수 있습니다.

---

## 📂 파일 구조

```
index.html          메인 PWA (6단계 설치 흐름)
qr.html             배포 URL QR 코드 생성 페이지
manifest.json       PWA 매니페스트
css/style.css       전체 스타일 (모바일 우선 반응형)
js/app.js           상태 관리 + 계산 로직 + 렌더링
images/
  window-measure.png   2단계 창문 측정 다이어그램
  sill-depth.png       4단계 창틀 깊이 측정 가이드
  split-window-kit.png 5단계 분할 창문 안내 이미지
```

---

## ✅ 구현된 기능

### 화면 흐름 (8개 스크린)
| 스크린 | 내용 |
|--------|------|
| `screen-0` | 시작/소개 화면 |
| `screen-model` | **모델 그룹 선택** (A·B·C·D) |
| `screen-1` | 창문 유형 선택 (미닫이/여닫이) |
| `screen-casement-block` | 여닫이 선택 시 설치 불가 안내 화면 |
| `screen-2` | 창문 가로·세로 입력 + 실시간 검증 |
| `screen-3` | 제품 유형(일반/미니) + 높이 범위 선택 |
| `screen-4` | 창틀 깊이 선택 + b·c 치수 입력 |
| `screen-5` | 창문 환경 선택 (4종 카드) |
| `screen-6` | **결과 화면** (설치 가능 여부 + 키트 + 영상) |

### 모델 그룹 정의
| 그룹 | 분류 | 모델 |
|------|------|------|
| A | 정속형/인버터 | PWA-2100, PWA-2200, PWA-2250, PWA-3200, PWA-3250 |
| B | 프리미엄 | PWA-3400, PWA-3500, PWA-3600, PWA-3650, PWA-M3500, PWA-3301BE2 |
| C | 듀얼인버터 | PWA-3100, PWA-3300, PWA-3300BE |
| D | 하이브리드 | PHA-M3240BE, PHA-M3600BE2 |

### 설치 조건 자동 판별 로직
1. **기본 설치**: a ≤ 2.3cm AND b ≥ 2cm (창틀 깊이 2cm 이상)
2. **두꺼운 창틀** (A, C 그룹 전용): 1.2cm ≤ a ≤ 2.3cm
3. **모든 창틀**: c ≥ 1.2cm AND b ≥ 1cm (창틀 깊이 2cm 미만 조건)
4. **나무 창틀**:
   - a ≥ 1.5cm → 나무 창틀 영상
   - b ≥ 1cm AND c ≥ 1.2cm → 모든 창틀(통합) 영상

### 추가 키트 노출 규칙
- 분할 창문 선택 시 **항상** 키트 필요
- 일반 제품 높이 **≥ 148cm** 또는 미니 제품 높이 **≥ 132cm** 시 키트 필요

### B/D 그룹 예외 처리
- **두 번째 설치 브라켓 안내 완전 비노출** (프리미엄/하이브리드 전용)
- 프리미엄 안내 문구: "동봉된 볼트만으로 모든 창틀 방법 설치 가능"

### 유튜브 영상 매핑

**그룹 A, C (정속형/인버터/듀얼인버터)**
| 버튼 | URL |
|------|-----|
| 🎬 일반 설치 방법 | https://www.youtube.com/watch?v=QY1geCxHO3Q |
| 🧱 두꺼운 창틀 설치법 | https://www.youtube.com/watch?v=DQyIik9sZ4w |
| 📏 추가 키트(긴 창문) 설치 | https://www.youtube.com/watch?v=MFG_7RdLFaE |
| 🪵 나무 창틀 설치법 | https://www.youtube.com/watch?v=re__v4lfV8A |
| 📺 모든 창틀 통합 가이드 | https://www.youtube.com/watch?v=BBqEtUb5Occ |

**그룹 B, D (프리미엄/하이브리드)**
| 버튼 | URL |
|------|-----|
| 🎬 프리미엄 기본 설치 | https://youtu.be/iWDHJ82y7U4 |
| 📏 프리미엄 추가 키트(긴 창문) | https://youtu.be/BqgmeJjWYcg |
| 🪵 프리미엄 나무 창틀 설치 | https://www.youtube.com/watch?v=I8R860SVuIo |
| 📺 프리미엄 통합 가이드 | https://www.youtube.com/watch?v=oaVrZpyJ3jc |

### 결과 공유 버튼
- `navigator.share` 지원 기기: 네이티브 공유 시트 실행 (리다이렉션 없음)
- 지원 안 할 경우: 클립보드에 결과 요약+URL 복사
- 공유 취소(AbortError) 시: 아무 동작 없음 (메인 이동 절대 방지)

---

## 🔧 서비스 센터
- **설치 문의**: 1588-1336

---

## 🚀 배포 방법
1. **Publish 탭**에서 배포 → 자동으로 공개 URL 생성
2. `/qr.html` 접속 → 배포 URL QR 코드 인쇄 가능

---

## 📌 미구현 / 추후 개선 사항
- 분할 창문 가이드 이미지 고화질 교체 (`images/split-window-kit.png`)
- 창틀 깊이 측정 다이어그램 고화질 교체 (`images/sill-depth.png`)
- 두꺼운 창틀(thick) 선택 시 BD 그룹 추가 안내 세분화
- 치수 입력 없이 두꺼운 창틀 선택만 한 경우 영상 fallback 정책 고도화
- 서비스워커 캐싱 전략 추가 (완전 오프라인 PWA)
