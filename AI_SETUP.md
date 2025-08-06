# AI Assistant Setup Guide

## Overview
The Smart Calendar v2 AI Assistant now supports multiple AI providers:
- OpenAI GPT-4
- Anthropic Claude
- Local fallback (when APIs are unavailable)
- Third-party LLM service (already configured)

## Configuration

### 1. Set up API Keys

Edit the `.env.local` file and add your API keys:

```env
# AI服务配置
NEXT_PUBLIC_OPENAI_API_KEY=your_actual_openai_api_key
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_actual_anthropic_api_key
```

### 2. Get API Keys

- **OpenAI**: Visit https://platform.openai.com/api-keys
- **Anthropic**: Visit https://console.anthropic.com/account/keys

### 3. Features

The AI Assistant provides:
- **Natural Language Processing**: Parse voice commands and text input
- **Smart Suggestions**: AI-powered recommendations for schedule optimization
- **Conflict Resolution**: Intelligent solutions for time conflicts
- **Task Breakdown**: Decompose complex tasks into manageable subtasks
- **Chat Interface**: Interactive AI conversation for calendar management

### 4. How It Works

The system uses a fallback mechanism:
1. **Primary**: Anthropic Claude (if configured)
2. **Secondary**: OpenAI GPT-4 (if configured)
3. **Fallback**: Local rule-based responses
4. **LLM Service**: Third-party service for chat interface

### 5. Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the application and click on the AI Assistant panel

3. Try these test commands:
   - "今天有什么安排？"
   - "明天下午2点开会"
   - "帮我优化今天的日程"
   - "如何提高工作效率？"

### 6. Troubleshooting

If the AI features don't work:
1. Check that API keys are correctly set in `.env.local`
2. Ensure you have valid API credits
3. Check browser console for error messages
4. The system will automatically fall back to local responses if APIs fail

## Cost Considerations

- **OpenAI GPT-4o-mini**: ~$0.15 per 1M input tokens
- **Anthropic Claude**: ~$3 per 1M input tokens
- **Local fallback**: Free but limited functionality

## Security Notes

- Never commit API keys to version control
- Use environment variables for all sensitive data
- The keys are only used in the browser (client-side)
- Consider implementing a backend proxy for production use