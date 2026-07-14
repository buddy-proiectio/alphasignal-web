# Web Design Refactoring Design Spec

## Overview

리포트 중심의 콘텐츠 사이트 alphasignal-web의 전체적인 UI/UX를 리팩토링합니다. 라이트 모드 기본, 다크모드 지원, 클린 미니멀 디자인, Pretendard 폰트 사용, 가독성 최우선을 목표로 합니다.

## Goals

1. **가독성 최우선**: 2시간 분량의 긴 리포트도 부담 없이 읽을 수 있는 타이포그래피
2. **클린 미니멀**: 불필요한 시각 요소 제거, 콘텐츠에 집중
3. **다크모드 지원**: 라이트 모드 기본, 사용자 토글 및 시스템 설정 감지
4. **일관된 경험**: 영문/한글 구분 없이 자연스러운 텍스트 나열
5. **광고와 콘텐츠 분리**: 광고가 리포트를 침범하지 않는 구조

## Tech Stack Changes

| Before | After |
|--------|-------|
| Hand-written CSS | Tailwind CSS |
| CSS Custom Properties (dark-only) | CSS Variables + next-themes |
| Inter + Outfit (Google Fonts @import) | Pretendard (CDN or next/font) |
| No theme switching | next-themes (class-based) |
| Inline React styles | Tailwind utility classes |

## Architecture

### File Structure

```
alphasignal-web/
├── app/
│   ├── globals.css          # Tailwind directives + CSS variables (minimal)
│   ├── layout.tsx           # Root layout with ThemeProvider
│   ├── page.tsx             # Home page (server component)
│   ├── notice/
│   │   ├── page.tsx         # Notice listing
│   │   └── [slug]/
│   │       └── page.tsx     # Notice detail (MDX)
│   └── signal/
│       └── [lang]/
│           └── [type]/
│               └── [date]/
│                   └── page.tsx  # Signal detail (MDX)
├── src/
│   ├── components/
│   │   ├── Header.tsx           # Top navigation
│   │   ├── FilterBar.tsx        # Category filter (All, Alpha, Premarket, Notice)
│   │   ├── ContentList.tsx      # Content list container
│   │   ├── ContentCard.tsx      # Individual content card
│   │   ├── ThemeToggle.tsx      # Dark mode toggle button
│   │   ├── Analytics.tsx        # Google Analytics (unchanged)
│   │   ├── Sponsorship.tsx      # Donation widget (refactor to Tailwind)
│   │   └── Adsense.tsx          # AdSense placeholder (unchanged)
│   └── services/
│       └── github.ts            # GitHub API service (unchanged)
├── tailwind.config.ts           # Tailwind configuration
├── postcss.config.js            # PostCSS configuration
└── package.json                 # Add tailwindcss, postcss, autoprefixer, next-themes
```

## Color System

### Light Mode (Default)

| Token | Purpose | Value |
|-------|---------|-------|
| `--background` | Page background | `slate-50` (#f8fafc) |
| `--foreground` | Main text | `slate-900` (#0f172a) |
| `--card` | Card background | `white` |
| `--card-hover` | Card hover | `slate-50` |
| `--accent` | Accent (slate blue) | `blue-600` (#2563eb) |
| `--accent-light` | Accent background | `blue-50` |
| `--border` | Borders | `slate-200` (#e2e8f0) |
| `--muted` | Secondary text | `slate-500` (#64748b) |
| `--success` | Success state | `emerald-600` |
| `--warning` | Warning state | `amber-500` |
| `--danger` | Danger state | `red-500` |

### Dark Mode

| Token | Purpose | Value |
|-------|---------|-------|
| `--background` | Page background | `slate-900` (#0f172a) |
| `--foreground` | Main text | `slate-50` (#f8fafc) |
| `--card` | Card background | `slate-800` (#1e293b) |
| `--card-hover` | Card hover | `slate-700` (#334155) |
| `--accent` | Accent | `blue-500` (#3b82f6) |
| `--accent-light` | Accent background | `blue-900/30` |
| `--border` | Borders | `slate-700` |
| `--muted` | Secondary text | `slate-400` |

## Typography

### Font

- **Primary**: Pretendard (Korean/English optimized)
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Loading**: CDN or `next/font` (replacing blocking `@import`)
- **Stack**: `"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, sans-serif`

### Type Scale

| Purpose | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 (Page title) | `text-3xl` (30px) | 700 | 1.2 |
| H2 (Section title) | `text-2xl` (24px) | 600 | 1.3 |
| H3 (Card title) | `text-lg` (18px) | 600 | 1.4 |
| Body (Content) | `text-base` (16px) | 400 | 1.6 |
| Small (Secondary) | `text-sm` (14px) | 400 | 1.5 |
| Caption (Date/tag) | `text-xs` (12px) | 500 | 1.4 |

### Readability Considerations

- **Line height**: Report body uses `leading-relaxed` (1.625) for comfortable long-form reading
- **Paragraph spacing**: `space-y-4` (16px) for visual breathing room
- **Max width**: Content area `max-w-3xl` (768px) to maintain 60-80 characters per line
- **Color contrast**: `slate-900` on `slate-50` → WCAG AAA level (15:1+)

## Layout Components

### Header

```
┌─────────────────────────────────────────────────────┐
│  Logo/사이트명                    [🌞/🌙] 테마 토글  │
└─────────────────────────────────────────────────────┘
```

- **Height**: `h-16` (64px)
- **Background**: `bg-white/80 backdrop-blur-sm` (light), `bg-slate-900/80` (dark)
- **Content**: Left: Logo/site name, Right: Dark mode toggle
- **Position**: `sticky top-0 z-50` → Fixed on scroll
- **Border**: Bottom `border-b border-slate-200`

### FilterBar

```
┌─────────────────────────────────────────────────────┐
│  [All]  [Alpha Signals]  [Premarket]  [Notice]      │
└─────────────────────────────────────────────────────┘
```

- **Height**: `h-12` (48px)
- **Background**: `bg-white` (light), `bg-slate-800` (dark)
- **Content**: Horizontally scrollable filter buttons
- **Filter Buttons**:
  - Default: `text-slate-600 hover:text-slate-900 hover:bg-slate-100`
  - Active: `text-blue-600 bg-blue-50 font-medium`
  - Transition: `transition-colors duration-150`
- **Position**: `sticky top-16 z-40` → Fixed below header

### ContentList

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ ContentCard 1                               │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ ContentCard 2                               │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ... (광고 영역 삽입 가능)                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- **Max width**: `max-w-4xl mx-auto` (896px)
- **Padding**: `px-4 py-6`
- **Gap**: `space-y-4` (16px)
- **Ad slots**: `my-8` separation between content

### ContentCard

```
┌─────────────────────────────────────────────────────┐
│  [Alpha Signals]  │  2024-01-15                     │
│                                                     │
│  Report Title Here                                  │
│  Brief description or excerpt from the report...    │
│                                                     │
│  ─────────────────────────────────────────────────  │
│  📊 Premarket  │  🕐 5 min read  │  →               │
└─────────────────────────────────────────────────────┘
```

- **Background**: `bg-white rounded-xl border border-slate-200`
- **Hover**: `hover:border-slate-300 hover:shadow-sm transition-all duration-150`
- **Padding**: `p-5`
- **Content structure**:
  - Top: Category badge + date
  - Middle: Title + summary
  - Bottom: Meta info (category, read time, arrow)

## Dark Mode Implementation

### Setup

- **Library**: next-themes
- **Method**: class-based (`attribute="class"`)
- **Default**: system preference detection
- **Storage**: localStorage persistence

### ThemeProvider Configuration

```tsx
// app/layout.tsx
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### CSS Variable Switching

```css
:root {
  --background: 248 39% 97%;  /* slate-50 */
  --foreground: 222 47% 11%;  /* slate-900 */
  /* ... */
}

.dark {
  --background: 222 47% 11%;  /* slate-900 */
  --foreground: 210 40% 98%;  /* slate-50 */
  /* ... */
}
```

### ThemeToggle Component

- **Location**: Header right side
- **Icons**: Sun (light), Moon (dark)
- **Interaction**: Click to toggle
- **Accessibility**: `aria-label="테마 전환"`
- **Animation**: `transition-colors duration-200`

## Responsive Design

### Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `sm` | 640px~ | Mobile landscape |
| `md` | 768px~ | Tablet |
| `lg` | 1024px~ | Desktop |
| `xl` | 1280px~ | Wide desktop |

### Mobile (<640px)

- **Header**: Compact, `h-14` (56px)
- **Filter bar**: Horizontal scroll, compact buttons
- **Content cards**: Full width, `px-4` padding
- **Max width**: Not applied (full viewport)

### Tablet (768px~1024px)

- **Header**: Desktop height
- **Filter bar**: All categories visible
- **Content cards**: `max-w-2xl` (672px)

### Desktop (1024px~)

- **Header**: `max-w-4xl mx-auto` (896px)
- **Filter bar**: Full width
- **Content cards**: `max-w-4xl mx-auto` (896px)

### Mobile-First Approach

- Base styles are for mobile
- Media queries add styles for larger screens
- Tailwind prefixes: `sm:`, `md:`, `lg:`

## Scope

### Changes

1. `app/globals.css` → Replace with Tailwind directives + CSS variables
2. `app/layout.tsx` → Add ThemeProvider, load Pretendard font
3. `app/page.tsx` → Refactor for new layout
4. `src/components/PremiumDashboard.tsx` → Split into Header, FilterBar, ContentList, ContentCard
5. `package.json` → Add tailwindcss, postcss, autoprefixer, next-themes
6. Add `tailwind.config.ts` and `postcss.config.js`

### Preserved

- `app/notice/` route structure
- `app/signal/` route structure
- `src/services/github.ts` logic
- MDX rendering approach
- `src/components/Analytics.tsx`
- `src/components/Adsense.tsx`

## Success Criteria

1. ✅ Light mode as default with clean, minimal aesthetic
2. ✅ Dark mode toggle with system preference detection
3. ✅ Pretendard font loading (non-blocking)
4. ✅ Long-form reports readable with optimized typography
5. ✅ Responsive across mobile, tablet, desktop
6. ✅ Ads separated from content, not intruding on reading experience
7. ✅ Categories: All, Alpha Signals, Premarket, Notice
8. ✅ English/Korean text displayed seamlessly
9. ✅ WCAG AA+ color contrast in both modes
10. ✅ Smooth theme transition without layout shift
