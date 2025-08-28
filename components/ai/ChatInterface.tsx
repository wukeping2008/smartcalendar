'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card } from '../../src/components/ui/card'
import { Button } from '../../src/components/ui/button'
import { Input } from '../../src/components/ui/input'
import { useEventStore } from '../../lib/stores/event-store'
import { llmService, ChatMessage } from '../../lib/services/LLMIntegrationService'
import { aiService } from '../../lib/services/AIService'
import VoiceInputFixed from '../voice/VoiceInputFixed'

interface ChatInterfaceProps {
  onClose?: () => void
}

interface ChatItem extends ChatMessage {
  id: string
  timestamp: Date
  streaming?: boolean
}

export default function ChatInterface({ onClose }: ChatInterfaceProps) {
  const { events } = useEventStore()
  const [messages, setMessages] = useState<ChatItem[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '👋 您好！我是小智，您的AI时间管理助手。我可以帮您：\n\n• 📅 查询和分析日程安排\n• 💡 提供时间管理建议\n• 🎯 解答效率相关问题\n• 📊 分析您的时间使用习惯\n\n有什么可以帮助您的吗？',
      timestamp: new Date()
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentRequest, setCurrentRequest] = useState<{ requestId: string; cancel: () => void } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // 自动聚焦输入框
    inputRef.current?.focus()
  }, [])

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return

    const userMessage: ChatItem = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date()
    }

    const assistantMessage: ChatItem = {
      id: `assistant_${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      streaming: true
    }

    setMessages(prev => [...prev, userMessage, assistantMessage])
    setInputText('')
    setIsLoading(true)

    try {
      const request = await llmService.askQuestion(userMessage.content, events, {
        onData: (chunk: string) => {
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, content: msg.content + chunk }
              : msg
          ))
        },
        onComplete: (response) => {
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, streaming: false }
              : msg
          ))
          setIsLoading(false)
          setCurrentRequest(null)
        },
        onError: (error) => {
          // Chat error occurred
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, content: '抱歉，发生了错误。请稍后再试。', streaming: false }
              : msg
          ))
          setIsLoading(false)
          setCurrentRequest(null)
        }
      })

      setCurrentRequest(request)
    } catch (error) {
      // Failed to send message
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessage.id))
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleStop = () => {
    if (currentRequest) {
      currentRequest.cancel()
      setCurrentRequest(null)
      setIsLoading(false)
      
      // 更新最后一条消息状态
      setMessages(prev => prev.map(msg => 
        msg.streaming ? { ...msg, streaming: false } : msg
      ))
    }
  }

  const quickQuestions = [
    "今天有什么重要安排？",
    "如何提高我的工作效率？", 
    "分析一下我的时间使用习惯",
    "有什么时间管理建议？"
  ]

  const handleQuickQuestion = (question: string) => {
    setInputText(question)
    inputRef.current?.focus()
  }

  return (
    <Card className="bg-black/40 border-white/20 h-[600px] flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <h3 className="text-white font-semibold">🤖 小智 - AI助手</h3>
        </div>
        {onClose && (
          <Button size="sm" variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </Button>
        )}
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-700/80 text-gray-100'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">
                {message.content}
                {message.streaming && (
                  <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse">|</span>
                )}
              </div>
              <div className="text-xs opacity-60 mt-2">
                {message.timestamp.toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 快捷问题 */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <div className="text-xs text-gray-400 mb-2">快捷问题：</div>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, index) => (
              <Button
                key={index}
                size="sm"
                variant="outline"
                className="text-xs text-gray-300 border-gray-600 hover:bg-gray-600/50"
                onClick={() => handleQuickQuestion(question)}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 输入区域 */}
      <div className="p-4 border-t border-white/10">
        {isLoading && (
          <div className="flex items-center justify-center mb-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleStop}
              className="text-red-400 border-red-400/50 hover:bg-red-400/10"
            >
              ⏹ 停止生成
            </Button>
          </div>
        )}
        
        <div className="flex space-x-2">
          <Input
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入您的问题..."
            disabled={isLoading}
            className="flex-1 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
          />
          {/* 语音输入按钮 */}
          <VoiceInputFixed
            size="sm"
            onResult={(text) => {
              setInputText(inputText + (inputText ? ' ' : '') + text.trim())
              inputRef.current?.focus()
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {isLoading ? '⏳' : '📤'}
          </Button>
        </div>
        
        <div className="text-xs text-gray-400 mt-2 text-center">
          按 Enter 发送，Shift + Enter 换行
        </div>
      </div>
    </Card>
  )
}
