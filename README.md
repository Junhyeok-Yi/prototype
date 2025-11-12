# SmartHome Level Checker (스마트홈 레벨 체커)

Make.com Webhook을 위한 단일 페이지 웹 프론트엔드입니다. 스마트홈 앱 스크린샷을 업로드하고 레벨 정보를 받아 표시합니다.

## 기능

- 📸 **다중 이미지 업로드**: 여러 스크린샷을 한 번에 업로드
- 🖼️ **이미지 미리보기**: 업로드 전 썸네일 확인
- 🔗 **Webhook URL 저장**: localStorage에 자동 저장
- 📤 **두 가지 전송 형식**: Multipart (Binary) 또는 Base64 JSON
- ⏱️ **타임아웃 처리**: 30초 요청 타임아웃
- 🎨 **반응형 디자인**: 모바일 및 데스크톱 지원
- ♿ **접근성**: ARIA 레이블 및 키보드 네비게이션 지원
- 🧪 **Mock 모드**: 네트워크 없이 UI 테스트 가능

## 빠른 시작

### 기본 사용 (단일 HTML 파일)

1. `index.html` 파일을 브라우저에서 열기
2. Make.com Webhook URL 입력
3. 스크린샷 이미지 업로드 (드래그 앤 드롭 또는 파일 선택)
4. 전송 형식 선택 (Multipart 또는 Base64 JSON)
5. "전송" 버튼 클릭

**주의**: CORS 정책으로 인해 일부 브라우저에서 직접 Webhook 호출이 차단될 수 있습니다. 이 경우 아래 프록시 서버를 사용하세요.

### 프록시 서버 사용 (CORS 문제 해결)

CORS 오류가 발생하는 경우:

```bash
# 의존성 설치
npm install

# 프록시 서버 실행
npm start
# 또는
node server.js
```

서버가 `http://localhost:3000`에서 실행됩니다.

**프록시 사용 방법**:
- UI에서 Webhook URL 대신 프록시 URL 사용:
  ```
  http://localhost:3000/proxy?target=<encoded_webhook_url>
  ```
- 예시: `http://localhost:3000/proxy?target=https%3A%2F%2Fhook.integromat.com%2F...`

## 파일 구조

```
.
├── index.html          # 메인 애플리케이션 (단일 파일)
├── server.js           # 선택적 프록시 서버 (CORS 문제 시)
├── package.json        # Node.js 의존성 관리
└── README.md          # 이 파일
```

## 데이터 형식

### 요청 형식

#### Multipart (Binary) 모드
```
POST /webhook
Content-Type: multipart/form-data

files[]: [File Blob 1]
files[]: [File Blob 2]
...
```

#### Base64 JSON 모드
```json
POST /webhook
Content-Type: application/json

{
  "files": [
    {
      "name": "screenshot1.png",
      "content_base64": "iVBORw0KGgoAAAANS..."
    },
    {
      "name": "screenshot2.png",
      "content_base64": "iVBORw0KGgoAAAANS..."
    }
  ]
}
```

### 응답 형식 (Make.com Webhook에서 반환)

```json
{
  "level_name": "Intermediate",
  "medal_url": "https://example.com/medals/silver.png",
  "recommended_contents": [
    {
      "title": "스마트 조명 자동화",
      "url": "https://example.com/1"
    },
    {
      "title": "TV 음성 제어 팁",
      "url": "https://example.com/2"
    },
    "에너지 절약 루틴 만들기"  // 문자열도 지원
  ],
  "devices": ["Smart TV", "Robot Vacuum"],  // 선택적
  "notes": "LLM-derived level based on screenshots"  // 선택적
}
```

**필드 설명**:
- `level_name` (필수): 레벨 이름 (예: "Beginner", "Intermediate", "Advanced")
- `medal_url` (선택): 메달 이미지 URL
- `recommended_contents` (선택): 추천 콘텐츠 배열
  - 문자열 또는 `{title: string, url?: string}` 객체
- `devices` (선택): 감지된 디바이스 목록
- `notes` (선택): 추가 메모

## Make.com Webhook 설정

### CORS 헤더 설정 (직접 호출 시)

Make.com Webhook Response 모듈에 다음 헤더를 추가하세요:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Content-Type
Access-Control-Allow-Methods: POST, OPTIONS
```

### 예상되는 요청 처리

1. **Multipart 모드**: `files[]` 필드에서 파일 배열 받기
2. **Base64 모드**: JSON 본문의 `files` 배열에서 `content_base64` 디코딩
3. **응답**: 위 형식의 JSON 반환

## 기술 스택

- **프론트엔드**: 순수 HTML/CSS/JavaScript (번들러 없음)
- **프록시 서버** (선택적): Node.js + Express + Multer
- **브라우저 지원**: 모든 모던 브라우저 (Chrome, Firefox, Safari, Edge)

## 개발 및 테스트

### Mock 모드

UI 테스트를 위해 네트워크 요청 없이 샘플 응답을 표시할 수 있습니다:

1. "Mock 응답 사용" 체크박스 활성화
2. "전송" 버튼 클릭
3. 샘플 데이터가 표시됩니다

### 로컬 테스트

1. `index.html`을 브라우저에서 직접 열기
2. Mock 모드로 UI 확인
3. 실제 Webhook URL로 테스트 (CORS 허용된 경우)
4. 필요시 프록시 서버 사용

## 문제 해결

### CORS 오류

**증상**: "CORS 오류가 발생했습니다" 메시지

**해결 방법**:
1. 프록시 서버 사용 (`server.js` 실행)
2. 또는 Make.com Webhook Response에 CORS 헤더 추가

### 타임아웃 오류

**증상**: "요청 시간이 초과되었습니다 (30초)" 메시지

**해결 방법**:
- Make.com 시나리오의 실행 시간 확인
- 큰 이미지 파일 크기 확인 (압축 고려)

### JSON 파싱 오류

**증상**: "Invalid JSON from webhook" 메시지

**해결 방법**:
- Make.com Webhook Response 모듈이 JSON을 반환하는지 확인
- Content-Type 헤더가 `application/json`인지 확인

## 라이선스

MIT

## 참고

이 프로젝트는 Make.com Webhook과의 통합 테스트를 위한 프로토타입입니다. 프로덕션 환경에서 사용하기 전에 보안 및 에러 처리를 추가로 검토하세요.
