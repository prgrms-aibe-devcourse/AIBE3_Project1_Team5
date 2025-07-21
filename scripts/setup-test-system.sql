-- 테스트 시스템을 위한 데이터베이스 스키마 생성

-- 1. 대화 로그 테이블
CREATE TABLE IF NOT EXISTS conversation_logs (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_input TEXT NOT NULL,
    detected_intent VARCHAR(100) NOT NULL,
    ai_response TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    test_scenario VARCHAR(255),
    intent_analysis_details JSONB,
    response_quality JSONB,
    user_satisfaction JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 테스트 실행 결과 테이블
CREATE TABLE IF NOT EXISTS test_results (
    id SERIAL PRIMARY KEY,
    test_run_id VARCHAR(255) NOT NULL,
    scenario_name VARCHAR(255) NOT NULL,
    success BOOLEAN NOT NULL,
    execution_time INTEGER NOT NULL,
    actual_intents TEXT[],
    actual_responses TEXT[],
    issues TEXT[],
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 시스템 성능 메트릭 테이블
CREATE TABLE IF NOT EXISTS system_metrics (
    id SERIAL PRIMARY KEY,
    metric_date DATE NOT NULL,
    total_conversations INTEGER DEFAULT 0,
    intent_accuracy DECIMAL(5,2) DEFAULT 0,
    response_quality DECIMAL(5,2) DEFAULT 0,
    user_satisfaction DECIMAL(5,2) DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    average_response_time INTEGER DEFAULT 0,
    error_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 실패 패턴 추적 테이블
CREATE TABLE IF NOT EXISTS failure_patterns (
    id SERIAL PRIMARY KEY,
    pattern_type VARCHAR(100) NOT NULL,
    pattern_description TEXT NOT NULL,
    frequency INTEGER DEFAULT 1,
    examples TEXT[],
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_conversation_logs_session_id ON conversation_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_timestamp ON conversation_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_intent ON conversation_logs(detected_intent);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_test_scenario ON conversation_logs(test_scenario);

CREATE INDEX IF NOT EXISTS idx_test_results_run_id ON test_results(test_run_id);
CREATE INDEX IF NOT EXISTS idx_test_results_timestamp ON test_results(timestamp);
CREATE INDEX IF NOT EXISTS idx_test_results_success ON test_results(success);

CREATE INDEX IF NOT EXISTS idx_system_metrics_date ON system_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_failure_patterns_type ON failure_patterns(pattern_type);

-- 6. 뷰 생성 - 일일 성과 요약
CREATE OR REPLACE VIEW daily_performance_summary AS
SELECT 
    DATE(timestamp) as date,
    COUNT(*) as total_conversations,
    COUNT(DISTINCT session_id) as unique_sessions,
    AVG(CASE WHEN (response_quality->>'isGood')::boolean THEN 100 ELSE 0 END) as avg_response_quality,
    AVG(CASE WHEN (user_satisfaction->>'continued')::boolean THEN 100 ELSE 0 END) as avg_user_satisfaction,
    AVG(CASE WHEN intent_analysis_details->>'processingTime' IS NOT NULL 
             THEN (intent_analysis_details->>'processingTime')::integer 
             ELSE 0 END) as avg_response_time,
    COUNT(CASE WHEN intent_analysis_details->>'error' IS NOT NULL THEN 1 END) as error_count
FROM conversation_logs
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- 7. 뷰 생성 - 의도 분류 정확도
CREATE OR REPLACE VIEW intent_accuracy_summary AS
SELECT 
    detected_intent,
    COUNT(*) as total_count,
    COUNT(CASE WHEN (intent_analysis_details->'keywordResult'->>'intent') = 
                    (intent_analysis_details->'gptResult'->>'intent') THEN 1 END) as accurate_count,
    ROUND(
        COUNT(CASE WHEN (intent_analysis_details->'keywordResult'->>'intent') = 
                        (intent_analysis_details->'gptResult'->>'intent') THEN 1 END) * 100.0 / 
        COUNT(*), 2
    ) as accuracy_percentage
FROM conversation_logs
WHERE intent_analysis_details IS NOT NULL
GROUP BY detected_intent
ORDER BY accuracy_percentage DESC;

-- 8. 뷰 생성 - 실패 패턴 분석
CREATE OR REPLACE VIEW failure_pattern_analysis AS
SELECT 
    response_quality->>'reason' as failure_reason,
    COUNT(*) as frequency,
    ARRAY_AGG(DISTINCT user_input) as examples
FROM conversation_logs
WHERE (response_quality->>'isGood')::boolean = false
GROUP BY response_quality->>'reason'
ORDER BY frequency DESC;

-- 9. 함수 생성 - 메트릭 계산
CREATE OR REPLACE FUNCTION calculate_daily_metrics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    metric_date DATE,
    total_conversations BIGINT,
    intent_accuracy DECIMAL,
    response_quality DECIMAL,
    user_satisfaction DECIMAL,
    completion_rate DECIMAL,
    average_response_time DECIMAL,
    error_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        target_date,
        COUNT(*)::BIGINT,
        COALESCE(AVG(CASE WHEN (cl.intent_analysis_details->'keywordResult'->>'intent') = 
                                (cl.intent_analysis_details->'gptResult'->>'intent') 
                         THEN 100 ELSE 0 END), 0)::DECIMAL,
        COALESCE(AVG(CASE WHEN (cl.response_quality->>'isGood')::boolean THEN 100 ELSE 0 END), 0)::DECIMAL,
        COALESCE(AVG(CASE WHEN (cl.user_satisfaction->>'continued')::boolean THEN 100 ELSE 0 END), 0)::DECIMAL,
        COALESCE(AVG(CASE WHEN sp.collection_status = 'complete' THEN 100 ELSE 0 END), 0)::DECIMAL,
        COALESCE(AVG(CASE WHEN cl.intent_analysis_details->>'processingTime' IS NOT NULL 
                         THEN (cl.intent_analysis_details->>'processingTime')::integer 
                         ELSE 0 END), 0)::DECIMAL,
        COALESCE(COUNT(CASE WHEN cl.intent_analysis_details->>'error' IS NOT NULL THEN 1 END) * 100.0 / 
                 COUNT(*), 0)::DECIMAL
    FROM conversation_logs cl
    LEFT JOIN session_parameters sp ON cl.session_id = sp.session_id
    WHERE DATE(cl.timestamp) = target_date;
END;
$$ LANGUAGE plpgsql;

-- 10. 자동 메트릭 업데이트 함수
CREATE OR REPLACE FUNCTION update_system_metrics()
RETURNS VOID AS $$
DECLARE
    metrics_record RECORD;
BEGIN
    -- 어제 메트릭 계산
    SELECT * INTO metrics_record FROM calculate_daily_metrics(CURRENT_DATE - INTERVAL '1 day');
    
    -- 기존 레코드 업데이트 또는 새로 삽입
    INSERT INTO system_metrics (
        metric_date, total_conversations, intent_accuracy, response_quality,
        user_satisfaction, completion_rate, average_response_time, error_rate
    ) VALUES (
        metrics_record.metric_date, metrics_record.total_conversations, 
        metrics_record.intent_accuracy, metrics_record.response_quality,
        metrics_record.user_satisfaction, metrics_record.completion_rate,
        metrics_record.average_response_time, metrics_record.error_rate
    ) ON CONFLICT (metric_date) DO UPDATE SET
        total_conversations = EXCLUDED.total_conversations,
        intent_accuracy = EXCLUDED.intent_accuracy,
        response_quality = EXCLUDED.response_quality,
        user_satisfaction = EXCLUDED.user_satisfaction,
        completion_rate = EXCLUDED.completion_rate,
        average_response_time = EXCLUDED.average_response_time,
        error_rate = EXCLUDED.error_rate,
        updated_at = NOW();
        
    -- 실패 패턴 업데이트
    INSERT INTO failure_patterns (pattern_type, pattern_description, frequency, examples)
    SELECT 
        'response_quality' as pattern_type,
        fp.failure_reason as pattern_description,
        fp.frequency::integer,
        fp.examples
    FROM failure_pattern_analysis fp
    ON CONFLICT (pattern_type, pattern_description) DO UPDATE SET
        frequency = EXCLUDED.frequency,
        examples = EXCLUDED.examples,
        last_seen = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 11. 제약 조건 추가
ALTER TABLE system_metrics ADD CONSTRAINT unique_metric_date UNIQUE (metric_date);
ALTER TABLE failure_patterns ADD CONSTRAINT unique_pattern UNIQUE (pattern_type, pattern_description);

-- 12. 권한 설정 (필요시)
-- GRANT SELECT, INSERT, UPDATE ON conversation_logs TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON test_results TO authenticated;
-- GRANT SELECT ON daily_performance_summary TO authenticated;
-- GRANT SELECT ON intent_accuracy_summary TO authenticated;
-- GRANT SELECT ON failure_pattern_analysis TO authenticated;

-- 13. 초기 데이터 삽입 (선택사항)
-- INSERT INTO system_metrics (metric_date) VALUES (CURRENT_DATE) ON CONFLICT DO NOTHING;

COMMENT ON TABLE conversation_logs IS '대화 로그 및 분석 결과를 저장하는 테이블';
COMMENT ON TABLE test_results IS '자동 테스트 실행 결과를 저장하는 테이블';
COMMENT ON TABLE system_metrics IS '일일 시스템 성능 메트릭을 저장하는 테이블';
COMMENT ON TABLE failure_patterns IS '실패 패턴을 추적하는 테이블';
COMMENT ON VIEW daily_performance_summary IS '일일 성과 요약 뷰';
COMMENT ON VIEW intent_accuracy_summary IS '의도 분류 정확도 요약 뷰';
COMMENT ON VIEW failure_pattern_analysis IS '실패 패턴 분석 뷰';