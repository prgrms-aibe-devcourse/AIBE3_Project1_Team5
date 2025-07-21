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
      
      if (!user?.id) {
        console.error('❌ 인증된 사용자가 없습니다');
        return null;
      }
      
      // 단순 쿼리 실행 (타임아웃 제거)
      const { data, error } = await supabase
        .from('session_parameters')
        .select('*')
        .eq('chat_session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('❌ Error fetching session parameters:', error);
        console.error('Error details:', { 
          code: error.code, 
          message: error.message, 
          hint: error.hint,
          sessionId 
        });
        return null;
      }
      
      if (!data) {
        return null;
      }
      
      // collection_status가 undefined인 경우 기본값 설정
      if (!data.collection_status) {
        data.collection_status = 'incomplete';
      }
      
      return data;
    } catch (error) {
      console.error('❌ Error in getSessionParameters:', error);
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
      
      const collectionStatus = missingParams.length === 0 ? 'complete' : 'incomplete';

      // 중복 row 문제 해결: 먼저 모든 row 확인
      const { data: allExisting, error: fetchAllError } = await supabase
        .from('session_parameters')
        .select('*')
        .eq('chat_session_id', sessionId)
        .order('created_at', { ascending: false });
      
      if (fetchAllError) {
        console.error('Error fetching existing session parameters:', fetchAllError);
      }
      
      // 중복 row가 있으면 정리
      if (allExisting && allExisting.length > 1) {
        const idsToDelete = allExisting.slice(1).map(row => row.id);
        const { error: deleteError } = await supabase
          .from('session_parameters')
          .delete()
          .in('id', idsToDelete);
        
        if (deleteError) {
          console.error('❌ 중복 row 삭제 실패:', deleteError);
        } else {
        }
      }
      
      const existing = allExisting && allExisting.length > 0 ? allExisting[0] : null;

      if (existing) {
        // Update existing - 기존 데이터와 병합
        
        // 업데이트할 데이터 준비 (DB 필드명 직접 사용)
        const updateData = {
          title: params.title !== undefined ? params.title : existing.title,
          destination: params.destination !== undefined ? params.destination : existing.destination,
          start_date: params.start_date !== undefined ? params.start_date : existing.start_date,
          end_date: params.end_date !== undefined ? params.end_date : existing.end_date,
          duration: params.duration !== undefined ? params.duration : existing.duration,
          people_count: params.people_count !== undefined ? params.people_count : existing.people_count,
          budget: params.budget !== undefined ? params.budget : existing.budget,
          transportation: params.transportation !== undefined ? params.transportation : existing.transportation,
          accommodation: params.accommodation !== undefined ? params.accommodation : existing.accommodation,
          travel_style: params.travel_style !== undefined ? params.travel_style : existing.travel_style,
          missing_params: missingParams,
          collection_status: collectionStatus,
          updated_at: new Date().toISOString()
        };
        
        
        const { data, error } = await supabase
          .from('session_parameters')
          .update(updateData)
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
        const { data, error } = await supabase
          .from('session_parameters')
          .insert({
            chat_session_id: sessionId,
            user_id: userId,
            title: params.title,
            destination: params.destination,
            start_date: params.start_date,
            end_date: params.end_date,
            duration: params.duration,
            people_count: params.people_count,
            budget: params.budget,
            transportation: params.transportation,
            accommodation: params.accommodation,
            travel_style: params.travel_style,
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
          start_date: plan.start_date,
          end_date: plan.end_date,
          duration: plan.duration,
          people_count: params.people_count || 1,
          budget: params.budget,
          transportation: params.transportation,
          accommodation: params.accommodation,
          travel_style: params.travel_style,
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

  // Session Parameters 초기화 (모든 기록 지우기용)
  async resetSessionParameters(sessionId: string, userId?: string): Promise<boolean> {
    try {
      
      // userId가 제공되지 않은 경우 인증된 사용자에서 가져오기
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        targetUserId = user?.id;
      }
      
      if (!targetUserId) {
        console.error('❌ User ID를 찾을 수 없습니다');
        return false;
      }
      
      
      // 먼저 기존 row가 있는지 확인
      const { data: existingRow, error: checkError } = await supabase
        .from('session_parameters')
        .select('*')
        .eq('chat_session_id', sessionId)
        .maybeSingle();
      
      
      // UPSERT 데이터 준비
      const upsertData = {
        chat_session_id: sessionId,
        user_id: targetUserId,
        title: null,
        destination: null,
        start_date: null,
        end_date: null,
        people_count: null,
        budget: null,
        travel_style: null,
        transportation: null,
        accommodation: null,
        duration: null,
        collection_status: 'incomplete' as const,
        missing_params: ['title', 'destination', 'start_date', 'end_date', 'people_count', 'budget', 'travel_style', 'transportation', 'accommodation'],
        updated_at: new Date().toISOString()
        // created_at은 UPSERT 시 자동 처리되도록 제외
      };
      
      
      // UPSERT: row가 있으면 UPDATE, 없으면 INSERT
      const { data, error } = await supabase
        .from('session_parameters')
        .upsert(upsertData, {
          onConflict: 'chat_session_id'
        })
        .select(); // 결과 데이터도 반환받기


      if (error) {
        console.error('❌ Error resetting session parameters:', error);
        console.error('❌ Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // UPSERT 실패 시 기존 row 확인 후 처리
        try {
          // 중복 row 정리: 가장 최근 것만 남기고 삭제
          const { data: allRows, error: fetchAllError } = await supabase
            .from('session_parameters')
            .select('id, created_at')
            .eq('chat_session_id', sessionId)
            .order('created_at', { ascending: false });
          
          if (!fetchAllError && allRows && allRows.length > 1) {
            // 첫 번째(최신)를 제외한 나머지 삭제
            const idsToDelete = allRows.slice(1).map(row => row.id);
            const { error: deleteError } = await supabase
              .from('session_parameters')
              .delete()
              .in('id', idsToDelete);
            
            if (deleteError) {
              console.error('❌ 중복 row 삭제 실패:', deleteError);
            } else {
                }
          }
          
          // 이제 UPDATE 시도
          if (allRows && allRows.length > 0) {
            const { data: updateData, error: updateError } = await supabase
              .from('session_parameters')
              .update(upsertData)
              .eq('chat_session_id', sessionId)
              .select();
            
            if (!updateError) {
              return true;
            }
          }
          
          // UPDATE 실패하면 INSERT 시도
          const { data: insertData, error: insertError } = await supabase
            .from('session_parameters')
            .insert({
              chat_session_id: sessionId,
              user_id: targetUserId,
              collection_status: 'incomplete',
              missing_params: ['title', 'destination', 'start_date', 'end_date', 'people_count', 'budget', 'travel_style', 'transportation', 'accommodation']
            })
            .select();
          
          if (insertError) {
            console.error('❌ Direct INSERT also failed:', insertError);
            return false;
          } else {
            return true;
          }
        } catch (insertCatchError) {
          console.error('❌ Exception during fallback processing:', insertCatchError);
          return false;
        }
      }

      
      // 실제로 row가 생성되었는지 확인
      const { data: verifyData, error: verifyError } = await supabase
        .from('session_parameters')
        .select('id, chat_session_id')
        .eq('chat_session_id', sessionId)
        .maybeSingle();
      
      if (verifyData) {
      } else {
        console.error('❌ Row 생성 확인 실패:', verifyError);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error in resetSessionParameters:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : String(error));
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