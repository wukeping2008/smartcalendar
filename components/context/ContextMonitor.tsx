/**
 * Context Monitor - 情境监控面板组件
 * 实时显示当前情境状态和匹配的规则
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '../../src/components/ui/card'
import { Badge } from '../../src/components/ui/badge'
import { Button } from '../../src/components/ui/button'
import { 
  Activity, 
  MapPin, 
  Users, 
  Calendar, 
  Smartphone,
  Heart,
  Brain,
  Briefcase,
  Cloud,
  Bell,
  Eye,
  EyeOff,
  RefreshCw,
  Settings
} from 'lucide-react'
import ContextEngine from '../../lib/services/ContextEngine'
import { Context, ContextMatch } from '../../types/context'

interface ContextMonitorProps {
  className?: string
  compact?: boolean
}

export default function ContextMonitor({ className = '', compact = false }: ContextMonitorProps) {
  const [context, setContext] = useState<Context | null>(null)
  const [matches, setMatches] = useState<ContextMatch[]>([])
  const [isMonitoring, setIsMonitoring] = useState(true)
  const [showDetails, setShowDetails] = useState(!compact)
  const [refreshInterval, setRefreshInterval] = useState(120000) // 减少刷新频率，防止闪烁

  useEffect(() => {
    // 初始化情境监听
    const listener = {
      id: 'context-monitor-ui',
      name: 'Context Monitor UI',
      callback: (newContext: Context, newMatches: ContextMatch[]) => {
        setContext(newContext)
        setMatches(newMatches)
      }
    }

    ContextEngine.registerListener(listener)

    // 获取初始情境
    updateContext()

    // 设置定时更新
    const timer = isMonitoring ? setInterval(updateContext, refreshInterval) : null

    return () => {
      if (timer) clearInterval(timer)
      ContextEngine.removeListener(listener.id)
    }
  }, [isMonitoring, refreshInterval])

  const updateContext = async () => {
    try {
      const currentContext = await ContextEngine.updateContext()
      setContext(currentContext)
    } catch (error) {
      console.error('Failed to update context:', error)
    }
  }

  const getTimeOfDayIcon = () => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return '🌅' // 早晨
    if (hour >= 12 && hour < 17) return '☀️' // 下午
    if (hour >= 17 && hour < 21) return '🌆' // 傍晚
    if (hour >= 21 || hour < 3) return '🌙' // 夜晚
    return '🌃' // 凌晨
  }

  const getEnergyLevelColor = (level: string) => {
    const colors = {
      peak: 'text-green-500',
      high: 'text-blue-500',
      medium: 'text-yellow-500',
      low: 'text-orange-500',
      exhausted: 'text-red-500'
    }
    return colors[level as keyof typeof colors] || 'text-gray-500'
  }

  const getFocusLevelIcon = (level: string) => {
    const icons = {
      deep: '🎯',
      normal: '👁️',
      distracted: '😵‍💫'
    }
    return icons[level as keyof typeof icons] || '👁️'
  }

  if (!context) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="h-4 w-4 mr-2 opacity-50" />
          <span className="text-sm text-gray-500">正在加载情境...</span>
        </div>
      </Card>
    )
  }

  if (compact) {
    // 紧凑模式
    return (
      <Card className={`p-3 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getTimeOfDayIcon()}</span>
            <span className="text-sm font-medium">情境感知</span>
          </div>
          <div className="flex items-center space-x-1">
            {matches.length > 0 && (
              <Badge variant="default" className="text-xs">
                {matches.length} 规则触发
              </Badge>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDetails(!showDetails)}
              className="h-6 w-6 p-0"
            >
              {showDetails ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {showDetails && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-1">
                <Activity className="h-3 w-3" />
                <span className={getEnergyLevelColor(context.physiology.energyLevel)}>
                  {context.physiology.energyLevel}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Brain className="h-3 w-3" />
                <span>{getFocusLevelIcon(context.psychology.focusLevel)}</span>
              </div>
            </div>

            {matches.length > 0 && (
              <div className="pt-2 border-t">
                <div className="text-xs text-gray-600 mb-1">触发的规则:</div>
                {matches.slice(0, 2).map((match, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs mb-1">
                    <span className="truncate">{match.rule.name}</span>
                    <Badge variant="outline" className="text-xs ml-1">
                      {Math.round(match.confidence * 100)}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    )
  }

  // 完整模式
  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          情境监控中心
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant={isMonitoring ? 'default' : 'outline'}
            onClick={() => setIsMonitoring(!isMonitoring)}
          >
            {isMonitoring ? (
              <>
                <Eye className="h-3 w-3 mr-1" />
                监控中
              </>
            ) : (
              <>
                <EyeOff className="h-3 w-3 mr-1" />
                已暂停
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={updateContext}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
          >
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 情境维度 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {/* 时间 */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-lg">{getTimeOfDayIcon()}</span>
          </div>
          <div className="text-xs text-gray-600">时间</div>
          <div className="text-sm font-medium capitalize">{context.time.timeOfDay}</div>
          <div className="text-xs text-gray-500">
            {context.time.isWorkingHour ? '工作时间' : '休息时间'}
          </div>
        </div>

        {/* 地点 */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <MapPin className="h-4 w-4 text-green-600" />
            <span className="text-xs">📍</span>
          </div>
          <div className="text-xs text-gray-600">地点</div>
          <div className="text-sm font-medium">
            {context.location.currentPlace?.name || '未知'}
          </div>
          <div className="text-xs text-gray-500">
            {context.location.isLocationEnabled ? '已定位' : '未开启'}
          </div>
        </div>

        {/* 能量 */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <Heart className="h-4 w-4 text-yellow-600" />
            <span className="text-xs">⚡</span>
          </div>
          <div className="text-xs text-gray-600">能量</div>
          <div className={`text-sm font-medium capitalize ${getEnergyLevelColor(context.physiology.energyLevel)}`}>
            {context.physiology.energyLevel}
          </div>
          <div className="text-xs text-gray-500">
            生产力: {context.score.productivity}%
          </div>
        </div>

        {/* 专注 */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <Brain className="h-4 w-4 text-purple-600" />
            <span className="text-lg">{getFocusLevelIcon(context.psychology.focusLevel)}</span>
          </div>
          <div className="text-xs text-gray-600">专注</div>
          <div className="text-sm font-medium capitalize">{context.psychology.focusLevel}</div>
          <div className="text-xs text-gray-500">
            专注度: {context.score.focus}%
          </div>
        </div>
      </div>

      {/* 任务队列状态 */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Briefcase className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">任务状态</span>
          </div>
          <Badge variant="outline">
            {context.taskQueue.totalTasks} 项任务
          </Badge>
        </div>
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-gray-500">紧急:</span>
            <span className="ml-1 font-medium text-red-600">{context.taskQueue.urgentTasks}</span>
          </div>
          <div>
            <span className="text-gray-500">逾期:</span>
            <span className="ml-1 font-medium text-orange-600">{context.taskQueue.overdueTasks}</span>
          </div>
          <div>
            <span className="text-gray-500">工作量:</span>
            <span className="ml-1 font-medium">{Math.round(context.taskQueue.estimatedWorkload / 60)}h</span>
          </div>
          <div>
            <span className="text-gray-500">完成率:</span>
            <span className="ml-1 font-medium text-green-600">{context.taskQueue.completionRate}%</span>
          </div>
        </div>
      </div>

      {/* 触发的规则 */}
      {matches.length > 0 && (
        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Bell className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">触发的规则</span>
            </div>
            <Badge variant="default">
              {matches.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {matches.map((match, idx) => (
              <div key={idx} className="bg-white border rounded-lg p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{match.rule.name}</span>
                  <div className="flex items-center space-x-1">
                    <Badge variant="outline" className="text-xs">
                      优先级 {match.rule.priority}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(match.confidence * 100)}%
                    </Badge>
                  </div>
                </div>
                {match.rule.description && (
                  <p className="text-xs text-gray-600 mb-1">{match.rule.description}</p>
                )}
                {match.explanation && (
                  <p className="text-xs text-gray-500">{match.explanation}</p>
                )}
                {match.suggestedActions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {match.suggestedActions.map((action, actionIdx) => (
                      <Badge key={actionIdx} variant="outline" className="text-xs">
                        {action.type}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 情境标签 */}
      {context.tags.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center mb-2">
            <span className="text-sm font-medium mr-2">情境标签:</span>
            <div className="flex flex-wrap gap-1">
              {context.tags.map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 外部数据 */}
      {context.externalData && Object.keys(context.externalData).length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center mb-2">
            <Cloud className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">外部数据</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {context.externalData.weather && (
              <div>
                <span className="text-gray-500">天气:</span>
                <span className="ml-1">{context.externalData.weather.condition}</span>
              </div>
            )}
            {context.externalData.marketStatus && (
              <div>
                <span className="text-gray-500">市场:</span>
                <span className="ml-1">{context.externalData.marketStatus.isMarketOpen ? '开市' : '闭市'}</span>
              </div>
            )}
            {context.externalData.traffic && (
              <div>
                <span className="text-gray-500">交通:</span>
                <span className="ml-1">{context.externalData.traffic.congestionLevel}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}