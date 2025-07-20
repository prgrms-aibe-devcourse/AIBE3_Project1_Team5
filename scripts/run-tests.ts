#!/usr/bin/env node

// 환경 변수 수동 로딩
import * as fs from 'fs';
import * as path from 'path';

function loadEnvFile() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value;
        }
      });
      console.log('✅ Environment variables loaded from .env.local');
    } else {
      console.log('⚠️ .env.local file not found');
    }
  } catch (error) {
    console.error('❌ Error loading .env.local:', error);
  }
}

// 환경 변수 로드
loadEnvFile();

import { ChatbotTester } from '../test/chatbot-test';
import { ConversationLogger } from '../lib/conversationLogger';
import { ChatAnalyzer } from '../lib/chatAnalyzer';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface TestConfig {
  mode: 'single' | 'continuous' | 'analysis';
  sessionId?: string;
  duration?: number; // 연속 테스트 시 실행 시간 (분)
  interval?: number; // 연속 테스트 시 간격 (초)
}

class TestRunner {
  private tester: ChatbotTester;
  private logger: ConversationLogger;
  private analyzer: ChatAnalyzer;
  private isRunning: boolean = false;

  constructor() {
    this.tester = new ChatbotTester();
    this.logger = new ConversationLogger();
    this.analyzer = new ChatAnalyzer();
  }

  async runSingleTest(sessionId?: string): Promise<void> {
    console.log('🚀 Starting single test run...');
    
    try {
      const results = await this.tester.runAllTests(sessionId);
      
      console.log('\n📊 TEST SUMMARY:');
      console.log('================');
      
      const successful = results.filter(r => r.success).length;
      const failed = results.length - successful;
      
      console.log(`✅ Successful: ${successful}/${results.length}`);
      console.log(`❌ Failed: ${failed}/${results.length}`);
      console.log(`📈 Success Rate: ${((successful / results.length) * 100).toFixed(1)}%`);
      
      if (failed > 0) {
        console.log('\n❌ FAILED TESTS:');
        results.filter(r => !r.success).forEach(result => {
          console.log(`\n${result.scenarioName}:`);
          result.issues.forEach(issue => console.log(`  - ${issue}`));
        });
      }
      
      // 분석 리포트 생성
      await this.generateAnalysisReport();
      
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    }
  }

  async runContinuousTest(duration: number = 60, interval: number = 30): Promise<void> {
    console.log(`🔄 Starting continuous test run for ${duration} minutes...`);
    console.log(`⏱️  Test interval: ${interval} seconds`);
    
    this.isRunning = true;
    const endTime = Date.now() + (duration * 60 * 1000);
    let testCount = 0;
    
    while (this.isRunning && Date.now() < endTime) {
      testCount++;
      console.log(`\n📋 Running test batch #${testCount}...`);
      
      try {
        const sessionId = `continuous-test-${testCount}-${Date.now()}`;
        await this.tester.runAllTests(sessionId);
        
        console.log(`✅ Test batch #${testCount} completed`);
        
        // 간격 대기
        if (this.isRunning && Date.now() < endTime) {
          console.log(`⏸️  Waiting ${interval} seconds before next test...`);
          await new Promise(resolve => setTimeout(resolve, interval * 1000));
        }
        
      } catch (error) {
        console.error(`❌ Test batch #${testCount} failed:`, error);
        // 연속 테스트에서는 실패해도 계속 진행
      }
    }
    
    console.log(`\n🎉 Continuous testing completed. Total batches: ${testCount}`);
    await this.generateAnalysisReport();
  }

  async runAnalysisOnly(): Promise<void> {
    console.log('📊 Running analysis only...');
    
    try {
      // 시스템 분석 실행
      const report = await this.analyzer.generateAnalysisReport();
      console.log('\n' + report);
      
      // 대화별 분석 (최근 10개 세션)
      const { data: recentSessions } = await this.getRecentSessions(10);
      
      if (recentSessions && recentSessions.length > 0) {
        console.log('\n📋 RECENT SESSION ANALYSIS:');
        console.log('============================');
        
        for (const session of recentSessions) {
          const sessionReport = await this.analyzer.generateAnalysisReport(session.id);
          console.log('\n' + sessionReport);
        }
      }
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    }
  }

  private async getRecentSessions(limit: number = 10): Promise<{data: any[]}> {
    // 실제 구현에서는 Supabase 쿼리 사용
    try {
      const { supabase } = await import('../lib/supabase');
      return await supabase
        .from('chat_sessions')
        .select('id, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);
    } catch (error) {
      console.error('Error fetching recent sessions:', error);
      return { data: [] };
    }
  }

  private async generateAnalysisReport(): Promise<void> {
    try {
      console.log('\n📊 Generating comprehensive analysis report...');
      
      const report = await this.analyzer.generateAnalysisReport();
      console.log('\n' + report);
      
      // 리포트 파일 저장
      const fs = require('fs');
      const path = require('path');
      
      const reportDir = path.join(__dirname, '../test-reports');
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }
      
      const reportFile = path.join(reportDir, `analysis-report-${Date.now()}.txt`);
      fs.writeFileSync(reportFile, report);
      
      console.log(`💾 Analysis report saved: ${reportFile}`);
      
    } catch (error) {
      console.error('❌ Failed to generate analysis report:', error);
    }
  }

  async setupDatabase(): Promise<void> {
    console.log('🗃️  Setting up database schema...');
    
    try {
      // SQL 파일 실행
      const fs = require('fs');
      const path = require('path');
      
      const sqlFile = path.join(__dirname, 'setup-test-system.sql');
      const sqlContent = fs.readFileSync(sqlFile, 'utf8');
      
      // 실제 구현에서는 PostgreSQL 연결하여 SQL 실행
      const { supabase } = await import('../lib/supabase');
      
      // SQL을 여러 개의 명령으로 분할하여 실행
      const commands = sqlContent.split(';').filter(cmd => cmd.trim());
      
      for (const command of commands) {
        if (command.trim()) {
          try {
            await supabase.rpc('execute_sql', { sql_query: command.trim() });
          } catch (error) {
            // 이미 존재하는 테이블/함수 등은 무시
            if (!error.message.includes('already exists')) {
              console.warn(`Warning executing SQL: ${error.message}`);
            }
          }
        }
      }
      
      console.log('✅ Database schema setup completed');
      
    } catch (error) {
      console.error('❌ Database setup failed:', error);
      throw error;
    }
  }

  async startDevServer(): Promise<void> {
    console.log('🚀 Starting development server...');
    
    try {
      // 개발 서버가 이미 실행 중인지 확인
      try {
        const response = await fetch('http://localhost:3000/api/health');
        if (response.ok) {
          console.log('✅ Development server is already running');
          return;
        }
      } catch (error) {
        // 서버가 실행되지 않은 상태
      }
      
      // 새로운 프로세스로 개발 서버 시작
      const { spawn } = require('child_process');
      const serverProcess = spawn('npm', ['run', 'dev'], {
        cwd: process.cwd(),
        stdio: 'inherit',
        detached: true
      });
      
      // 서버 시작 대기
      console.log('⏳ Waiting for server to start...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // 서버 상태 확인
      const response = await fetch('http://localhost:3000/api/health');
      if (response.ok) {
        console.log('✅ Development server started successfully');
      } else {
        throw new Error('Server health check failed');
      }
      
    } catch (error) {
      console.error('❌ Failed to start development server:', error);
      throw error;
    }
  }

  stop(): void {
    console.log('⏹️  Stopping test runner...');
    this.isRunning = false;
    this.logger.destroy();
  }
}

// CLI 인터페이스
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const runner = new TestRunner();
  
  // 프로세스 종료 시 정리
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, stopping...');
    runner.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, stopping...');
    runner.stop();
    process.exit(0);
  });
  
  try {
    switch (command) {
      case 'setup':
        await runner.setupDatabase();
        break;
        
      case 'server':
        await runner.startDevServer();
        break;
        
      case 'test':
        const sessionId = args[1];
        await runner.runSingleTest(sessionId);
        break;
        
      case 'continuous':
        const duration = parseInt(args[1]) || 60;
        const interval = parseInt(args[2]) || 30;
        await runner.runContinuousTest(duration, interval);
        break;
        
      case 'analyze':
        await runner.runAnalysisOnly();
        break;
        
      case 'all':
        console.log('🎯 Running complete test suite...');
        await runner.setupDatabase();
        await runner.startDevServer();
        await runner.runSingleTest();
        await runner.runAnalysisOnly();
        break;
        
      default:
        console.log('🤖 Chatbot Test Runner');
        console.log('======================');
        console.log('Usage: npm run test-chatbot <command> [options]');
        console.log('');
        console.log('Commands:');
        console.log('  setup                    - Setup database schema');
        console.log('  server                   - Start development server');
        console.log('  test [sessionId]         - Run single test suite');
        console.log('  continuous <min> <sec>   - Run continuous tests');
        console.log('  analyze                  - Run analysis only');
        console.log('  all                      - Run complete test suite');
        console.log('');
        console.log('Examples:');
        console.log('  npm run test-chatbot setup');
        console.log('  npm run test-chatbot test');
        console.log('  npm run test-chatbot continuous 30 60');
        console.log('  npm run test-chatbot analyze');
        console.log('  npm run test-chatbot all');
        break;
    }
    
  } catch (error) {
    console.error('❌ Command failed:', error);
    process.exit(1);
  }
}

// 모듈로 사용될 때는 실행하지 않음
if (require.main === module) {
  main();
}

export { TestRunner };