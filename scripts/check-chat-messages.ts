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
  console.log('🔍 Checking chat_messages table...\n');
  
  try {
    // 최근 메시지 조회
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    console.log('📊 Recent Chat Messages:');
    console.log('=' .repeat(100));
    
    if (messages && messages.length > 0) {
      messages.forEach((message, index) => {
        const createdAt = new Date(message.created_at);
        const isToday = createdAt.toDateString() === new Date().toDateString();
        
        console.log(`\n${index + 1}. ${isToday ? '🟢 TODAY' : '📅'} ${createdAt.toLocaleString()}`);
        console.log(`   ID: ${message.id}`);
        console.log(`   Session: ${message.session_id || 'N/A'}`);
        console.log(`   User: ${message.user_id || 'N/A'}`);
        console.log(`   Role: ${message.role}`);
        console.log(`   Content: "${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}"`);
        
        if (message.metadata) {
          console.log(`   Metadata: ${JSON.stringify(message.metadata)}`);
        }
      });
    } else {
      console.log('No chat messages found.');
    }
    
    // 오늘 메시지 통계
    const today = new Date().toISOString().split('T')[0];
    const { data: todayMessages, error: todayError } = await supabase
      .from('chat_messages')
      .select('role')
      .gte('created_at', today + 'T00:00:00');

    if (todayError) throw todayError;

    console.log(`\n\n📈 Today's Statistics (${today}):`);
    console.log('=' .repeat(100));
    
    if (todayMessages && todayMessages.length > 0) {
      const userMessages = todayMessages.filter(m => m.role === 'user').length;
      const assistantMessages = todayMessages.filter(m => m.role === 'assistant').length;
      const totalMessages = todayMessages.length;
      
      console.log(`💬 Total Messages: ${totalMessages}`);
      console.log(`👤 User Messages: ${userMessages}`);
      console.log(`🤖 Assistant Messages: ${assistantMessages}`);
      console.log(`📊 User/Assistant Ratio: ${userMessages}:${assistantMessages}`);
      
      if (userMessages === 0) {
        console.log('\n⚠️  WARNING: No user messages found today!');
        console.log('   This might indicate an issue with message saving.');
      } else {
        console.log('\n✅ User messages are being saved properly.');
      }
    } else {
      console.log('No messages found today.');
      console.log('\n⚠️  WARNING: No messages saved today!');
      console.log('   Please test the chat interface to see if messages are being saved.');
    }

    // 실시간 모니터링 모드
    const args = process.argv.slice(2);
    if (args.includes('--watch') || args.includes('-w')) {
      console.log('\n🔄 Entering watch mode...');
      console.log('💡 Send a test message in the chat interface and watch for real-time updates.');
      console.log('Press Ctrl+C to exit.\n');
      
      let lastMessageCount = messages?.length || 0;
      
      setInterval(async () => {
        try {
          const { data: latestMessages, error: latestError } = await supabase
            .from('chat_messages')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

          if (latestError) throw latestError;

          const currentCount = latestMessages?.length || 0;
          
          if (latestMessages && latestMessages.length > 0) {
            const latestMessage = latestMessages[0];
            const messageTime = new Date(latestMessage.created_at);
            const timeDiff = Date.now() - messageTime.getTime();
            
            // 새 메시지 (30초 이내)인지 체크
            if (timeDiff < 30000) {
              console.log(`🆕 NEW MESSAGE: [${messageTime.toLocaleTimeString()}] ${latestMessage.role}: "${latestMessage.content.substring(0, 80)}..."`);
            }
          }
        } catch (error) {
          console.error('❌ Watch error:', error);
        }
      }, 3000); // 3초마다 체크
    }

  } catch (error) {
    console.error('❌ Error checking chat messages:', error);
    process.exit(1);
  }
}

// 도움말 표시
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
📨 Chat Messages Checker

Usage: npm run check-messages [options]

Options:
  --watch, -w    Enter watch mode to monitor new messages in real-time
  --help, -h     Show this help message

Examples:
  npm run check-messages           # Check recent messages
  npm run check-messages -- --watch    # Monitor new messages in real-time
`);
  process.exit(0);
}

main().catch(console.error);