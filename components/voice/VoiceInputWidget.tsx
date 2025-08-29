'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '../../src/components/ui/button'
import { Card } from '../../src/components/ui/card'
import { Badge } from '../../src/components/ui/badge'
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react'
import { useEventStore } from '../../lib/stores/event-store'
import { EventCategory, Priority, EventStatus, EnergyLevel } from '../../types/event'

interface VoiceInputWidgetProps {
  onResult?: (text: string) => void
  onCommand?: (command: any) => void
  placeholder?: string
  autoProcess?: boolean  // 自动处理语音指令
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showTranscript?: boolean
  variant?: 'default' | 'floating' | 'inline'
}

export default function VoiceInputWidget({
  onResult,
  onCommand,
  placeholder = '点击开始语音输入...',
  autoProcess = true,
  className = '',
  size = 'md',
  showTranscript = true,
  variant = 'default'
}: VoiceInputWidgetProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const recognitionRef = useRef<any>(null)
  const { addEvent } = useEventStore()

  useEffect(() => {
    // 检查浏览器支持
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.lang = 'zh-CN'
        recognition.continuous = true
        recognition.interimResults = true
        
        recognition.onresult = (event: any) => {
          let finalTranscript = ''
          let interimTranscript = ''
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' '
            } else {
              interimTranscript += transcript
            }
          }
          
          if (finalTranscript) {
            setTranscript(prev => prev + finalTranscript)
            if (autoProcess) {
              processVoiceCommand(finalTranscript.trim())
            }
            if (onResult) {
              onResult(finalTranscript.trim())
            }
          } else if (interimTranscript) {
            setTranscript(prev => prev + interimTranscript)
          }
        }
        
        recognition.onerror = (event: any) => {
          console.error('语音识别错误:', event.error)
          setError(`识别错误: ${event.error}`)
          setIsListening(false)
        }
        
        recognition.onend = () => {
          setIsListening(false)
        }
        
        recognitionRef.current = recognition
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [autoProcess, onResult])

  const processVoiceCommand = async (text: string) => {
    setIsProcessing(true)
    
    try {
      // 解析语音指令
      const command = parseVoiceCommand(text)
      
      if (command.type === 'create_event') {
        // 创建日历事件
        const event = {
          title: command.title || '新事件',
          description: `语音创建: ${text}`,
          startTime: command.startTime || new Date(),
          endTime: command.endTime || new Date(Date.now() + 60 * 60 * 1000),
          category: command.category || EventCategory.MEETING,
          priority: command.priority || Priority.MEDIUM,
          status: EventStatus.PLANNED,
          position: { x: 0, y: 0, z: 0 },
          size: { width: 200, height: 80, depth: 20 },
          color: '#3b82f6',
          opacity: 0.8,
          isSelected: false,
          isDragging: false,
          isHovered: false,
          isConflicted: false,
          energyRequired: EnergyLevel.MEDIUM,
          estimatedDuration: 60,
          isMarketProtected: false,
          flexibilityScore: 50,
          tags: ['语音创建'],
          reminders: []
        }
        
        addEvent(event)
        
        // 语音反馈
        speak(`已创建事件：${command.title}`)
        
        if (onCommand) {
          onCommand(command)
        }
      }
    } catch (error) {
      console.error('处理语音指令失败:', error)
      setError('处理失败，请重试')
    } finally {
      setIsProcessing(false)
    }
  }

  const parseVoiceCommand = (text: string) => {
    const command: any = {
      type: 'create_event',
      rawText: text
    }
    
    // 时间解析
    const timePatterns = {
      '明天': () => {
        const date = new Date()
        date.setDate(date.getDate() + 1)
        return date
      },
      '后天': () => {
        const date = new Date()
        date.setDate(date.getDate() + 2)
        return date
      },
      '下周': () => {
        const date = new Date()
        date.setDate(date.getDate() + 7)
        return date
      },
      '今天': () => new Date(),
      '今晚': () => {
        const date = new Date()
        date.setHours(20, 0, 0, 0)
        return date
      }
    }
    
    // 提取时间
    for (const [pattern, getDate] of Object.entries(timePatterns)) {
      if (text.includes(pattern)) {
        command.startTime = getDate()
        break
      }
    }
    
    // 提取具体时间
    const timeMatch = text.match(/(\d{1,2})[点:：](\d{0,2})?/)
    if (timeMatch) {
      const hours = parseInt(timeMatch[1])
      const minutes = parseInt(timeMatch[2] || '0')
      if (command.startTime) {
        command.startTime.setHours(hours, minutes, 0, 0)
      } else {
        command.startTime = new Date()
        command.startTime.setHours(hours, minutes, 0, 0)
      }
    }
    
    // 提取标题
    if (text.includes('会议') || text.includes('开会')) {
      command.title = '会议'
      command.category = EventCategory.MEETING
    } else if (text.includes('运动') || text.includes('锻炼')) {
      command.title = '运动'
      command.category = EventCategory.EXERCISE
    } else if (text.includes('学习')) {
      command.title = '学习'
      command.category = EventCategory.PERSONAL
    } else if (text.includes('工作')) {
      command.title = '工作任务'
      command.category = EventCategory.WORK
    } else {
      command.title = text.substring(0, 20)
    }
    
    // 设置结束时间（默认1小时）
    if (command.startTime) {
      command.endTime = new Date(command.startTime.getTime() + 60 * 60 * 1000)
    }
    
    return command
  }

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'zh-CN'
      utterance.rate = 1.0
      window.speechSynthesis.speak(utterance)
    }
  }

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      setTranscript('')
      setError('')
      recognitionRef.current?.start()
      setIsListening(true)
      speak('请说出您的指令')
    }
  }

  // 根据尺寸获取样式
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 w-8 text-sm'
      case 'lg':
        return 'h-12 w-12 text-lg'
      default:
        return 'h-10 w-10 text-base'
    }
  }

  // 根据变体获取样式
  const getVariantClasses = () => {
    switch (variant) {
      case 'floating':
        return 'fixed bottom-8 right-8 z-50 shadow-2xl'
      case 'inline':
        return 'inline-flex items-center gap-2'
      default:
        return ''
    }
  }

  if (variant === 'floating') {
    return (
      <div className={`${getVariantClasses()} ${className}`}>
        <Card className="bg-gray-800/90 backdrop-blur-sm border-gray-700 p-4">
          <Button
            onClick={toggleListening}
            disabled={isProcessing}
            className={`${getSizeClasses()} rounded-full ${
              isListening 
                ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isProcessing ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : isListening ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>
          {showTranscript && transcript && (
            <div className="mt-2 p-2 bg-gray-900/50 rounded text-sm text-gray-300 max-w-xs">
              {transcript}
            </div>
          )}
          {error && (
            <div className="mt-2 text-xs text-red-400">
              {error}
            </div>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className={`${getVariantClasses()} ${className}`}>
      <Button
        onClick={toggleListening}
        disabled={isProcessing}
        className={`${getSizeClasses()} ${
          isListening 
            ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
        title={isListening ? '停止录音' : '开始语音输入'}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isListening ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
        {variant === 'inline' && (
          <span className="ml-2">
            {isListening ? '停止' : '语音输入'}
          </span>
        )}
      </Button>
      
      {showTranscript && transcript && variant !== 'floating' && (
        <div className="ml-2 px-3 py-1 bg-gray-800/50 rounded text-sm text-gray-300">
          {transcript}
        </div>
      )}
      
      {error && (
        <Badge className="ml-2 bg-red-600/20 text-red-400 border-red-600/50">
          {error}
        </Badge>
      )}
      
      {isListening && (
        <Badge className="ml-2 bg-green-600/20 text-green-400 border-green-600/50 animate-pulse">
          <Volume2 className="h-3 w-3 mr-1" />
          正在聆听...
        </Badge>
      )}
    </div>
  )
}