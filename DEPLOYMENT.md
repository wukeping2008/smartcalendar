# 智能日历 v4.0 部署文档

## 🚀 快速部署指南

### 1. 环境要求
- Node.js 18.0.0 或更高版本
- npm 9.0.0 或更高版本  
- Git 2.0 或更高版本

### 2. 克隆项目
```bash
git clone https://github.com/your-username/smartcalendar.git
cd smartcalendar
```

### 3. 安装依赖
```bash
npm install
```

### 4. 配置环境变量
创建 `.env.local` 文件并添加以下配置：

```env
# AI服务配置
NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-xxx
NEXT_PUBLIC_OPENAI_API_KEY=sk-xxx
NEXT_PUBLIC_AZURE_SPEECH_KEY=xxx
NEXT_PUBLIC_AZURE_SPEECH_REGION=southeastasia

# 市场数据API（可选）
NEXT_PUBLIC_MARKET_DATA_API_KEY=your_market_api_key

# LLM服务配置（可选）
NEXT_PUBLIC_LLM_API_URL=https://your-llm-endpoint.com
NEXT_PUBLIC_LLM_API_TOKEN=xxx
```

### 5. 启动开发服务器
```bash
npm run dev
```
访问 http://localhost:3000

### 6. 生产部署

#### 构建项目
```bash
npm run build
```

#### 启动生产服务器
```bash
npm run start
```

## 📦 Docker 部署

### 创建 Dockerfile
```dockerfile
FROM node:18-alpine AS base

# 安装依赖
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# 构建应用
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# 生产镜像
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### 构建和运行 Docker 容器
```bash
# 构建镜像
docker build -t smartcalendar:v4.0 .

# 运行容器
docker run -p 3000:3000 --env-file .env.local smartcalendar:v4.0
```

## ☁️ 云平台部署

### Vercel 部署（推荐）

1. **连接 GitHub 仓库**
   - 访问 https://vercel.com
   - 导入 GitHub 项目

2. **配置环境变量**
   - 在 Vercel Dashboard → Settings → Environment Variables
   - 添加所有必需的环境变量：
     - `NEXT_PUBLIC_ANTHROPIC_API_KEY`
     - `NEXT_PUBLIC_OPENAI_API_KEY`
     - `NEXT_PUBLIC_AZURE_SPEECH_KEY`
     - `NEXT_PUBLIC_AZURE_SPEECH_REGION`

3. **部署**
   - Vercel 会自动部署主分支的每次提交
   - 也可以手动触发重新部署

### Railway 部署
1. 连接 GitHub 仓库
2. 在 Railway 控制台配置环境变量
3. 自动部署

### Netlify 部署
```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 构建项目
npm run build

# 部署到 Netlify
netlify deploy --prod --dir=.next
```

### Azure App Service 部署
```bash
# 安装 Azure CLI
az webapp up --name smartcalendar-v4 --resource-group myResourceGroup --plan myAppServicePlan
```

## 🔑 API 密钥获取指南

### 1. Anthropic Claude API
- 访问: https://console.anthropic.com/
- 创建账号并获取 API 密钥
- 注意：需要付费订阅

### 2. OpenAI API
- 访问: https://platform.openai.com/
- 注册并获取 API 密钥
- 需要充值使用额度

### 3. Azure Speech Services
- 访问: https://azure.microsoft.com/services/cognitive-services/speech-services/
- 创建语音服务资源
- 获取密钥和区域信息
- 免费层每月有限额

## 🔧 性能优化建议

### 1. 启用缓存
- 使用 Redis 缓存 AI 响应
- 配置 CDN 加速静态资源
- 启用 Next.js ISR (增量静态再生)

### 2. 数据库优化
- 使用 PostgreSQL 或 MongoDB
- 配置连接池
- 添加适当的索引

### 3. 监控配置
```env
# 添加监控服务
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
NEW_RELIC_LICENSE_KEY=your_newrelic_key
```

### 4. 负载均衡
使用 PM2 进行进程管理：
```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start npm --name "smartcalendar" -- start

# 查看状态
pm2 status

# 配置自动重启
pm2 startup
pm2 save
```

## 🛡️ 安全配置

### 1. HTTPS 配置
- 使用 Let's Encrypt 获取免费 SSL 证书
- 配置自动更新证书

### 2. 环境变量安全
- 不要提交 `.env.local` 到版本控制
- 使用密钥管理服务（如 Azure Key Vault）
- 定期轮换 API 密钥

### 3. API 速率限制
配置 API 请求限制防止滥用：
```javascript
// middleware.ts
export const config = {
  matcher: '/api/:path*',
}
```

### 4. CORS 配置
在 `next.config.js` 中配置允许的域名

## 📊 监控和日志

### 1. 健康检查端点
访问 `/api/health` 检查服务状态

### 2. 日志收集
- 使用 Winston 或 Pino 记录日志
- 配置日志轮转
- 集成日志分析服务

### 3. 性能监控
- 使用 Application Insights 或 New Relic
- 监控关键指标：响应时间、错误率、CPU/内存使用

## 🔄 更新和维护

### 1. 更新依赖
```bash
npm update
npm audit fix
```

### 2. 数据备份
- 定期备份用户数据和配置
- 使用自动备份脚本

### 3. 版本管理
- 使用语义化版本号：major.minor.patch
- 维护更新日志 CHANGELOG.md

## 📝 故障排除

### 常见问题

#### 1. 端口占用
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

#### 2. 依赖安装失败
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### 3. 构建失败
```bash
rm -rf .next
npm run build
```

#### 4. 内存不足
增加 Node.js 内存限制：
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

#### 5. AI 功能不工作
- 检查浏览器控制台错误信息
- 验证环境变量是否正确配置
- 确认 API 密钥有效且有余额
- 检查网络连接和防火墙设置

## 🎯 功能可用性检查

部署后，以下 AI 功能需要对应的 API 密钥才能正常工作：

| 功能 | 所需密钥 | 影响 |
|------|---------|------|
| AI智能推荐 | ANTHROPIC_API_KEY 或 OPENAI_API_KEY | 无密钥时功能降级，使用本地规则 |
| 自然语言输入 | ANTHROPIC_API_KEY 或 OPENAI_API_KEY | 无密钥时无法解析自然语言 |
| 语音输入 | AZURE_SPEECH_KEY | 无密钥时语音功能不可用 |
| 语音合成 | AZURE_SPEECH_KEY | 无密钥时无法朗读内容 |
| 情境感知 | ANTHROPIC_API_KEY | 无密钥时使用本地规则引擎 |

## 💰 成本控制建议

1. **设置 API 使用上限**
   - 在各平台设置月度使用限额
   - 实施用户级别的配额管理

2. **实施缓存机制**
   - 缓存常见 AI 响应
   - 使用本地规则减少 API 调用

3. **选择合适的模型**
   - 根据任务选择合适大小的模型
   - 非关键任务使用更经济的选项

4. **监控使用量**
   - 设置使用量告警
   - 定期审查 API 使用报告

## 📧 支持

如有问题，请联系：
- GitHub Issues: [项目地址]/issues
- 技术支持邮箱: support@smartcalendar.com
- 文档网站: https://docs.smartcalendar.com

---

最后更新：2025-01-20
版本：v4.0.0