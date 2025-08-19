# 部署配置指南

## AI功能部署准备

### 必需的环境变量

部署到生产环境时，需要在托管平台（如Vercel、Netlify等）配置以下环境变量：

#### 1. AI服务密钥

```env
# Claude API (Anthropic)
NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-xxx

# OpenAI API
NEXT_PUBLIC_OPENAI_API_KEY=sk-xxx

# Azure 语音服务
NEXT_PUBLIC_AZURE_SPEECH_KEY=xxx
NEXT_PUBLIC_AZURE_SPEECH_REGION=southeastasia

# LLM服务配置（可选）
NEXT_PUBLIC_LLM_API_URL=https://node.long-arena.com
NEXT_PUBLIC_LLM_API_TOKEN=xxx
```

### 获取API密钥

1. **Anthropic Claude API**
   - 访问: https://console.anthropic.com/
   - 创建账号并获取API密钥
   - 注意：需要付费订阅

2. **OpenAI API**
   - 访问: https://platform.openai.com/
   - 注册并获取API密钥
   - 需要充值使用额度

3. **Azure Speech Services**
   - 访问: https://azure.microsoft.com/zh-cn/services/cognitive-services/speech-services/
   - 创建语音服务资源
   - 获取密钥和区域信息
   - 免费层每月有限额

### Vercel部署步骤

1. 在Vercel项目设置中添加环境变量：
   - 进入项目 Settings → Environment Variables
   - 添加上述所有必需的环境变量
   - 选择适用的环境（Production/Preview/Development）

2. 重新部署：
   - 环境变量配置后需要重新部署才能生效
   - 在Vercel Dashboard点击"Redeploy"

### 功能可用性检查

部署后，以下AI功能需要对应的API密钥才能正常工作：

| 功能 | 所需密钥 | 影响 |
|------|---------|------|
| AI智能推荐 | ANTHROPIC_API_KEY 或 OPENAI_API_KEY | 无密钥时功能降级，使用本地规则 |
| 自然语言输入 | ANTHROPIC_API_KEY 或 OPENAI_API_KEY | 无密钥时无法解析自然语言 |
| 语音输入 | AZURE_SPEECH_KEY | 无密钥时语音功能不可用 |
| 语音合成 | AZURE_SPEECH_KEY | 无密钥时无法朗读内容 |

### 安全注意事项

1. **密钥安全**
   - 永远不要将API密钥提交到Git仓库
   - 使用环境变量而非硬编码
   - 定期轮换密钥

2. **访问控制**
   - 考虑添加API请求限流
   - 实施用户认证和授权
   - 监控API使用量避免超额

3. **前端密钥暴露风险**
   - 当前使用`NEXT_PUBLIC_`前缀的环境变量会暴露在前端
   - 建议未来迁移到后端API路由处理敏感操作

### 测试AI功能

部署完成后，测试以下功能确保正常工作：

1. **AI助手对话**
   - 点击右侧AI助手图标
   - 发送消息测试响应

2. **智能事件创建**
   - 使用自然语言创建事件
   - 例如："明天下午3点开会"

3. **语音输入**（需要HTTPS）
   - 点击麦克风按钮
   - 说话测试语音识别

4. **市场数据**（如配置）
   - 检查市场状态栏数据更新

### 故障排查

如果AI功能不工作：

1. 检查浏览器控制台错误信息
2. 验证环境变量是否正确配置
3. 确认API密钥有效且有余额
4. 检查网络连接和防火墙设置

### 成本控制建议

1. 设置API使用上限
2. 实施缓存机制减少重复调用
3. 考虑使用更经济的模型版本
4. 监控每月使用量

---

更新时间: 2025-01-17