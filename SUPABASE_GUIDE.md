# Supabase 연동 가이드

## 1. Supabase 프로젝트 설정

### 1.1 Supabase 대시보드에서 SQL 실행

1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. 좌측 메뉴에서 "SQL Editor" 클릭
4. `supabase-setup.sql` 파일의 내용을 복사하여 실행

### 1.2 환경 변수 확인

`.env.local` 파일에 다음 환경 변수가 설정되어 있는지 확인:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 2. 테이블 구조

### travels 테이블 필드

- `id`: 고유 식별자 (자동 증가)
- `name`: 여행지 이름
- `country`: 국가
- `region`: 지역 (아시아, 유럽, 북미, 남미, 아프리카, 오세아니아)
- `budget`: 예산 (저예산, 중간, 고예산)
- `description`: 여행지 설명
- `image`: 이미지 URL
- `rating`: 평점 (0-5)
- `review_count`: 리뷰 개수
- `is_popular`: 인기 여행지 여부
- `tags`: 태그 배열
- `highlights`: 주요 명소 배열
- `best_time`: 최적 방문 시기
- `created_at`: 생성일시
- `updated_at`: 수정일시

## 3. 주요 기능

### 3.1 데이터 페칭

- 컴포넌트 마운트 시 Supabase에서 자동으로 데이터 로드
- 로딩 상태 및 에러 처리 포함

### 3.2 검색 및 필터링

- 텍스트 검색 (이름, 국가, 설명)
- 지역별 필터링
- 예산별 필터링
- 인기 여행지 필터링

### 3.3 뷰 모드

- 그리드 뷰: 카드 형태로 표시
- 리스트 뷰: 목록 형태로 표시

### 3.4 즐겨찾기

- 하트 아이콘 클릭으로 즐겨찾기 추가/제거
- 로컬 상태로 관리 (향후 DB 연동 가능)

## 4. 개발 모드 실행

```bash
npm run dev
```

## 5. 추가 개선사항

### 5.1 이미지 업로드

- Supabase Storage 활용하여 이미지 업로드 기능 추가
- 여행지 이미지를 실제 이미지로 교체

### 5.2 사용자 인증

- 즐겨찾기 기능을 사용자별로 관리
- 리뷰 작성 기능 추가

### 5.3 실시간 업데이트

- Supabase Realtime 활용하여 실시간 데이터 업데이트

### 5.4 페이지네이션

- 대용량 데이터 처리를 위한 페이지네이션 구현

## 6. 문제 해결

### 6.1 환경 변수 오류

- `.env.local` 파일이 존재하는지 확인
- 환경 변수 이름이 정확한지 확인 (`NEXT_PUBLIC_` 접두사 필요)

### 6.2 Supabase 연결 오류

- Supabase URL과 API 키가 올바른지 확인
- 네트워크 연결 상태 확인

### 6.3 RLS (Row Level Security) 오류

- SQL 스크립트의 정책이 올바르게 적용되었는지 확인
- 필요시 RLS 비활성화 후 테스트
