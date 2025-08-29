'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '../../src/components/ui/button'
import { Card } from '../../src/components/ui/card'
import { Badge } from '../../src/components/ui/badge'
import { Mic, MicOff, Square, X, AlertCircle } from 'lucide-react'

interface VoiceInputFixedProps {
  onResult?: (text: string) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function VoiceInputFixed({
  onResult,
  className = '',
  size = 'md'
}: VoiceInputFixedProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [finalText, setFinalText] = useState('')
  const [interimText, setInterimText] = useState('')
  const [error, setError] = useState('')
  
  const recognitionRef = useRef<any>(null)
  const allTextRef = useRef('')

  useEffect(() => {
    // 检查浏览器支持
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      setIsSupported(!!SpeechRecognition)
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        
        // 重要设置 - 确保不会自动停止
        recognition.lang = 'zh-CN'
        recognition.continuous = true  // 持续识别，不自动停止
        recognition.interimResults = true  // 显示中间结果
        recognition.maxAlternatives = 1
        
        recognition.onstart = () => {
          console.log('语音识别已启动')
          setError('')
          allTextRef.current = ''
          setFinalText('')
          setInterimText('')
          // 不要在这里发出任何声音
        }
        
        recognition.onresult = (event: any) => {
          let currentInterim = ''
          let newFinal = ''
          
          // 处理所有结果
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            
            if (event.results[i].isFinal) {
              // 最终结果 - 累加到总文本
              newFinal += transcript
            } else {
              // 中间结果 - 只显示当前的
              currentInterim = transcript
            }
          }
          
          // 更新最终文本
          if (newFinal) {
            allTextRef.current += newFinal
            setFinalText(allTextRef.current)
            setInterimText('')  // 清除中间结果
          } else {
            // 只更新中间结果显示
            setInterimText(currentInterim)
          }
          
          // 不要在这里停止识别或发出声音
        }
        
        recognition.onerror = (event: any) => {
          console.error('语音识别错误:', event.error)
          
          // 忽略 no-speech 错误，让用户继续
          if (event.error === 'no-speech') {
            console.log('继续等待语音输入...')
            return
          }
          
          // 其他错误才显示
          const errorMessages: { [key: string]: string } = {
            'audio-capture': '无法访问麦克风',
            'not-allowed': '麦克风权限被拒绝',
            'network': '网络连接错误',
            'aborted': '识别已中止'
          }
          
          const errorMsg = errorMessages[event.error] || `识别错误: ${event.error}`
          setError(errorMsg)
          setIsListening(false)
        }
        
        recognition.onend = () => {
          console.log('语音识别已结束')
          // 如果还在监听状态，自动重启（防止超时自动停止）
          if (isListening) {
            try {
              recognition.start()
              console.log('自动重启识别...')
            } catch (e) {
              console.log('重启失败，用户需要手动停止')
              setIsListening(false)
            }
          }
        }
        
        // 移除所有自动停止的事件
        recognition.onspeechend = () => {
          // 不做任何事，继续监听
          console.log('检测到语音暂停，继续监听...')
        }
        
        recognition.onnomatch = () => {
          // 不做任何事，继续监听
          console.log('无法匹配，继续监听...')
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
  }, [isListening])  // 添加 isListening 依赖

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
        recognitionRef.current.start()
        // 不要发出语音提示
      } catch (error) {
        console.error('启动识别失败:', error)
        setError('启动失败，请重试')
        setIsListening(false)
      }
    }
  }

  // 停止录音并处理结果
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        setIsListening(false)
        recognitionRef.current.stop()
        
        // 处理最终结果
        const fullText = allTextRef.current + (interimText || '')
        if (fullText.trim() && onResult) {
          onResult(fullText.trim())
          // 不要发出语音反馈
        }
      } catch (error) {
        console.error('停止识别失败:', error)
      }
    }
  }

  // 清除文本
  const clearText = () => {
    setFinalText('')
    setInterimText('')
    allTextRef.current = ''
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

  // 获取显示的完整文本
  const displayText = finalText + (interimText ? ` ${interimText}` : '')

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* 控制按钮组 */}
      <div className="flex items-center gap-1">
        {!isListening ? (
          // 开始录音按钮
          <Button
            onClick={startListening}
            disabled={!isSupported}
            className={`${getSizeClasses()} bg-blue-600 hover:bg-blue-700 ${
              !isSupported ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title={!isSupported ? '浏览器不支持语音识别' : '点击开始录音'}
          >
            <Mic className="h-4 w-4" />
          </Button>
        ) : (
          // 停止录音按钮
          <Button
            onClick={stopListening}
            className={`${getSizeClasses()} bg-red-600 hover:bg-red-700 animate-pulse`}
            title="点击停止录音"
          >
            <Square className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* 状态和结果显示 */}
      <div className="flex items-center gap-2">
        {/* 录音状态 */}
        {isListening && (
          <Badge className="bg-red-600/20 text-red-400 border-red-600/50 animate-pulse">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              录音中...
            </div>
          </Badge>
        )}
        
        {/* 文本显示 */}
        {displayText && (
          <Card className="px-3 py-2 bg-gray-800/90 border-gray-700 max-w-md">
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm">
                {/* 已确认的文本 */}
                {finalText && (
                  <span className="text-white">{finalText}</span>
                )}
                {/* 临时文本（灰色斜体） */}
                {interimText && (
                  <span className="text-gray-400 italic">
                    {finalText ? ' ' : ''}{interimText}
                  </span>
                )}
              </div>
              {/* 清除按钮 */}
              <Button
                onClick={clearText}
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 hover:bg-gray-700"
                title="清除文本"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        )}
        
        {/* 错误提示 */}
        {error && (
          <Badge className="bg-red-600/20 text-red-400 border-red-600/50">
            <AlertCircle className="h-3 w-3 mr-1" />
            {error}
          </Badge>
        )}

        {/* 使用提示 */}
        {!isListening && !displayText && !error && (
          <span className="text-xs text-gray-500">
            点击麦克风开始，点击方块停止
          </span>
        )}
      </div>
    </div>
  )
}