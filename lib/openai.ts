import OpenAI from 'openai';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 여행 파라미터 인터페이스
export interface TravelParameters {
  destination?: string;
  duration?: number;
  peopleCount?: number;
  budget?: number;
  transportation?: string;
  accommodation?: string;
  travelStyle?: string;
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

// 전체 여행 일정 인터페이스
export interface TravelPlan {
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
You are an advanced intent classifier for a travel planning assistant. Analyze the user's message and determine their intent with consideration for context.

Your task is to classify if the user wants to:
1. Continue/start travel planning
2. Cancel/stop travel planning 
3. Resume travel planning
4. Ask general questions unrelated to travel

Context considerations:
- If user previously had incomplete travel parameters, consider if they want to continue
- Recognize explicit cancellation phrases like "여행 안갈래", "안간다", "취소", "그만", "중단", "멈춰", "안할래"
- Recognize resumption phrases like "계속", "다시", "재개", "진행", "이어서", "계속해줘", "다시 시작"
- When user gives affirmative responses (네, 응, 맞아, 그래, yes, ok, okay, sure, etc.) after being asked about travel continuation, classify as "travel_resume"
- When user explicitly indicates it's NOT travel-related (아니야, 그냥, 일반적인, 단순히, just, no, etc.), classify as "general" and do NOT offer travel continuation
- IMPORTANT: Expressions of hesitation or indecision like "갈지말지 고민", "생각중", "망설임" should be classified as "general", NOT travel requests
- Only classify as travel_start/continue if there's clear intent to plan or get help with travel

Return a JSON object with:
{
  "intent": "travel_start" | "travel_continue" | "travel_cancel" | "travel_resume" | "general",
  "confidence": number (0-1),
  "reasoning": "brief explanation",
  "isTravelRequest": boolean (true for travel_start, travel_continue, travel_resume),
  "shouldOfferContinue": boolean (false if user explicitly indicates NOT travel-related)
}
`,
  extractParameters: `
You are a travel planning assistant. Extract travel parameters from the user's message.

Extract the following information:
- destination (REQUIRED): The specific place they want to visit
- duration (REQUIRED): Number of days/nights (Korean formats like "2박3일", "3박4일", "1주일" should be converted to numbers: 2박3일=3, 3박4일=4, 1주일=7)
- peopleCount (REQUIRED): Number of travelers (Korean formats like "2명", "세명", "혼자" should be converted: 혼자=1, 둘=2, 세명=3)
- budget (REQUIRED): Total budget in KRW or specified currency (must be specific amount)
- travelStyle (REQUIRED): Travel style preference (luxury, budget, adventure, cultural, family, romantic, business, etc.)
- transportation (REQUIRED): Preferred transportation mode (flight, train, car, bus, etc.)
- accommodation (REQUIRED): Preferred accommodation type (hotel, hostel, airbnb, resort, guesthouse, etc.)

IMPORTANT RULES:
1. ALL 7 required parameters must be present to mark as complete
2. Destination must be specific (not just "Europe" or "Asia")
3. Duration must be a specific number (not "a few days")
4. PeopleCount must be a specific number (not "some friends")
5. Budget must have a specific amount (not "reasonable" or "cheap")
6. TravelStyle: Accept ANY travel style description as-is - VERY IMPORTANT: Even unusual or creative travel styles like "격투여행", "음악여행", "카페투어" should be recognized as valid travel styles
7. Transportation: Accept ANY transportation method as-is - do NOT convert (비행기, KTX, 지하철, etc.)
8. Accommodation: Accept ANY accommodation type as-is - do NOT convert (호텔, 펜션, 에어비앤비, etc.)

Examples of Korean expressions to recognize:
- Duration: "2박3일" → duration: 3, "3박4일" → duration: 4, "1주일" → duration: 7, "이틀" → duration: 2
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
  "isComplete": boolean (true ONLY if ALL 7 required params are present and specific)
}

CRITICAL: If user provides ANY word that could be interpreted as a travel style (even unusual ones like "격투여행", "음악여행"), include it in collectedParams as travelStyle.

Be strict: if any required parameter is vague or missing, include it in missingParams.
`,

  generateQuestion: `
You are a friendly travel planning assistant. Generate a natural, conversational question in Korean to ask for the missing travel information.

Missing parameter: {PARAM}

Generate only one question, make it friendly and conversational.
Examples:
- For destination: "어느 도시나 지역을 방문하고 싶으신가요?"
- For duration: "며칠 동안 여행하실 예정인가요? (예: 3박 4일, 1주일 등)"
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
- For duration "2일정도": "2일정도면 1박2일 여행을 말씀하시는 건가요? 아니면 2박3일인가요?"
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
1. Actual places, attractions, and restaurants that exist
2. Realistic travel times and distances
3. Local culture, customs, and etiquette
4. Weather and seasonal considerations
5. Visa requirements if applicable
6. Local currency and realistic costs
7. Opening hours and days for attractions

IMPORTANT: Respond in KOREAN language. All text fields (title, description, activity, location, tips, etc.) must be in Korean.

Return a JSON object with this structure:
{
  "title": "여행 제목 (한국어)",
  "destination": "구체적인 목적지",
  "duration": number,
  "totalBudget": estimated total cost in KRW,
  "currency": "local currency code",
  "schedule": [
    {
      "day": 1,
      "title": "일차 제목 (한국어)",
      "description": "간단한 일차 개요 (한국어)",
      "items": [
        {
          "time": "09:00",
          "activity": "활동명 (한국어)",
          "location": "구체적인 장소/주소 (한국어)",
          "duration": "2시간",
          "cost": 15000,
          "currency": "KRW",
          "transportation": "이동 방법 (한국어)",
          "tips": "도움이 되는 팁 (한국어)"
        }
      ],
      "totalCost": daily total in KRW
    }
  ],
  "tips": ["일반적인 여행 팁들 (한국어)"],
  "requirements": ["비자", "예방접종", "기타 (한국어)"]
}

Make the itinerary detailed, practical, and exciting. Include a mix of must-see attractions, local experiences, meals, and free time.

REMEMBER: All text content must be in KOREAN language, including titles, descriptions, activities, locations, tips, and requirements.
`
};

// 개선된 의도 분류 함수
export async function classifyTravelIntent(
  userMessage: string, 
  hasExistingParams: boolean = false,
  recentMessages: string[] = []
): Promise<{
  intent: 'travel_start' | 'travel_continue' | 'travel_cancel' | 'travel_resume' | 'general',
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
      model: 'gpt-4-turbo-preview',
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
export async function extractTravelParameters(userMessage: string): Promise<ParameterCollectionStatus> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: PROMPTS.extractParameters
        },
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

    return JSON.parse(result);
  } catch (error) {
    console.error('Error extracting parameters:', error);
    throw error;
  }
}

// 질문 생성 함수
export async function generateQuestion(missingParam: string): Promise<string> {
  try {
    const paramNameMap: Record<string, string> = {
      destination: '목적지',
      duration: '여행 기간',
      peopleCount: '여행 인원',
      budget: '예산',
      travelStyle: '여행 스타일',
      transportation: '교통수단',
      accommodation: '숙박시설'
    };

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
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

// 확인 질문 생성 함수
export async function generateClarificationQuestion(param: string, userInput: string): Promise<string> {
  try {
    const paramNameMap: Record<string, string> = {
      destination: '목적지',
      duration: '여행 기간',
      peopleCount: '여행 인원',
      budget: '예산',
      travelStyle: '여행 스타일',
      transportation: '교통수단',
      accommodation: '숙박시설'
    };

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
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
      model: 'gpt-4-turbo-preview',
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
      model: 'gpt-4-turbo-preview',
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
      model: 'gpt-4-turbo-preview',
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