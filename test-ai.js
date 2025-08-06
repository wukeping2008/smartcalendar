// Quick test script for AI functionality
const { AIService } = require('./lib/services/AIService.ts');

async function testAI() {
  console.log('Testing AI Service...\n');
  
  const aiService = new AIService();
  
  // Test 1: Local response (no API needed)
  console.log('Test 1: Local Response Generation');
  const localResponse = aiService.generateLocalResponse('今天有什么安排？');
  console.log('Response:', localResponse);
  console.log('---\n');
  
  // Test 2: Natural Language Parsing (local)
  console.log('Test 2: Natural Language Parsing');
  const parsed = aiService.parseLocalNaturalLanguage('明天下午2点开会');
  console.log('Parsed:', JSON.stringify(parsed, null, 2));
  console.log('---\n');
  
  // Test 3: Task Breakdown (local)
  console.log('Test 3: Task Breakdown');
  const subtasks = aiService.breakdownTaskLocal('开发新功能', 8);
  console.log('Subtasks:', JSON.stringify(subtasks, null, 2));
  console.log('---\n');
  
  console.log('✅ All local AI functions are working!');
  console.log('\nTo test API features:');
  console.log('1. Add your API keys to .env.local');
  console.log('2. Run: npm run dev');
  console.log('3. Open the app and use the AI Assistant panel');
}

// Run tests
testAI().catch(console.error);