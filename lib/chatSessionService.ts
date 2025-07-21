import { supabase } from './supabase';
import { ChatSession, ChatMessage } from './chatService';

// SessionParameters 인터페이스 정의 (travelPlanService.ts의 것과 비슷하지만 필드가 다름)
export interface SessionParameters {
  id: string;
  chat_session_id: string;
  user_id: string;
  destination?: string;
  duration?: number;
  people_count?: number;
  budget?: number;
  transportation?: string;
  accommodation?: string;
  travel_style?: string;
  collection_status: 'incomplete' | 'complete' | 'awaiting_confirmation';
  missing_params: string[];
  created_at: string;
  updated_at: string;
}

// 채팅 세션 관리 함수들
export class ChatSessionService {
  // 새 채팅 세션 생성
  static async createSession(userId: string, title: string = '새로운 여행 계획'): Promise<ChatSession | null> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          title,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating chat session:', error);
      return null;
    }
  }

  // 활성 세션 조회
  static async getActiveSession(userId: string): Promise<ChatSession | null> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error getting active session:', error);
      return null;
    }
  }

  // 세션 비활성화
  static async deactivateSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      return !error;
    } catch (error) {
      console.error('Error deactivating session:', error);
      return false;
    }
  }

  // 메시지 저장
  static async saveMessage(sessionId: string, userId: string, role: 'user' | 'assistant', content: string): Promise<ChatMessage | null> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          user_id: userId,
          role,
          content
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving message:', error);
      return null;
    }
  }

  // 세션의 메시지 조회
  static async getSessionMessages(sessionId: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting session messages:', error);
      return [];
    }
  }

  // 세션 파라미터 저장/업데이트
  static async updateSessionParameters(sessionId: string, userId: string, params: Partial<SessionParameters>): Promise<SessionParameters | null> {
    try {
      // 기존 파라미터 조회
      const { data: existing } = await supabase
        .from('session_parameters')
        .select('*')
        .eq('chat_session_id', sessionId)
        .single();

      if (existing) {
        // 업데이트
        const { data, error } = await supabase
          .from('session_parameters')
          .update({
            ...params,
            updated_at: new Date().toISOString()
          })
          .eq('chat_session_id', sessionId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // 새로 생성
        const { data, error } = await supabase
          .from('session_parameters')
          .insert({
            chat_session_id: sessionId,
            user_id: userId,
            ...params,
            collection_status: 'incomplete',
            missing_params: []
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error updating session parameters:', error);
      return null;
    }
  }

  // 세션 파라미터 조회
  static async getSessionParameters(sessionId: string): Promise<SessionParameters | null> {
    try {
      const { data, error } = await supabase
        .from('session_parameters')
        .select('*')
        .eq('chat_session_id', sessionId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error getting session parameters:', error);
      return null;
    }
  }











}