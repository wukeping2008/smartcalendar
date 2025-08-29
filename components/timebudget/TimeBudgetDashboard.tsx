/**
 * Time Budget Dashboard - 时间预算仪表盘
 * 展示预算使用情况和统计
 */

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Clock, TrendingUp, AlertTriangle, CheckCircle, 
  Activity, Target, Zap, BarChart3 
} from 'lucide-react'
import TimeBudgetService from '../../lib/services/TimeBudgetService'
import { TimeBudget, BudgetCategory, TimeTracker } from '../../types/timebudget'
import { PanelGuide, PanelHelpButton } from '../ui/panel-guide'
import { PANEL_GUIDES } from '../../config/panel-guides'
import { PanelType } from '../../types/floating-panel'

interface TimeBudgetDashboardProps {
  compact?: boolean
}

export default function TimeBudgetDashboard({ compact = false }: TimeBudgetDashboardProps) {
  const [budgets, setBudgets] = useState<TimeBudget[]>([])
  const [todayTrackers, setTodayTrackers] = useState<TimeTracker[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    loadData()
    
    // 每30秒刷新一次数据
    const interval = setInterval(() => {
      loadData()
    }, 30000)

    return () => clearInterval(interval)
  }, [refreshKey])

  const loadData = () => {
    const allBudgets = TimeBudgetService.getAllBudgets()
    setBudgets(allBudgets)
    
    const trackers = TimeBudgetService.getTodayTrackers()
    setTodayTrackers(trackers)
  }

  // 获取类别颜色
  const getCategoryColor = (category: BudgetCategory) => {
    const colors: Record<BudgetCategory, string> = {
      [BudgetCategory.WORK]: 'text-blue-400',
      [BudgetCategory.MEETING]: 'text-purple-400',
      [BudgetCategory.BREAK]: 'text-green-400',
      [BudgetCategory.LEARNING]: 'text-yellow-400',
      [BudgetCategory.PERSONAL]: 'text-pink-400',
      [BudgetCategory.EXERCISE]: 'text-orange-400',
      [BudgetCategory.COMMUTE]: 'text-gray-400',
      [BudgetCategory.OTHER]: 'text-indigo-400'
    }
    return colors[category] || 'text-gray-400'
  }

  // 获取进度条颜色
  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'bg-red-500'
    if (percent >= 95) return 'bg-orange-500'
    if (percent >= 80) return 'bg-yellow-500'
    return 'bg-cyan-500'
  }

  // 格式化时间
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  // 计算总体统计
  const calculateStats = () => {
    const totalBudget = budgets.reduce((sum, b) => sum + b.budgets.daily, 0)
    const totalUsed = budgets.reduce((sum, b) => sum + b.usage.today, 0)
    const efficiency = totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 100) : 0
    const completedTasks = todayTrackers.filter(t => t.status === 'completed').length
    
    return {
      totalBudget,
      totalUsed,
      efficiency,
      completedTasks,
      remaining: Math.max(0, totalBudget - totalUsed)
    }
  }

  const stats = calculateStats()

  if (compact) {
    // 紧凑模式
    return (
      <div className="bg-gray-900/95 border border-gray-700/50 rounded-lg p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-cyan-400" />
            <span className="text-gray-100 font-semibold">时间预算</span>
          </div>
          <span className="text-sm text-gray-400 font-mono">
            {formatDuration(stats.totalUsed)} / {formatDuration(stats.totalBudget)}
          </span>
        </div>

        <div className="space-y-3">
          {budgets.slice(0, 3).map(budget => {
            const percent = (budget.usage.today / budget.budgets.daily) * 100
            const status = TimeBudgetService.getBudgetStatus(budget.category)
            
            return (
              <div key={budget.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className={`${getCategoryColor(budget.category)} font-medium`}>
                    {budget.name}
                  </span>
                  <span className="text-gray-300 font-mono">
                    {Math.round(percent)}%
                  </span>
                </div>
                <div className="w-full bg-gray-800/50 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(percent)}`}
                    style={{ width: `${Math.min(100, percent)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">今日效率</span>
            <span className="text-cyan-400 font-semibold font-mono">{stats.efficiency}%</span>
          </div>
        </div>
      </div>
    )
  }

  // 完整模式
  return (
    <div className="space-y-6 p-4">
      {/* 统一的功能指南 */}
      <PanelGuide
        {...PANEL_GUIDES[PanelType.TIME_BUDGET]}
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
      />
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <Clock className="h-6 w-6 text-cyan-400" />
            <span className="text-sm text-cyan-400 font-medium">今日</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-100 font-mono">
              {formatDuration(stats.totalUsed)}
            </div>
            <div className="text-sm text-gray-400 mt-1">已使用</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <Target className="h-6 w-6 text-green-400" />
            <span className="text-sm text-green-400 font-medium">剩余</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-100 font-mono">
              {formatDuration(stats.remaining)}
            </div>
            <div className="text-sm text-gray-400 mt-1">可用时间</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <Activity className="h-6 w-6 text-purple-400" />
            <span className="text-sm text-purple-400 font-medium">效率</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-100 font-mono">
              {stats.efficiency}%
            </div>
            <div className="text-sm text-gray-400 mt-1">利用率</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle className="h-6 w-6 text-orange-400" />
            <span className="text-sm text-orange-400 font-medium">完成</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-100 font-mono">
              {stats.completedTasks}
            </div>
            <div className="text-sm text-gray-400 mt-1">任务数</div>
          </div>
        </div>
      </div>

      {/* 分类预算详情 */}
      <div className="bg-gray-900/95 border border-gray-700/50 rounded-lg p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-gray-100 font-semibold flex items-center text-lg">
            <BarChart3 className="h-6 w-6 mr-3 text-cyan-400" />
            分类预算使用情况
          </h3>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRefreshKey(k => k + 1)}
              className="text-gray-400 hover:text-gray-200 border-gray-600 hover:border-gray-500"
            >
              刷新
            </Button>
            <PanelHelpButton onClick={() => setShowGuide(!showGuide)} />
          </div>
        </div>

        <div className="space-y-3">
          {budgets.map(budget => {
            const percent = (budget.usage.today / budget.budgets.daily) * 100
            const status = TimeBudgetService.getBudgetStatus(budget.category)
            const remaining = Math.max(0, budget.budgets.daily - budget.usage.today)
            
            return (
              <div key={budget.id} className="bg-gray-800/50 border border-gray-700/30 rounded-lg p-4 hover:bg-gray-800/70 transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className={`text-lg font-semibold ${getCategoryColor(budget.category)}`}>
                      {budget.name}
                    </span>
                    {status.status === 'warning' && (
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    )}
                    {status.status === 'critical' && (
                      <AlertTriangle className="h-4 w-4 text-orange-400" />
                    )}
                    {status.status === 'overrun' && (
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-100 font-mono">
                      {formatDuration(budget.usage.today)} / {formatDuration(budget.budgets.daily)}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      剩余 {formatDuration(remaining)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>使用率</span>
                    <span className="font-mono">{Math.round(percent)}%</span>
                  </div>
                  <div className="w-full bg-gray-800/70 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(percent)}`}
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>
                </div>

                {status.status !== 'normal' && (
                  <div className={`mt-2 text-xs ${
                    status.status === 'warning' ? 'text-yellow-400' :
                    status.status === 'critical' ? 'text-orange-400' :
                    'text-red-400'
                  }`}>
                    {status.status === 'warning' && '接近预算上限，请注意控制'}
                    {status.status === 'critical' && '即将超出预算！'}
                    {status.status === 'overrun' && `已超支 ${formatDuration(budget.usage.today - budget.budgets.daily)}`}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 今日任务列表 */}
      {todayTrackers.length > 0 && (
        <div className="bg-gray-900/95 border border-gray-700/50 rounded-lg p-6 backdrop-blur-sm">
          <h3 className="text-gray-100 font-semibold mb-4 flex items-center text-lg">
            <Zap className="h-6 w-6 mr-3 text-cyan-400" />
            今日时间记录
          </h3>
          
          <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800/50">
            {todayTrackers.map(tracker => (
              <div key={tracker.id} className="flex items-center justify-between bg-gray-800/50 border border-gray-700/30 rounded-lg p-3 hover:bg-gray-800/70 transition-all duration-200">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    tracker.status === 'running' ? 'bg-green-400 animate-pulse' :
                    tracker.status === 'paused' ? 'bg-yellow-400' :
                    tracker.status === 'completed' ? 'bg-cyan-400' :
                    'bg-gray-400'
                  }`} />
                  <div>
                    <div className="text-sm text-gray-100 font-medium">{tracker.taskName}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      {getCategoryName(tracker.category)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-cyan-400 font-semibold">
                    {formatDuration(tracker.activeDuration)}
                  </div>
                  {tracker.estimatedDuration && (
                    <div className="text-sm text-gray-400 mt-1">
                      预估 {formatDuration(tracker.estimatedDuration)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  // 获取类别名称
  function getCategoryName(category: BudgetCategory): string {
    const names: Record<BudgetCategory, string> = {
      [BudgetCategory.WORK]: '工作',
      [BudgetCategory.MEETING]: '会议',
      [BudgetCategory.BREAK]: '休息',
      [BudgetCategory.LEARNING]: '学习',
      [BudgetCategory.PERSONAL]: '个人',
      [BudgetCategory.EXERCISE]: '运动',
      [BudgetCategory.COMMUTE]: '通勤',
      [BudgetCategory.OTHER]: '其他'
    }
    return names[category] || category
  }
}
