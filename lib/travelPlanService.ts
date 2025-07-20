import { supabase } from './supabase';
import { TravelParameters, TravelPlan } from './openai';

// Session Parameters 인터페이스
export interface SessionParameters {
  id: string;
  chat_session_id: string;
  user_id: string;
  title?: string;
  destination?: string;
  start_date?: string; // 여행 시작일 (YYYY-MM-DD)
  end_date?: string;   // 여행 종료일 (YYYY-MM-DD)
  duration?: number;   // 자동 계산된 기간 (일수) - 하위 호환성을 위해 유지
  people_count?: number;
  budget?: number;
  transportation?: string;
  accommodation?: string;
  travel_style?: string;
  collection_status: 'incomplete' | 'complete' | 'awaiting_confirmation';
  missing_params?: string[];
  created_at: string;
  updated_at: string;
}

// Travel Plan DB 인터페이스
export interface TravelPlanDB {
  id: string;
  user_id: string;
  created_from_session_id?: string; // 생성 출처 추적용 (참조만)
  title: string;
  destination: string;
  start_date?: string;
  end_date?: string;
  duration: number;
  people_count: number;
  budget?: number;
  transportation?: string;
  accommodation?: string;
  travel_style?: string;
  schedule: any; // JSON
  ai_metadata?: any; // JSON
  status: 'draft' | 'confirmed' | 'completed';
  share_settings?: any; // JSON
  created_at: string;
  updated_at: string;
}

export const travelPlanService = {
  // Session Parameters CRUD
  async getSessionParameters(sessionId: string): Promise<SessionParameters | null> {
    try {
      // 현재 인증된 사용자 확인
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔐 현재 인증 사용자:', user?.id || 'NULL');
      console.log('🔐 세션 ID:', sessionId);
      
      // 타임아웃 설정 (12초 - useChat의 15초보다 짧게)
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: getSessionParameters took too long')), 12000)
      );
      
      const queryPromise = supabase
        .from('session_parameters')
        .select('*')
        .eq('chat_session_id', sessionId)
        .limit(1);

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error) {
        console.error('❌ Error fetching session parameters:', error);
        console.error('Error details:', { 
          code: error.code, 
          message: error.message, 
          hint: error.hint,
          sessionId 
        });
        
        // 406 에러나 기타 권한 관련 에러인 경우 특별 처리
        if (error.message?.includes('406') || error.code === 'PGRST406' || 
            error.message?.includes('Not Acceptable') || error.code?.includes('406')) {
          console.error('🚨 RLS 정책 또는 권한 문제 - 빈 파라미터로 계속 진행');
          return {
            id: 'temp-' + Date.now(),
            chat_session_id: sessionId,
            user_id: user?.id || '',
            collection_status: 'incomplete' as const,
            missing_params: ['title', 'destination', 'startDate', 'endDate', 'peopleCount', 'budget', 'travelStyle', 'transportation', 'accommodation'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        
        return null;
      }

      // limit(1) 사용 시 배열로 반환되므로 첫 번째 요소 추출
      const result = Array.isArray(data) ? data[0] : data;
      
      if (!result) {
        console.log('📋 세션 파라미터 없음 (새 세션)');
        return null;
      }

      // collection_status가 undefined인 경우 기본값 설정
      if (!result.collection_status) {
        result.collection_status = 'incomplete';
      }

      console.log('✅ 세션 파라미터 조회 성공:', result);
      return result;
    } catch (error) {
      console.error('❌ Error in getSessionParameters:', error);
      
      // 타임아웃이나 기타 에러 시에도 빈 파라미터 반환
      if (error.message?.includes('Timeout') || error.message?.includes('406') || 
          error.message?.includes('Not Acceptable')) {
        console.error('🚨 타임아웃 또는 406 에러 - 빈 파라미터로 계속 진행');
        try {
          const { data: { user } } = await supabase.auth.getUser();
          return {
            id: 'temp-' + Date.now(),
            chat_session_id: sessionId,
            user_id: user?.id || '',
            collection_status: 'incomplete' as const,
            missing_params: ['title', 'destination', 'startDate', 'endDate', 'peopleCount', 'budget', 'travelStyle', 'transportation', 'accommodation'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        } catch (authError) {
          console.error('❌ 인증 에러도 발생:', authError);
          return null;
        }
      }
      
      return null;
    }
  },

  async createOrUpdateSessionParameters(
    sessionId: string,
    userId: string,
    params: Partial<TravelParameters>,
    missingParams: string[] = []
  ): Promise<SessionParameters | null> {
    try {
      // 현재 인증된 사용자 확인
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔐 createOrUpdate - 인증 사용자:', user?.id || 'NULL');
      console.log('🔐 createOrUpdate - 전달받은 userId:', userId);
      
      const collectionStatus = missingParams.length === 0 ? 'complete' : 'incomplete';

      const { data: existing, error: fetchError } = await supabase
        .from('session_parameters')
        .select('*')  // 모든 필드를 가져와서 병합
        .eq('chat_session_id', sessionId)
        .single();
      
      // 404 에러는 무시 (데이터가 없는 경우)
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing session parameters:', fetchError);
      }

      if (existing) {
        // Update existing - 기존 데이터와 병합
        console.log('📝 기존 데이터:', existing);
        console.log('📝 새로운 파라미터:', params);
        
        const { data, error } = await supabase
          .from('session_parameters')
          .update({
            title: params.title !== undefined ? params.title : existing.title,
            destination: params.destination !== undefined ? params.destination : existing.destination,
            start_date: params.startDate !== undefined ? params.startDate : existing.start_date,
            end_date: params.endDate !== undefined ? params.endDate : existing.end_date,
            duration: params.duration !== undefined ? params.duration : existing.duration,
            people_count: params.peopleCount !== undefined ? params.peopleCount : (params.people_count !== undefined ? params.people_count : existing.people_count),
            budget: params.budget !== undefined ? params.budget : existing.budget,
            transportation: params.transportation !== undefined ? params.transportation : existing.transportation,
            accommodation: params.accommodation !== undefined ? params.accommodation : existing.accommodation,
            travel_style: params.travelStyle !== undefined ? params.travelStyle : (params.travel_style !== undefined ? params.travel_style : existing.travel_style),
            missing_params: missingParams,
            collection_status: collectionStatus,
            updated_at: new Date().toISOString()
          })
          .eq('chat_session_id', sessionId)
          .select()
          .single();

        if (error) {
          console.error('Error updating session parameters:', error);
          return null;
        }

        return data;
      } else {
        // Create new
        console.log('🆕 새로운 세션 파라미터 생성');
        const { data, error } = await supabase
          .from('session_parameters')
          .insert({
            chat_session_id: sessionId,
            user_id: userId,
            title: params.title,
            destination: params.destination,
            start_date: params.startDate,
            end_date: params.endDate,
            duration: params.duration,
            people_count: params.peopleCount || params.people_count,
            budget: params.budget,
            transportation: params.transportation,
            accommodation: params.accommodation,
            travel_style: params.travelStyle || params.travel_style,
            missing_params: missingParams,
            collection_status: collectionStatus,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating session parameters:', error);
          return null;
        }

        return data;
      }
    } catch (error) {
      console.error('Error in createOrUpdateSessionParameters:', error);
      return null;
    }
  },

  // Travel Plans CRUD
  async createTravelPlan(
    userId: string,
    sessionId: string,
    params: TravelParameters,
    plan: TravelPlan
  ): Promise<TravelPlanDB | null> {
    try {
      const { data, error } = await supabase
        .from('travel_plans')
        .insert({
          user_id: userId,
          created_from_session_id: sessionId,
          title: plan.title,
          destination: plan.destination,
          start_date: plan.startDate,
          end_date: plan.endDate,
          duration: plan.duration,
          people_count: params.peopleCount || 1,
          budget: params.budget,
          transportation: params.transportation,
          accommodation: params.accommodation,
          travel_style: params.travelStyle,
          schedule: plan.schedule,
          ai_metadata: {
            tips: plan.tips,
            requirements: plan.requirements,
            currency: plan.currency,
            totalBudget: plan.totalBudget
          },
          status: 'draft'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating travel plan:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createTravelPlan:', error);
      return null;
    }
  },

  async getUserTravelPlans(userId: string): Promise<TravelPlanDB[]> {
    try {
      const { data, error } = await supabase
        .from('travel_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching travel plans:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserTravelPlans:', error);
      return [];
    }
  },

  async getTravelPlan(planId: string): Promise<TravelPlanDB | null> {
    try {
      const { data, error } = await supabase
        .from('travel_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (error) {
        console.error('Error fetching travel plan:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getTravelPlan:', error);
      return null;
    }
  },

  async updateTravelPlan(
    planId: string,
    updates: Partial<TravelPlanDB>
  ): Promise<TravelPlanDB | null> {
    try {
      const { data, error } = await supabase
        .from('travel_plans')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId)
        .select()
        .single();

      if (error) {
        console.error('Error updating travel plan:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateTravelPlan:', error);
      return null;
    }
  },

  // Session Parameters 삭제
  async deleteSessionParameters(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('session_parameters')
        .delete()
        .eq('chat_session_id', sessionId);

      if (error) {
        console.error('Error deleting session parameters:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteSessionParameters:', error);
      return false;
    }
  },

  // 특정 여행 계획 삭제 (개별 계획 관리용)
  async deleteTravelPlan(planId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('travel_plans')
        .delete()
        .eq('id', planId);

      if (error) {
        console.error('Error deleting travel plan:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteTravelPlan:', error);
      return false;
    }
  }
};