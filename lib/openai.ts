import OpenAI from 'openai';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 120000, // 120초 타임아웃
});

// 여행 파라미터 인터페이스
export interface TravelParameters {
  title?: string;
  destination?: string;
  startDate?: string;  // 여행 시작일 (YYYY-MM-DD)
  endDate?: string;    // 여행 종료일 (YYYY-MM-DD)
  duration?: number;   // 자동 계산된 기간 (일수) - 하위 호환성을 위해 유지
  peopleCount?: number;
  budget?: number;
  transportation?: string;
  accommodation?: string;
  travelStyle?: string;
  collection_status?: 'incomplete' | 'complete' | 'awaiting_confirmation';
}

// 파라미터 수집 상태
export interface ParameterCollectionStatus {
  isComplete: boolean;
  collectedParams: TravelParameters;
  ambiguousParams?: Record<string, string>;
  missingParams: string[];
}

// 일정 아이템 인터페이스
export interface ScheduleItem {
  time: string;
  activity: string;
  location: string;
  duration: string;
  cost?: number;
  currency?: string;
  transportation?: string;
  tips?: string;
}

// 일별 일정 인터페이스
export interface DaySchedule {
  day: number;
  date?: string;
  title: string;
  description: string;
  items: ScheduleItem[];
  totalCost?: number;
  currency?: string;
}

// 개선된 여행 일정 아이템 인터페이스
export interface ImprovedScheduleItem {
  time: string;
  activity: string;
  location: string;
  status: '확정' | '미정' | '예정';
  note?: string;
  cost: number;
  duration?: string;
  transportation?: string;
}

// 개선된 일별 일정 인터페이스
export interface ImprovedDaySchedule {
  day: number;
  date: string;
  title: string;
  items: ImprovedScheduleItem[];
  totalCost: number;
}

// 식사 요약 인터페이스
export interface MealSummary {
  day: string;
  meal: string;
  restaurant: string;
  status: string;
  cost: number;
}

// 비용 분석 인터페이스
export interface CostBreakdown {
  transportation: number;
  accommodation: number;
  meals: number;
  activities: number;
  others: number;
  total: number;
}

// 여행 개요 인터페이스
export interface TravelOverview {
  dates: string;
  people: string;
  transportation: string;
  accommodation: string;
  theme: string;
  budgetRange: string;
}

// 응급 정보 인터페이스
export interface EmergencyInfo {
  hospital: string;
  police: string;
  embassy?: string;
}

// 전체 여행 일정 인터페이스 (개선됨)
export interface TravelPlan {
  title: string;
  destination: string;
  duration: number;
  startDate?: string;
  endDate?: string;
  totalBudget?: number;
  currency?: string;
  overview?: TravelOverview;
  schedule: ImprovedDaySchedule[];
  mealSummary?: MealSummary[];
  costBreakdown?: CostBreakdown;
  tips?: string[];
  requirements?: string[];
  emergencyInfo?: EmergencyInfo;
  originalParams?: any; // 원본 파라미터 (선택사항)
  dbPlanId?: string; // DB 계획 ID (선택사항)
}

// 기존 호환성을 위한 레거시 인터페이스
export interface LegacyTravelPlan {
  title: string;
  destination: string;
  duration: number;
  startDate?: string;
  endDate?: string;
  totalBudget?: number;
  currency?: string;
  schedule: DaySchedule[];
  tips?: string[];
  requirements?: string[];
}

// 프롬프트 템플릿
const PROMPTS = {
  classifyIntent: `
You are an advanced intent classifier for a travel planning assistant powered by GPT-4o. Use your full conversational AI capabilities to understand user intent from context, tone, and implicit meaning.

CONVERSATIONAL UNDERSTANDING:
- Analyze the FULL conversation context, not just keywords
- Understand implicit intent: "대구여행" clearly means user wants to provide a travel title
- Consider conversational flow: if AI just asked for title, user's response is likely the title
- Use contextual reasoning: "대구가고싶다" → travel_start, "대구여행" (after title question) → travel_parameter

Your task is to classify if the user wants to:
1. Start new travel planning (travel_start)
2. Continue existing travel planning conversation (travel_continue)  
3. Provide travel parameters during collection process (travel_parameter)
4. Cancel/stop travel planning (travel_cancel)
5. Resume previous travel planning (travel_resume)
6. Ask general questions unrelated to travel (general)

CRITICAL: Detect travel parameter inputs during collection process:
- ONLY classify as "travel_parameter" if user has EXISTING incomplete travel parameters
- Duration patterns: "2일", "3일", "1박2일", "2박3일", "1주일" → travel_parameter (if existing params)
- Place names: "서울", "부산", "제주", "일본", "도쿄", "파리" → travel_parameter (if existing params)  
- People count: "2명", "혼자", "둘이서", "3명" → travel_parameter (if existing params)
- Budget amounts: "100만원", "50만원", "200만원" → travel_parameter (if existing params)
- Travel styles: "힐링", "액티비티", "문화탐방", "카페투어" → travel_parameter (if existing params)
- Transportation: "비행기", "기차", "버스", "KTX" → travel_parameter (if existing params)
- Accommodation: "호텔", "펜션", "게스트하우스" → travel_parameter (if existing params)

NEW TRAVEL DETECTION:
- If NO existing travel parameters and user mentions travel plans like "도쿄 여행", "제주도 가고싶다", "파리 여행계획" → travel_start
- Travel expressions without existing context should start new planning, not continue parameter collection

Context considerations:
- If user previously had incomplete travel parameters and provides specific travel info, classify as "travel_parameter"
- If NO existing travel parameters, travel-related expressions should be "travel_start"
- Recognize explicit cancellation phrases like "여행 안갈래", "안간다", "취소", "그만", "중단", "멈춰", "안할래"
- Recognize resumption phrases like "계속", "다시", "재개", "진행", "이어서", "계속해줘", "다시 시작"
- When user gives affirmative responses (네, 응, 맞아, 그래, yes, ok, okay, sure, etc.) after being asked about travel continuation, classify as "travel_resume"
- When user explicitly indicates it's NOT travel-related (아니야, 그냥, 일반적인, 단순히, just, no, etc.), classify as "general" and do NOT offer travel continuation
- IMPORTANT: Expressions of hesitation or indecision like "갈지말지 고민", "생각중", "망설임" should be classified as "general", NOT travel requests
- Only classify as travel_start/continue if there's clear intent to plan or get help with travel

Return a JSON object with:
{
  "intent": "travel_start" | "travel_continue" | "travel_parameter" | "travel_cancel" | "travel_resume" | "general",
  "confidence": number (0-1),
  "reasoning": "brief explanation",
  "isTravelRequest": boolean (true for travel_start, travel_continue, travel_parameter, travel_resume),
  "shouldOfferContinue": boolean (false if user explicitly indicates NOT travel-related)
}
`,
  extractParameters: `
You are a travel planning assistant. Extract travel parameters from the user's message.

Extract the following information:
- title (REQUIRED): Travel title/name given by user (examples: "오사카 맛집 탐방", "제주도 힐링 여행", "유럽 배낭여행")
- destination (REQUIRED): The specific place they want to visit
- startDate (REQUIRED): Travel start date in YYYY-MM-DD format (Korean dates like "7월 25일", "8월 3일" should be converted to 2025-07-25, 2025-08-03)
- endDate (REQUIRED): Travel end date in YYYY-MM-DD format (Korean dates like "7월 28일", "8월 7일" should be converted to 2025-07-28, 2025-08-07)
- duration: Automatically calculated from start and end dates (for compatibility)
- peopleCount (REQUIRED): Number of travelers (Korean formats like "2명", "세명", "혼자" should be converted: 혼자=1, 둘=2, 세명=3)
- budget (REQUIRED): Total budget in KRW or specified currency (must be specific amount)
- travelStyle (REQUIRED): Travel style preference (luxury, budget, adventure, cultural, family, romantic, business, etc.)
- transportation (REQUIRED): Preferred transportation mode (flight, train, car, bus, etc.)
- accommodation (REQUIRED): Preferred accommodation type (hotel, hostel, airbnb, resort, guesthouse, etc.)

DESTINATION CHANGE DETECTION:
- If a new destination is mentioned and it's different from any existing destination, mark it as "destinationChanged": true
- Examples of destination change: "일본 대신 제주도로", "파리 말고 런던으로", "도쿄에서 오사카로 변경"

CONVERSATIONAL CONTEXT RULES:
1. ALL 9 required parameters must be present to mark as complete (title, destination, startDate, endDate, peopleCount, budget, travelStyle, transportation, accommodation)
2. USE CONTEXT: If AI just asked for title and user responds with "대구여행", extract it as title
3. Title: Accept ANY user input including simple ones like "대구여행", "제주도", "오사카 여행"
4. Destination must be specific (not just "Europe" or "Asia")
5. StartDate must be a specific date (not "sometime next week")
6. EndDate must be a specific date (not "a few days later")
7. PeopleCount must be a specific number (not "some friends")
8. Budget must have a specific amount (not "reasonable" or "cheap")
9. TravelStyle: Accept ANY travel style description as-is - VERY IMPORTANT: Even unusual or creative travel styles like "격투여행", "음악여행", "카페투어" should be recognized as valid travel styles
10. Transportation: Accept ANY transportation method as-is - do NOT convert (비행기, KTX, 지하철, etc.)
11. Accommodation: Accept ANY accommodation type as-is - do NOT convert (호텔, 펜션, 에어비앤비, etc.)

CRITICAL: If user says "대구 여행일정" or similar, do NOT extract both title and destination. Only extract what they explicitly provided as an answer to a specific question.

Examples of Korean expressions to recognize:
- Start Date: "7월 25일" → startDate: "2025-07-25", "8월 3일" → startDate: "2025-08-03", "내일" → startDate: "2025-07-21", "다음주" → startDate: "2025-07-27"
- End Date: "7월 28일" → endDate: "2025-07-28", "8월 7일" → endDate: "2025-08-07", "2일 후" → endDate: "2025-07-23", "일주일 후" → endDate: "2025-07-28"
- People: "2명" → peopleCount: 2, "혼자" → peopleCount: 1, "둘이서" → peopleCount: 2, "세명" → peopleCount: 3
- Budget: "100만원" → budget: 1000000, "50만원" → budget: 500000, "200만원" → budget: 2000000
- TravelStyle: Accept any travel style description as-is, including creative/unusual styles (여유로운 휴양, 카페투어, 격투여행, 음악여행, 액티비티, 문화탐방, 휴식, 힐링, etc.)
- Transportation: Accept any transportation method as-is (비행기, 기차, 자동차, 버스, KTX, 지하철, etc.)
- Accommodation: Accept any accommodation type as-is (호텔, 게스트하우스, 에어비앤비, 펜션, 리조트, etc.)

IMPORTANT: Handle ambiguous expressions:
- "2일정도", "3일쯤", "약 1주일" → mark as "ambiguous" and provide clarification options
- "적당히", "보통", "괜찮은" → mark as "ambiguous" and ask for specific details

Return a JSON object with:
{
  "collectedParams": { ... only parameters that are specifically mentioned and converted to proper format ... },
  "ambiguousParams": { ... parameters that need clarification with suggested options ... },
  "missingParams": [ ... list of missing required parameters ... ],
  "isComplete": boolean (true ONLY if ALL 8 required params are present and specific),
  "calculatedDuration": number (automatically calculated from start and end dates if both are provided),
  "destinationChanged": boolean (true if a destination change is detected)
}

CRITICAL: If user provides ANY word that could be interpreted as a travel style (even unusual ones like "격투여행", "음악여행"), include it in collectedParams as travelStyle.

Be strict: if any required parameter is vague or missing, include it in missingParams.
`,

  generateQuestion: `
You are a friendly travel planning assistant. Generate a natural, conversational question in Korean to ask for the missing travel information.

Missing parameter: {PARAM}

Generate only one question, make it friendly and conversational.
Examples:
- For title: "이번 여행의 제목을 입력해주세요 (예: 오사카 맛집 탐방, 제주도 힐링 여행, 유럽 배낭여행)"
- For destination: "어느 도시나 지역을 방문하고 싶으신가요?"
- For startDate: "여행 시작일은 언제인가요? (예: 7월 25일, 8월 3일, 내일, 다음주 등)"
- For endDate: "여행 종료일은 언제인가요? (예: 7월 28일, 8월 7일, 3일 후 등)"
- For peopleCount: "몇 명이서 함께 여행하시나요?"
- For budget: "여행 예산은 얼마나 생각하고 계신가요? (예: 100만원, 500만원 등)"
- For travelStyle: "어떤 스타일의 여행을 원하시나요?\n1. 여유로운 휴양\n2. 액티비티 중심\n3. 문화 탐방\n4. 카페/맛집 투어\n5. 쇼핑 중심\n6. 로맨틱\n7. 자연/힐링\n8. 기타 (직접 입력)"
- For transportation: "어떤 교통수단을 이용하고 싶으신가요?\n1. 비행기\n2. 기차\n3. 자동차\n4. 버스\n5. 기타 (직접 입력)"
- For accommodation: "어떤 숙박시설을 선호하시나요?\n1. 호텔\n2. 게스트하우스\n3. 에어비앤비\n4. 리조트\n5. 펜션\n6. 기타 (직접 입력)"

Return only the question text, nothing else.
`,

  generateClarificationQuestion: `
You are a friendly travel planning assistant. Generate a clarification question in Korean for ambiguous travel parameters.

Ambiguous parameter: {PARAM}
User's ambiguous input: {USER_INPUT}

Generate a clarification question with specific options to choose from.
Examples:
- For startDate "언젠가": "여행 시작일을 구체적으로 알려주세요. 예를 들어 7월 25일, 8월 3일처럼 말씀해주세요."
- For endDate "며칠 후": "여행 종료일을 구체적으로 알려주세요. 예를 들어 7월 28일, 8월 7일처럼 말씀해주세요."
- For budget "적당히": "예산을 좀 더 구체적으로 알려주세요. 50만원, 100만원, 200만원 중 어느 정도가 적당하실까요?"
- For peopleCount "몇명": "정확히 몇 명이서 여행하실 건가요? (예: 2명, 3명, 4명 등)"

Return only the clarification question text, nothing else.
`,

  validateParameter: `
You are a travel planning assistant. Validate if the user's response is appropriate for the requested travel parameter.

Parameter type: {PARAM_TYPE}
User's response: {USER_RESPONSE}

Validation rules:
- destination: Must be a place name (city, country, region). Invalid: non-place words like "food", "happy", "123"
- transportation: Must be a valid transportation method. Invalid: food, emotions, random words
- accommodation: Must be a valid lodging type. Invalid: food, activities, random words  
- travelStyle: Must be a travel style/preference. Invalid: completely unrelated words

Return a JSON object with:
{
  "isValid": boolean,
  "reason": "brief explanation of why invalid (if applicable)",
  "suggestion": "helpful suggestion for valid input (if invalid)"
}

Examples:
- destination + "피자" → {"isValid": false, "reason": "피자는 목적지가 아닙니다", "suggestion": "도시나 지역명을 말씀해주세요 (예: 서울, 제주도, 부산)"}
- transportation + "편한 거" → {"isValid": false, "reason": "구체적인 교통수단이 필요합니다", "suggestion": "비행기, 기차, 자동차, 버스 등 중에서 선택해주세요"}
- accommodation + "호텔" → {"isValid": true}
`,

  generateTravelPlan: `
You are an expert travel planner with extensive knowledge of global destinations. Create a detailed travel itinerary in KOREAN language based on the following parameters:

Destination: {DESTINATION}
Duration: {DURATION} days
People: {PEOPLE_COUNT}
Budget: {BUDGET}
Transportation: {TRANSPORTATION}
Accommodation: {ACCOMMODATION}
Travel Style: {TRAVEL_STYLE}

Create a realistic and practical travel plan considering:
1. Actual places, attractions, and restaurants that exist (use real names)
2. Realistic travel times and distances
3. Local culture, customs, and etiquette
4. Weather and seasonal considerations
5. Visa requirements if applicable
6. Local currency and realistic costs
7. Opening hours and days for attractions
8. Specific restaurant names and their famous dishes
9. Actual transportation routes and schedules
10. Real accommodation options with pricing

IMPORTANT: 
- Respond in KOREAN language. All text fields must be in Korean.
- Use REAL, SPECIFIC names of restaurants, cafes, attractions, and accommodations
- Provide REALISTIC costs and timing
- Include confirmation status: 확정 (confirmed), 미정 (not decided), 예정 (planned)
- Format as a comprehensive table-style itinerary

Return a JSON object with this structure:
{
  "title": "{목적지} {기간} {여행스타일} 플랜 (날짜 / {인원} 기준)",
  "destination": "구체적인 목적지",
  "duration": number,
  "startDate": "2025-06-05",
  "endDate": "2025-06-06", 
  "totalBudget": estimated total cost in KRW,
  "currency": "KRW",
  "overview": {
    "dates": "구체적인 날짜 (예: 2025년 6월 5일(목) ~ 6월 6일(금))",
    "people": "구체적 인원 (예: 성인 2명)",
    "transportation": "구체적 교통수단 (예: 서울 ↔ 여수 KTX / 여수 시내 쏘카)",
    "accommodation": "구체적 숙소명 (예: 신라스테이 여수 (오션뷰 + 조식 포함))",
    "theme": "여행 테마 키워드들 (예: 가족 / 맛집 / 감성카페 / 문화 / 야경)",
    "budgetRange": "예산 범위 (예: 약 72~75만원 (2인 기준))"
  },
  "schedule": [
    {
      "day": 1,
      "date": "6월 5일 (목)",
      "title": "DAY 1 – 6월 5일 (목)",
      "items": [
        {
          "time": "10:19",
          "activity": "여수EXPO역 도착",
          "location": "여수EXPO역",
          "status": "확정",
          "note": "KTX",
          "cost": 0,
          "duration": "",
          "transportation": ""
        },
        {
          "time": "11:00", 
          "activity": "점심: 정다운식당",
          "location": "정다운식당 (실제 주소)",
          "status": "확정",
          "note": "게장정식 추천",
          "cost": 25000,
          "duration": "1시간 30분",
          "transportation": "도보 10분"
        }
      ],
      "totalCost": daily total in KRW
    }
  ],
  "mealSummary": [
    {
      "day": "Day 1",
      "meal": "점심",
      "restaurant": "정다운식당",
      "status": "확정",
      "cost": 25000
    }
  ],
  "costBreakdown": {
    "transportation": amount,
    "accommodation": amount,
    "meals": amount, 
    "activities": amount,
    "others": amount,
    "total": total amount
  },
  "tips": ["현실적이고 구체적인 여행 팁들"],
  "requirements": ["비자", "예방접종", "기타 준비사항"],
  "emergencyInfo": {
    "hospital": "현지 병원 정보",
    "police": "현지 경찰서 정보", 
    "embassy": "영사관 정보 (해외 여행시)"
  }
}

CRITICAL REQUIREMENTS:
1. Use REAL restaurant names, not generic ones
2. Include REAL attraction names with actual addresses
3. Provide REALISTIC costs based on current market prices
4. Use confirmation status (확정/미정/예정) for each item
5. Make transportation times and routes realistic
6. Include specific local dishes and specialties
7. Format as a structured table-style itinerary
8. All costs should add up to the specified budget
9. Include emergency contact information
10. Make timing realistic considering travel time between locations

REMEMBER: All text content must be in KOREAN language. Create a practical, detailed plan that users can actually follow.
`,

  generateParameterConfirmation: `
You are a friendly travel planning assistant. The user has changed their destination and you need to confirm if they want to keep the existing parameters or change them.

Generate a natural, conversational confirmation message in Korean that:
1. Acknowledges the destination change
2. Lists the existing parameters for confirmation
3. Asks if they want to keep them or change them
4. Provides clear options for the user

Format:
"{새목적지}로 변경하시는군요! {새목적지}는 {이전목적지}와 다른 매력이 있어서 기존 설정을 확인해드릴게요.

현재 설정:
• 기간: {duration}
• 인원: {peopleCount}명  
• 예산: {budget}원
• 여행스타일: {travelStyle}
• 교통수단: {transportation}
• 숙박: {accommodation}

이 설정들을 그대로 사용하시겠어요?
- "네, 그대로 해주세요" → 기존 설정 유지
- "다시 설정할게요" → 처음부터 새로 설정
- "일부만 바꿀게요" → 원하는 항목만 말씀해주세요"

Be natural and conversational. Always end with clear options for the user.
`
};

// 개선된 의도 분류 함수
export async function classifyTravelIntent(
  userMessage: string, 
  hasExistingParams: boolean = false,
  recentMessages: string[] = []
): Promise<{
  intent: 'travel_start' | 'travel_continue' | 'travel_cancel' | 'travel_resume' | 'travel_parameter' | 'general',
  confidence: number,
  reasoning: string,
  isTravelRequest: boolean
}> {
  try {
    const contextInfo = hasExistingParams ? 
      '\n\nCONTEXT: User has incomplete travel parameters from previous conversation.' : '';
    
    const recentContext = recentMessages.length > 0 ? 
      `\n\nRECENT MESSAGES: ${recentMessages.join(' | ')}` : '';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: PROMPTS.classifyIntent + contextInfo + recentContext
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const result = response.choices[0].message.content;
    if (!result) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(result);
  } catch (error) {
    console.error('Error classifying intent:', error);
    throw error;
  }
}

// 파라미터 추출 함수
export async function extractTravelParameters(
  userMessage: string, 
  existingParams?: any,
  recentMessages: string[] = []
): Promise<ParameterCollectionStatus & { destinationChanged?: boolean }> {
  try {
    let systemPrompt = PROMPTS.extractParameters;
    
    // 기존 파라미터가 있으면 목적지 변경 감지를 위해 추가 정보 제공
    if (existingParams?.destination) {
      systemPrompt += `\n\nEXISTING DESTINATION: ${existingParams.destination}\nDetect if the user wants to change to a different destination.`;
    }

    // 대화 맥락 구성 (최근 10개 메시지)
    const contextMessages = recentMessages.slice(-10).map(msgStr => {
      const [role, content] = msgStr.split(': ', 2);
      return {
        role: role as 'user' | 'assistant',
        content: content || msgStr
      };
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        ...contextMessages,
        {
          role: 'user',
          content: userMessage
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const result = response.choices[0].message.content;
    if (!result) {
      throw new Error('No response from OpenAI');
    }

    // OpenAI 응답 원본 로깅 (디버깅용)
    console.log('🤖 OpenAI extractParameters 원본 응답:', result);
    console.log('🎯 입력 메시지:', userMessage);

    const parsedResult = JSON.parse(result);
    console.log('📊 파싱된 결과:', parsedResult);
    
    // 백업 로직: OpenAI가 도시명을 놓쳤을 때 키워드 기반으로 보완
    const enhancedResult = enhanceParameterExtraction(userMessage, parsedResult, existingParams);
    console.log('🔧 백업 로직 적용 후:', enhancedResult);
    
    // 날짜 파싱 및 기간 자동 계산
    const dateProcessedResult = processDateParameters(enhancedResult);
    console.log('📅 날짜 처리 후:', dateProcessedResult);
    
    return dateProcessedResult;
  } catch (error) {
    console.error('Error extracting parameters:', error);
    throw error;
  }
}

// 백업 파라미터 추출 로직 (키워드 기반)
function enhanceParameterExtraction(
  userMessage: string, 
  aiResult: any, 
  existingParams?: any
): any {
  const message = userMessage.trim();
  const result = { ...aiResult };
  
  // 도시명 키워드 리스트 (자주 사용되는 여행지)
  const destinations = [
    // 국내
    '서울', '부산', '제주', '제주도', '대구', '인천', '광주', '대전', '울산', '세종',
    '강릉', '속초', '여수', '포항', '경주', '안동', '전주', '목포', '군산', '통영',
    // 일본
    '도쿄', '오사카', '교토', '후쿠오카', '나고야', '요코하마', '고베', '히로시마', 
    '삿포로', '센다이', '가나자와', '나라', '닛코', '하코다테', '오키나와',
    // 중국
    '베이징', '상하이', '시안', '청두', '광저우', '심천', '홍콩', '마카오',
    '대련', '칭다오', '항저우', '소주', '난징', '쿤밍', '하얼빈',
    // 동남아
    '방콕', '치앙마이', '푸켓', '파타야', '호치민', '하노이', '다낭', '호이안',
    '쿠알라룸푸르', '페낭', '싱가포르', '자카르타', '발리', '보라카이', '세부',
    // 유럽
    '파리', '런던', '로마', '바르셀로나', '베를린', '프라하', '비엔나', '부다페스트',
    '암스테르담', '브뤼셀', '취리히', '스톡홀름', '코펜하겐', '헬싱키', '더블린',
    // 미주
    '뉴욕', '로스앤젤레스', '라스베이거스', '시애틀', '샌프란시스코', '시카고',
    '마이애미', '하와이', '토론토', '밴쿠버', '몬트리올'
  ];
  
  // 1. 목적지 백업 추출
  if (!result.collectedParams?.destination && destinations.some(dest => message.includes(dest))) {
    const foundDestination = destinations.find(dest => message.includes(dest));
    if (foundDestination) {
      console.log('🎯 백업 로직으로 목적지 발견:', foundDestination);
      result.collectedParams = result.collectedParams || {};
      result.collectedParams.destination = foundDestination;
      
      // missingParams에서 destination 제거
      if (result.missingParams?.includes('destination')) {
        result.missingParams = result.missingParams.filter((param: string) => param !== 'destination');
      }
    }
  }
  
  // 2. 기간 백업 추출 (숫자+일 패턴)
  if (!result.collectedParams?.duration) {
    const durationMatches = [
      message.match(/(\d+)일/),
      message.match(/(\d+)박\s*(\d+)일/),
      message.match(/(\d+)박/),
      message.match(/(\d+)주일?/),
      message.match(/(\d+)개월/)
    ];
    
    for (const match of durationMatches) {
      if (match) {
        let duration = 0;
        if (match[0].includes('박') && match[2]) {
          // X박Y일 형태
          duration = parseInt(match[2]);
        } else if (match[0].includes('박')) {
          // X박 형태 (X박 = X+1일)
          duration = parseInt(match[1]) + 1;
        } else if (match[0].includes('주')) {
          // X주일 형태
          duration = parseInt(match[1]) * 7;
        } else if (match[0].includes('개월')) {
          // X개월 형태
          duration = parseInt(match[1]) * 30;
        } else {
          // X일 형태
          duration = parseInt(match[1]);
        }
        
        if (duration > 0) {
          console.log('📅 백업 로직으로 기간 발견:', duration);
          result.collectedParams = result.collectedParams || {};
          result.collectedParams.duration = duration;
          
          if (result.missingParams?.includes('duration')) {
            result.missingParams = result.missingParams.filter((param: string) => param !== 'duration');
          }
          break;
        }
      }
    }
  }
  
  // 3. 인원수 백업 추출
  if (!result.collectedParams?.peopleCount) {
    const peopleMatches = [
      message.match(/(\d+)명/),
      message.match(/혼자/),
      message.match(/둘이?서?/),
      message.match(/셋이?서?/),
      message.match(/넷이?서?/)
    ];
    
    for (const match of peopleMatches) {
      if (match) {
        let peopleCount = 0;
        if (match[0] === '혼자') peopleCount = 1;
        else if (match[0].includes('둘')) peopleCount = 2;
        else if (match[0].includes('셋')) peopleCount = 3;
        else if (match[0].includes('넷')) peopleCount = 4;
        else if (match[1]) peopleCount = parseInt(match[1]);
        
        if (peopleCount > 0) {
          console.log('👥 백업 로직으로 인원수 발견:', peopleCount);
          result.collectedParams = result.collectedParams || {};
          result.collectedParams.peopleCount = peopleCount;
          
          if (result.missingParams?.includes('peopleCount')) {
            result.missingParams = result.missingParams.filter((param: string) => param !== 'peopleCount');
          }
          break;
        }
      }
    }
  }
  
  return result;
}

// 날짜 파라미터 처리 및 기간 자동 계산 함수
function processDateParameters(result: any): any {
  const processedResult = { ...result };
  
  // startDate와 endDate가 모두 있으면 duration 자동 계산
  if (processedResult.collectedParams?.startDate && processedResult.collectedParams?.endDate) {
    const startDate = new Date(processedResult.collectedParams.startDate);
    const endDate = new Date(processedResult.collectedParams.endDate);
    
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 because travel days include both start and end
      
      processedResult.collectedParams.duration = diffDays;
      processedResult.calculatedDuration = diffDays;
      
      console.log(`📅 자동 계산된 기간: ${processedResult.collectedParams.startDate} ~ ${processedResult.collectedParams.endDate} = ${diffDays}일`);
      
      // missingParams에서 duration 제거
      if (processedResult.missingParams?.includes('duration')) {
        processedResult.missingParams = processedResult.missingParams.filter((param: string) => param !== 'duration');
      }
    }
  }
  
  // startDate와 endDate가 필요한 파라미터 목록에 추가 (duration 대신)
  if (!processedResult.collectedParams?.startDate && !processedResult.missingParams?.includes('startDate')) {
    processedResult.missingParams = processedResult.missingParams || [];
    processedResult.missingParams.push('startDate');
  }
  
  if (!processedResult.collectedParams?.endDate && !processedResult.missingParams?.includes('endDate')) {
    processedResult.missingParams = processedResult.missingParams || [];
    processedResult.missingParams.push('endDate');
  }
  
  // duration은 더이상 필수 파라미터가 아니므로 missingParams에서 제거
  if (processedResult.missingParams?.includes('duration')) {
    processedResult.missingParams = processedResult.missingParams.filter((param: string) => param !== 'duration');
  }
  
  return processedResult;
}

// 질문 생성 함수
export async function generateQuestion(missingParam: string): Promise<string> {
  try {
    const paramNameMap: Record<string, string> = {
      title: '여행 제목',
      destination: '목적지',
      startDate: '여행 시작일',
      endDate: '여행 종료일',
      peopleCount: '여행 인원',
      budget: '예산',
      travelStyle: '여행 스타일',
      transportation: '교통수단',
      accommodation: '숙박시설'
    };

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: PROMPTS.generateQuestion.replace('{PARAM}', paramNameMap[missingParam] || missingParam)
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    return response.choices[0].message.content || '정보를 더 알려주시겠어요?';
  } catch (error) {
    console.error('Error generating question:', error);
    return '여행 정보를 더 자세히 알려주시겠어요?';
  }
}

// 파라미터 확인 메시지 생성 함수
export async function generateParameterConfirmation(
  newDestination: string,
  previousDestination: string,
  existingParams: any
): Promise<string> {
  try {
    const formatBudget = (budget: number) => {
      if (budget >= 1000000) {
        return `${(budget / 10000).toFixed(0)}만원`;
      }
      return `${budget.toLocaleString()}원`;
    };

    const confirmationMessage = `${newDestination}로 변경하시는군요! ${newDestination}는 ${previousDestination}와 다른 매력이 있어서 기존 설정을 확인해드릴게요.

현재 설정:
• 시작일: ${existingParams.startDate || existingParams.start_date || '미설정'}
• 종료일: ${existingParams.endDate || existingParams.end_date || '미설정'}
• 인원: ${existingParams.people_count || existingParams.peopleCount}명  
• 예산: ${existingParams.budget ? formatBudget(existingParams.budget) : '미설정'}
• 여행스타일: ${existingParams.travel_style || existingParams.travelStyle || '미설정'}
• 교통수단: ${existingParams.transportation || '미설정'}
• 숙박: ${existingParams.accommodation || '미설정'}

이 설정들을 그대로 사용하시겠어요?
• "네, 그대로 해주세요" → 기존 설정 유지
• "다시 설정할게요" → 처음부터 새로 설정  
• "일부만 바꿀게요" → 원하는 항목만 말씀해주세요`;

    return confirmationMessage;
  } catch (error) {
    console.error('Error generating parameter confirmation:', error);
    return `${newDestination}로 변경하시는군요! 기존 설정을 유지하시겠어요? 아니면 다시 설정하시겠어요?`;
  }
}

// 확인 질문 생성 함수
export async function generateClarificationQuestion(param: string, userInput: string): Promise<string> {
  try {
    const paramNameMap: Record<string, string> = {
      destination: '목적지',
      startDate: '여행 시작일',
      endDate: '여행 종료일',
      peopleCount: '여행 인원',
      budget: '예산',
      travelStyle: '여행 스타일',
      transportation: '교통수단',
      accommodation: '숙박시설'
    };

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: PROMPTS.generateClarificationQuestion
            .replace('{PARAM}', paramNameMap[param] || param)
            .replace('{USER_INPUT}', userInput)
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    return response.choices[0].message.content || '좀 더 구체적으로 알려주시겠어요?';
  } catch (error) {
    console.error('Error generating clarification question:', error);
    return '좀 더 구체적으로 알려주시겠어요?';
  }
}

// 파라미터 유효성 검사 함수
export async function validateParameter(paramType: string, userResponse: string): Promise<{isValid: boolean, reason?: string, suggestion?: string}> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: PROMPTS.validateParameter
            .replace('{PARAM_TYPE}', paramType)
            .replace('{USER_RESPONSE}', userResponse)
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const result = response.choices[0].message.content;
    if (!result) {
      return {isValid: true}; // 실패 시 통과로 처리
    }

    return JSON.parse(result);
  } catch (error) {
    console.error('Error validating parameter:', error);
    return {isValid: true}; // 에러 시 통과로 처리
  }
}

// 여행 일정 생성 함수
export async function generateTravelPlan(params: TravelParameters): Promise<TravelPlan> {
  try {
    let prompt = PROMPTS.generateTravelPlan;
    
    // 파라미터 치환
    prompt = prompt.replace('{DESTINATION}', params.destination || '');
    prompt = prompt.replace('{DURATION}', String(params.duration || 3));
    prompt = prompt.replace('{PEOPLE_COUNT}', String(params.peopleCount || 1));
    prompt = prompt.replace('{BUDGET}', params.budget ? `${params.budget} KRW` : 'Not specified');
    prompt = prompt.replace('{TRANSPORTATION}', params.transportation || 'Not specified');
    prompt = prompt.replace('{ACCOMMODATION}', params.accommodation || 'Not specified');
    prompt = prompt.replace('{TRAVEL_STYLE}', params.travelStyle || 'Balanced');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const result = response.choices[0].message.content;
    if (!result) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(result);
  } catch (error) {
    console.error('Error generating travel plan:', error);
    throw error;
  }
}

// 대화 맥락을 고려한 응답 생성 (여행과 무관한 일반 대화용)
export async function generateChatResponse(
  userMessage: string, 
  conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = []
): Promise<string> {
  try {
    // 대화 히스토리 구성 (최근 10개 메시지만 유지)
    const recentHistory = conversationHistory.slice(-10);
    
    const messages = [
      {
        role: 'system' as const,
        content: `당신은 친절한 여행 계획 도우미입니다. 사용자와의 대화에서 맥락을 고려하여 자연스럽게 답변하세요.
        
이전 대화 내용을 참고하여 일관성 있는 답변을 제공하고, 사용자의 질문에 구체적으로 도움이 되는 정보를 제공하세요.`
      },
      ...recentHistory,
      {
        role: 'user' as const,
        content: userMessage
      }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content || '죄송합니다. 응답을 생성할 수 없습니다.';
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw error;
  }
}