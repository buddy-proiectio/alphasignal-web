# 구글 및 네이버 검색엔진 등록 & SEO/AEO 가이드

본 문서는 알파시그널 (AlphaSignal) 웹 사이트를 구글 (Google) 및 네이버 (Naver) 검색엔진에 등록하고, 최신 검색 엔진 최적화 (SEO) 및 AI 답변 엔진 최적화 (AEO)를 적용하기 위한 종합 지침서입니다.

---

## 1. 구글 서치 콘솔 (Google Search Console) 등록 절차

구글 검색 결과에 사이트를 노출시키고 색인 상태를 모니터링하기 위한 단계입니다.

### 1단계: 속성 추가 및 소유권 확인
1. [구글 서치 콘솔](https://search.google.com/search-console/about)에 접속하여 로그인합니다.
2. **[속성 추가]**를 클릭한 후, **[URL 접두사]** 또는 **[도메인]** 방식을 선택합니다.
   - *URL 접두사*: `https://alphasignals.co` 입력
   - *도메인*: `alphasignals.co` 입력 (DNS 레코드 설정 필요)
3. 소유권 확인을 위해 구글이 제공하는 메타태그 복사합니다.
   - 복사한 HTML 메타태그 (예: `<meta name="google-site-verification" content="VerificationCode" />`)를 `app/layout.tsx` 파일 내 `<head>` 영역에 아래와 같이 추가합니다:
     ```tsx
     <head>
       <meta name="google-site-verification" content="VerificationCode" />
       ...
     </head>
     ```
4. 등록을 완료하고 서치 콘솔 화면에서 **[확인]**을 누릅니다.

### 2단계: 사이트맵 (Sitemap.xml) 제출
1. Next.js 빌드 시 자동으로 생성되는 사이트맵 주소 (`https://alphasignals.co/sitemap.xml` 또는 `sitemap.ts` 동적 처리 결과물)를 확인합니다.
2. 구글 서치 콘솔의 **[Sitemaps]** 메뉴로 이동합니다.
3. **[새 사이트맵 추가]** 입력란에 `sitemap.xml`을 입력하고 **[제출]**을 클릭합니다.

---

## 2. 네이버 서치어드바이저 (Naver Search Advisor) 등록 절차

국내 검색 포털인 네이버의 로봇 (Yeti)이 사이트를 원활히 수집하도록 유도하는 단계입니다.

### 1단계: 사이트 등록 및 소유권 검증
1. [네이버 서치어드바이저](https://searchadvisor.naver.com/)에 접속하여 로그인한 후 **[웹마스터 도구]**로 이동합니다.
2. 사이트 등록 창에 `https://alphasignals.co`를 입력합니다.
3. **[HTML 태그]** 인증 방식을 선택한 후, 제공되는 초록색 메타태그를 복사합니다.
   - 복사한 태그 (예: `<meta name="naver-site-verification" content="VerificationCode" />`)를 `app/layout.tsx` 파일 내 `<head>` 영역에 삽입합니다.
4. 웹마스터 도구에서 **[소유확인]** 버튼을 클릭하여 승인받습니다.

### 2단계: 사이트맵 및 RSS 제출
1. 네이버 웹마스터 도구 내 **[요청]** -> **[사이트맵 제출]** 메뉴로 이동합니다.
2. 사이트맵 URL 경로에 `sitemap.xml`을 입력하고 제출합니다.
3. RSS 피드가 있을 경우, **[RSS 제출]** 메뉴에 주소 (예: `feed.xml`)를 등록합니다.

---

## 3. SEO 및 AEO (인공지능 답변 엔진 최적화) 가이드라인

최신 검색 서비스들은 LLM (대형 언어 모델) 기반 답변 엔진 (Perplexity, Google Gemini, OpenSearch 등)으로 진화하고 있습니다. 아래 규칙들은 AI 봇이 알파시그널의 신뢰도 높은 데이터를 정확하게 인용하도록 돕습니다.

### ① 시맨틱 HTML5 구조화 (Structure)
- 페이지당 하나의 `<h1>`만 사용하고, 제목 계층 (`<h2>`, `<h3>`)을 엄격히 준수합니다.
- 단순 `<div>` 보다는 `<article>`, `<section>`, `<aside>`, `<time>` 등 의미가 명확한 HTML5 표준 요소를 활용합니다.

### ② JSON-LD 구조화 데이터 적용 (Structured Data)
AEO 로봇이 리포트의 본문 정보를 개체 단위로 이해하도록 JSON-LD 스키마 마크업을 각 리포트 상세 페이지에 심어둡니다:
```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "리포트 제목",
  "datePublished": "ISO 8601 날짜",
  "author": {
    "@type": "Organization",
    "name": "AlphaSignal"
  },
  "publisher": {
    "@type": "Organization",
    "name": "AlphaSignal",
    "logo": {
      "@type": "ImageObject",
      "url": "https://alphasignals.co/logo-light.png"
    }
  },
  "description": "요약문 (excerpt)"
}
```

### ③ 1차 출처 팩트 전달 (AEO 핵심)
- AI 모델은 오역이나 왜곡이 배제된 날것의 1차 데이터 (Hard Data)를 우선적으로 신뢰합니다.
- 알파시그널이 자랑하는 **영어 원문 선제공 및 국문 번역 매칭 구조**는 기계 번역 왜곡을 차단하여 AI 챗봇이 가장 선호하는 색인 대상이 됩니다.
- 텍스트 중간에 인용된 모든 경제 수치는 단위 및 출처 (SEC 공시, Fed 성명서 등)를 생략 없이 정확히 기입하여 데이터 신뢰도를 높여야 합니다.
