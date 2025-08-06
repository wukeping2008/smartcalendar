'use client'

import React, { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { WorkHoursBudget, EnergyLevel, EventCategory } from '../../types/event'
import { useEventStore } from '../../lib/stores/event-store'

interface EnhancedWorkHoursBudgetProps {
  className?: string
  // 新增精确工时预算特性
  preciseCalculation: {
    weeklyBudget: number      // 112小时 (16h * 7天)
    fixedDeductions: number   // 59小时固定扣除
    availableHours: number    // 53小时可用
    realTimeTracking: boolean // 实时追踪
  }
  // 精力曲线管理
  energyCurve: {
    morning: 'low'      // 7AM-12PM
    afternoon: 'medium' // 12PM-6PM  
    evening: 'high'     // 6PM-11PM (交易黄金时段)
    night: 'medium'     // 11PM后
  }
}

// 精确工时预算计算引擎
class PreciseWorkHourCalculator {
  // 基础配置
  static readonly DAILY_AVAILABLE = 16  // 7AM-11PM
  static readonly WEEKLY_BUDGET = 112   // 16h * 7天
  
  // 固定扣除 (每周)
  static readonly FIXED_DEDUCTIONS = {
    trading: {
      eveningSession: 25,    // 周一至五 6PM-11PM
      dailySetup: 7,         // 每天1小时捕兽夹
      monitoring: 3.5,       // 每天30分钟监控
      meals: 7               // 每天1小时晚餐
    },
    meetings: {
      mondayBusiness: 3,     // 周一业务会
      tuesdayFinance: 1.5,   // 周二财务会
      sundayRoutine: 2.5     // 周日复盘等
    },
    personal: {
      sundayCall: 0.5,       // 给爸爸电话
      saturdaySabbath: 6     // 周六学习
    }
  }
  
  // 计算总固定扣除
  static getTotalFixedDeductions(): number {
    const { trading, meetings, personal } = this.FIXED_DEDUCTIONS
    return Object.values(trading).reduce((a, b) => a + b, 0) +
           Object.values(meetings).reduce((a, b) => a + b, 0) +
           Object.values(personal).reduce((a, b) => a + b, 0)
  }
  
  // 可用工作时间
  static getWeeklyAvailable(): number {
    return this.WEEKLY_BUDGET - this.getTotalFixedDeductions() // 112 - 59 = 53
  }
  
  // 精力曲线分析
  static getEnergyLevel(hour: number): EnergyLevel {
    if (hour >= 7 && hour < 12) return EnergyLevel.LOW      // 早晨低能量
    if (hour >= 12 && hour < 18) return EnergyLevel.MEDIUM  // 下午中等能量
    if (hour >= 18 && hour < 23) return EnergyLevel.HIGH    // 晚上高能量(交易黄金时段)
    return EnergyLevel.MEDIUM  // 夜间中等能量
  }
  
  // 计算时段保护级别
  static getProtectionLevel(hour: number, day: number): 'absolute' | 'high' | 'medium' | 'low' {
    // 交易黄金时段 (周一至五 6PM-11PM)
    if (day >= 1 && day <= 5 && hour >= 18 && hour < 23) {
      return 'absolute'
    }
    // 其他交易相关时段
    if (hour >= 9 && hour < 17) {
      return 'high'
    }
    return 'low'
  }
}

export default function EnhancedWorkHoursBudgetComponent({ 
  className = "",
  preciseCalculation = {
    weeklyBudget: 112,
    fixedDeductions: 59,
    availableHours: 53,
    realTimeTracking: true
  },
  energyCurve = {
    morning: 'low',
    afternoon: 'medium', 
    evening: 'high',
    night: 'medium'
  }
}: EnhancedWorkHoursBudgetProps) {
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

  // 使用精确工时计算引擎
  const weeklyStats = useMemo(() => {
    const fixedDeductions = PreciseWorkHourCalculator.getTotalFixedDeductions()
    const availableHours = PreciseWorkHourCalculator.getWeeklyAvailable()
    
    return {
      totalBudget: preciseCalculation.weeklyBudget,
      fixedDeductions,
      availableHours,
      utilizationRate: (fixedDeductions / preciseCalculation.weeklyBudget) * 100
    }
  }, [preciseCalculation])
  
  // 分析精力曲线匹配度
  const energyAnalysis = useMemo(() => {
    const analysis = {
      optimal: 0,    // 精力匹配良好
      suboptimal: 0, // 精力匹配一般
      mismatch: 0    // 精力不匹配
    }
    
    todayEvents.forEach(event => {
      const eventHour = event.startTime.getHours()
      const recommendedEnergy = PreciseWorkHourCalculator.getEnergyLevel(eventHour)
      
      if (event.energyRequired === recommendedEnergy) {
        analysis.optimal += event.estimatedDuration / 60
      } else if (Math.abs(
        Object.values(EnergyLevel).indexOf(event.energyRequired) - 
        Object.values(EnergyLevel).indexOf(recommendedEnergy)
      ) === 1) {
        analysis.suboptimal += event.estimatedDuration / 60
      } else {
        analysis.mismatch += event.estimatedDuration / 60
      }
    })
    
    return analysis
  }, [todayEvents])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 精确工时预算总览 - 升级版 */}
      <Card className="bg-black/30 border-white/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">🎯 精确工时预算</h3>
          <div className="text-sm text-gray-400">
            {consumedToday.toFixed(1)}h / 16h (今日)
          </div>
        </div>
        
        {/* 周预算概览 */}
        <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded">
          <div className="text-purple-300 text-xs mb-2">📊 周预算分析</div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="text-center">
              <div className="text-white font-semibold">{weeklyStats.totalBudget}h</div>
              <div className="text-gray-400">总预算</div>
            </div>
            <div className="text-center">
              <div className="text-red-300 font-semibold">{weeklyStats.fixedDeductions}h</div>
              <div className="text-gray-400">固定扣除</div>
            </div>
            <div className="text-center">
              <div className="text-green-300 font-semibold">{weeklyStats.availableHours}h</div>
              <div className="text-gray-400">可用工时</div>
            </div>
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

        {/* 精力曲线分析 - 升级版 */}
      <Card className="bg-black/30 border-white/20 p-4">
        <h3 className="text-white font-semibold mb-3">⚡ 精力曲线匹配分析</h3>
        
        {/* 精力匹配度总览 */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-400">精力匹配度</span>
            <span className="text-white">
              {((energyAnalysis.optimal / (energyAnalysis.optimal + energyAnalysis.suboptimal + energyAnalysis.mismatch)) * 100 || 0).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="flex h-2 rounded-full overflow-hidden">
              <div 
                className="bg-green-500"
                style={{ width: `${(energyAnalysis.optimal / consumedToday) * 100}%` }}
              />
              <div 
                className="bg-yellow-500"
                style={{ width: `${(energyAnalysis.suboptimal / consumedToday) * 100}%` }}
              />
              <div 
                className="bg-red-500"
                style={{ width: `${(energyAnalysis.mismatch / consumedToday) * 100}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* 时段精力分析 */}
        <div className="space-y-2 mb-4">
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="text-center p-2 bg-green-500/10 border border-green-500/20 rounded">
              <div className="text-green-300 font-semibold">7-12</div>
              <div className="text-gray-400">低精力</div>
              <div className="text-white">{energyStats[EnergyLevel.LOW].toFixed(1)}h</div>
            </div>
            <div className="text-center p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
              <div className="text-yellow-300 font-semibold">12-18</div>
              <div className="text-gray-400">中精力</div>
              <div className="text-white">{energyStats[EnergyLevel.MEDIUM].toFixed(1)}h</div>
            </div>
            <div className="text-center p-2 bg-orange-500/10 border border-orange-500/20 rounded">
              <div className="text-orange-300 font-semibold">18-23</div>
              <div className="text-gray-400">高精力</div>
              <div className="text-white">{energyStats[EnergyLevel.HIGH].toFixed(1)}h</div>
            </div>
            <div className="text-center p-2 bg-red-500/10 border border-red-500/20 rounded">
              <div className="text-red-300 font-semibold">巅峰</div>
              <div className="text-gray-400">交易时段</div>
              <div className="text-white">{energyStats[EnergyLevel.PEAK].toFixed(1)}h</div>
            </div>
          </div>
        </div>
        
        {/* 智能精力优化建议 */}
        <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded">
          <div className="text-cyan-300 text-xs mb-2">🧠 智能精力优化</div>
          <div className="text-gray-300 text-xs space-y-1">
            {energyAnalysis.mismatch > 2 && (
              <div>• 检测到{energyAnalysis.mismatch.toFixed(1)}h精力不匹配，建议调整时间安排</div>
            )}
            {energyStats[EnergyLevel.HIGH] > 6 && (
              <div>• 交易黄金时段(18-23点)安排过满，建议保留缓冲时间</div>
            )}
            {energyAnalysis.optimal > energyAnalysis.suboptimal + energyAnalysis.mismatch && (
              <div>• ✨ 精力安排良好！保持当前的时间管理模式</div>
            )}
            {consumedToday < 12 && (
              <div>• 今日工时较少，可以考虑增加一些重要任务</div>
            )}
          </div>
        </div>
      </Card>

      {/* 市场保护时段与固定扣除分析 */}
      <Card className="bg-black/30 border-white/20 p-4">
        <h3 className="text-white font-semibold mb-3">🛡️ 市场保护与固定扣除</h3>
        
        {/* 今日保护时段 */}
        <div className="mb-4">
          <div className="text-gray-300 text-sm mb-2">今日保护时段</div>
          <div className="space-y-2">
            {todayEvents
              .filter(event => event.isMarketProtected)
              .map(event => {
                const hour = event.startTime.getHours()
                const day = event.startTime.getDay()
                const protectionLevel = PreciseWorkHourCalculator.getProtectionLevel(hour, day)
                
                return (
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
                        <span className={`ml-2 px-1 rounded text-xs ${
                          protectionLevel === 'absolute' ? 'bg-red-500/20 text-red-300' :
                          protectionLevel === 'high' ? 'bg-orange-500/20 text-orange-300' :
                          'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {protectionLevel === 'absolute' ? '绝对保护' :
                           protectionLevel === 'high' ? '高级保护' : '一般保护'}
                        </span>
                      </div>
                    </div>
                    <div className="text-yellow-400 text-xs">🛡️</div>
                  </div>
                )
              })}
            
            {todayEvents.filter(event => event.isMarketProtected).length === 0 && (
              <div className="text-gray-400 text-sm text-center py-2">
                今日无市场保护时段
              </div>
            )}
          </div>
        </div>
        
        {/* 固定扣除项目明细 */}
        <div className="p-3 bg-gray-500/10 border border-gray-500/20 rounded">
          <div className="text-gray-300 text-xs mb-2">📋 每周固定扣除明细 (总计: {weeklyStats.fixedDeductions}h)</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-red-300 mb-1">交易相关 (42.5h)</div>
              <div className="text-gray-400 space-y-0.5 ml-2">
                <div>• 晚间交易 25h</div>
                <div>• 日常设置 7h</div>
                <div>• 市场监控 3.5h</div>
                <div>• 交易晚餐 7h</div>
              </div>
            </div>
            <div>
              <div className="text-blue-300 mb-1">会议个人 (16.5h)</div>
              <div className="text-gray-400 space-y-0.5 ml-2">
                <div>• 周一业务会 3h</div>
                <div>• 周二财务会 1.5h</div>
                <div>• 周日复盘 2.5h</div>
                <div>• 周日电话 0.5h</div>
                <div>• 周六学习 6h</div>  
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
