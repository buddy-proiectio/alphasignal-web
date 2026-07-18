# <img src="public/logo.svg" width="36" height="36" align="center" /> AlphaSignal (알파시그널)

> **우리는 지속가능하고 깨끗한 금융 정보 제공을 추구합니다.**

알파시그널은 미국 주식 시장에 참여하는 개인 투자자들을 위해 오염되지 않은 1차 출처 데이터와 AI 분석 결과를 투명하게 제공하는 프리미엄 데이터 리포트 웹 애플리케이션입니다.

---

## 🚀 주요 기능 및 특징

1. **AI 기반 정밀 분석 리포트**: 자체 개발한 AI 알고리즘이 미국 연준 유동성, 금리, 매크로 지표, SEC 공시 및 핵심 외신 뉴스를 수집하고 가공하여 군더더기 없이 나열합니다.
2. **원문과 번역의 실시간 매칭**: 정보의 왜곡과 번역 오류를 차단하기 위해 실시간 영어 원문을 선제공한 후 정밀한 국문 번역본을 대조 포맷으로 매칭하여 제공합니다.
3. **로컬 타임존 기반 다국어 지원**: 한국 시간 (KST) 및 현지 로컬 시간대를 완벽하게 연동하여 날짜 정합성을 유지합니다.
4. **반응형 웹 공유 기능**: Web Share API를 완벽 지원하여 모바일 및 태블릿 브라우저에서 손쉬운 원클릭 전파가 가능합니다.
5. **SEO & AEO 최적화**: 구글 서치 콘솔 및 네이버 서치어드바이저 수집 최적화와 함께, AI 답변 엔진이 팩트 데이터를 쉽게 인용할 수 있도록 시맨틱 HTML5 구조와 구조화 데이터를 설계했습니다.

---

## 🛠 기술 스택

- **Framework**: Next.js 16.2 (App Router, Turbopack)
- **Styling**: Tailwind CSS v4, Vanilla CSS
- **Content Handling**: MDX (next-mdx-remote)
- **State & Theme**: next-themes
- **Validation**: TypeScript, ESLint, Prettier
- **Testing**: Vitest

---

## 📦 폴더 구조

- `app/`: Next.js App Router 기반 페이지 구성 (메인, 아카이브, 개별 리포트 상세, 공지사항, 지원 및 후원 안내 등)
- `content/`: 리포트, 공지사항 등 정적/동적 파싱용 마크다운 및 MDX 원본 파일 관리
- `src/components/`: 글로벌 헤더, 푸터, 디스클레이머, 테마 토글, 로컬 타임존 변환기 등 재사용 컴포넌트
- `src/services/`: GitHub API 연동 및 데이터 패치 인터페이스
- `src/utils/`: 미 증시 휴장일 연산기, 데이터 포맷터 등 비즈니스 로직 유틸리티
- `public/`: 브랜드 SVG 및 PNG 로고, 파비콘 등 정적 에셋

---

## 🏃 실행 및 빌드 방법

### 의존성 설치
```bash
pnpm install
```

### 로컬 개발 서버 실행
```bash
npm run dev
```

### 프로덕션 빌드 및 정적 페이지 생성
```bash
npm run build
```

### 타입 검사 및 린터 실행
```bash
npm run type-check
npm run lint
```
