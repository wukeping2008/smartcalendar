'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useEventStore } from '../../lib/stores/event-store'
import { EventCategory, Priority, EventStatus } from '../../types/event'

interface VoiceInputButtonProps {
  onResult?: (text: string) => void
  className?: string
}

export default function VoiceInputButton({ onResult, className = "" }: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const { addEvent } = useEventStore()

  // 检查浏览器支持
  useEffect(() => {
    const speechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    setIsSupported(speechRecognition)
  }, [])

  // 语音识别
  const startListening = () => {
    if (!isSupported) {
      alert('浏览器不支持语音识别')
      return
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'zh-CN'

    recognition.onstart = () => {
      setIsListening(true)
      setTranscript('')
    }

    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript
      setTranscript(result)
      onResult?.(result)
      
      // 自动解析并创建事件
      const eventData = parseVoiceToEvent(result)
      if (eventData) {
        addEvent(eventData)
        speak(`已创建事件：${eventData.title}`)
      } else {
        speak('抱歉，无法理解您的指令，请重试')
      }
    }

    recognition.onerror = (event: any) => {
      console.error('语音识别错误:', event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  // 语音合成
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'zh-CN'
      window.speechSynthesis.speak(utterance)
    }
  }

  // 解析语音指令创建事件
  const parseVoiceToEvent = (text: string) => {
    const normalizedText = text.toLowerCase().trim()
    
    if (!normalizedText.includes('创建') && !normalizedText.includes('新建') && !normalizedText.includes('添加')) {
      return null
    }

    let title = ''
    let category = EventCategory.OTHER
    let priority = Priority.MEDIUM
    const now = new Date()
    let startTime = new Date(now.getTime() + 60 * 60 * 1000) // 默认1小时后
    let endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 默认持续1小时

    // 类别识别
    if (normalizedText.includes('会议') || normalizedText.includes('开会')) {
      category = EventCategory.MEETING
      title = '会议'
    } else if (normalizedText.includes('工作') || normalizedText.includes('项目')) {
      category = EventCategory.WORK
      title = '工作任务'
    } else if (normalizedText.includes('运动') || normalizedText.includes('锻炼')) {
      category = EventCategory.EXERCISE
      title = '运动时间'
    } else if (normalizedText.includes('吃饭') || normalizedText.includes('午餐') || normalizedText.includes('晚餐')) {
      category = EventCategory.MEAL
      title = '用餐时间'
    } else if (normalizedText.includes('休息')) {
      category = EventCategory.BREAK
      title = '休息时间'
    }

    // 优先级识别
    if (normalizedText.includes('紧急') || normalizedText.includes('重要')) {
      priority = Priority.URGENT
    } else if (normalizedText.includes('高优先级')) {
      priority = Priority.HIGH
    }

    // 时间解析
    const timeMatch = normalizedText.match(/(\d{1,2})[点时]/)
    if (timeMatch) {
      const hour = parseInt(timeMatch[1])
      if (hour >= 0 && hour <= 23) {
        startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0)
        endTime = new Date(startTime.getTime() + 60 * 60 * 1000)
      }
    }

    // 提取标题
    if (!title) {
      title = normalizedText
        .replace(/创建|新建|添加|安排|预约/g, '')
        .replace(/\d{1,2}[点时]\d{0,2}[分]?/g, '')
        .replace(/上午|下午|晚上|明天|后天/g, '')
        .replace(/紧急|重要|高优先级|低优先级/g, '')
        .trim()
      
      if (!title) {
        title = '新事件'
      }
    }

    return {
      title,
      description: `通过语音创建：${text}`,
      startTime,
      endTime,
      category,
      priority,
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
      reminders: []
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
      // Trading专业类别颜色
      [EventCategory.TRADING]: '#dc2626',        // 红色 - 交易相关
      [EventCategory.LIFE_ROUTINE]: '#059669',   // 绿色 - 生活例程
      [EventCategory.PREPARATION]: '#7c3aed'     // 紫色 - 准备工作
    }
    return colors[category]
  }

  if (!isSupported) {
    return (
      <Button 
        variant="outline" 
        className="w-full text-gray-400 border-gray-600 cursor-not-allowed" 
        size="sm"
        disabled
      >
        🎤 语音不支持
      </Button>
    )
  }

  return (
    <div className={className}>
      <Button 
        onClick={startListening}
        variant="outline" 
        className={`w-full border-white/20 ${
          isListening 
            ? 'bg-red-600 text-white animate-pulse' 
            : 'text-white hover:bg-white/10'
        }`}
        size="sm"
        disabled={isListening}
      >
        {isListening ? '🔴 正在录音...' : '🎤 语音创建'}
      </Button>
      
      {transcript && (
        <div className="mt-2 text-xs text-gray-400 p-2 bg-black/20 rounded">
          识别结果: {transcript}
        </div>
      )}
    </div>
  )
}
