import { supabase } from './supabase';
import { TravelParameters, TravelPlan } from './openai';

// Session Parameters 인터페이스
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
  missing_params?: string[];
  created_at: string;
  updated_at: string;
}

// Travel Plan DB 인터페이스
export interface TravelPlanDB {
  id: string;
  user_id: string;
  chat_session_id?: string;
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
      const { data, error } = await supabase
        .from('session_parameters')
        .select('*')
        .eq('chat_session_id', sessionId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching session parameters:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getSessionParameters:', error);
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
      const collectionStatus = missingParams.length === 0 ? 'complete' : 'incomplete';

      const { data: existing, error: fetchError } = await supabase
        .from('session_parameters')
        .select('id')
        .eq('chat_session_id', sessionId)
        .single();
      
      // 404 에러는 무시 (데이터가 없는 경우)
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing session parameters:', fetchError);
      }

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('session_parameters')
          .update({
            destination: params.destination,
            duration: params.duration,
            people_count: params.peopleCount,
            budget: params.budget,
            transportation: params.transportation,
            accommodation: params.accommodation,
            travel_style: params.travelStyle,
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
        const { data, error } = await supabase
          .from('session_parameters')
          .insert({
            chat_session_id: sessionId,
            user_id: userId,
            destination: params.destination,
            duration: params.duration,
            people_count: params.peopleCount,
            budget: params.budget,
            transportation: params.transportation,
            accommodation: params.accommodation,
            travel_style: params.travelStyle,
            missing_params: missingParams,
            collection_status: collectionStatus
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
          chat_session_id: sessionId,
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
  }
};