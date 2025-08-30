'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '../../src/components/ui/button'
import { Card } from '../../src/components/ui/card'
import { Input } from '../../src/components/ui/input'
import { Textarea } from '../../src/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../src/components/ui/select'
import { useEventStore } from '../../lib/stores/event-store'
import { EventCategory, Priority, EventStatus, EnergyLevel, ReminderType } from '../../types/event'
import { AzureSpeechService } from '../../lib/services/AzureSpeechService'
import type { IAudioService } from '../../lib/services/IAudioService'
import VoiceInputFixed from '../voice/VoiceInputFixed'
// import { TimeAnalyzer } from '../../lib/engines/TimeAnalyzer'
// import { ScheduleOptimizer } from '../../lib/engines/ScheduleOptimizer'

interface SmartEventCreatorProps {
  onEventCreated?: (eventId: string) => void
  className?: string
}

export default function SmartEventCreator({ onEventCreated, className = '' }: SmartEventCreatorProps) {
  // UI状态
  const [showForm, setShowForm] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  
  // 表单数据
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<EventCategory>(EventCategory.WORK)
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM)
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(EnergyLevel.MEDIUM)
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [duration, setDuration] = useState(60)
  const [flexibilityScore, setFlexibilityScore] = useState(70)
  
  // 语音功能状态
  const [isListening, setIsListening] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [isVoiceSupported, setIsVoiceSupported] = useState(false)
  const [isAzureReady, setIsAzureReady] = useState(false)
  const [showVoiceConfirm, setShowVoiceConfirm] = useState(false)
  
  // 智能分析状态
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [conflicts, setConflicts] = useState<string[]>([])
  const [optimizationTips, setOptimizationTips] = useState<string[]>([])
  
  const { addEvent, events } = useEventStore()
  const audioServiceRef = useRef<IAudioService | null>(null)
  const accumulatedTextRef = useRef('')

  // 初始化Azure Speech Service
  useEffect(() => {
    const initVoiceService = async () => {
      try {
        const hasAzureConfig = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY && 
                               process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION
        
        if (hasAzureConfig) {
          audioServiceRef.current = new AzureSpeechService()
          await audioServiceRef.current.initTranscription()
          await audioServiceRef.current.initSynthesis()
          
          audioServiceRef.current.onTranscriptionUpdate((text: string, isFinal: boolean) => {
            if (isFinal && text) {
              accumulatedTextRef.current += text + ' '
              setVoiceTranscript(accumulatedTextRef.current)
              parseVoiceInput(accumulatedTextRef.current)
            } else {
              setVoiceTranscript(accumulatedTextRef.current + text)
            }
          })

          audioServiceRef.current.onError((error) => {
            // 语音服务错误
            setIsListening(false)
          })

          setIsAzureReady(true)
        } else {
          const speechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
          setIsVoiceSupported(speechRecognition)
        }

        setIsVoiceSupported(true)
      } catch (error) {
        // 初始化语音服务失败
        const speechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
        setIsVoiceSupported(speechRecognition)
      }
    }

    initVoiceService()
    return () => {
      if (audioServiceRef.current) {
        audioServiceRef.current.destroy()
      }
    }
  }, [])

  // 实时智能分析
  useEffect(() => {
    if (title || description) {
      performSmartAnalysis()
    }
  }, [title, description, category, startDate, startTime, duration])

  // 简化智能分析函数
  const performSmartAnalysis = async () => {
    try {
      // 简单的冲突检测
      const timeConflicts: string[] = []
      if (startDate && startTime) {
        const proposedStart = new Date(`${startDate}T${startTime}:00`)
        const proposedEnd = new Date(proposedStart.getTime() + duration * 60 * 1000)
        
        events.forEach(event => {
          if (event.startTime <= proposedEnd && event.endTime >= proposedStart) {
            timeConflicts.push(`与事件"${event.title}"时间重叠`)
          }
        })
      }
      setConflicts(timeConflicts)

      // 生成简单建议
      const basicSuggestions: string[] = []
      if (priority === Priority.URGENT && energyLevel === EnergyLevel.LOW) {
        basicSuggestions.push('紧急任务建议分配更高精力')
      }
      if (duration > 180) {
        basicSuggestions.push('建议将长时间任务分解为多个小任务')
      }
      if (category === EventCategory.TRADING && !startDate) {
        basicSuggestions.push('交易任务建议设定具体时间')
      }
      setSuggestions(basicSuggestions)

      // 生成优化提示
      const tips: string[] = []
      if (flexibilityScore > 80) {
        tips.push('高灵活度任务可以作为时间缓冲')
      }
      if (energyLevel === EnergyLevel.HIGH && category === EventCategory.BREAK) {
        tips.push('休息时间不需要高精力要求')
      }
      setOptimizationTips(tips)

    } catch (error) {
      // 智能分析失败
    }
  }

  // 开始语音识别
  const startVoiceInput = async () => {
    if (!isVoiceSupported) return

    try {
      setIsListening(true)
      setVoiceTranscript('')
      accumulatedTextRef.current = ''

      if (audioServiceRef.current && isAzureReady) {
        await audioServiceRef.current.startTranscription()
      } else {
        // 浏览器API回退
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
        
        if (!SpeechRecognition) {
          // 浏览器不支持语音识别
          return
        }
        const recognition = new SpeechRecognition()
        
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'zh-CN'

        recognition.onresult = (event: any) => {
          let finalTranscript = ''
          let interimTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }

          if (finalTranscript) {
            accumulatedTextRef.current += finalTranscript + ' '
            setVoiceTranscript(accumulatedTextRef.current)
            parseVoiceInput(accumulatedTextRef.current)
          } else {
            setVoiceTranscript(accumulatedTextRef.current + interimTranscript)
          }
        }

        recognition.onerror = () => setIsListening(false)
        recognition.onend = () => setIsListening(false)
        recognition.start()
      }
    } catch (error) {
      // 语音识别启动失败
      setIsListening(false)
    }
  }

  // 停止语音识别
  const stopVoiceInput = async () => {
    try {
      if (audioServiceRef.current && isAzureReady) {
        await audioServiceRef.current.stopTranscription()
        
        // 如果有语音识别结果，显示确认界面
        if (voiceTranscript.trim()) {
          setShowVoiceConfirm(true)
          setShowForm(true)
        }
      }
      setIsListening(false)
    } catch (error) {
      // 停止语音识别失败
      setIsListening(false)
    }
  }

  // 解析语音输入
  const parseVoiceInput = (text: string) => {
    const normalizedText = text.toLowerCase().trim()
    
    // 提取标题
    if (!title && normalizedText) {
      const extractedTitle = normalizedText
        .replace(/创建|新建|添加|安排|预约/g, '')
        .replace(/\d{1,2}[点时](\d{0,2}[分]?)?/g, '')
        .replace(/上午|下午|晚上|明天|后天|今天/g, '')
        .replace(/紧急|重要|高优先级|低优先级/g, '')
        .replace(/会议|工作|运动|锻炼|吃饭|休息/g, (match) => {
          // 根据关键词设置类别
          switch(match) {
            case '会议': setCategory(EventCategory.MEETING); return '会议'
            case '工作': setCategory(EventCategory.WORK); return '工作任务'
            case '运动': case '锻炼': setCategory(EventCategory.EXERCISE); return '运动时间'
            case '吃饭': setCategory(EventCategory.MEAL); return '用餐时间'
            case '休息': setCategory(EventCategory.BREAK); return '休息时间'
            default: return match
          }
        })
        .trim()
      
      if (extractedTitle) {
        setTitle(extractedTitle)
      }
    }

    // 提取优先级
    if (normalizedText.includes('紧急') || normalizedText.includes('重要')) {
      setPriority(Priority.URGENT)
      setEnergyLevel(EnergyLevel.HIGH)
    } else if (normalizedText.includes('高优先级')) {
      setPriority(Priority.HIGH)
    }

    // 提取时间
    const timeMatch = normalizedText.match(/(今天|明天|后天)?\s*(\d{1,2})[点时](\d{0,2}[分]?)?/)
    if (timeMatch) {
      const [, day, hour, minute] = timeMatch
      const hourNum = parseInt(hour)
      const minuteNum = minute ? parseInt(minute.replace('分', '')) || 0 : 0
      
      const now = new Date()
      const targetDate = new Date()
      
      if (day === '明天') {
        targetDate.setDate(now.getDate() + 1)
      } else if (day === '后天') {
        targetDate.setDate(now.getDate() + 2)
      }
      
      targetDate.setHours(hourNum, minuteNum, 0, 0)
      
      setStartDate(targetDate.toISOString().split('T')[0])
      setStartTime(`${hourNum.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')}`)
    }

    // 提取描述
    if (!description) {
      setDescription(`通过语音创建：${text}`)
    }
  }

  // 语音反馈
  const speakFeedback = async (text: string) => {
    try {
      if (audioServiceRef.current && isAzureReady) {
        await audioServiceRef.current.synthesizeAndPlay(text)
      } else if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'zh-CN'
        window.speechSynthesis.speak(utterance)
      }
    } catch (error) {
      // 语音反馈失败
    }
  }

  // 语音创建事件（快速创建）
  const handleVoiceCreateEvent = async (voiceText: string) => {
    try {
      const normalizedText = voiceText.toLowerCase().trim()
      
      // 检查是否包含创建关键词
      if (!normalizedText.includes('创建') && !normalizedText.includes('新建') && !normalizedText.includes('添加')) {
        await speakFeedback('请说"创建"加事件内容，例如：创建明天下午2点会议')
        return
      }

      // 智能解析事件信息
      let eventTitle = '新事件'
      let eventCategory = EventCategory.WORK
      let eventPriority = Priority.MEDIUM
      let eventEnergyLevel = EnergyLevel.MEDIUM
      let eventStartTime = new Date(Date.now() + 60 * 60 * 1000) // 默认1小时后
      let eventDuration = 60

      // 提取标题
      const extractedTitle = normalizedText
        .replace(/创建|新建|添加|安排|预约/g, '')
        .replace(/\d{1,2}[点时](\d{0,2}[分]?)?/g, '')
        .replace(/上午|下午|晚上|明天|后天|今天/g, '')
        .replace(/紧急|重要|高优先级|低优先级/g, '')
        .trim()

      // 类别识别
      if (normalizedText.includes('会议') || normalizedText.includes('开会')) {
        eventCategory = EventCategory.MEETING
        eventTitle = extractedTitle || '会议'
        eventDuration = 60
      } else if (normalizedText.includes('工作') || normalizedText.includes('项目') || normalizedText.includes('任务')) {
        eventCategory = EventCategory.WORK
        eventTitle = extractedTitle || '工作任务'
        eventDuration = 120
      } else if (normalizedText.includes('运动') || normalizedText.includes('锻炼')) {
        eventCategory = EventCategory.EXERCISE
        eventTitle = extractedTitle || '运动时间'
        eventDuration = 30
      } else if (normalizedText.includes('吃饭') || normalizedText.includes('午餐') || normalizedText.includes('晚餐') || normalizedText.includes('用餐')) {
        eventCategory = EventCategory.MEAL
        eventTitle = extractedTitle || '用餐时间'
        eventDuration = 50
      } else if (normalizedText.includes('休息')) {
        eventCategory = EventCategory.BREAK
        eventTitle = extractedTitle || '休息时间'
        eventDuration = 15
      } else if (normalizedText.includes('watchlist') || normalizedText.includes('扫') || normalizedText.includes('key in') || normalizedText.includes('数据')) {
        eventCategory = EventCategory.TRADING
        eventTitle = extractedTitle || 'Trading任务'
        eventDuration = 5
      } else {
        eventTitle = extractedTitle || '新事件'
      }

      // 优先级识别
      if (normalizedText.includes('紧急') || normalizedText.includes('重要')) {
        eventPriority = Priority.URGENT
        eventEnergyLevel = EnergyLevel.HIGH
      } else if (normalizedText.includes('高优先级')) {
        eventPriority = Priority.HIGH
        eventEnergyLevel = EnergyLevel.HIGH
      }

      // 时间解析
      const timeMatch = normalizedText.match(/(今天|明天|后天)?\s*(\d{1,2})[点时](\d{0,2}[分]?)?/)
      if (timeMatch) {
        const [, day, hour, minute] = timeMatch
        const hourNum = parseInt(hour)
        const minuteNum = minute ? parseInt(minute.replace('分', '')) || 0 : 0
        
        const now = new Date()
        const targetDate = new Date()
        
        if (day === '明天') {
          targetDate.setDate(now.getDate() + 1)
        } else if (day === '后天') {
          targetDate.setDate(now.getDate() + 2)
        }
        
        targetDate.setHours(hourNum, minuteNum, 0, 0)
        eventStartTime = targetDate
      }

      const eventEndTime = new Date(eventStartTime.getTime() + eventDuration * 60 * 1000)

      // 创建事件
      const newEvent = {
        title: eventTitle,
        description: `语音创建：${voiceText}`,
        startTime: eventStartTime,
        endTime: eventEndTime,
        category: eventCategory,
        priority: eventPriority,
        status: EventStatus.PLANNED,
        position: { x: 0, y: 0, z: 0 },
        size: { width: 200, height: 80, depth: 20 },
        color: getCategoryColor(eventCategory),
        opacity: 0.8,
        isSelected: false,
        isDragging: false,
        isHovered: false,
        isConflicted: false,
        energyRequired: eventEnergyLevel,
        estimatedDuration: eventDuration,
        isMarketProtected: eventCategory === EventCategory.TRADING,
        flexibilityScore: 70,
        tags: ['语音创建'],
        reminders: generateReminders(eventStartTime)
      }

      addEvent(newEvent)
      
      // 语音确认
      const timeStr = eventStartTime.toLocaleString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
      await speakFeedback(`已创建事件：${eventTitle}，时间是${timeStr}`)
      
      // 回调通知
      if (onEventCreated) {
        onEventCreated(newEvent.title)
      }

      // 重置语音状态
      setVoiceTranscript('')
      accumulatedTextRef.current = ''
      
    } catch (error) {
      // 语音创建事件失败
      await speakFeedback('创建失败，请重试')
    }
  }

  // 创建事件
  const handleCreateEvent = async () => {
    if (!title.trim()) {
      alert('请输入事件标题')
      return
    }

    try {
      const now = new Date()
      let eventStartTime: Date
      let eventEndTime: Date

      if (startDate && startTime) {
        eventStartTime = new Date(`${startDate}T${startTime}:00`)
        eventEndTime = new Date(eventStartTime.getTime() + duration * 60 * 1000)
      } else {
        eventStartTime = new Date(now.getTime() + 60 * 60 * 1000)
        eventEndTime = new Date(eventStartTime.getTime() + duration * 60 * 1000)
      }

      const newEvent = {
        title: title.trim(),
        description: description.trim(),
        startTime: eventStartTime,
        endTime: eventEndTime,
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
        energyRequired: energyLevel,
        estimatedDuration: duration,
        isMarketProtected: category === EventCategory.TRADING,
        flexibilityScore,
        tags: voiceTranscript ? ['语音创建'] : [],
        reminders: generateReminders(eventStartTime)
      }

      addEvent(newEvent)
      
      // 语音确认
      await speakFeedback(`已成功创建事件：${title}。${conflicts.length > 0 ? '检测到时间冲突，请注意调整。' : ''}`)
      
      // 回调通知
      if (onEventCreated) {
        onEventCreated(newEvent.title)
      }

      // 重置表单
      resetForm()
      
    } catch (error) {
      // 创建事件失败
      await speakFeedback('创建事件失败，请重试')
    }
  }

  // 生成提醒
  const generateReminders = (startTime: Date) => {
    return [
      {
        id: `reminder-${Date.now()}-30`,
        eventId: '',
        type: ReminderType.NOTIFICATION,
        time: new Date(startTime.getTime() - 30 * 60 * 1000),
        message: '30分钟后开始',
        isTriggered: false
      },
      {
        id: `reminder-${Date.now()}-5`,
        eventId: '',
        type: ReminderType.NOTIFICATION,
        time: new Date(startTime.getTime() - 5 * 60 * 1000),
        message: '5分钟后开始',
        isTriggered: false
      }
    ]
  }

  // 获取类别颜色
  const getCategoryColor = (cat: EventCategory): string => {
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
    return colors[cat]
  }

  // 重置表单
  const resetForm = () => {
    setTitle('')
    setDescription('')
    setCategory(EventCategory.WORK)
    setPriority(Priority.MEDIUM)
    setEnergyLevel(EnergyLevel.MEDIUM)
    setStartDate('')
    setStartTime('')
    setDuration(60)
    setFlexibilityScore(70)
    setVoiceTranscript('')
    setSuggestions([])
    setConflicts([])
    setOptimizationTips([])
    setShowForm(false)
    setIsExpanded(false)
  }

  if (!showForm) {
    return (
      <div className={`flex space-x-2 ${className}`}>
        {/* 使用 VoiceInputFixed 替代原有的语音输入功能 */}
        <VoiceInputFixed
          size="sm"
          onResult={(text) => {
            setVoiceTranscript(text)
            setShowForm(true)
            setShowVoiceConfirm(true)
            parseVoiceInput(text)
          }}
          className="flex-1"
        />
        <Button 
          onClick={() => setShowForm(true)}
          variant="outline"
          className="text-white border-white/20 hover:bg-white/10" 
          size="sm"
        >
          ✏️
        </Button>
      </div>
    )
  }

  return (
    <Card className="bg-black/30 border-white/20 p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-semibold">
          {showVoiceConfirm ? '语音识别结果确认' : '智能事件创建'}
        </h3>
        {isAzureReady && (
          <div className="text-xs text-green-400">✅ Azure语音就绪</div>
        )}
      </div>

      {/* 语音确认提示 */}
      {showVoiceConfirm && (
        <div className="bg-blue-600/20 border border-blue-500/50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-blue-400">🎤</span>
            <span className="text-sm font-medium text-blue-300">语音识别完成</span>
          </div>
          <p className="text-xs text-blue-200 mb-2">
            请检查并修改下方自动填写的内容，确认无误后点击&ldquo;🚀 创建事件&rdquo;
          </p>
          <div className="text-xs text-gray-300 bg-black/20 rounded p-2">
            原始语音：{voiceTranscript}
          </div>
        </div>
      )}


      {/* 基本信息 */}
      <div className="space-y-3">
        <div className="flex space-x-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="事件标题..."
            className="bg-slate-700 border-slate-600 text-white flex-1"
          />
          {/* 标题语音输入按钮 */}
          <VoiceInputFixed
            size="sm"
            onResult={(text) => {
              setTitle(text.trim())
            }}
          />
        </div>
        
        <div className="flex space-x-2">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="事件描述..."
            rows={2}
            className="bg-slate-700 border-slate-600 text-white resize-none flex-1"
          />
          {/* 描述语音输入按钮 */}
          <VoiceInputFixed
            size="sm"
            onResult={(text) => {
              setDescription(description + (description ? ' ' : '') + text.trim())
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Select value={category} onValueChange={(value) => setCategory(value as EventCategory)}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EventCategory.WORK}>工作</SelectItem>
              <SelectItem value={EventCategory.MEETING}>会议</SelectItem>
              <SelectItem value={EventCategory.PERSONAL}>个人</SelectItem>
              <SelectItem value={EventCategory.EXERCISE}>运动</SelectItem>
              <SelectItem value={EventCategory.MEAL}>用餐</SelectItem>
              <SelectItem value={EventCategory.BREAK}>休息</SelectItem>
              <SelectItem value={EventCategory.TRADING}>交易</SelectItem>
              <SelectItem value={EventCategory.OTHER}>其他</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Priority.LOW}>低优先级</SelectItem>
              <SelectItem value={Priority.MEDIUM}>中等优先级</SelectItem>
              <SelectItem value={Priority.HIGH}>高优先级</SelectItem>
              <SelectItem value={Priority.URGENT}>紧急</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 高级选项 */}
      {isExpanded && (
        <div className="space-y-3 border-t border-white/10 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400">持续时间(分钟)</label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={15}
                max={480}
                step={15}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">灵活度</label>
              <Input
                type="range"
                value={flexibilityScore}
                onChange={(e) => setFlexibilityScore(Number(e.target.value))}
                min={0}
                max={100}
                className="bg-slate-700 border-slate-600"
              />
            </div>
          </div>

          <Select value={energyLevel} onValueChange={(value) => setEnergyLevel(value as EnergyLevel)}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="精力需求" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EnergyLevel.LOW}>低精力</SelectItem>
              <SelectItem value={EnergyLevel.MEDIUM}>中等精力</SelectItem>
              <SelectItem value={EnergyLevel.HIGH}>高精力</SelectItem>
              <SelectItem value={EnergyLevel.PEAK}>巅峰精力</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 智能分析结果 */}
      {(conflicts.length > 0 || suggestions.length > 0 || optimizationTips.length > 0) && (
        <div className="bg-slate-800/30 rounded-lg p-3 space-y-2">
          <div className="text-sm font-medium text-yellow-400">🧠 智能分析</div>
          
          {conflicts.length > 0 && (
            <div className="text-xs text-red-400">
              <div className="font-medium">⚠️ 冲突检测:</div>
              {conflicts.map((conflict, i) => (
                <div key={i} className="ml-2">• {conflict}</div>
              ))}
            </div>
          )}
          
          {suggestions.length > 0 && (
            <div className="text-xs text-blue-400">
              <div className="font-medium">💡 建议:</div>
              {suggestions.slice(0, 2).map((suggestion, i) => (
                <div key={i} className="ml-2">• {suggestion}</div>
              ))}
            </div>
          )}
          
          {optimizationTips.length > 0 && (
            <div className="text-xs text-green-400">
              <div className="font-medium">⚡ 优化:</div>
              {optimizationTips.slice(0, 2).map((tip, i) => (
                <div key={i} className="ml-2">• {tip}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex space-x-2">
        <Button 
          onClick={handleCreateEvent}
          className="flex-1 bg-purple-600 hover:bg-purple-700"
          size="sm"
        >
          🚀 创建事件
        </Button>
        <Button 
          onClick={() => setIsExpanded(!isExpanded)}
          variant="outline"
          className="text-white border-white/20"
          size="sm"
        >
          {isExpanded ? '简化' : '高级'}
        </Button>
        <Button 
          onClick={resetForm}
          variant="outline"
          className="text-white border-white/20"
          size="sm"
        >
          取消
        </Button>
      </div>
    </Card>
  )
}
