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

interface TimeBudgetDashboardProps {
  compact?: boolean
}

export default function TimeBudgetDashboard({ compact = false }: TimeBudgetDashboardProps) {
  const [budgets, setBudgets] = useState<TimeBudget[]>([])
  const [todayTrackers, setTodayTrackers] = useState<TimeTracker[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

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
      <Card className="bg-black/30 border-white/20 p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-cyan-400" />
            <span className="text-white font-semibold text-sm">时间预算</span>
          </div>
          <span className="text-xs text-gray-400">
            {formatDuration(stats.totalUsed)} / {formatDuration(stats.totalBudget)}
          </span>
        </div>

        <div className="space-y-2">
          {budgets.slice(0, 3).map(budget => {
            const percent = (budget.usage.today / budget.budgets.daily) * 100
            const status = TimeBudgetService.getBudgetStatus(budget.category)
            
            return (
              <div key={budget.id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className={getCategoryColor(budget.category)}>
                    {budget.name}
                  </span>
                  <span className="text-gray-400">
                    {Math.round(percent)}%
                  </span>
                </div>
                <div className="w-full bg-black/50 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all ${getProgressColor(percent)}`}
                    style={{ width: `${Math.min(100, percent)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">今日效率</span>
            <span className="text-cyan-400 font-semibold">{stats.efficiency}%</span>
          </div>
        </div>
      </Card>
    )
  }

  // 完整模式
  return (
    <div className="space-y-4">
      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30 p-3">
          <div className="flex items-center justify-between">
            <Clock className="h-5 w-5 text-cyan-400" />
            <span className="text-xs text-cyan-400">今日</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white">
              {formatDuration(stats.totalUsed)}
            </div>
            <div className="text-xs text-gray-400">已使用</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 p-3">
          <div className="flex items-center justify-between">
            <Target className="h-5 w-5 text-green-400" />
            <span className="text-xs text-green-400">剩余</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white">
              {formatDuration(stats.remaining)}
            </div>
            <div className="text-xs text-gray-400">可用时间</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 p-3">
          <div className="flex items-center justify-between">
            <Activity className="h-5 w-5 text-purple-400" />
            <span className="text-xs text-purple-400">效率</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white">
              {stats.efficiency}%
            </div>
            <div className="text-xs text-gray-400">利用率</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-orange-500/30 p-3">
          <div className="flex items-center justify-between">
            <CheckCircle className="h-5 w-5 text-orange-400" />
            <span className="text-xs text-orange-400">完成</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white">
              {stats.completedTasks}
            </div>
            <div className="text-xs text-gray-400">任务数</div>
          </div>
        </Card>
      </div>

      {/* 分类预算详情 */}
      <Card className="bg-black/30 border-white/20 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            分类预算使用情况
          </h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setRefreshKey(k => k + 1)}
            className="text-gray-400 hover:text-white"
          >
            刷新
          </Button>
        </div>

        <div className="space-y-3">
          {budgets.map(budget => {
            const percent = (budget.usage.today / budget.budgets.daily) * 100
            const status = TimeBudgetService.getBudgetStatus(budget.category)
            const remaining = Math.max(0, budget.budgets.daily - budget.usage.today)
            
            return (
              <div key={budget.id} className="bg-black/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`text-lg ${getCategoryColor(budget.category)}`}>
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
                    <div className="text-sm text-white">
                      {formatDuration(budget.usage.today)} / {formatDuration(budget.budgets.daily)}
                    </div>
                    <div className="text-xs text-gray-400">
                      剩余 {formatDuration(remaining)}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>使用率</span>
                    <span>{Math.round(percent)}%</span>
                  </div>
                  <div className="w-full bg-black/50 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${getProgressColor(percent)}`}
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
      </Card>

      {/* 今日任务列表 */}
      {todayTrackers.length > 0 && (
        <Card className="bg-black/30 border-white/20 p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            今日时间记录
          </h3>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {todayTrackers.map(tracker => (
              <div key={tracker.id} className="flex items-center justify-between bg-black/50 rounded-lg p-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    tracker.status === 'running' ? 'bg-green-400 animate-pulse' :
                    tracker.status === 'paused' ? 'bg-yellow-400' :
                    tracker.status === 'completed' ? 'bg-cyan-400' :
                    'bg-gray-400'
                  }`} />
                  <div>
                    <div className="text-sm text-white">{tracker.taskName}</div>
                    <div className="text-xs text-gray-400">
                      {getCategoryName(tracker.category)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-cyan-400">
                    {formatDuration(tracker.activeDuration)}
                  </div>
                  {tracker.estimatedDuration && (
                    <div className="text-xs text-gray-400">
                      预估 {formatDuration(tracker.estimatedDuration)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
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