-- Supabase에서 실행할 SQL 스크립트
-- 여행지 테이블 생성 및 샘플 데이터 삽입

-- 1. 테이블 생성 (이미 존재하는 경우 건너뛰기)
CREATE TABLE IF NOT EXISTS travels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    region VARCHAR(50) NOT NULL,
    budget VARCHAR(20) NOT NULL,
    description TEXT,
    image VARCHAR(500),
    rating DECIMAL(2,1) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    is_popular BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    highlights TEXT[] DEFAULT '{}',
    best_time VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 샘플 데이터 삽입
INSERT INTO travels (name, country, region, budget, description, image, rating, review_count, is_popular, tags, highlights, best_time) VALUES
('교토', '일본', '아시아', '중간', '전통적인 일본 문화를 경험할 수 있는 아름다운 고도입니다. 수많은 사찰과 전통 건축물이 있습니다.', '/placeholder.svg', 4.8, 1245, true, 
 ARRAY['문화', '역사', '사찰', '전통'], 
 ARRAY['기온 거리', '후시미 이나리 신사', '아라시야마 대나무 숲', '기요미즈데라'], 
 '3-5월, 10-11월'),

('파리', '프랑스', '유럽', '고예산', '사랑의 도시 파리에서 로맨틱한 여행을 즐기세요. 에펠탑, 루브르 박물관 등 명소가 가득합니다.', '/placeholder.svg', 4.7, 2156, true,
 ARRAY['로맨틱', '문화', '예술', '미식'], 
 ARRAY['에펠탑', '루브르 박물관', '샹젤리제 거리', '몽마르트 언덕'], 
 '4-6월, 9-10월'),

('뉴욕', '미국', '북미', '고예산', '잠들지 않는 도시 뉴욕에서 다양한 문화와 엔터테인먼트를 경험하세요.', '/placeholder.svg', 4.6, 1876, true,
 ARRAY['도시', '문화', '쇼핑', '엔터테인먼트'], 
 ARRAY['타임스퀘어', '센트럴파크', '자유의 여신상', '브루클린 브릿지'], 
 '4-6월, 9-11월'),

('발리', '인도네시아', '아시아', '저예산', '열대 천국 발리에서 휴식과 모험을 동시에 즐기세요. 아름다운 해변과 문화가 조화를 이룹니다.', '/placeholder.svg', 4.5, 987, false,
 ARRAY['해변', '휴양', '문화', '모험'], 
 ARRAY['울루와투 사원', '타나롯 사원', '우붓 원숭이 숲', '테가라랑 라이스 테라스'], 
 '5-9월'),

('로마', '이탈리아', '유럽', '중간', '영원한 도시 로마에서 고대 역사와 현대 문화를 체험하세요.', '/placeholder.svg', 4.7, 1543, true,
 ARRAY['역사', '문화', '건축', '미식'], 
 ARRAY['콜로세움', '바티칸 박물관', '트레비 분수', '판테온'], 
 '4-6월, 9-10월'),

('시드니', '호주', '오세아니아', '고예산', '아름다운 항구도시 시드니에서 현대적인 도시 생활과 자연을 만끽하세요.', '/placeholder.svg', 4.4, 765, false,
 ARRAY['도시', '해변', '현대', '자연'], 
 ARRAY['시드니 오페라 하우스', '하버 브리지', '본다이 해변', '로열 보타닉 가든'], 
 '12-2월, 3-5월'),

('방콕', '태국', '아시아', '저예산', '활기찬 동남아시아의 중심지 방콕에서 맛있는 음식과 풍부한 문화를 경험하세요.', '/placeholder.svg', 4.3, 1234, false,
 ARRAY['미식', '문화', '쇼핑', '야시장'], 
 ARRAY['왓 포 사원', '그랜드 팰리스', '짜뚜짝 시장', '카오산 로드'], 
 '11-3월'),

('리우데자네이루', '브라질', '남미', '중간', '삼바와 축제의 도시 리우에서 열정적인 브라질 문화를 체험하세요.', '/placeholder.svg', 4.2, 543, false,
 ARRAY['축제', '해변', '문화', '음악'], 
 ARRAY['코파카바나 해변', '예수상', '슈가로프 산', '산타 테레사'], 
 '12-3월'),

('카이로', '이집트', '아프리카', '저예산', '고대 문명의 신비로운 도시 카이로에서 피라미드와 스핑크스를 만나보세요.', '/placeholder.svg', 4.1, 432, false,
 ARRAY['역사', '고대', '문명', '모험'], 
 ARRAY['기자 피라미드', '스핑크스', '이집트 박물관', '나일강'], 
 '10-4월'),

('산토리니', '그리스', '유럽', '고예산', '에게해의 보석 산토리니에서 로맨틱한 석양과 아름다운 건축물을 감상하세요.', '/placeholder.svg', 4.9, 876, true,
 ARRAY['로맨틱', '석양', '건축', '휴양'], 
 ARRAY['오이아 마을', '피라 타운', '레드 비치', '아크로티리 유적'], 
 '4-6월, 9-10월');

-- 3. 인덱스 생성 (성능 향상을 위해)
CREATE INDEX IF NOT EXISTS idx_travels_region ON travels(region);
CREATE INDEX IF NOT EXISTS idx_travels_budget ON travels(budget);
CREATE INDEX IF NOT EXISTS idx_travels_is_popular ON travels(is_popular);
CREATE INDEX IF NOT EXISTS idx_travels_name ON travels(name);
CREATE INDEX IF NOT EXISTS idx_travels_country ON travels(country);

-- 4. RLS (Row Level Security) 활성화 (선택사항)
ALTER TABLE travels ENABLE ROW LEVEL SECURITY;

-- 5. 공개 읽기 정책 생성
CREATE POLICY "Anyone can read travels" ON travels
  FOR SELECT USING (true);

-- 6. 인증된 사용자만 쓰기 가능 정책 (선택사항)
-- CREATE POLICY "Authenticated users can insert travels" ON travels
--   FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- CREATE POLICY "Authenticated users can update travels" ON travels
--   FOR UPDATE USING (auth.role() = 'authenticated');

-- CREATE POLICY "Authenticated users can delete travels" ON travels
--   FOR DELETE USING (auth.role() = 'authenticated');
