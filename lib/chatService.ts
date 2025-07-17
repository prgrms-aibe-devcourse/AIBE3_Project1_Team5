import { supabase } from './supabase';

export interface ChatSession {
  id: string;
  user_id: string;
  title?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export const chatService = {
  // 활성 세션 가져오기 또는 새로 생성
  async getOrCreateActiveSession(userId: string): Promise<ChatSession | null> {
    try {
      // 먼저 활성 세션이 있는지 확인
      const { data: existingSession, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingSession && !fetchError) {
        return existingSession;
      }

      // 활성 세션이 없으면 새로 생성
      const { data: newSession, error: createError } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          title: '새 대화',
          is_active: true,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating session:', createError);
        return null;
      }

      return newSession;
    } catch (error) {
      console.error('Error in getOrCreateActiveSession:', error);
      return null;
    }
  },

  // 세션의 메시지 가져오기
  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSessionMessages:', error);
      return [];
    }
  },

  // 새 메시지 저장
  async saveMessage(
    sessionId: string,
    userId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<ChatMessage | null> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          user_id: userId,
          role,
          content,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving message:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in saveMessage:', error);
      return null;
    }
  },

  // 세션 제목 업데이트
  async updateSessionTitle(sessionId: string, title: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) {
        console.error('Error updating session title:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateSessionTitle:', error);
      return false;
    }
  },

  // 세션 종료
  async endSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) {
        console.error('Error ending session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in endSession:', error);
      return false;
    }
  },

  // 사용자의 모든 세션 가져오기
  async getUserSessions(userId: string): Promise<ChatSession[]> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching user sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserSessions:', error);
      return [];
    }
  },
};