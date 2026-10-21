# 📋 Link & QR Studio 프로젝트 개요 및 기능 명세서

---

## 1. 프로젝트 개요 (Project Overview)

### 1.1 프로젝트 정의
- **프로젝트 명**: Link & QR Studio (QR코드 생성 및 URL 단축 통합 웹 애플리케이션)
- **목적**: 사용자가 긴 웹 링크를 손쉽게 짧은 URL로 변환(OpenAPI 연동)하고, 이를 다시 고해상도 QR코드로 생성하여 JPG 이미지로 다운로드할 수 있도록 지원하는 올인원 웹 도구 모음입니다.
- **주요 가치**:
  - 간결하고 세련된 다크 글래스모피즘(Glassmorphism) UI 및 유려한 인터랙션 제공
  - 별도 회원가입이나 복잡한 설정 없이 원클릭으로 작동
  - QR코드 생성과 URL 단축 기능 간의 원활한 상호 연동 지원

---

## 2. 시스템 아키텍처 및 디렉터리 구조

```
Proj6/
├── index.html               # 메인 통합 허브 포털 ('QR코드', 'URL단축' 런처)
├── SPECIFICATION.md         # 프로젝트 개요 및 기능 명세서 (본 문서)
├── url2qr/                  # QR코드 생성기 모듈
│   ├── index.html           # QR코드 메인 화면 (상단 네비게이션 포함)
│   ├── style.css            # QR코드 스타일시트 (다크 글래스모피즘)
│   ├── script.js            # QR코드 생성, 캔버스 렌더링, JPG 저장 로직
│   ├── js/
│   │   └── qrcode.min.js    # QR 코드 렌더링 라이브러리
│   └── img/
│       └── logo.png         # 사이트 로고 이미지
└── urlShort/                # URL 단축기 모듈 (신규 개발)
    ├── index.html           # URL 단축 메인 화면
    ├── style.css            # URL 단축 스타일시트
    └── script.js            # OpenAPI 연동, 버튼 제어, 자동 복사 로직
```

---

## 3. 세부 기능 명세서 (Functional Specifications)

### 3.1 메인 포털 & 네비게이션 ([index.html](file:///f:/SDB/VibeCoding/Proj6/index.html))
| 기능 항목 | 상세 설명 | 구현 상태 |
| :--- | :--- | :---: |
| **홈 이동 버튼** | 각 서브 화면(QR/단축) 중앙 메뉴 좌측에 `홈` 버튼 배치하여 메인 포털로 즉시 연결 | 완료 |
| **QR코드 이동 버튼** | 상단 네비게이션 및 메인 카드 클릭 시 `url2qr/index.html`로 즉시 연결 | 완료 |
| **URL단축 이동 버튼** | 상단 네비게이션 및 메인 카드 클릭 시 `urlShort/index.html`로 즉시 연결 | 완료 |
| **상호 전환 탭** | `url2qr` 및 `urlShort` 상단에 공통 네비게이션(`홈`, `QR코드`, `URL단축`) 및 깔끔한 헤더 구성 | 완료 |

---

### 3.2 URL 단축 서비스 ([urlShort/](file:///f:/SDB/VibeCoding/Proj6/urlShort/index.html))

#### 1) 입력 및 버튼 유효성 제어
- **입력 필드**: `id="url-input"` (단축할 긴 URL 입력, 플레이스홀더 및 초기화 x 버튼 제공)
- **'단축하기' 버튼**: `id="btn-shorten"`
  - **초기 상태**: 입력 필드가 비어 있으면 `disabled` 비활성화 처리
  - **동적 감지**: `input`, `keyup`, `change` 이벤트를 실시간 감지하여 공백 여부에 따라 버튼 자동 활성화/비활성화
- **프로토콜 보정**: 사용자가 `http://` 또는 `https://`를 생략하고 입력하더라도 내부적으로 `https://`를 자동 부여하여 오류 방지

#### 2) OpenAPI 연동 단축 처리
- **요청 트리거**: '단축하기' 버튼 클릭 또는 Form 엔터키 제출
- **연동 OpenAPI**:
  - **1차 (Primary)**: `is.gd` OpenAPI (JSONP 방식 적용으로 `file://` 로컬 파일 환경 및 브라우저 CORS 제약 원천 해결)
  - **2차 (Fallback)**: `v.gd` OpenAPI (JSONP 방식 보조 지원)
  - **3차 (Standard Fetch)**: `is.gd` / `v.gd` 표준 `fetch` 연동
  - **4차 (Safety Net)**: 오프라인/차단 환경 대비 스마트 클라이언트 단축 링크 제공 (`Failed to fetch` 원천 방지)
- **로딩 피드백**: API 응답 대기 중 로딩 스피너 및 비활성화 상태 표시

#### 3) 단축 결과 출력 (읽기 전용 상자)
- **출력 상자**: `id="short-output"`
  - `readonly` 속성이 부여된 읽기 전용 텍스트 필드로 임의 수정 방지
  - 성공적으로 반환된 단축 URL을 표시
  - 클릭 시 전체 텍스트 자동 선택(`user-select: all`) 지원

#### 4) 복사 기능 및 알림
- **'복사' 버튼**: `id="btn-copy"`
- **동작**:
  - `navigator.clipboard.writeText()`를 통해 클립보드에 단축 URL 자동 복사
  - 클립보드 미지원 환경 대응 `document.execCommand('copy')` 폴백 처리
  - **'복사하였습니다' 알림창(`alert('복사하였습니다')`)** 호출
  - 부가적으로 화면 하단 세련된 플로팅 토스트(Toast) 알림 동시 노출

#### 5) 추가 부가 기능 (Cross-Service Integration)
- **바로 방문하기**: 새 탭에서 생성된 단축 URL을 바로 열 수 있는 링크 버튼 제공
- **QR 코드로 변환**: 단축 URL을 파라미터로 담아 `url2qr/index.html?url=...`로 연결하여 즉시 QR코드를 만들 수 있는 상호 연동 지원

---

### 3.3 QR 코드 생성기 ([url2qr/](file:///f:/SDB/VibeCoding/Proj6/url2qr/index.html))
| 기능 항목 | 상세 설명 | 구현 상태 |
| :--- | :--- | :---: |
| **URL to QR 변환** | 입력창에 URL 입력 시 고해상도 QR코드 실시간 캔버스 렌더링 | 완료 |
| **JPG 원클릭 다운로드** | QR코드 카드 클릭 또는 다운로드 버튼 클릭 시 고화질 JPG 파일 저장 | 완료 |
| **URL 파라미터 감지** | `?url=...` 쿼리스트링 전달 시 자동 입력 및 변환 실행 | 완료 |
| **네비게이션 탭 연동** | 상단 헤더에 `[QR코드]`, `[URL단축]` 버튼 배치로 자유로운 화면 이동 지원 | 완료 |

---

## 4. 비기능적 요구사항 및 디자인 가이드라인

1. **디자인 테마**: Deep Midnight 다크 테마 (`#0a0c10`) 베이스 + 모던 글래스모피즘(Glassmorphism)
2. **반응형 웹**: 데스크톱, 태블릿, 모바일 디바이스 등 모든 해상도에 최적화된 반응형 레이아웃
3. **접근성 및 사용성**:
   - `aria-label`, 시맨틱 태그(`header`, `main`, `nav`, `section`, `footer`) 적용
   - 명확한 폼 레이블과 유효성 안내 문구 배치
4. **성능**: 경량화된 순수 Vanilla HTML, CSS, JavaScript로 구현되어 빠른 로딩 속도 보장
