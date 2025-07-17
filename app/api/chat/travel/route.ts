import { NextRequest, NextResponse } from 'next/server';
import { classifyTravelIntent, extractTravelParameters, generateQuestion, generateClarificationQuestion, validateParameter, generateTravelPlan } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, action, params, missingParam, hasExistingParams, recentMessages, userInput, paramType } = body;

    if (!message && action !== 'generatePlan' && action !== 'generateQuestion' && action !== 'generateClarificationQuestion' && action !== 'validateParameter') {
      return NextResponse.json(
        { error: '메시지가 필요합니다.' },
        { status: 400 }
      );
    }

    // 의도 분류
    if (action === 'classifyIntent') {
      const result = await classifyTravelIntent(
        message, 
        hasExistingParams || false, 
        recentMessages || []
      );
      return NextResponse.json(result);
    }

    // 파라미터 추출
    if (action === 'extractParams') {
      const result = await extractTravelParameters(message);
      return NextResponse.json(result);
    }

    // 질문 생성
    if (action === 'generateQuestion') {
      if (!missingParam) {
        return NextResponse.json(
          { error: '누락된 파라미터가 필요합니다.' },
          { status: 400 }
        );
      }
      const question = await generateQuestion(missingParam);
      return NextResponse.json({ question });
    }

    // 확인 질문 생성
    if (action === 'generateClarificationQuestion') {
      if (!missingParam || !userInput) {
        return NextResponse.json(
          { error: '파라미터와 사용자 입력이 필요합니다.' },
          { status: 400 }
        );
      }
      const question = await generateClarificationQuestion(missingParam, userInput);
      return NextResponse.json({ question });
    }

    // 파라미터 유효성 검사
    if (action === 'validateParameter') {
      if (!paramType || !userInput) {
        return NextResponse.json(
          { error: '파라미터 타입과 사용자 입력이 필요합니다.' },
          { status: 400 }
        );
      }
      const result = await validateParameter(paramType, userInput);
      return NextResponse.json(result);
    }

    // 여행 일정 생성
    if (action === 'generatePlan') {
      if (!params) {
        return NextResponse.json(
          { error: '여행 파라미터가 필요합니다.' },
          { status: 400 }
        );
      }
      const plan = await generateTravelPlan(params);
      return NextResponse.json({ plan });
    }

    // 기본 파라미터 추출
    const result = await extractTravelParameters(message);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Travel API error:', error);
    return NextResponse.json(
      { error: '여행 정보 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}