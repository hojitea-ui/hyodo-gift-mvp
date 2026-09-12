# 기술 명세서 — 용돈박스+결합상품 경쟁 상품 분석 대시보드

> 이 문서는 [PRD.md](./PRD.md)에서 정의한 MVP("경쟁 상품 분석 대시보드")를 어떻게 구현할지를 다룬다.

## 1. 설계 원칙

- **1인 로컬 도구다.** 회원가입/로그인/서버 DB/다중 사용자 동시성 같은 것은 만들지 않는다.
- **백엔드를 두지 않는다.** 파일 업로드 → 파싱 → 분석 → 저장을 전부 브라우저 안에서 처리한다.
  - 이유: 조사 데이터가 외부 서버로 나갈 필요가 없고, 인프라/배포 비용과 복잡도가 가장 낮다.
- **나중에 커질 걸 미리 설계하지 않는다.** URL 크롤링, 서버 DB, 다중 사용자, 원가 시뮬레이션은 Out of Scope이므로 지금 확장 포인트를 만들어두지 않는다. 필요해지면 그때 별도 스펙(상품 구성 시뮬레이터 MVP 등)으로 다룬다.

---

## 2. 전체 아키텍처

```
[사용자]
   │  CSV/XLSX 파일 업로드
   ▼
┌─────────────────────────────────────────┐
│           브라우저 (Next.js App)          │
│                                           │
│  1. 파일 파싱 (papaparse / xlsx)          │
│  2. 스키마 검증 (zod)                     │
│  3. localStorage 저장                     │
│  4. 분석 함수 (순수 함수, lib/analysis.ts) │
│  5. 대시보드 렌더링 (React + Recharts)     │
└─────────────────────────────────────────┘
```

- 서버 왕복이 없으므로 정적 사이트로도 배포 가능하지만, 이번 과제는 배포가 필수는 아니다 (PRD 0절, 9절 참고).
- 개발 중에는 `npm run dev`로 로컬(`http://localhost:3000`)에서만 사용해도 충분하다.

---

## 3. 기술 스택

| 영역 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | Next.js 16 (App Router) + TypeScript | 페이지 라우팅, 빌드/배포가 표준화되어 있고 확장 시(랜딩페이지 등) 재사용 가능 |
| 스타일 | Tailwind CSS v4 | 빠른 대시보드 UI 작업에 적합 |
| CSV 파싱 | `papaparse` | 브라우저에서 CSV 파싱 표준 |
| 엑셀 파싱 | `xlsx` (SheetJS), **CDN 패치 빌드 사용** | 일반 npm 레지스트리의 `xlsx` 최신 버전은 알려진 취약점이 있어, SheetJS가 공식 배포하는 CDN tarball(`https://cdn.sheetjs.com/xlsx-<버전>/xlsx-<버전>.tgz`)을 `package.json` 의존성으로 직접 지정해 회피한다 |
| 스키마 검증 | `zod` | 업로드 데이터의 필수 컬럼/타입 검증 |
| 차트 | `recharts` | React 친화적, 히스토그램/바차트 구현 간단 |
| 저장소 | `localStorage` | 서버 없이 새로고침 후에도 데이터 유지. 데이터 규모(수십~수백 행)에 5MB 제한으로 충분 |
| 배포 | 로컬 실행만으로 충분 (PRD 0절, 9절) | 1인 도구이자 과제 채점 기준상 배포 자체가 필수는 아님 |

> 위 버전(Next.js 16, xlsx CDN 패치 빌드)은 이전 옥 지압봉 단독 버전을 구현하면서 실제로 확인된 값이라, 이번엔 스캐폴딩 단계부터 이 조합으로 바로 시작한다.

---

## 4. 데이터 모델

### 4.1 업로드 파일 컬럼 스키마

| 컬럼명 (한글 헤더) | 필드명 | 타입 | 필수 | 설명 |
|---|---|---|---|---|
| 상품명 | `name` | string | ✅ | |
| 판매처 | `platform` | string | ✅ | 예: 네이버, 쿠팡, 아이디어스, 자사몰 |
| 가격 | `price` | number | ✅ | 원 단위 숫자만 (콤마/원 문자 제거 후 파싱) |
| 용돈박스형태 | `boxType` | string | ✅ | 예: 봉투형, 케이스형, 카드형, 기타 (자유 입력, 값 자체를 강제하지 않고 빈도 집계에만 사용) |
| 결합상품유형 | `combinationType` | string | ✅ | 예: 지압봉, 화장품, 건강식품, 기타 (자유 입력) — 이번 MVP는 용돈박스 단독 상품은 조사 대상에서 제외하므로 항상 값이 있어야 한다 |
| 구성 | `composition` | string | ⬜ | 예: "용돈박스 1개 + 지압봉 1개 + 파우치 + 설명서" (`+` 또는 `,`로 구분) |
| 재질 | `material` | string | ⬜ | 결합상품의 재질 (있는 경우) — 예: 지압봉이면 옥/합성수지/기타 |
| 사이즈 | `size` | string | ⬜ | |
| 리뷰수 | `reviewCount` | number | ⬜ | |
| 평점 | `rating` | number | ⬜ | |
| URL | `url` | string | ⬜ | |
| 비고 | `memo` | string | ⬜ | |

- 헤더명은 한글 그대로 인식하고, 내부적으로 위 필드명에 매핑한다.
- 필수 컬럼이 없거나 `가격`이 숫자로 파싱되지 않는 행은 "오류 행"으로 분리해 업로드 미리보기 화면에서 알려주고, 나머지 정상 행만 반영한다.
- `용돈박스형태`/`결합상품유형` 모두 값 자체를 열거형으로 강제하지 않는다 (조사하다 보면 예상 못 한 값이 나올 수 있음) — 대신 F4 분석에서 등장한 값 그대로 빈도 집계한다.

### 4.2 zod 스키마 (개념 코드)

```ts
// lib/schema.ts
import { z } from "zod";

export const ProductSchema = z.object({
  name: z.string().min(1),
  platform: z.string().min(1),
  price: z.number().positive(),
  boxType: z.string().min(1),
  combinationType: z.string().min(1),
  composition: z.string().optional(),
  material: z.string().optional(),
  size: z.string().optional(),
  reviewCount: z.number().optional(),
  rating: z.number().optional(),
  url: z.string().optional(),
  memo: z.string().optional(),
});

export type Product = z.infer<typeof ProductSchema>;
```

### 4.3 저장 포맷 (localStorage)

- key: `hyodo-gift-mvp:products`
- value: `Product[]`를 JSON 문자열로 저장
- 업로드 시 기존 데이터를 **덮어쓸지 / 추가할지** 사용자가 선택 (기본값: 덮어쓰기)

---

## 5. 분석 로직 (`lib/analysis.ts`)

모두 순수 함수로 작성해 테스트하기 쉽게 한다.

### 5.1 가격 통계
```ts
function getPriceStats(products: Product[]): {
  min: number; max: number; mean: number; median: number;
}
```

### 5.2 가격 구간 분포 (히스토그램)
- 가격 범위를 기준으로 균등 구간(예: 5,000원 단위 또는 최소~최대를 8구간으로 등분)으로 나눠 구간별 상품 개수 집계.
```ts
function getPriceHistogram(products: Product[], bucketSize?: number): { range: string; count: number }[]
```

### 5.3 결합상품·구성 공통점 분석
- `boxType`, `combinationType` 같은 단일 값 필드는 값별 빈도(그룹 카운트)로 집계 — "용돈박스 형태별로 어떤 결합상품이 많은지" 같은 교차 분석에도 재사용한다.
- `composition` 문자열은 `+`, `,`, `/` 기준으로 토큰화 → 공백 제거 → 빈도 집계 → 등장 빈도 내림차순 정렬.
```ts
function getFieldFrequency<K extends keyof Product>(products: Product[], field: K): { value: string; count: number }[]
function getCrossFrequency(products: Product[], fieldA: "boxType", fieldB: "combinationType"): { boxType: string; combinationType: string; count: number }[]
function getTopCompositionTokens(products: Product[], topN?: number): { token: string; count: number; ratio: number }[]
```

### 5.4 비교 테이블 데이터
- 원본 `Product[]`를 그대로 사용, 정렬/필터(가격/용돈박스형태/결합상품유형)는 React 상태(클라이언트 사이드)로 처리 (별도 분석 함수 불필요).

---

## 6. 화면 구성

### 6.1 라우트/파일 구조 (App Router)
```
app/
  page.tsx              # 업로드 상태 없으면 업로드 화면, 있으면 대시보드 렌더링
  layout.tsx
components/
  UploadPanel.tsx        # 파일 선택, 파싱, 미리보기, 오류행 안내
  dashboard/
    DashboardView.tsx        # 요약 카드 + 차트 + 비교 테이블 컨테이너
    PriceSummaryCards.tsx
    PriceHistogramChart.tsx
    CompositionInsights.tsx  # 용돈박스형태/결합상품유형 빈도 + 교차표 + 구성 토큰 랭킹
    ProductTable.tsx
lib/
  schema.ts
  parseFile.ts           # CSV/XLSX -> Product[] (+ 오류 리스트)
  analysis.ts
  storage.ts              # localStorage read/write 래퍼
```

> 이전 옥 지압봉 단독 버전에서 실제로 이 구조(App Router 라우팅 대신 `components/`에 화면 컴포넌트를 모아두는 방식)로 구현했고 잘 동작했으므로 그대로 재사용한다.

### 6.2 화면 흐름
1. **첫 진입**: `localStorage`에 데이터 있으면 바로 대시보드, 없으면 업로드 화면.
2. **업로드 화면**: 파일 드래그/선택 → 파싱 → 미리보기 테이블(정상 행 / 오류 행 구분) → "대시보드 보기" 버튼.
3. **대시보드 화면**:
   - 상단: 가격 요약 카드 (최저/최고/평균/중앙값, 상품 수)
   - 가격 히스토그램 차트
   - 결합상품 인사이트: 용돈박스형태 빈도, 결합상품유형 빈도, 용돈박스형태×결합상품유형 교차표, 구성 토큰 랭킹
   - 하단: 전체 상품 비교 테이블 (정렬/필터: 판매처, 가격 범위, 용돈박스형태, 결합상품유형)
   - 우상단: "새 파일 업로드" / "데이터 초기화" 버튼

---

## 7. 파일 파싱 처리 (`lib/parseFile.ts`)

```ts
async function parseFile(file: File): Promise<{
  products: Product[];
  errors: { row: number; reason: string }[];
}>
```

- 확장자가 `.csv`면 `papaparse`, `.xlsx`/`.xls`면 `xlsx`로 분기.
- 헤더를 한글 → 내부 필드명 매핑 테이블로 변환.
- `가격`, `리뷰수`, `평점` 등 숫자 컬럼은 콤마·통화기호·공백만 제거한 뒤 `Number()` 변환한다. 실패 시 해당 행을 errors에 담고 전체 업로드는 막지 않는다(부분 성공 허용).
- **지난 버전에서 겪은 버그를 재발시키지 않기 위한 주의사항**: 숫자 파싱 시 콤마/원/공백 "이외의 문자"를 무시하고 이어붙이면 안 된다. 예를 들어 "1~2"처럼 범위로 적힌 값을 `~`만 무시하고 붙이면 "12"로 잘못 파싱된다. 콤마/원/공백만 제거하고 그래도 숫자가 아니면(`Number()`가 `NaN`을 반환하면) 정직하게 파싱 실패로 처리해 해당 값은 "값 없음"으로 남긴다.

---

## 8. 비기능 구현 메모

- **성능**: 데이터 규모가 수십~수백 행 수준이므로 별도 가상화(virtualization) 없이 일반 테이블 렌더링으로 충분.
- **에러 처리**: 파싱 실패, 필수 컬럼 누락은 사용자에게 구체적으로 "몇 번째 행, 어떤 이유"로 안내한다. 시스템 에러(콘솔 에러 등)로만 남기지 않는다.
- **테스트**: `lib/analysis.ts`, `lib/parseFile.ts`는 순수 함수 위주이므로 Vitest로 유닛 테스트 작성 (샘플 CSV 픽스처 기반).

---

## 9. 배포/실행 방법 & 과제 제출 형태

- **이 프로젝트는 AI 에이전트 교육 과정 과제이며, 채점 기준은 "GitHub 저장소 코드 열람"이다. 별도 배포(라이브 URL)는 요구되지 않는다.**
  - (참고: 같은 과정의 다른 과제인 `backend_homework`(하루 출석체크 앱)는 실제 동작하는 공개 URL이 필요한 루브릭이라 이것과 기준이 다르다. 혼동하지 않도록 구분한다.)
- 따라서 배포는 진행하지 않고, 대신 **채점자가 로컬에서 바로 실행해볼 수 있도록 README를 충실히 작성**하는 데 집중한다.
- README에 포함할 내용:
  - 프로젝트 개요 (PRD 요약: 무엇을, 왜 만들었는지 — 옥 지압봉 단독 → 용돈박스+지압봉 → 용돈박스+결합상품으로 컨셉이 바뀐 배경도 짧게 언급)
  - 실행 방법: `npm install` → `npm run dev` → `localhost:3000` 접속
  - 샘플 데이터: 바로 업로드해볼 수 있는 예시 CSV 파일(`sample-data/competitors-sample.csv`)을 저장소에 포함해, 채점자가 직접 파일을 조사하지 않아도 기능을 확인할 수 있게 한다.
  - 주요 화면 스크린샷 (업로드 화면, 대시보드 화면)
  - 폴더 구조 및 핵심 로직 위치 안내 (`lib/analysis.ts` 등 — 코드 리뷰 편의)
- 로컬 실행이 채점의 핵심 경로이므로, 별도 환경변수나 외부 서비스 키 없이 `npm install` 직후 바로 동작해야 한다.
- (선택) 여러 기기에서 접근하고 싶어지거나 과정 외 용도로 계속 쓰고 싶어지면, 그때 Vercel 등에 배포하는 걸 고려한다 — 채점 요건은 아니다.

---

## 10. 향후 확장 시 고려사항 (지금은 구현하지 않음)

- URL 붙여넣기 자동 수집: 플랫폼별(네이버/쿠팡/아이디어스) 페이지 구조가 달라 크롤러를 사이트별로 따로 만들어야 하고, 차단·약관 이슈도 있어 별도 과제로 분리.
- 서버 DB 도입: 여러 기기에서 데이터를 공유하거나, 사업 파트너와 함께 봐야 할 때 Supabase 등으로 교체 고려.
- 다중 사용자/공유 링크: 파트너나 투자자에게 대시보드를 공유해야 할 시점에 인증 없는 읽기전용 공유 링크 기능 추가 고려.
- 용돈박스 단독 상품까지 조사 범위 확장: 이번엔 "용돈박스+결합상품"으로만 좁혔지만, 나중에 단독 시장 규모도 궁금해지면 별도 조사/스키마로 다룬다.
- 재질(material) 빈도 분석: 재질은 결합상품유형마다 의미가 달라(예: 지압봉은 옥/합성수지, 화장품은 해당 없음) 결합상품유형과 묶어서 봐야 의미가 있다. 이번 MVP는 단순 빈도 집계 범위에서 제외하고, 데이터 자체는 계속 수집(`material` 필드 유지)해두었다가 결합상품유형별 서브 분석이 필요해지면 별도로 다룬다.

---

## 11. 구현 순서 (제안)

1. Next.js + TypeScript + Tailwind 프로젝트 스캐폴딩
2. `lib/schema.ts`, `lib/parseFile.ts` 구현 + 샘플 CSV로 파싱 검증
3. `lib/storage.ts` (localStorage 래퍼) 구현
4. 업로드 화면 (UploadPanel) 구현
5. `lib/analysis.ts` 구현 (가격 통계, 히스토그램, 용돈박스형태·결합상품유형 빈도/교차표)
6. 대시보드 화면 (요약 카드 → 차트 → 테이블 순으로 구현)
7. 전체 흐름 수동 테스트 (샘플 경쟁 상품 데이터로 업로드 → 대시보드 확인)

> [[prefers-incremental-build-not-full-mvp-dump]]에 따라, 이 순서를 한 세션에 몰아서 구현하지 않고 위 1~7단계를 각각 작은 단위로 나눠 진행하며 매 단계 확인을 받는다.

---
