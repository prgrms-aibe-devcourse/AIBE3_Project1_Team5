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
      console.log('✅ Environment variables loaded from .env.local');
      console.log('🔧 SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Found' : 'Missing');
      console.log('🔧 SUPABASE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Found' : 'Missing');
    } else {
      console.log('⚠️ .env.local file not found');
    }
  } catch (error) {
    console.error('❌ Error loading .env.local:', error);
  }
}

// 환경 변수 로드
loadEnvFile();

import { RealChatAnalyzer } from '../lib/realChatAnalyzer';

async function main() {
  const args = process.argv.slice(2);
  const days = parseInt(args[0]) || 7; // 기본 7일

  console.log(`🔍 Starting real chat analysis for the last ${days} days...`);
  
  try {
    const analyzer = new RealChatAnalyzer();
    
    // 실제 채팅 데이터 분석
    const analysis = await analyzer.analyzeRecentChats(days);
    
    // 분석 리포트 생성
    const report = await analyzer.generateAnalysisReport(analysis);
    
    // 콘솔에 출력
    console.log(report);
    
    // 파일로 저장
    const reportDir = path.join(process.cwd(), 'chat-analysis-reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const filename = `real-chat-analysis-${Date.now()}.txt`;
    const filepath = path.join(reportDir, filename);
    fs.writeFileSync(filepath, report);
    
    console.log(`\n💾 Report saved: ${filepath}`);
    
    // JSON 데이터도 저장
    const jsonFilename = `real-chat-analysis-${Date.now()}.json`;
    const jsonFilepath = path.join(reportDir, jsonFilename);
    fs.writeFileSync(jsonFilepath, JSON.stringify(analysis, null, 2));
    
    console.log(`💾 Raw data saved: ${jsonFilepath}`);
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

// 도움말 표시
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
📊 Real Chat Analyzer

Usage: npx tsx scripts/analyze-real-chats.ts [days]

Arguments:
  days    Number of days to analyze (default: 7)

Examples:
  npx tsx scripts/analyze-real-chats.ts        # Analyze last 7 days
  npx tsx scripts/analyze-real-chats.ts 30     # Analyze last 30 days
  npx tsx scripts/analyze-real-chats.ts 1      # Analyze last 1 day
`);
  process.exit(0);
}

main().catch(console.error);