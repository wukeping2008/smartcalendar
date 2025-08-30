'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '../../src/components/ui/button'
import { Card } from '../../src/components/ui/card'
import { Badge } from '../../src/components/ui/badge'
import { Mic, MicOff, Square, X, AlertCircle, CheckCircle, Calendar, Loader2 } from 'lucide-react'
import { useEventStore } from '../../lib/stores/event-store'
import { EventCategory, Priority, EventStatus, EnergyLevel } from '../../types/event'
import { aiService } from '../../lib/services/AIService'

interface VoiceEventCreatorProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  onEventCreated?: (eventId: string) => void
}

export default function VoiceEventCreator({
  className = '',
  size = 'lg',
  onEventCreated
}: VoiceEventCreatorProps) {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [finalText, setFinalText] = useState('')
  const [interimText, setInterimText] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCard, setShowCard] = useState(false)
  
  const recognitionRef = useRef<any>(null)
  const allTextRef = useRef('')
  const { addEvent } = useEventStore()

  useEffect(() => {
    // 检查浏览器支持
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      setIsSupported(!!SpeechRecognition)
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        
        recognition.lang = 'zh-CN'
        recognition.continuous = true
        recognition.interimResults = true
        recognition.maxAlternatives = 1
        
        recognition.onstart = () => {
          console.log('语音识别已启动')
          setError('')
          setSuccess('')
          allTextRef.current = ''
          setFinalText('')
          setInterimText('')
          setShowCard(true)
        }
        
        recognition.onresult = (event: any) => {
          let currentInterim = ''
          let newFinal = ''
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            
            if (event.results[i].isFinal) {
              newFinal += transcript
            } else {
              currentInterim = transcript
            }
          }
          
          if (newFinal) {
            allTextRef.current += newFinal
            setFinalText(allTextRef.current)
            setInterimText('')
          } else {
            setInterimText(currentInterim)
          }
        }
        
        recognition.onerror = (event: any) => {
          console.error('语音识别错误:', event.error)
          
          if (event.error === 'no-speech') {
            return // 继续等待
          }
          
          const errorMessages: { [key: string]: string } = {
            'audio-capture': '无法访问麦克风',
            'not-allowed': '麦克风权限被拒绝',
            'network': '网络连接错误',
            'aborted': '识别已中止'
          }
          
          setError(errorMessages[event.error] || `识别错误: ${event.error}`)
          setIsListening(false)
        }
        
        recognition.onend = () => {
          console.log('语音识别已结束')
          if (isListening) {
            try {
              recognition.start()
            } catch (e) {
              setIsListening(false)
            }
          }
        }
        
        recognitionRef.current = recognition
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          console.log('清理时停止识别失败')
        }
      }
    }
  }, [isListening])

  // 开始录音
  const startListening = () => {
    if (!isSupported) {
      setError('您的浏览器不支持语音识别')
      return
    }
    
    if (recognitionRef.current && !isListening) {
      try {
        setIsListening(true)
        setError('')
        setSuccess('')
        recognitionRef.current.start()
      } catch (error) {
        console.error('启动识别失败:', error)
        setError('启动失败，请重试')
        setIsListening(false)
      }
    }
  }

  // 停止录音并创建事件
  const stopListeningAndCreate = async () => {
    if (recognitionRef.current && isListening) {
      try {
        setIsListening(false)
        recognitionRef.current.stop()
        
        const fullText = allTextRef.current + (interimText || '')
        if (fullText.trim()) {
          await createEventFromVoice(fullText.trim())
        } else {
          setError('未检测到语音内容')
        }
      } catch (error) {
        console.error('停止识别失败:', error)
        setError('处理失败，请重试')
      }
    }
  }

  // 使用AI解析并创建事件
  const createEventFromVoice = async (text: string) => {
    setIsProcessing(true)
    setError('')
    setSuccess('')

    try {
      console.log('开始解析语音命令:', text)
      
      // 使用AI解析语音命令
      const parsedCommand = await aiService.parseNaturalLanguageCommand(text)
      console.log('AI解析结果:', parsedCommand)
      
      if (parsedCommand && (parsedCommand as any).title) {
        // 创建事件
        const eventData = {
          title: (parsedCommand as any).title,
          description: (parsedCommand as any).description || `语音创建：${text}`,
          startTime: (parsedCommand as any).startTime ? new Date((parsedCommand as any).startTime) : new Date(Date.now() + 60 * 60 * 1000),
          endTime: (parsedCommand as any).endTime ? new Date((parsedCommand as any).endTime) : new Date(Date.now() + 2 * 60 * 60 * 1000),
          category: (parsedCommand as any).category || EventCategory.OTHER,
          priority: (parsedCommand as any).priority || Priority.MEDIUM,
          status: EventStatus.PLANNED,
          position: { x: 0, y: 0, z: 0 },
          size: { width: 200, height: 80, depth: 20 },
          color: getCategoryColor((parsedCommand as any).category || EventCategory.OTHER),
          opacity: 0.8,
          isSelected: false,
          isDragging: false,
          isHovered: false,
          isConflicted: false,
          tags: (parsedCommand as any).tags || ['语音创建'],
          reminders: (parsedCommand as any).reminders || [],
          energyRequired: (parsedCommand as any).energyRequired || EnergyLevel.MEDIUM,
          estimatedDuration: (parsedCommand as any).estimatedDuration || 60,
          isMarketProtected: false,
          flexibilityScore: 70
        }
        
        console.log('准备创建事件:', eventData)
        const newEvent = addEvent(eventData)
        console.log('事件创建成功:', newEvent)
        
        const startTimeStr = eventData.startTime.toLocaleString('zh-CN', {
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
        setSuccess(`✅ 已创建事件：${eventData.title}\n时间：${startTimeStr}`)
        
        if (newEvent && newEvent.id) {
          onEventCreated?.(newEvent.id)
        }
        
        // 5秒后自动关闭成功提示
        setTimeout(() => {
          setSuccess('')
          setFinalText('')
          setInterimText('')
          setShowCard(false)
          allTextRef.current = ''
        }, 5000)
      } else {
        console.log('AI解析未返回有效数据:', parsedCommand)
        // 如果AI解析失败，尝试简单的本地解析
        const simpleEvent = parseSimpleCommand(text)
        if (simpleEvent) {
          const newEvent = addEvent(simpleEvent)
          console.log('使用简单解析创建事件:', newEvent)
          setSuccess(`✅ 已创建事件：${simpleEvent.title}`)
          
          if (newEvent && newEvent.id) {
            onEventCreated?.(newEvent.id)
          }
          
          setTimeout(() => {
            setSuccess('')
            setFinalText('')
            setInterimText('')
            setShowCard(false)
            allTextRef.current = ''
          }, 5000)
        } else {
          setError('无法理解该指令，请尝试说："创建明天下午3点的会议"')
        }
      }
    } catch (error) {
      console.error('处理语音命令失败:', error)
      // 尝试简单的本地解析作为后备方案
      const simpleEvent = parseSimpleCommand(text)
      if (simpleEvent) {
        const newEvent = addEvent(simpleEvent)
        setSuccess(`✅ 已创建事件：${simpleEvent.title}`)
        if (newEvent && newEvent.id) {
          onEventCreated?.(newEvent.id)
        }
        setTimeout(() => {
          setSuccess('')
          setFinalText('')
          setInterimText('')
          setShowCard(false)
          allTextRef.current = ''
        }, 5000)
      } else {
        setError('处理失败，请重试')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // 简单的本地命令解析（作为后备方案）
  const parseSimpleCommand = (text: string) => {
    const normalizedText = text.toLowerCase().trim()
    
    // 检查是否包含创建事件的关键词
    if (!normalizedText.includes('创建') && 
        !normalizedText.includes('添加') && 
        !normalizedText.includes('安排') &&
        !normalizedText.includes('预约') &&
        !normalizedText.includes('提醒')) {
      return null
    }

    let title = '新事件'
    let category = EventCategory.OTHER
    let startTime = new Date(Date.now() + 60 * 60 * 1000) // 默认1小时后
    
    // 提取标题
    if (normalizedText.includes('会议')) {
      title = '会议'
      category = EventCategory.MEETING
    } else if (normalizedText.includes('运动')) {
      title = '运动'
      category = EventCategory.EXERCISE
    } else if (normalizedText.includes('工作')) {
      title = '工作任务'
      category = EventCategory.WORK
    } else if (normalizedText.includes('吃饭') || normalizedText.includes('午餐') || normalizedText.includes('晚餐')) {
      title = '用餐'
      category = EventCategory.MEAL
    }

    // 解析时间
    const now = new Date()
    if (normalizedText.includes('明天')) {
      startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      startTime.setHours(9, 0, 0, 0) // 默认上午9点
    } else if (normalizedText.includes('后天')) {
      startTime = new Date(now.getTime() + 48 * 60 * 60 * 1000)
      startTime.setHours(9, 0, 0, 0)
    }

    // 解析具体时间
    const timeMatch = normalizedText.match(/(\d{1,2})[点时]/)
    if (timeMatch) {
      const hour = parseInt(timeMatch[1])
      if (normalizedText.includes('下午') && hour < 12) {
        startTime.setHours(hour + 12, 0, 0, 0)
      } else {
        startTime.setHours(hour, 0, 0, 0)
      }
    }

    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 默认1小时

    return {
      title,
      description: `语音创建：${text}`,
      startTime,
      endTime,
      category,
      priority: Priority.MEDIUM,
      status: EventStatus.PLANNED,
      position: { x: 0, y: 0, z: 0 },
      size: { width: 200, height: 80, depth: 20 },
      color: getCategoryColor(category),
      opacity: 0.8,
      isSelected: false,
      isDragging: false,
      isHovered: false,
      isConflicted: false,
      tags: ['语音创建'],
      reminders: [],
      energyRequired: EnergyLevel.MEDIUM,
      estimatedDuration: 60,
      isMarketProtected: false,
      flexibilityScore: 70
    }
  }

  // 获取类别颜色
  const getCategoryColor = (category: EventCategory): string => {
    const colors = {
      [EventCategory.WORK]: '#3b82f6',
      [EventCategory.PERSONAL]: '#10b981',
      [EventCategory.MEETING]: '#f59e0b',
      [EventCategory.BREAK]: '#8b5cf6',
      [EventCategory.EXERCISE]: '#ef4444',
      [EventCategory.MEAL]: '#f97316',
      [EventCategory.TRAVEL]: '#06b6d4',
      [EventCategory.OTHER]: '#6b7280',
      [EventCategory.TRADING]: '#dc2626',
      [EventCategory.LIFE_ROUTINE]: '#059669',
      [EventCategory.PREPARATION]: '#7c3aed'
    }
    return colors[category]
  }

  // 清除文本
  const clearText = () => {
    setFinalText('')
    setInterimText('')
    allTextRef.current = ''
    setError('')
    setSuccess('')
  }

  // 获取按钮大小样式
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-10 w-10'
      case 'lg':
        return 'h-14 w-14'
      default:
        return 'h-12 w-12'
    }
  }

  // 获取显示的完整文本
  const displayText = finalText + (interimText ? ' ' : '') + interimText

  return (
    <div className={`relative ${className}`}>
      {/* 浮动按钮 */}
      {!isListening ? (
        <Button
          onClick={startListening}
          disabled={!isSupported || isProcessing}
          className={`${getSizeClasses()} rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all ${
            !isSupported ? 'opacity-50 cursor-not-allowed' : ''
          } ${isProcessing ? 'animate-pulse' : ''}`}
          title={!isSupported ? '浏览器不支持语音识别' : '点击开始语音创建事件'}
        >
          {isProcessing ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>
      ) : (
        <Button
          onClick={stopListeningAndCreate}
          className={`${getSizeClasses()} rounded-full bg-red-600 hover:bg-red-700 shadow-xl animate-pulse`}
          title="点击停止并创建事件"
        >
          <Square className="h-6 w-6" />
        </Button>
      )}

      {/* 悬浮卡片 - 显示语音识别状态和结果 */}
      {showCard && (
        <Card className="absolute bottom-20 right-0 w-80 bg-gray-900/95 backdrop-blur-md border-gray-700 shadow-2xl p-4 z-50">
          {/* 标题栏 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-gray-200">语音创建事件</span>
            </div>
            <Button
              onClick={() => {
                clearText()
                setShowCard(false)
              }}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* 状态指示器 */}
          {isListening && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-red-400">正在录音...</span>
              </div>
              <span className="text-xs text-gray-500">说完后点击停止按钮</span>
            </div>
          )}

          {isProcessing && (
            <div className="flex items-center gap-2 mb-3">
              <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
              <span className="text-xs text-blue-400">AI正在解析指令...</span>
            </div>
          )}

          {/* 识别文本显示 */}
          {displayText && (
            <div className="bg-gray-800/80 rounded-lg p-3 mb-3">
              <div className="text-sm">
                {finalText && (
                  <span className="text-white">{finalText}</span>
                )}
                {interimText && (
                  <span className="text-gray-400 italic">
                    {finalText ? ' ' : ''}{interimText}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 成功消息 */}
          {success && (
            <Badge className="w-full justify-start bg-green-600/20 text-green-400 border-green-600/50 py-2">
              <CheckCircle className="h-4 w-4 mr-2" />
              {success}
            </Badge>
          )}

          {/* 错误消息 */}
          {error && (
            <Badge className="w-full justify-start bg-red-600/20 text-red-400 border-red-600/50 py-2">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </Badge>
          )}

          {/* 提示信息 */}
          {!isListening && !displayText && !error && !success && (
            <div className="text-xs text-gray-500 space-y-1">
              <p>💡 示例命令：</p>
              <ul className="ml-4 space-y-0.5">
                <li>• 创建明天下午3点的会议</li>
                <li>• 安排后天上午运动时间</li>
                <li>• 提醒我下周一9点开会</li>
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}