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

// 세션 캐시 (메모리) - 타임스탬프와 함께 저장
let sessionCache: { [userId: string]: { session: ChatSession, timestamp: number } } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5분

export const chatService = {
  // 캐시 관리 함수들
  clearCache(userId?: string) {
    if (userId) {
      delete sessionCache[userId];
      console.log('[chatService] Cache cleared for user:', userId);
    } else {
      sessionCache = {};
      console.log('[chatService] All cache cleared');
    }
  },

  isCacheValid(userId: string): boolean {
    const cached = sessionCache[userId];
    if (!cached) return false;
    
    const now = Date.now();
    const isValid = (now - cached.timestamp) < CACHE_DURATION;
    
    if (!isValid) {
      delete sessionCache[userId];
      console.log('[chatService] Cache expired for user:', userId);
    }
    
    return isValid;
  },

  // 세션의 모든 메시지 삭제
  async deleteSessionMessages(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', sessionId);

      if (error) {
        console.error('Error deleting session messages:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteSessionMessages:', error);
      return false;
    }
  },

  // 활성 세션 가져오기 또는 새로 생성
  async getOrCreateActiveSession(userId: string): Promise<ChatSession | null> {
    console.log('[chatService] getOrCreateActiveSession called for user:', userId);
    
    // 캐시된 세션 확인 (유효성 검사 포함)
    if (this.isCacheValid(userId) && sessionCache[userId].session.is_active) {
      console.log('[chatService] Returning cached session for user:', userId);
      return sessionCache[userId].session;
    }
    
    try {
      // 먼저 활성 세션이 있는지 확인
      console.log('[chatService] Checking for existing active session...');
      const { data: existingSession, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log('[chatService] Existing session check result:', { existingSession, fetchError });

      if (existingSession && !fetchError) {
        console.log('[chatService] Found existing active session:', existingSession.id);
        // 세션 캐시에 타임스탬프와 함께 저장
        sessionCache[userId] = {
          session: existingSession,
          timestamp: Date.now()
        };
        return existingSession;
      }

      // 활성 세션이 없으면 새로 생성
      console.log('[chatService] No active session found, creating new one...');
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
        console.error('[chatService] Error creating session:', createError);
        return null;
      }

      console.log('[chatService] New session created:', newSession);
      // 새 세션 캐시에 타임스탬프와 함께 저장
      sessionCache[userId] = {
        session: newSession,
        timestamp: Date.now()
      };
      return newSession;
    } catch (error) {
      console.error('[chatService] Error in getOrCreateActiveSession:', error);
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

      // 캐시에서 해당 세션 제거
      Object.keys(sessionCache).forEach(userId => {
        if (sessionCache[userId].id === sessionId) {
          delete sessionCache[userId];
        }
      });

      return true;
    } catch (error) {
      console.error('Error in endSession:', error);
      return false;
    }
  },

  // 캐시 정리 (필요시 호출)
  clearCache(): void {
    sessionCache = {};
    console.log('[chatService] Session cache cleared');
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