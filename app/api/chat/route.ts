import { NextRequest, NextResponse } from 'next/server';
import { generateChatResponse } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: '메시지가 필요합니다.' },
        { status: 400 }
      );
    }

    // OpenAI API 호출 (대화 히스토리 포함)
    const response = await generateChatResponse(message, conversationHistory || []);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'AI 응답 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}