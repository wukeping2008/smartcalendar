/**
 * Time Tracker Widget - 时间追踪器组件
 * 精确到秒的实时计时器
 */

import React, { useState, useEffect } from 'react'
import { Card } from '../../src/components/ui/card'
import { Button } from '../../src/components/ui/button'
import { Play, Pause, Square, Clock, Target, TrendingUp } from 'lucide-react'
import TimeBudgetService from '../../lib/services/TimeBudgetService'
import { BudgetCategory, TrackerStatus, TimerState } from '../../types/timebudget'

interface TimeTrackerWidgetProps {
  taskId?: string
  taskName?: string
  category?: BudgetCategory
  onComplete?: (duration: number) => void
  compact?: boolean
}

export default function TimeTrackerWidget({
  taskId,
  taskName,
  category = BudgetCategory.WORK,
  onComplete,
  compact = false
}: TimeTrackerWidgetProps) {
  const [timerState, setTimerState] = useState<TimerState | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentTaskName, setCurrentTaskName] = useState(taskName || '')
  const [currentCategory, setCurrentCategory] = useState(category)
  const [estimatedMinutes, setEstimatedMinutes] = useState(30)

  // 更新计时器状态 - 改为每秒更新以获得精确显示
  useEffect(() => {
    const updateTimerState = () => {
      const state = TimeBudgetService.getTimerState()
      setTimerState(state)
      setIsTracking(state.isRunning)
      setIsPaused(state.isPaused)
      
      if (state.taskName && state.taskName !== currentTaskName) {
        setCurrentTaskName(state.taskName)
      }
      if (state.category && state.category !== currentCategory) {
        setCurrentCategory(state.category)
      }
    }

    // 立即更新一次
    updateTimerState()

    // 如果正在追踪，每秒更新；否则每5秒更新
    const getInterval = () => {
      const state = TimeBudgetService.getTimerState()
      return state.isRunning ? 1000 : 5000
    }

    let interval = setInterval(updateTimerState, getInterval())

    // 监听追踪状态变化，动态调整更新频率
    let currentIntervalTime = getInterval()
    const checkInterval = setInterval(() => {
      const newInterval = getInterval()
      if (newInterval !== currentIntervalTime) {
        clearInterval(interval)
        interval = setInterval(updateTimerState, newInterval)
        currentIntervalTime = newInterval
      }
    }, 1000)

    return () => {
      clearInterval(interval)
      clearInterval(checkInterval)
    }
  }, [])

  // 开始追踪
  const handleStart = async () => {
    if (!currentTaskName) {
      alert('请输入任务名称')
      return
    }

    const tracker = await TimeBudgetService.startTracking(
      taskId || `task_${Date.now()}`,
      currentTaskName,
      currentCategory,
      estimatedMinutes * 60
    )

    if (tracker) {
      setIsTracking(true)
      setIsPaused(false)
    }
  }

  // 暂停/恢复
  const handlePauseResume = async () => {
    if (!timerState?.trackerId) return

    if (isPaused) {
      await TimeBudgetService.resumeTracking(timerState.trackerId)
      setIsPaused(false)
    } else {
      await TimeBudgetService.pauseTracking(timerState.trackerId)
      setIsPaused(true)
    }
  }

  // 停止追踪
  const handleStop = async () => {
    if (!timerState?.trackerId) return

    const tracker = await TimeBudgetService.stopTracking(timerState.trackerId)
    if (tracker) {
      setIsTracking(false)
      setIsPaused(false)
      
      if (onComplete) {
        onComplete(tracker.activeDuration)
      }
      
      // 显示完成提示
      console.log(`✅ 任务完成！用时: ${timerState.display.formatted}`)
    }
  }

  // 获取类别颜色
  const getCategoryColor = (cat: BudgetCategory) => {
    const colors: Record<BudgetCategory, string> = {
      [BudgetCategory.WORK]: 'bg-blue-500',
      [BudgetCategory.MEETING]: 'bg-purple-500',
      [BudgetCategory.BREAK]: 'bg-green-500',
      [BudgetCategory.LEARNING]: 'bg-yellow-500',
      [BudgetCategory.PERSONAL]: 'bg-pink-500',
      [BudgetCategory.EXERCISE]: 'bg-orange-500',
      [BudgetCategory.COMMUTE]: 'bg-gray-500',
      [BudgetCategory.OTHER]: 'bg-indigo-500'
    }
    return colors[cat] || 'bg-gray-500'
  }

  // 获取类别名称
  const getCategoryName = (cat: BudgetCategory) => {
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
    return names[cat] || cat
  }

  if (compact) {
    // 紧凑模式
    return (
      <Card className="bg-black/30 border-white/20 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span className="text-white font-semibold text-sm">时间追踪</span>
          </div>
          {isTracking && (
            <div className="text-cyan-400 font-mono text-lg">
              {timerState?.display.formatted || '00:00:00'}
            </div>
          )}
        </div>
        
        {!isTracking ? (
          <div className="mt-3 space-y-2">
            <input
              type="text"
              value={currentTaskName}
              onChange={(e) => setCurrentTaskName(e.target.value)}
              placeholder="任务名称..."
              className="w-full px-2 py-1 text-sm bg-black/50 border border-white/20 rounded text-white placeholder-gray-400"
            />
            <Button
              size="sm"
              onClick={handleStart}
              className="w-full bg-cyan-600 hover:bg-cyan-700"
            >
              <Play className="h-3 w-3 mr-1" />
              开始计时
            </Button>
          </div>
        ) : (
          <div className="mt-3">
            <div className="text-xs text-gray-400 mb-2">
              {currentTaskName} • {getCategoryName(currentCategory)}
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePauseResume}
                className="flex-1 text-white border-white/20"
              >
                {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleStop}
                className="flex-1 text-white border-white/20"
              >
                <Square className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    )
  }

  // 完整模式
  return (
    <Card className="bg-black/30 border-white/20 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${getCategoryColor(currentCategory)}/20`}>
            <Clock className={`h-5 w-5 ${getCategoryColor(currentCategory).replace('bg-', 'text-')}`} />
          </div>
          <div>
            <h3 className="text-white font-semibold">时间追踪器</h3>
            <p className="text-xs text-gray-400">精确到秒的计时</p>
          </div>
        </div>
        {isTracking && (
          <div className="text-right">
            <div className="text-3xl font-mono text-cyan-400">
              {timerState?.display.formatted || '00:00:00'}
            </div>
            {isPaused && (
              <div className="text-xs text-orange-400 mt-1">已暂停</div>
            )}
          </div>
        )}
      </div>

      {!isTracking ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">任务名称</label>
            <input
              type="text"
              value={currentTaskName}
              onChange={(e) => setCurrentTaskName(e.target.value)}
              placeholder="输入任务名称..."
              className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">类别</label>
              <select
                value={currentCategory}
                onChange={(e) => setCurrentCategory(e.target.value as BudgetCategory)}
                className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white"
              >
                {Object.values(BudgetCategory).map(cat => (
                  <option key={cat} value={cat}>
                    {getCategoryName(cat)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">预估时间(分钟)</label>
              <input
                type="number"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white"
                min="1"
                max="480"
              />
            </div>
          </div>

          <Button
            onClick={handleStart}
            className="w-full bg-cyan-600 hover:bg-cyan-700"
          >
            <Play className="h-4 w-4 mr-2" />
            开始计时
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-black/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">当前任务</span>
              <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(currentCategory)}/20 ${getCategoryColor(currentCategory).replace('bg-', 'text-')}`}>
                {getCategoryName(currentCategory)}
              </span>
            </div>
            <div className="text-white font-medium">{currentTaskName}</div>
            
            {timerState && estimatedMinutes > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>进度</span>
                  <span>{Math.min(100, Math.round((timerState.elapsed.active / (estimatedMinutes * 60)) * 100))}%</span>
                </div>
                <div className="w-full bg-black/50 rounded-full h-2">
                  <div 
                    className="bg-cyan-500 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${Math.min(100, (timerState.elapsed.active / (estimatedMinutes * 60)) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handlePauseResume}
              className="flex-1 text-white border-white/20 hover:bg-white/10"
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  继续
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  暂停
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleStop}
              className="flex-1 text-white border-red-500/50 hover:bg-red-500/20"
            >
              <Square className="h-4 w-4 mr-2" />
              停止
            </Button>
          </div>

          {timerState && (
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
              <div className="text-center">
                <div className="text-xs text-gray-400">活动时间</div>
                <div className="text-sm text-white font-mono">
                  {Math.floor(timerState.elapsed.active / 60)}分
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400">暂停时间</div>
                <div className="text-sm text-white font-mono">
                  {Math.floor(timerState.elapsed.paused / 60)}分
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400">总时间</div>
                <div className="text-sm text-white font-mono">
                  {Math.floor(timerState.elapsed.total / 60)}分
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}