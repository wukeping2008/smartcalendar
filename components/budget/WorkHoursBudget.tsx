'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { WorkHoursBudget, EnergyLevel } from '../../types/event'
import { useEventStore } from '../../lib/stores/event-store'

interface WorkHoursBudgetProps {
  className?: string
}

// 模拟工时预算数据
const mockBudget: WorkHoursBudget = {
  weeklyTotal: 112, // 7天 * 16小时/天
  dailyAllocations: {
    '2025-01-25': 16,
    '2025-01-26': 16,
    '2025-01-27': 16,
    '2025-01-28': 16,
    '2025-01-29': 16,
    '2025-01-30': 16,
    '2025-01-31': 16
  },
  categoryBudgets: {
    trading: 35.5,
    work: 28,
    meeting: 4.5,
    personal: 10.5,
    break: 8.5,
    exercise: 3.5,
    meal: 14,
    travel: 2,
    other: 5.5,
    life: 0,
    preparation: 0
  },
  consumed: 0,
  remaining: 112,
  overloadWarning: false
}

export default function WorkHoursBudgetComponent({ className = "" }: WorkHoursBudgetProps) {
  const { events } = useEventStore()
  
  // 计算今日已消耗工时
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
  
  const todayEvents = events.filter(event => 
    event.startTime >= todayStart && event.startTime < todayEnd
  )
  
  const consumedToday = todayEvents.reduce((total, event) => {
    return total + event.estimatedDuration
  }, 0) / 60 // 转换为小时
  
  const remainingToday = 16 - consumedToday
  const utilizationRate = (consumedToday / 16) * 100
  
  // 按精力等级分组统计
  const energyStats = {
    [EnergyLevel.PEAK]: 0,
    [EnergyLevel.HIGH]: 0,
    [EnergyLevel.MEDIUM]: 0,
    [EnergyLevel.LOW]: 0
  }
  
  todayEvents.forEach(event => {
    energyStats[event.energyRequired] += event.estimatedDuration / 60
  })
  
  const getProgressColor = (rate: number): string => {
    if (rate < 60) return 'bg-green-500'
    if (rate < 80) return 'bg-yellow-500'
    if (rate < 90) return 'bg-orange-500'
    return 'bg-red-500'
  }
  
  const getEnergyColor = (level: EnergyLevel): string => {
    switch (level) {
      case EnergyLevel.PEAK: return 'bg-red-500'
      case EnergyLevel.HIGH: return 'bg-orange-500'
      case EnergyLevel.MEDIUM: return 'bg-yellow-500'
      case EnergyLevel.LOW: return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 今日工时预算总览 */}
      <Card className="bg-black/30 border-white/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">今日工时预算</h3>
          <div className="text-sm text-gray-400">
            {consumedToday.toFixed(1)}h / 16h
          </div>
        </div>
        
        {/* 进度条 */}
        <div className="w-full bg-gray-700 rounded-full h-3 mb-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(utilizationRate)}`}
            style={{ width: `${Math.min(utilizationRate, 100)}%` }}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="text-center">
            <div className="text-green-400 font-semibold">
              {remainingToday.toFixed(1)}h
            </div>
            <div className="text-gray-400">剩余</div>
          </div>
          <div className="text-center">
            <div className="text-white font-semibold">
              {utilizationRate.toFixed(1)}%
            </div>
            <div className="text-gray-400">利用率</div>
          </div>
          <div className="text-center">
            <div className={`font-semibold ${utilizationRate > 85 ? 'text-red-400' : 'text-purple-400'}`}>
              {todayEvents.length}
            </div>
            <div className="text-gray-400">事件数</div>
          </div>
        </div>
        
        {utilizationRate > 85 && (
          <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-300 text-xs">
            ⚠️ 工时预算即将超载，建议重新安排优先级较低的任务
          </div>
        )}
      </Card>

      {/* 精力分配统计 */}
      <Card className="bg-black/30 border-white/20 p-4">
        <h3 className="text-white font-semibold mb-3">精力分配分析</h3>
        
        <div className="space-y-3">
          {Object.entries(energyStats).map(([level, hours]) => (
            <div key={level} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getEnergyColor(level as EnergyLevel)}`} />
                <span className="text-gray-300 text-sm capitalize">
                  {level === 'peak' ? '巅峰精力' : 
                   level === 'high' ? '高精力' :
                   level === 'medium' ? '中等精力' : '低精力'}
                </span>
              </div>
              <div className="text-white text-sm font-medium">
                {hours.toFixed(1)}h
              </div>
            </div>
          ))}
        </div>
        
        {/* 精力分配建议 */}
        <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded">
          <div className="text-cyan-300 text-xs mb-2">💡 精力优化建议</div>
          <div className="text-gray-300 text-xs space-y-1">
            {energyStats[EnergyLevel.PEAK] > 4 && (
              <div>• 巅峰精力任务过多，建议分散到多天</div>
            )}
            {energyStats[EnergyLevel.LOW] < 2 && (
              <div>• 可以增加一些低精力的例行任务</div>
            )}
            {energyStats[EnergyLevel.PEAK] + energyStats[EnergyLevel.HIGH] > 8 && (
              <div>• 高强度任务集中，注意安排休息时间</div>
            )}
          </div>
        </div>
      </Card>

      {/* 市场保护时段 */}
      <Card className="bg-black/30 border-white/20 p-4">
        <h3 className="text-white font-semibold mb-3">市场保护时段</h3>
        
        <div className="space-y-2">
          {todayEvents
            .filter(event => event.isMarketProtected)
            .map(event => (
              <div key={event.id} className="flex items-center justify-between p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                <div>
                  <div className="text-yellow-300 text-sm font-medium">{event.title}</div>
                  <div className="text-gray-400 text-xs">
                    {event.startTime.toLocaleTimeString('zh-CN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })} - {event.endTime.toLocaleTimeString('zh-CN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
                <div className="text-yellow-400 text-xs">🛡️</div>
              </div>
            ))}
          
          {todayEvents.filter(event => event.isMarketProtected).length === 0 && (
            <div className="text-gray-400 text-sm text-center py-2">
              今日无市场保护时段
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
