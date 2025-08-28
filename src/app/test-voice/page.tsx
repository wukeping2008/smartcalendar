'use client'

import React, { useState, useEffect } from 'react'
import VoiceInputButton from '../../../components/voice/VoiceInputButton'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, CheckCircle, XCircle, Volume2, AlertCircle } from 'lucide-react'

export default function TestVoicePage() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null)
  const [lastResult, setLastResult] = useState('')
  const [testResults, setTestResults] = useState<any[]>([])
  const [browserInfo, setBrowserInfo] = useState<any>({})

  useEffect(() => {
    // 检查浏览器支持
    const checkSupport = () => {
      const hasWebkitSpeech = 'webkitSpeechRecognition' in window
      const hasSpeechRecognition = 'SpeechRecognition' in window
      const hasMediaDevices = navigator.mediaDevices && navigator.mediaDevices.getUserMedia
      
      setIsSupported(hasWebkitSpeech || hasSpeechRecognition)
      
      setBrowserInfo({
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        hasWebkitSpeech,
        hasSpeechRecognition,
        hasMediaDevices,
        azureConfigured: !!(process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY),
      })
    }

    checkSupport()
  }, [])

  const handleVoiceResult = (text: string) => {
    setLastResult(text)
    const result = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      text,
      success: true
    }
    setTestResults(prev => [result, ...prev])
  }

  const testMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const result = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        text: '麦克风权限测试成功',
        success: true,
        type: 'microphone'
      }
      setTestResults(prev => [result, ...prev])
      stream.getTracks().forEach(track => track.stop())
    } catch (error: any) {
      const result = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        text: `麦克风权限测试失败: ${error.message}`,
        success: false,
        type: 'microphone'
      }
      setTestResults(prev => [result, ...prev])
    }
  }

  const testSpeechSynthesis = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('语音合成测试成功')
      utterance.lang = 'zh-CN'
      window.speechSynthesis.speak(utterance)
      
      const result = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        text: '语音合成测试成功',
        success: true,
        type: 'synthesis'
      }
      setTestResults(prev => [result, ...prev])
    } else {
      const result = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        text: '浏览器不支持语音合成',
        success: false,
        type: 'synthesis'
      }
      setTestResults(prev => [result, ...prev])
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">语音功能测试页面</h1>
        
        {/* 浏览器支持状态 */}
        <Card className="bg-gray-800/50 border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">浏览器支持状态</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">语音识别支持</span>
              {isSupported === null ? (
                <Badge className="bg-gray-600">检测中...</Badge>
              ) : isSupported ? (
                <Badge className="bg-green-600">✅ 支持</Badge>
              ) : (
                <Badge className="bg-red-600">❌ 不支持</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">WebKit Speech API</span>
              <Badge className={browserInfo.hasWebkitSpeech ? "bg-green-600" : "bg-red-600"}>
                {browserInfo.hasWebkitSpeech ? '✅ 支持' : '❌ 不支持'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">标准 Speech API</span>
              <Badge className={browserInfo.hasSpeechRecognition ? "bg-green-600" : "bg-red-600"}>
                {browserInfo.hasSpeechRecognition ? '✅ 支持' : '❌ 不支持'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">媒体设备访问</span>
              <Badge className={browserInfo.hasMediaDevices ? "bg-green-600" : "bg-red-600"}>
                {browserInfo.hasMediaDevices ? '✅ 支持' : '❌ 不支持'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Azure配置</span>
              <Badge className={browserInfo.azureConfigured ? "bg-green-600" : "bg-yellow-600"}>
                {browserInfo.azureConfigured ? '✅ 已配置' : '⚠️ 未配置'}
              </Badge>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-900/50 rounded">
            <p className="text-xs text-gray-400">
              浏览器: {browserInfo.userAgent?.split(' ').slice(-2).join(' ')}<br/>
              语言: {browserInfo.language}<br/>
              平台: {browserInfo.platform}
            </p>
          </div>
        </Card>

        {/* 功能测试 */}
        <Card className="bg-gray-800/50 border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">功能测试</h2>
          <div className="flex gap-4 mb-4">
            <VoiceInputButton onResult={handleVoiceResult} />
            <Button 
              onClick={testMicrophone}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Mic className="h-4 w-4 mr-2" />
              测试麦克风
            </Button>
            <Button 
              onClick={testSpeechSynthesis}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              测试语音合成
            </Button>
          </div>
          
          {lastResult && (
            <div className="p-4 bg-green-900/20 border border-green-700 rounded">
              <p className="text-green-400">最新识别结果:</p>
              <p className="text-white font-medium">{lastResult}</p>
            </div>
          )}
        </Card>

        {/* 测试说明 */}
        <Card className="bg-gray-800/50 border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">测试说明</h2>
          <div className="space-y-3 text-gray-300">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium">测试前准备:</p>
                <ul className="text-sm mt-1 space-y-1 ml-4">
                  <li>• 使用Chrome或Edge浏览器</li>
                  <li>• 确保麦克风已连接并工作</li>
                  <li>• 允许浏览器访问麦克风权限</li>
                  <li>• 在安静的环境中测试</li>
                </ul>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Mic className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium">语音测试指令:</p>
                <ul className="text-sm mt-1 space-y-1 ml-4">
                  <li>• "创建明天9点的会议"</li>
                  <li>• "安排后天下午3点见客户"</li>
                  <li>• "提醒我下周一交报告"</li>
                  <li>• "今天晚上8点运动"</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* 测试历史 */}
        <Card className="bg-gray-800/50 border-gray-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">测试历史</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-400 text-center py-4">暂无测试记录</p>
            ) : (
              testResults.map(result => (
                <div 
                  key={result.id}
                  className={`p-3 rounded border ${
                    result.success 
                      ? 'bg-green-900/20 border-green-700' 
                      : 'bg-red-900/20 border-red-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={result.success ? 'text-green-400' : 'text-red-400'}>
                        {result.text}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{result.timestamp}</p>
                    </div>
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  {result.type && (
                    <Badge className="mt-2" variant="outline">
                      {result.type === 'microphone' ? '麦克风测试' : 
                       result.type === 'synthesis' ? '语音合成' : '语音识别'}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}