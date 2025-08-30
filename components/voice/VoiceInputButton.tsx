'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '../../src/components/ui/button'
import { useEventStore } from '../../lib/stores/event-store'
import { EventCategory, Priority, EventStatus, EnergyLevel } from '../../types/event'
import { AzureSpeechService } from '../../lib/services/AzureSpeechService'
import { aiService } from '../../lib/services/AIService'
import type { IAudioService } from '../../lib/services/IAudioService'
import { useVoiceCommandStore, VoiceCommandIntent } from '../../lib/stores/voice-command-store'
import { PanelType } from '../../types/floating-panel'

// Type definitions for Web Speech API to fix TypeScript errors
interface SpeechRecognition extends EventTarget {
  grammars: SpeechGrammarList;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  serviceURI: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  // Add other event handlers as needed: onaudiostart, onsoundstart, onspeechstart, onspeechend, onsoundend, onaudiostart
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechGrammarList {
  addFromString(string: string, weight?: number): void;
  // Add other properties and methods as needed
}

// Extend window object
interface ExtendedWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
}

declare const window: ExtendedWindow;

interface VoiceInputButtonProps {
  onResult?: (text: string) => void
  className?: string
}

export default function VoiceInputButton({ onResult, className = "" }: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [currentText, setCurrentText] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)
  const { addEvent } = useEventStore()
  
  const audioServiceRef = useRef<IAudioService | null>(null)
  const accumulatedTextRef = useRef('')
  const [voiceInteractions, setVoiceInteractions] = useState<Array<{
    id: string
    timestamp: Date
    input: string
    result: string
    success: boolean
  }>>([])

  // 添加语音交互记录
  const addVoiceInteraction = (input: string, result: string, success: boolean) => {
    const interaction = {
      id: `voice_${Date.now()}`,
      timestamp: new Date(),
      input,
      result,
      success
    }
    setVoiceInteractions(prev => [interaction, ...prev.slice(0, 9)]) // 保留最近10条记录
    
    // 保存到localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('voice_interactions') || '[]'
        const interactions = JSON.parse(saved)
        interactions.unshift(interaction)
        localStorage.setItem('voice_interactions', JSON.stringify(interactions.slice(0, 50))) // 保留最近50条
      } catch (error) {
        console.warn('保存语音交互记录失败:', error)
      }
    }
  }

  // 加载历史记录
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('voice_interactions')
        if (saved) {
          const interactions = JSON.parse(saved).slice(0, 10)
          setVoiceInteractions(interactions.map((item: { timestamp: string | number | Date }) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          })))
        }
      } catch (error) {
        console.warn('加载语音交互记录失败:', error)
      }
    }
  }, [])

  // 初始化语音服务
  useEffect(() => {
    const initAudioService = async () => {
      try {
        // 检查浏览器是否支持语音识别
        const speechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
        
        if (!speechRecognition) {
          setIsSupported(false)
          return
        }

        // 尝试初始化Azure语音服务
        try {
          const hasAzureConfig = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY && 
                                 process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION
          
          if (hasAzureConfig) {
            audioServiceRef.current = new AzureSpeechService()
            if (!audioServiceRef.current) return;
            await audioServiceRef.current.initTranscription()
            await audioServiceRef.current.initSynthesis()
            
            // 设置回调
            audioServiceRef.current.onTranscriptionUpdate((text: string, isFinal: boolean) => {
              if (isFinal && text.trim()) {
                accumulatedTextRef.current += text + ' '
                setCurrentText(accumulatedTextRef.current)
                setTranscript(accumulatedTextRef.current.trim())
              } else {
                setCurrentText((accumulatedTextRef.current + text).trim())
              }
            })

            audioServiceRef.current.onError((error) => {
              console.warn('Azure语音服务错误:', error)
              setIsListening(false)
            })

            setIsSupported(true)
            setIsInitialized(true)
            return
          }
        } catch (azureError) {
          console.warn('Azure语音服务初始化失败，回退到浏览器API:', azureError)
        }

        // 回退到浏览器语音识别
        setIsSupported(speechRecognition)
        setIsInitialized(false)
        
      } catch (error) {
        console.warn('语音服务初始化失败:', error)
        setIsSupported(false)
      }
    }

    initAudioService()

    // 清理函数
    return () => {
      if (audioServiceRef.current) {
        try {
          audioServiceRef.current.destroy()
        } catch (error) {
          console.warn('清理语音服务失败:', error)
        }
      }
    }
  }, [])

  // 语音识别
  const startListening = async () => {
    if (!isSupported) {
      speakResponse('浏览器不支持语音识别，请使用Chrome浏览器')
      return
    }

    try {
      // 清空之前的结果
      setTranscript('')
      setCurrentText('')
      accumulatedTextRef.current = ''

      // 如果有Azure服务，使用Azure
      if (audioServiceRef.current && isInitialized) {
        setIsListening(true)
        await audioServiceRef.current.startTranscription()
        return
      }

      // 回退到浏览器API
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      
      if (!SpeechRecognition) {
        speakResponse('浏览器不支持语音识别功能')
        return
      }

      const recognition = new SpeechRecognition()

      recognition.continuous = true  // 改为连续识别
      recognition.interimResults = true  // 显示中间结果
      recognition.lang = 'zh-CN'
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsListening(true)
        speakResponse('开始录音，请说话')
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        // 更新显示
        if (finalTranscript) {
          setTranscript(finalTranscript.trim())
          setCurrentText(finalTranscript.trim())
          onResult?.(finalTranscript.trim())
        } else {
          setCurrentText(interimTranscript)
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn('语音识别错误:', event.error)
        setIsListening(false)
        if (event.error === 'no-speech') {
          speakResponse('没有检测到语音，请重试')
        } else if (event.error === 'not-allowed') {
          speakResponse('请允许浏览器访问麦克风权限')
        } else {
          speakResponse('语音识别失败，请重试')
        }
      }

      recognition.onend = () => {
        setIsListening(false)
        // 如果有最终识别结果，处理它
        const finalText = transcript || currentText
        if (finalText.trim()) {
          handleVoiceResult(finalText.trim())
        } else {
          speakResponse('没有识别到语音内容')
        }
      }

      recognition.start()
      
    } catch (error) {
      console.error('启动语音识别失败:', error)
      setIsListening(false)
      speakResponse('语音识别启动失败，请重试')
    }
  }

  // 停止语音识别
  const stopListening = async () => {
    try {
      if (audioServiceRef.current && isInitialized) {
        await audioServiceRef.current.stopTranscription()
        
        // 处理Azure识别结果
        if (currentText.trim()) {
          handleVoiceResult(currentText.trim())
        }
      }
      setIsListening(false)
    } catch (error) {
      // 停止语音识别失败 - 静默处理
      setIsListening(false)
    }
  }

  // 处理语音识别结果
  const handleVoiceResult = async (result: string) => {
    onResult?.(result);

    // 1. 尝试解析为面板控制命令
    const panelCommand = await aiService.parsePanelCommand(result);
    if (panelCommand.intent === 'open_panel' || panelCommand.intent === 'close_panel') {
      const { setCommand } = useVoiceCommandStore.getState();
      setCommand({
        intent: panelCommand.intent as VoiceCommandIntent,
        panelType: panelCommand.panelType as PanelType,
      });
      speakResponse(`好的，正在${panelCommand.intent === 'open_panel' ? '打开' : '关闭'}${panelCommand.panelType}面板`);
      return;
    }

    // 2. 如果不是面板命令，则尝试解析为事件创建命令
    try {
      const parsedEventCommand = await aiService.parseNaturalLanguageCommand(result);
      const entities = parsedEventCommand.entities || {};

      if (parsedEventCommand.intent === 'create_event' && entities.title) {
        const eventData = {
          title: entities.title,
          description: `通过语音创建：${result}`,
          startTime: entities.dateTime ? new Date(entities.dateTime) : new Date(Date.now() + 60 * 60 * 1000),
          endTime: entities.dateTime && entities.duration 
            ? new Date(new Date(entities.dateTime).getTime() + entities.duration * 60000) 
            : new Date(Date.now() + 2 * 60 * 60 * 1000),
          category: entities.category || EventCategory.OTHER,
          priority: entities.priority || Priority.MEDIUM,
          status: EventStatus.PLANNED,
          position: { x: 0, y: 0, z: 0 },
          size: { width: 200, height: 80, depth: 20 },
          color: getCategoryColor(entities.category || EventCategory.OTHER),
          opacity: 0.8,
          isSelected: false,
          isDragging: false,
          isHovered: false,
          isConflicted: false,
          tags: ['语音创建'],
          reminders: [],
          energyRequired: EnergyLevel.MEDIUM,
          estimatedDuration: entities.duration || 60,
          isMarketProtected: false,
          flexibilityScore: 70
        };
        
        addEvent(eventData);
        const successMessage = `已创建事件：${eventData.title}，时间：${eventData.startTime.toLocaleString()}`;
        speakResponse(successMessage);
        addVoiceInteraction(result, successMessage, true);
      } else {
        // 如果AI解析失败，回退到本地解析
        const eventData = parseVoiceToEvent(result)
        if (eventData) {
          try {
            addEvent(eventData)
            const successMessage = `已创建事件：${eventData.title}，时间：${eventData.startTime.toLocaleString()}`
            speakResponse(successMessage)
            addVoiceInteraction(result, successMessage, true)
          } catch (error) {
            const errorMessage = '创建事件失败，请重试'
            speakResponse(errorMessage)
            addVoiceInteraction(result, errorMessage, false)
          }
        } else {
          const errorMessage = '抱歉，无法理解您的指令。请尝试说：创建会议、明天9点开会、添加运动时间等'
          speakResponse(errorMessage)
          addVoiceInteraction(result, errorMessage, false)
        }
      }
    } catch (error) {
      // AI服务失败，回退到本地解析
      const eventData = parseVoiceToEvent(result)
      if (eventData) {
        try {
          addEvent(eventData)
          const successMessage = `已创建事件：${eventData.title}，时间：${eventData.startTime.toLocaleString()}`
          speakResponse(successMessage)
          addVoiceInteraction(result, successMessage, true)
        } catch (error) {
          const errorMessage = '创建事件失败，请重试'
          speakResponse(errorMessage)
          addVoiceInteraction(result, errorMessage, false)
        }
      } else {
        const errorMessage = '抱歉，无法理解您的指令。请尝试说：创建会议、明天9点开会、添加运动时间等'
        speakResponse(errorMessage)
        addVoiceInteraction(result, errorMessage, false)
      }
    }
  }

  // 语音合成响应
  const speakResponse = async (text: string) => {
    try {
      // 优先使用Azure语音合成
      if (audioServiceRef.current && isInitialized) {
        await audioServiceRef.current.synthesizeAndPlay(text)
        return
      }
      
      // 回退到浏览器语音合成
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'zh-CN'
        window.speechSynthesis.speak(utterance)
      }
    } catch (error) {
      // 语音合成失败，回退到浏览器API
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'zh-CN'
        window.speechSynthesis.speak(utterance)
      }
    }
  }

  // 语音合成（兼容性保留）
  const speak = (text: string) => {
    speakResponse(text)
  }

  // 解析语音指令创建事件
  const parseVoiceToEvent = (text: string) => {
    const normalizedText = text.toLowerCase().trim()
    
    // 更灵活的指令识别
    const hasCreateCommand = normalizedText.includes('创建') || 
                           normalizedText.includes('新建') || 
                           normalizedText.includes('添加') ||
                           normalizedText.includes('安排') ||
                           normalizedText.includes('预约') ||
                           normalizedText.includes('提醒我') ||
                           // 直接的时间表达也应该被识别
                           /\d{1,2}[点时]/.test(normalizedText) ||
                           /(今天|明天|后天|下周)/.test(normalizedText)
    
    if (!hasCreateCommand && 
        !normalizedText.includes('会议') && 
        !normalizedText.includes('工作') && 
        !normalizedText.includes('运动') && 
        !normalizedText.includes('吃饭') &&
        !normalizedText.includes('休息')) {
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
    const timeMatch = normalizedText.match(/(\d{1,2})[点时](\d{1,2}[分]?)?/)
    const dateMatch = normalizedText.match(/(今天|明天|后天|下周)/)
    
    const targetDate = new Date(now)
    
    // 处理日期
    if (dateMatch) {
      const dateStr = dateMatch[1]
      if (dateStr === '明天') {
        targetDate.setDate(targetDate.getDate() + 1)
      } else if (dateStr === '后天') {
        targetDate.setDate(targetDate.getDate() + 2)
      } else if (dateStr === '下周') {
        targetDate.setDate(targetDate.getDate() + 7)
      }
    }
    
    // 处理时间
    if (timeMatch) {
      const hour = parseInt(timeMatch[1])
      const minute = timeMatch[2] ? parseInt(timeMatch[2].replace('分', '')) : 0
      
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute < 60) {
        startTime = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), hour, minute)
        endTime = new Date(startTime.getTime() + 60 * 60 * 1000)
      }
    } else {
      // 如果没有具体时间，根据当前时间智能推断
      if (targetDate.getDate() === now.getDate()) {
        // 今天的话，设置为1小时后
        startTime = new Date(now.getTime() + 60 * 60 * 1000)
        endTime = new Date(startTime.getTime() + 60 * 60 * 1000)
      } else {
        // 其他日期，设置为上午9点
        startTime = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 9, 0)
        endTime = new Date(startTime.getTime() + 60 * 60 * 1000)
      }
    }

    // 提取标题
    if (!title) {
      title = normalizedText
        .replace(/创建|新建|添加|安排|预约|提醒我/g, '')
        .replace(/\d{1,2}[点时](\d{1,2}[分]?)?/g, '')
        .replace(/今天|明天|后天|下周|上午|下午|晚上/g, '')
        .replace(/紧急|重要|高优先级|低优先级/g, '')
        .replace(/的?事件?$/, '') // 去掉结尾的"事件"
        .trim()
      
      if (!title || title.length < 2) {
        // 根据类别设置默认标题
        if (category === EventCategory.MEETING) {
          title = '会议'
        } else if (category === EventCategory.WORK) {
          title = '工作任务'
        } else if (category === EventCategory.EXERCISE) {
          title = '运动时间'
        } else if (category === EventCategory.MEAL) {
          title = '用餐时间'
        } else if (category === EventCategory.BREAK) {
          title = '休息时间'
        } else {
          title = '新事件'
        }
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
        onClick={isListening ? stopListening : startListening}
        variant="outline" 
        className={`w-full border-white/20 ${
          isListening 
            ? 'bg-red-600 text-white animate-pulse' 
            : 'text-white hover:bg-white/10'
        }`}
        size="sm"
      >
        {isListening ? '🔴 点击停止录音' : '🎤 语音创建'}
      </Button>
      
      {(transcript || currentText) && (
        <div className="mt-2 text-xs text-gray-400 p-2 bg-black/20 rounded">
          识别结果: {transcript || currentText}
        </div>
      )}
      
      {isInitialized && (
        <div className="mt-1 text-xs text-green-400">
          ✅ Azure语音服务已就绪
        </div>
      )}

      {/* 语音交互记录 */}
      {voiceInteractions.length > 0 && (
        <div className="mt-2 text-xs">
          <div className="text-gray-300 mb-1">最近语音交互:</div>
          <div className="space-y-1 max-h-32 overflow-y-auto bg-black/10 rounded p-2">
            {voiceInteractions.slice(0, 3).map((interaction) => (
              <div key={interaction.id} className={`text-xs p-1 rounded ${
                interaction.success ? 'bg-green-900/30 border-l-2 border-green-500' : 'bg-red-900/30 border-l-2 border-red-500'
              }`}>
                <div className="font-mono text-gray-300">
                  {interaction.input}
                </div>
                <div className={interaction.success ? 'text-green-400' : 'text-red-400'}>
                  {interaction.result}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {interaction.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
