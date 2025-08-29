/**
 * 认知带宽监控组件
 * 实时显示和管理认知负载状态
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  AlertTriangle, 
  Archive, 
  Zap, 
  TrendingUp,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  HelpCircle,
  X
} from 'lucide-react'
import CognitiveGuide from './CognitiveGuide'
import {
  CognitiveLoad,
  CognitiveItem,
  CommitmentPriority,
  CognitiveAlert
} from '../../types/cognitive'
import cognitiveBandwidthService from '../../lib/services/CognitiveBandwidthService'

interface BandwidthMonitorProps {
  className?: string
  compact?: boolean
  onTradingModeToggle?: (enabled: boolean) => void
}

export default function BandwidthMonitor({
  className = '',
  compact = false,
  onTradingModeToggle
}: BandwidthMonitorProps) {
  const [cognitiveLoad, setCognitiveLoad] = useState<CognitiveLoad | null>(null)
  const [alerts, setAlerts] = useState<CognitiveAlert[]>([])
  const [tradingMode, setTradingMode] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    loadCognitiveStatus()
    // 每30秒更新一次
    const interval = setInterval(loadCognitiveStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadCognitiveStatus = () => {
    const load = cognitiveBandwidthService.getCognitiveLoad()
    const recentAlerts = cognitiveBandwidthService.getRecentAlerts(3)
    setCognitiveLoad(load)
    setAlerts(recentAlerts)
  }

  const handleTradingMode = () => {
    if (tradingMode) {
      cognitiveBandwidthService.exitTradingFocusMode()
      setTradingMode(false)
    } else {
      cognitiveBandwidthService.enterTradingFocusMode(60)
      setTradingMode(true)
    }
    onTradingModeToggle?.(!tradingMode)
    loadCognitiveStatus()
  }

  const handleClearNonCritical = async () => {
    setIsClearing(true)
    try {
      const cleared = cognitiveBandwidthService.clearNonCritical()
      loadCognitiveStatus()
    } finally {
      setIsClearing(false)
    }
  }

  const getLoadColor = (current: number, max: number) => {
    const ratio = current / max
    if (ratio >= 1) return 'bg-red-500'
    if (ratio >= 0.7) return 'bg-orange-500'
    if (ratio >= 0.5) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getPriorityBadgeColor = (priority: CommitmentPriority) => {
    switch (priority) {
      case CommitmentPriority.CRITICAL:
        return 'bg-red-600 text-white'
      case CommitmentPriority.HIGH:
        return 'bg-orange-600 text-white'
      case CommitmentPriority.MEDIUM:
        return 'bg-blue-600 text-white'
      case CommitmentPriority.LOW:
        return 'bg-gray-500 text-white'
      default:
        return 'bg-gray-400'
    }
  }

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      default:
        return <CheckCircle className="w-4 h-4 text-blue-500" />
    }
  }

  if (!cognitiveLoad) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <Brain className="w-5 h-5 mr-2 animate-pulse" />
          <span>加载认知状态...</span>
        </div>
      </Card>
    )
  }

  // 紧凑模式
  if (compact) {
    return (
      <Card className={`${className}`}>
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Brain className={`w-5 h-5 ${tradingMode ? 'text-green-500' : 'text-gray-500'}`} />
              <div>
                <div className="text-sm font-medium">
                  认知带宽: {cognitiveLoad.current}/{cognitiveLoad.max}
                </div>
                <Progress 
                  value={(cognitiveLoad.current / cognitiveLoad.max) * 100}
                  className="w-24 h-2 mt-1"
                />
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={tradingMode ? "default" : "outline"}
                onClick={handleTradingMode}
                className="h-7"
              >
                <Zap className="w-3 h-3" />
              </Button>
              {cognitiveLoad.current > cognitiveLoad.threshold && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearNonCritical}
                  className="h-7"
                  disabled={isClearing}
                >
                  <Archive className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
          {/* 紧凑模式下的快速提示 */}
          <CognitiveGuide compact={true} />
        </div>
      </Card>
    )
  }

  // 完整模式
  const loadPercentage = (cognitiveLoad.current / cognitiveLoad.max) * 100
  const isOverloaded = cognitiveLoad.current >= cognitiveLoad.max
  const isWarning = cognitiveLoad.current >= cognitiveLoad.threshold

  return (
    <>
      <Card className={`${className} relative`}>
        {/* 头部状态栏 */}
        <div className={`p-4 border-b ${tradingMode ? 'bg-green-50' : ''}`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain className={`w-6 h-6 ${tradingMode ? 'text-green-500' : 'text-gray-600'}`} />
              <div>
                <h3 className="font-semibold text-lg">认知带宽监控</h3>
                {tradingMode && (
                  <Badge className="bg-green-600 text-white mt-1">
                    Trading专注模式
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowGuide(true)}
                className="text-gray-500 hover:text-gray-700"
                title="功能指南"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
            <Button
              size="sm"
              variant={tradingMode ? "destructive" : "default"}
              onClick={handleTradingMode}
            >
              {tradingMode ? (
                <>
                  <XCircle className="w-4 h-4 mr-1" />
                  退出专注
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-1" />
                  Trading模式
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearNonCritical}
              disabled={isClearing}
            >
              <Archive className="w-4 h-4 mr-1" />
              清理
            </Button>
          </div>
        </div>

        {/* 负载进度条 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              当前负载: {cognitiveLoad.current}/{cognitiveLoad.max}
            </span>
            <span className={`font-medium ${isOverloaded ? 'text-red-500' : isWarning ? 'text-orange-500' : 'text-green-500'}`}>
              {isOverloaded ? '过载!' : isWarning ? '接近上限' : '正常'}
            </span>
          </div>
          <div className="relative">
            <Progress 
              value={loadPercentage}
              className="h-3"
            />
            <div 
              className="absolute top-0 h-3 w-0.5 bg-orange-500"
              style={{ left: `${(cognitiveLoad.threshold / cognitiveLoad.max) * 100}%` }}
              title="警告线"
            />
          </div>
        </div>
      </div>

      {/* 活跃项列表 */}
      <div className="p-4 border-b">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          活跃事项 ({cognitiveLoad.activeItems.length})
        </h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {cognitiveLoad.activeItems.length === 0 ? (
            <p className="text-sm text-gray-500">暂无活跃事项，认知带宽充足</p>
          ) : (
            cognitiveLoad.activeItems.map(item => (
              <div 
                key={item.id}
                className="flex items-start justify-between p-2 bg-gray-50 rounded"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.title}</span>
                    <Badge className={`text-xs ${getPriorityBadgeColor(item.priority)}`}>
                      {item.priority}
                    </Badge>
                  </div>
                  {item.deadline && (
                    <span className="text-xs text-gray-500">
                      截止: {new Date(item.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium">负载: {item.load}</span>
                  {item.canAutoArchive && (
                    <span title="可自动归档">
                      <Archive className="w-3 h-3 text-gray-400" />
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 警告区域 */}
      {alerts.length > 0 && (
        <div className="p-4 bg-gray-50">
          <h4 className="font-medium mb-2 text-sm">最近提醒</h4>
          <div className="space-y-1">
            {alerts.map(alert => (
              <div 
                key={alert.id}
                className="flex items-start gap-2 text-sm"
              >
                {getAlertIcon(alert.severity)}
                <div className="flex-1">
                  <span>{alert.message}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 底部建议 */}
      {(isWarning || isOverloaded) && (
        <div className="p-4 bg-yellow-50 border-t border-yellow-200">
          <div className="flex items-start gap-2">
            <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">认知保护建议：</p>
              <ul className="mt-1 space-y-1 text-yellow-700">
                {isOverloaded && <li>• 立即拒绝新的承诺请求</li>}
                {isWarning && <li>• 考虑推迟低优先级任务</li>}
                <li>• 进入Trading专注模式屏蔽干扰</li>
                <li>• 使用智能拒绝模板保护边界</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      </Card>

      {/* 功能指南弹窗 */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <CognitiveGuide onClose={() => setShowGuide(false)} />
          </div>
        </div>
      )}
    </>
  )
}