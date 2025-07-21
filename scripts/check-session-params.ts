#!/usr/bin/env node

// 환경 변수 수동 로딩
const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        if (line.trim() && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            process.env[key.trim()] = value;
          }
        }
      });
      console.log('✅ Environment variables loaded');
    }
  } catch (error) {
    console.error('❌ Error loading .env.local:', error);
  }
}

// 환경 변수 로드
loadEnvFile();

import { supabase } from '../lib/supabase';

async function main() {
  console.log('🔍 Checking session_parameters table...\n');
  
  try {
    // 최근 세션 파라미터 조회
    const { data: sessions, error } = await supabase
      .from('session_parameters')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    console.log('📊 Recent Session Parameters:');
    console.log('=' .repeat(80));
    
    if (sessions && sessions.length > 0) {
      sessions.forEach((session, index) => {
        console.log(`\n${index + 1}. Session ID: ${session.session_id}`);
        console.log(`   Created: ${new Date(session.created_at).toLocaleString()}`);
        console.log(`   Status: ${session.collection_status || 'N/A'}`);
        
        // 8개 필수 파라미터 체크
        const requiredParams = [
          'title', 'destination', 'duration', 'people_count', 'budget', 
          'travel_style', 'transportation', 'accommodation'
        ];
        
        let completedCount = 0;
        console.log('   Parameters:');
        
        requiredParams.forEach(param => {
          const value = session[param];
          const status = value ? '✅' : '❌';
          console.log(`     ${param}: ${status} ${value || 'missing'}`);
          if (value) completedCount++;
        });
        
        console.log(`   Completion: ${completedCount}/8 (${Math.round(completedCount/8*100)}%)`);
        
        if (session.missing_params) {
          console.log(`   Missing: ${JSON.stringify(session.missing_params)}`);
        }
      });
    } else {
      console.log('No session parameters found.');
    }
    
    // 오늘 생성된 세션들 체크
    const today = new Date().toISOString().split('T')[0];
    const { data: todaySessions, error: todayError } = await supabase
      .from('session_parameters')
      .select('*')
      .gte('created_at', today + 'T00:00:00')
      .order('created_at', { ascending: false });

    if (todayError) throw todayError;

    console.log(`\n\n📅 Today's Sessions (${today}):`);
    console.log('=' .repeat(80));
    
    if (todaySessions && todaySessions.length > 0) {
      console.log(`Found ${todaySessions.length} session(s) created today.`);
      
      todaySessions.forEach((session, index) => {
        const requiredParams = [
          'destination', 'duration', 'people_count', 'budget', 
          'travel_style', 'transportation', 'accommodation'
        ];
        
        let completedCount = 0;
        requiredParams.forEach(param => {
          if (session[param]) completedCount++;
        });
        
        console.log(`\n${index + 1}. Session: ${session.session_id}`);
        console.log(`   Time: ${new Date(session.created_at).toLocaleTimeString()}`);
        console.log(`   Status: ${session.collection_status}`);
        console.log(`   Completion: ${completedCount}/8 parameters`);
        
        if (completedCount < 8 && session.collection_status === 'complete') {
          console.log(`   ⚠️  WARNING: Marked as complete but only ${completedCount}/8 parameters!`);
        }
      });
    } else {
      console.log('No sessions created today.');
    }

  } catch (error) {
    console.error('❌ Error checking session parameters:', error);
    process.exit(1);
  }
}

main().catch(console.error);