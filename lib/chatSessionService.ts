import { supabase } from './supabase';

// 데이터베이스 인터페이스 정의
export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
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

export interface PlanModification {
  id: string;
  plan_id: string;
  user_id: string;
  modification_type: string;
  modification_request: string;
  original_data: any;
  modified_data: any;
  ai_reasoning: string;
  user_approval: boolean;
  created_at: string;
}

export interface PlanVersion {
  id: string;
  plan_id: string;
  version_number: number;
  schedule_data: any;
  modification_summary: string;
  is_current: boolean;
  created_at: string;
}

export interface SaveRequest {
  id: string;
  chat_session_id: string;
  user_id: string;
  save_request: string;
  plan_data: any;
  validation_status: 'pending' | 'valid' | 'invalid';
  validation_errors: any;
  save_status: 'pending' | 'success' | 'failed';
  generated_plan_id?: string;
  save_error?: string;
  created_at: string;
  completed_at?: string;
}

export interface PlanSharingSettings {
  id: string;
  plan_id: string;
  user_id: string;
  is_public: boolean;
  allow_copy: boolean;
  allow_reference: boolean;
  allow_matching: boolean;
  sharing_code: string;
  shared_with: any;
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

  // 계획 수정 요청 저장
  static async saveModificationRequest(
    planId: string,
    userId: string,
    modificationType: string,
    request: string,
    originalData: any,
    modifiedData: any,
    aiReasoning: string
  ): Promise<PlanModification | null> {
    try {
      const { data, error } = await supabase
        .from('plan_modifications')
        .insert({
          plan_id: planId,
          user_id: userId,
          modification_type: modificationType,
          modification_request: request,
          original_data: originalData,
          modified_data: modifiedData,
          ai_reasoning: aiReasoning,
          user_approval: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving modification request:', error);
      return null;
    }
  }

  // 계획 버전 생성
  static async createPlanVersion(
    planId: string,
    versionNumber: number,
    scheduleData: any,
    modificationSummary: string,
    isCurrent: boolean = true
  ): Promise<PlanVersion | null> {
    try {
      // 기존 버전들을 current = false로 변경
      if (isCurrent) {
        await supabase
          .from('plan_versions')
          .update({ is_current: false })
          .eq('plan_id', planId);
      }

      const { data, error } = await supabase
        .from('plan_versions')
        .insert({
          plan_id: planId,
          version_number: versionNumber,
          schedule_data: scheduleData,
          modification_summary: modificationSummary,
          is_current: isCurrent
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating plan version:', error);
      return null;
    }
  }

  // 최신 버전 번호 조회
  static async getLatestVersionNumber(planId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('plan_versions')
        .select('version_number')
        .eq('plan_id', planId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching latest version number:', error);
        return 0;
      }

      return data?.version_number || 0;
    } catch (error) {
      console.error('Error in getLatestVersionNumber:', error);
      return 0;
    }
  }

  // 자동 버전 생성 (여행 계획 수정 시)
  static async createVersionFromPlanUpdate(
    planId: string,
    updatedScheduleData: any,
    modificationSummary: string
  ): Promise<PlanVersion | null> {
    try {
      const currentVersionNumber = await this.getLatestVersionNumber(planId);
      const newVersionNumber = currentVersionNumber + 1;

      return await this.createPlanVersion(
        planId,
        newVersionNumber,
        updatedScheduleData,
        modificationSummary,
        true
      );
    } catch (error) {
      console.error('Error creating version from plan update:', error);
      return null;
    }
  }

  // 현재 활성 버전 조회
  static async getCurrentPlanVersion(planId: string): Promise<PlanVersion | null> {
    try {
      const { data, error } = await supabase
        .from('plan_versions')
        .select('*')
        .eq('plan_id', planId)
        .eq('is_current', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching current plan version:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getCurrentPlanVersion:', error);
      return null;
    }
  }

  // 특정 버전으로 롤백
  static async rollbackToVersion(planId: string, versionNumber: number): Promise<boolean> {
    try {
      // 1. 모든 버전을 current = false로 변경
      await supabase
        .from('plan_versions')
        .update({ is_current: false })
        .eq('plan_id', planId);

      // 2. 지정된 버전을 current = true로 변경
      const { error } = await supabase
        .from('plan_versions')
        .update({ is_current: true })
        .eq('plan_id', planId)
        .eq('version_number', versionNumber);

      if (error) {
        console.error('Error rolling back to version:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in rollbackToVersion:', error);
      return false;
    }
  }

  // 저장 요청 생성
  static async createSaveRequest(
    sessionId: string,
    userId: string,
    saveRequest: string,
    planData: any
  ): Promise<SaveRequest | null> {
    try {
      const { data, error } = await supabase
        .from('save_requests')
        .insert({
          chat_session_id: sessionId,
          user_id: userId,
          save_request: saveRequest,
          plan_data: planData,
          validation_status: 'pending',
          save_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating save request:', error);
      return null;
    }
  }

  // 공유 설정 생성
  static async createSharingSettings(
    planId: string,
    userId: string,
    settings: Partial<PlanSharingSettings>
  ): Promise<PlanSharingSettings | null> {
    try {
      const sharingCode = Math.random().toString(36).substring(2, 15);
      
      const { data, error } = await supabase
        .from('plan_sharing_settings')
        .insert({
          plan_id: planId,
          user_id: userId,
          sharing_code: sharingCode,
          is_public: false,
          allow_copy: false,
          allow_reference: false,
          allow_matching: false,
          shared_with: {},
          ...settings
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating sharing settings:', error);
      return null;
    }
  }

  // 특정 계획의 모든 수정 이력 삭제
  static async deletePlanModifications(planId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('plan_modifications')
        .delete()
        .eq('plan_id', planId);

      if (error) {
        console.error('Error deleting plan modifications:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deletePlanModifications:', error);
      return false;
    }
  }

  // 사용자의 모든 수정 이력 삭제 (필요시 사용)
  static async deleteUserModifications(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('plan_modifications')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting user modifications:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteUserModifications:', error);
      return false;
    }
  }

  // 사용자별 세션 목록 조회
  static async getUserSessions(userId: string, limit: number = 20): Promise<ChatSession[]> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }
}