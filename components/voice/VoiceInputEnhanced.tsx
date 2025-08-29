'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '../../src/components/ui/button'
import { Card } from '../../src/components/ui/card'
import { Badge } from '../../src/components/ui/badge'
import { Mic, MicOff, Volume2, Loader2, X } from 'lucide-react'

interface VoiceInputEnhancedProps {
  onResult?: (text: string) => void
  onCommand?: (command: any) => void
  placeholder?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  mode?: 'click' | 'hold' | 'continuous'
  showStatus?: boolean
}

export default function VoiceInputEnhanced({
  onResult,
  onCommand,
  placeholder = '点击麦克风开始说话...',
  className = '',
  size = 'md',
  mode = 'click',
  showStatus = true
}: VoiceInputEnhancedProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'error'>('idle')
  const [error, setError] = useState('')
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null)
  
  const recognitionRef = useRef<any>(null)
  const finalTranscriptRef = useRef('')
  const isProcessingRef = useRef(false)

  useEffect(() => {
    // 检查浏览器支持
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      setIsSupported(!!SpeechRecognition)
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        
        // 基础设置
        recognition.lang = 'zh-CN'
        recognition.continuous = mode === 'continuous' // 只在连续模式下启用
        recognition.interimResults = true // 显示中间结果
        recognition.maxAlternatives = 1
        
        recognition.onstart = () => {
          console.log('语音识别已启动')
          setStatus('listening')
          setError('')
          finalTranscriptRef.current = ''
          setTranscript('')
          setInterimTranscript('')
        }
        
        recognition.onresult = (event: any) => {
          let interim = ''
          let final = ''
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              final += transcript
            } else {
              interim = transcript
            }
          }
          
          // 更新显示
          if (final) {
            finalTranscriptRef.current += final
            setTranscript(finalTranscriptRef.current)
            setInterimTranscript('')
            
            // 重置静默计时器
            if (silenceTimer) {
              clearTimeout(silenceTimer)
            }
            
            // 设置新的静默计时器（2秒后自动停止）
            const timer = setTimeout(() => {
              if (recognitionRef.current && isListening) {
                console.log('检测到静默，停止识别')
                stopListening()
              }
            }, 4000) // 从2秒增加到4秒
            setSilenceTimer(timer)
            
          } else {
            setInterimTranscript(interim)
          }
        }
        
        recognition.onerror = (event: any) => {
          console.error('语音识别错误:', event.error)
          setStatus('error')
          
          // 更友好的错误信息
          const errorMessages: { [key: string]: string } = {
            'no-speech': '未检测到语音，请再试一次',
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
          setIsListening(false)
          setStatus('idle')
          
          // 清理计时器
          if (silenceTimer) {
            clearTimeout(silenceTimer)
            setSilenceTimer(null)
          }
          
          // 如果有最终结果，触发回调
          if (finalTranscriptRef.current && !isProcessingRef.current) {
            isProcessingRef.current = true
            handleFinalResult(finalTranscriptRef.current)
          }
        }
        
        recognition.onspeechend = () => {
          console.log('检测到语音结束')
          // 在click模式下，不要立即停止，让静默计时器处理
          // 这样用户可以继续说话或手动停止
        }
        
        recognitionRef.current = recognition
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          console.log('停止识别时出错:', e)
        }
      }
      if (silenceTimer) {
        clearTimeout(silenceTimer)
      }
    }
  }, [mode])

  const handleFinalResult = (text: string) => {
    if (text.trim()) {
      console.log('最终识别结果:', text)
      
      // 触发回调
      if (onResult) {
        onResult(text)
      }
      
      // 解析命令
      if (onCommand) {
        const command = parseCommand(text)
        onCommand(command)
      }
      
      // 语音反馈
      speak('已识别：' + text.substring(0, 20))
    }
    
    isProcessingRef.current = false
  }

  const parseCommand = (text: string) => {
    // 简单的命令解析
    const command = {
      type: 'unknown',
      text: text,
      params: {}
    }
    
    // 日历事件相关
    if (text.includes('创建') || text.includes('安排') || text.includes('添加')) {
      command.type = 'create_event'
      
      // 解析时间
      if (text.includes('明天')) {
        command.params = { ...command.params, day: 'tomorrow' }
      } else if (text.includes('后天')) {
        command.params = { ...command.params, day: 'dayAfterTomorrow' }
      } else if (text.includes('今天')) {
        command.params = { ...command.params, day: 'today' }
      }
      
      // 解析事件类型
      if (text.includes('会议')) {
        command.params = { ...command.params, type: 'meeting' }
      } else if (text.includes('运动')) {
        command.params = { ...command.params, type: 'exercise' }
      } else if (text.includes('学习')) {
        command.params = { ...command.params, type: 'study' }
      }
    }
    
    // 查询相关
    else if (text.includes('查看') || text.includes('显示') || text.includes('有什么')) {
      command.type = 'query'
    }
    
    // 删除相关
    else if (text.includes('删除') || text.includes('取消')) {
      command.type = 'delete'
    }
    
    return command
  }

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      // 取消之前的语音
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'zh-CN'
      utterance.rate = 1.2
      utterance.pitch = 1.0
      utterance.volume = 0.8
      window.speechSynthesis.speak(utterance)
    }
  }

  const startListening = () => {
    if (!isSupported) {
      setError('您的浏览器不支持语音识别')
      return
    }
    
    if (recognitionRef.current && !isListening) {
      try {
        setIsListening(true)
        recognitionRef.current.start()
        speak('请开始说话，说完后点击停止按钮')
      } catch (error) {
        console.error('启动识别失败:', error)
        setError('启动失败，请重试')
        setIsListening(false)
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop()
        setIsListening(false)
      } catch (error) {
        console.error('停止识别失败:', error)
      }
    }
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  // 手动停止函数
  const handleManualStop = () => {
    if (isListening) {
      stopListening()
      // 立即处理结果
      if (finalTranscriptRef.current && !isProcessingRef.current) {
        isProcessingRef.current = true
        handleFinalResult(finalTranscriptRef.current)
      }
    }
  }

  const clearTranscript = () => {
    setTranscript('')
    setInterimTranscript('')
    finalTranscriptRef.current = ''
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

  // 主要渲染
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* 开始/停止按钮 */}
      <Button
        onClick={isListening ? handleManualStop : startListening}
        disabled={!isSupported}
        className={`${getSizeClasses()} ${
          isListening 
            ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
            : 'bg-blue-600 hover:bg-blue-700'
        } ${!isSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={
          !isSupported 
            ? '浏览器不支持语音识别' 
            : isListening 
              ? '点击停止并处理结果' 
              : '点击开始说话'
        }
      >
        {isListening ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      
      {/* 清除按钮 */}
      {transcript && (
        <Button
          onClick={clearTranscript}
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-gray-700 text-gray-400 hover:text-gray-200"
          title="清除输入"
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      {/* 状态显示 */}
      {showStatus && (
        <>
          {/* 识别状态 */}
          {isListening && (
            <div className="flex items-center gap-2">
              <Badge className="bg-green-600/20 text-green-400 border-green-600/50 animate-pulse">
                <Volume2 className="h-3 w-3 mr-1" />
                正在聆听...
              </Badge>
              <span className="text-xs text-gray-400">
                说完后点击停止或等待4秒
              </span>
            </div>
          )}
          
          {/* 显示识别结果 */}
          {(transcript || interimTranscript) && (
            <Card className="px-3 py-2 bg-gray-800/90 border-gray-700 max-w-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm">
                  {transcript && (
                    <span className="text-white">{transcript}</span>
                  )}
                  {interimTranscript && (
                    <span className="text-gray-400 italic ml-1">
                      {interimTranscript}
                    </span>
                  )}
                </div>
                {transcript && (
                  <Button
                    onClick={clearTranscript}
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0 hover:bg-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </Card>
          )}
          
          {/* 错误信息 */}
          {error && (
            <Badge className="bg-red-600/20 text-red-400 border-red-600/50">
              {error}
            </Badge>
          )}
        </>
      )}
    </div>
  )
}