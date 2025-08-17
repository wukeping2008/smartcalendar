/**
 * Azure Speech Service 配置测试脚本
 * 用于验证环境变量配置是否正确
 */

const fs = require('fs');
const path = require('path');

// 手动读取.env.local文件
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env.local');
  const config = {};
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          config[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
  } catch (error) {
    console.error('❌ 无法读取.env.local文件:', error.message);
    return {};
  }
  
  return config;
}

const envConfig = loadEnvFile();
const config = {
  speechKey: envConfig.NEXT_PUBLIC_AZURE_SPEECH_KEY,
  speechRegion: envConfig.NEXT_PUBLIC_AZURE_SPEECH_REGION,
};

console.log('🔍 Azure Speech Service 配置检查');
console.log('=====================================');

// 检查配置
const checks = [
  {
    name: 'Speech Key',
    value: config.speechKey,
    expected: '应该是有效的Azure密钥(32位或更长)',
    valid: config.speechKey && config.speechKey.length >= 32 && /^[A-Za-z0-9]+$/.test(config.speechKey)
  },
  {
    name: 'Speech Region',
    value: config.speechRegion,
    expected: 'southeastasia',
    valid: config.speechRegion === 'southeastasia'
  }
];

let allValid = true;

checks.forEach(check => {
  const status = check.valid ? '✅' : '❌';
  console.log(`${status} ${check.name}:`);
  console.log(`   值: ${check.value || '未设置'}`);
  console.log(`   预期: ${check.expected}`);
  console.log('');
  
  if (!check.valid) {
    allValid = false;
  }
});

if (allValid) {
  console.log('🎉 所有配置检查通过！Azure Speech Service 应该可以正常工作。');
} else {
  console.log('⚠️  存在配置问题，请检查上述错误项。');
}

console.log('\n📝 注意事项:');
console.log('- 确保已重启开发服务器以加载新的环境变量');
console.log('- 如果使用的是客户端组件，确保变量名以 NEXT_PUBLIC_ 开头');
console.log('- 检查 Azure Portal 中的密钥是否仍然有效');
