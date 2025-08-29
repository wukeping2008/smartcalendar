/**
 * Trading专注模式面板
 * 为交易决策提供最佳的专注环境
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Zap,
  Timer,
  TrendingUp,
  Shield,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  RefreshCw,
  LineChart,
  DollarSign,
  Clock,
  Brain,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Info,
  ChevronRight,
  BarChart3,
  Activity
} from 'lucide-react'
import { useCognitiveStore } from '../../lib/stores/cognitive-store'
import cognitiveBandwidthService from '../../lib/services/CognitiveBandwidthService'
import { PanelGuide, PanelHelpButton } from '../ui/panel-guide'
import { PANEL_GUIDES } from '../../config/panel-guides'
import { PanelType } from '../../types/floating-panel'

interface TradingFocusPanelProps {
  className?: string
  onClose?: () => void
}

interface TradingSession {
  id: string
  startTime: Date
  endTime?: Date
  decisions: TradingDecision[]
  profit: number
  focusScore: number // 专注度评分
}

interface TradingDecision {
  id: string
  timestamp: Date
  symbol: string
  action: 'BUY' | 'SELL' | 'HOLD' | 'WATCH'
  decisionTime: number // 决策用时（秒）
  confidence: number // 信心指数 0-100
  notes?: string
}

interface MarketAlert {
  id: string
  level: 'info' | 'warning' | 'critical'
  message: string
  timestamp: Date
}

export default function TradingFocusPanel({ 
  className = '',
  onClose 
}: TradingFocusPanelProps) {
  // 状态管理
  const { enterTradingMode, exitTradingMode, isInTradingMode } = useCognitiveStore()
  const [isActive, setIsActive] = useState(false)
  const [decisionTimer, setDecisionTimer] = useState(60) // 60秒决策倒计时
  const [sessionTime, setSessionTime] = useState(0) // 会话总时长
  const [currentDecision, setCurrentDecision] = useState<Partial<TradingDecision>>({})
  const [decisions, setDecisions] = useState<TradingDecision[]>([])
  const [marketAlerts, setMarketAlerts] = useState<MarketAlert[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [distractionBlocked, setDistractionBlocked] = useState(true)
  const [watchlist, setWatchlist] = useState<string[]>(['AAPL', 'TSLA', 'BTC', 'ETH', 'SPY'])
  const [showGuide, setShowGuide] = useState(false)
  
  // 定时器引用
  const decisionTimerRef = useRef<NodeJS.Timeout | null>(null)
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // 启动Trading模式
  const startTradingMode = () => {
    setIsActive(true)
    enterTradingMode(60)
    setSessionTime(0)
    setDecisionTimer(60)
    
    // 启动会话计时器
    sessionTimerRef.current = setInterval(() => {
      setSessionTime(prev => prev + 1)
    }, 1000)
    
    // 添加初始提醒
    addMarketAlert('info', 'Trading专注模式已启动，保持专注！')
    
    // 播放启动音效
    if (soundEnabled) {
      playSound('start')
    }
  }
  
  // 停止Trading模式
  const stopTradingMode = () => {
    setIsActive(false)
    exitTradingMode()
    
    // 清理计时器
    if (decisionTimerRef.current) {
      clearInterval(decisionTimerRef.current)
    }
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current)
    }
    
    // 计算并显示会话统计
    showSessionSummary()
    
    // 播放结束音效
    if (soundEnabled) {
      playSound('end')
    }
  }
  
  // 开始决策计时
  const startDecisionTimer = () => {
    setDecisionTimer(60)
    
    if (decisionTimerRef.current) {
      clearInterval(decisionTimerRef.current)
    }
    
    decisionTimerRef.current = setInterval(() => {
      setDecisionTimer(prev => {
        if (prev <= 1) {
          // 时间到，提醒决策
          if (soundEnabled) {
            playSound('alert')
          }
          addMarketAlert('warning', '决策时间已到！请立即做出决定')
          clearInterval(decisionTimerRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }
  
  // 记录交易决策
  const recordDecision = (action: TradingDecision['action']) => {
    const decision: TradingDecision = {
      id: `decision_${Date.now()}`,
      timestamp: new Date(),
      symbol: currentDecision.symbol || 'UNKNOWN',
      action,
      decisionTime: 60 - decisionTimer,
      confidence: currentDecision.confidence || 50,
      notes: currentDecision.notes
    }
    
    setDecisions(prev => [...prev, decision])
    setCurrentDecision({})
    
    // 重置决策计时器
    if (decisionTimerRef.current) {
      clearInterval(decisionTimerRef.current)
    }
    setDecisionTimer(60)
    
    // 反馈
    addMarketAlert('info', `决策已记录: ${action} ${decision.symbol}`)
  }
  
  // 添加市场提醒
  const addMarketAlert = (level: MarketAlert['level'], message: string) => {
    const alert: MarketAlert = {
      id: `alert_${Date.now()}`,
      level,
      message,
      timestamp: new Date()
    }
    
    setMarketAlerts(prev => [alert, ...prev].slice(0, 5)) // 只保留最新5条
  }
  
  // 播放音效（简化版）
  const playSound = (type: 'start' | 'end' | 'alert' | 'success') => {
    // 实际项目中应该使用真实音频文件
    if ('speechSynthesis' in window && soundEnabled) {
      const utterance = new SpeechSynthesisUtterance()
      utterance.volume = 0.3
      utterance.rate = 1.5
      
      switch (type) {
        case 'start':
          utterance.text = '开始'
          break
        case 'end':
          utterance.text = '结束'
          break
        case 'alert':
          utterance.text = '提醒'
          break
        case 'success':
          utterance.text = '成功'
          break
      }
      
      window.speechSynthesis.speak(utterance)
    }
  }
  
  // 显示会话总结
  const showSessionSummary = () => {
    const totalDecisions = decisions.length
    const avgDecisionTime = decisions.reduce((sum, d) => sum + d.decisionTime, 0) / (totalDecisions || 1)
    const avgConfidence = decisions.reduce((sum, d) => sum + d.confidence, 0) / (totalDecisions || 1)
    
    addMarketAlert('info', `会话结束：${totalDecisions}个决策，平均用时${avgDecisionTime.toFixed(1)}秒，信心指数${avgConfidence.toFixed(0)}%`)
  }
  
  // 格式化时间
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // 清理定时器
  useEffect(() => {
    return () => {
      if (decisionTimerRef.current) {
        clearInterval(decisionTimerRef.current)
      }
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current)
      }
    }
  }, [])
  
  const guideConfig = PANEL_GUIDES[PanelType.TRADING_FOCUS];

  return (
    <Card className={`${className} bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700 relative`}>
      {/* 头部状态栏 */}
      <div className={`p-4 border-b border-gray-700 ${isActive ? 'bg-green-900/20' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isActive ? 'bg-green-500/20' : 'bg-gray-700'}`}>
              <Zap className={`w-6 h-6 ${isActive ? 'text-green-400' : 'text-gray-400'}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Trading专注模式</h2>
              {isActive && (
                <Badge className="bg-green-600 text-white mt-1">
                  专注中 • {formatTime(sessionTime)}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 功能指南 */}
            <PanelHelpButton onClick={() => setShowGuide(!showGuide)} />
            
            {/* 声音开关 */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-gray-400 hover:text-white"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            
            {/* 干扰屏蔽 */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDistractionBlocked(!distractionBlocked)}
              className="text-gray-400 hover:text-white"
            >
              {distractionBlocked ? <Shield className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
            
            {/* 主控制按钮 */}
            {!isActive ? (
              <Button
                onClick={startTradingMode}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                启动专注
              </Button>
            ) : (
              <Button
                onClick={stopTradingMode}
                variant="destructive"
              >
                <Pause className="w-4 h-4 mr-2" />
                结束专注
              </Button>
            )}
            
            {onClose && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        
      </div>
      
      {/* 主体内容区 */}
      <div className="p-4">
        {isActive ? (
          <div className="space-y-4">
            {/* 决策计时器 */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Timer className="w-4 h-4 text-yellow-400" />
                  决策倒计时
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={startDecisionTimer}
                  className="text-gray-300 border-gray-600"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  重置
                </Button>
              </div>
              
              <div className="text-center">
                <div className={`text-5xl font-bold ${decisionTimer <= 10 ? 'text-red-400' : decisionTimer <= 30 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {decisionTimer}s
                </div>
                <Progress 
                  value={(decisionTimer / 60) * 100}
                  className="mt-3 h-2"
                />
              </div>
              
              {/* 快速决策按钮 */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                <Button
                  onClick={() => recordDecision('BUY')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  买入
                </Button>
                <Button
                  onClick={() => recordDecision('SELL')}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  卖出
                </Button>
                <Button
                  onClick={() => recordDecision('HOLD')}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  持有
                </Button>
                <Button
                  onClick={() => recordDecision('WATCH')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  观望
                </Button>
              </div>
            </div>
            
            {/* Watchlist扫描 */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-400" />
                Watchlist扫描
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {watchlist.map(symbol => (
                  <Button
                    key={symbol}
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDecision({ symbol })}
                    className={`text-gray-300 border-gray-600 hover:border-blue-500 ${currentDecision.symbol === symbol ? 'border-blue-500 bg-blue-500/10' : ''}`}
                  >
                    {symbol}
                  </Button>
                ))}
              </div>
              <div className="mt-3 text-xs text-gray-500">
                下次扫描: {new Date(Date.now() + (60 - new Date().getMinutes()) * 60000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            
            {/* 市场提醒 */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-400" />
                实时提醒
              </h3>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {marketAlerts.length === 0 ? (
                    <p className="text-sm text-gray-500">暂无提醒</p>
                  ) : (
                    marketAlerts.map(alert => (
                      <div 
                        key={alert.id}
                        className={`flex items-start gap-2 p-2 rounded ${
                          alert.level === 'critical' ? 'bg-red-900/20' :
                          alert.level === 'warning' ? 'bg-yellow-900/20' :
                          'bg-blue-900/20'
                        }`}
                      >
                        {alert.level === 'critical' ? <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" /> :
                         alert.level === 'warning' ? <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" /> :
                         <Info className="w-4 h-4 text-blue-400 mt-0.5" />}
                        <div className="flex-1">
                          <p className="text-sm text-gray-300">{alert.message}</p>
                          <p className="text-xs text-gray-500">
                            {alert.timestamp.toLocaleTimeString('zh-CN')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
            
            {/* 决策历史 */}
            {decisions.length > 0 && (
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  今日决策 ({decisions.length})
                </h3>
                <div className="space-y-1">
                  {decisions.slice(-3).reverse().map(decision => (
                    <div key={decision.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">
                        {decision.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-gray-300">{decision.symbol}</span>
                      <Badge className={
                        decision.action === 'BUY' ? 'bg-green-600' :
                        decision.action === 'SELL' ? 'bg-red-600' :
                        decision.action === 'HOLD' ? 'bg-yellow-600' :
                        'bg-blue-600'
                      }>
                        {decision.action}
                      </Badge>
                      <span className="text-gray-500">{decision.decisionTime}s</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 未启动状态 */
          <div className="text-center py-12">
            <div className="inline-flex p-4 bg-gray-800 rounded-full mb-4">
              <Zap className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              准备进入Trading专注模式
            </h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              点击"启动专注"进入高效交易状态，屏蔽一切干扰，专注于交易决策
            </p>
            
            {/* 最佳实践提示 */}
            <div className="bg-gray-800/30 rounded-lg p-4 max-w-md mx-auto text-left">
              <h4 className="font-medium text-white mb-2">最佳实践：</h4>
              <ul className="space-y-1 text-sm text-gray-400">
                <li className="flex items-start gap-1">
                  <ChevronRight className="w-3 h-3 mt-0.5" />
                  <span>每小时整点扫描Watchlist</span>
                </li>
                <li className="flex items-start gap-1">
                  <ChevronRight className="w-3 h-3 mt-0.5" />
                  <span>1分钟内完成决策，避免过度分析</span>
                </li>
                <li className="flex items-start gap-1">
                  <ChevronRight className="w-3 h-3 mt-0.5" />
                  <span>记录每个决策，复盘时分析</span>
                </li>
                <li className="flex items-start gap-1">
                  <ChevronRight className="w-3 h-3 mt-0.5" />
                  <span>保持情绪稳定，相信系统</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {/* 底部状态栏 */}
      {isActive && (
        <div className="px-4 pb-4">
          <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-gray-500">专注时长:</span>
                <span className="text-white font-medium">{formatTime(sessionTime)}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-500">决策数:</span>
                <span className="text-white font-medium">{decisions.length}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-500">平均用时:</span>
                <span className="text-white font-medium">
                  {decisions.length > 0 
                    ? `${(decisions.reduce((sum, d) => sum + d.decisionTime, 0) / decisions.length).toFixed(1)}s`
                    : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 统一的功能指南 */}
      <PanelGuide
        {...guideConfig}
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
      />
    </Card>
  )
}