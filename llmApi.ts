  // 从环境变量读取配置，提高安全性
  const llmUrl = process.env.NEXT_PUBLIC_LLM_API_URL || 'https://node.long-arena.com';
  const token = process.env.NEXT_PUBLIC_LLM_API_TOKEN || '';

  // 验证token是否配置
  if (!token) {
    // LLM API Token未配置
  }

  // 调用此方法返回一个实例 含有cancel 可取消调用  使用方式 const llmInstance = postAiSSE({...})  llmInstance.cancel()
  export const postAiSSE = ({
    params,
    onData,
    onError,
    onComplete
  }: {
    params?: {
      modelName?: string;//deepseek|siliconDeepseek|volcesDeepseek|kimi|minimax-text|qwen-turbo-latest|alideepseekv3|volcesDeepseekR1
      messages?: Array<{role: string; content: string}>; //主要参数 openAi一致 一定传数组
      temperature?: string;//温度 openAi一致
      maxTokens?: number;//这个大多情况不需要传递 openAi一致
    };
    onData?: (data: string) => void;// 这个是重要参数 就是返回值的流式数据 
    onError?: (error: Error) => void;//错误信息 可以不传
    onComplete?: (tokens: number) => void; //返回输出token数量
  })=>{
    const controller = new AbortController();
    const signal = controller.signal;
    // 这个取得是本地的状态管理的的数据 就是类似神谕顶部切换模型和温度的select 也可以取localstorage 这个根据自己项目存值来获取
    //  我这边先写死
    // const {selectModel,temperature} = useAIModelState();
    const selectModel = 'volcesDeepseek';
    const temperature = '0.5';

    const requestData = {
      modelName:params?.modelName || selectModel || 'volcesDeepseek',
      messages: params?.messages || [],
      temperature:params?.temperature || temperature || '0.5',
      maxTokens: params?.maxTokens || 4096,
      stream: true
    };


    const headers = {
      'Content-Type': 'application/json',
      'token': token,
      'Accept': 'text/event-stream'
    };
    
    fetch(`${llmUrl}/api/ai/chat/stream`, {
      method: 'POST',
      headers: headers as HeadersInit,
      body: JSON.stringify(requestData),
      signal: signal
    })
    .then((response: Response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let outPutTokens = 0;
      function readChunk() {
        return reader.read().then(({ done, value }: ReadableStreamReadResult<Uint8Array>) => {
          if (done) {
            onComplete && onComplete(outPutTokens);
            controller.abort()
            return;
          }
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          // 按行处理 SSE 数据
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // 保留可能不完整的最后一行
          lines.forEach(line => {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const jsonData = JSON.parse(line.slice(6));
                // 提取内容逻辑与原代码相同
                let content = '';
                if (jsonData.choices?.[0]?.delta?.content) {
                  content = jsonData.choices[0].delta.content;
                } else if (jsonData.content) {
                  content = jsonData.content;
                } else if (jsonData.data) {
                  content = typeof jsonData.data === 'string' ? jsonData.data : JSON.stringify(jsonData.data);
                } else if (jsonData.text) {
                  content = jsonData.text;
                }
                outPutTokens += 1;
                if (content && onData) {
                  onData(content);
                }
              } catch (e) {
                // 生产环境不输出错误到控制台
                // 如果不是JSON格式，可能是纯文本
                if (line.slice(6) && onData) {
                  onData(line.slice(6));
                }
              }
            } else if (line === 'data: [DONE]' || line.includes('"done":true') || line.includes('"finished":true')) {
              // Stream processing completed
              return;
            }
          });
          return readChunk();
        });
      }
      return readChunk();
    })
    .catch(error => {
      // 生产环境使用错误处理而非console
      onError && onError(error);
    });
    return {
      cancel: () => controller.abort()
    };
  }
 