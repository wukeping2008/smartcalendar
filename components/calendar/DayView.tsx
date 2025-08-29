'use client'

import React, { useState } from 'react'
import { Button } from '../../src/components/ui/button'
import { Card } from '../../src/components/ui/card'
import { useEventStore } from '../../lib/stores/event-store'
import { Event, EventCategory, EnergyLevel } from '../../types/event'
import AddEventButton from './AddEventButton'

interface DayViewProps {
  selectedDate: Date
  onBack: () => void
  onEventSelect?: (event: Event) => void
}

export default function DayView({ 
  selectedDate, 
  onBack,
  onEventSelect 
}: DayViewProps) {
  const { events, selectEvent } = useEventStore()
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  // 获取选中日期的所有事件
  const dayEvents = events.filter(event => 
    event.startTime.toDateString() === selectedDate.toDateString()
  ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

  // 生成24小时时间轴
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 0; hour < 24; hour++) {
      slots.push({
        hour,
        time: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), hour),
        events: dayEvents.filter(event => event.startTime.getHours() === hour)
      })
    }
    return slots
  }

  const timeSlots = generateTimeSlots()

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
    selectEvent(event.id)
    onEventSelect?.(event)
  }

  const handleDayAnalysis = () => {
    if (dayEvents.length === 0) {
      alert('📊 当天分析：今日暂无事件安排。建议规划一些有意义的活动！')
      return
    }

    const totalDuration = dayEvents.reduce((total, event) => 
      total + (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60), 0
    )
    const completedEvents = dayEvents.filter(e => e.status === 'completed').length
    const highPriorityEvents = dayEvents.filter(e => e.priority === 'urgent' || e.priority === 'high').length
    const conflictedEvents = dayEvents.filter(e => e.isConflicted).length
    
    const analysis = `📊 ${selectedDate.toLocaleDateString('zh-CN')} 当天分析报告：

🎯 基本统计：
• 总事件数：${dayEvents.length} 个
• 总时长：${(totalDuration / 60).toFixed(1)} 小时
• 完成率：${dayEvents.length > 0 ? (completedEvents / dayEvents.length * 100).toFixed(1) : 0}%
• 高优先级：${highPriorityEvents} 个
${conflictedEvents > 0 ? `• ⚠️ 冲突事件：${conflictedEvents} 个` : '• ✅ 无时间冲突'}

💡 AI分析建议：
${totalDuration > 480 ? '• 今日安排较满，注意劳逸结合' : '• 今日安排适中，可考虑增加学习时间'}
${highPriorityEvents > dayEvents.length * 0.5 ? '• 高优先级任务较多，建议重点关注' : '• 优先级分布合理'}
${conflictedEvents > 0 ? '• 请及时解决时间冲突问题' : '• 时间安排合理有序'}`

    alert(analysis)
  }

  const handleOptimizeAnalysis = () => {
    if (dayEvents.length === 0) {
      alert('🎯 优化分析：今日暂无事件，无需优化。建议先安排一些活动！')
      return
    }

    const energyDistribution = dayEvents.reduce((acc, event) => {
      acc[event.energyRequired] = (acc[event.energyRequired] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const recommendations = []
    
    // 精力分析
    if (energyDistribution.peak > 3) {
      recommendations.push('• 高峰精力任务过多，建议分散到不同时段')
    }
    if (energyDistribution.low < 2) {
      recommendations.push('• 建议增加一些轻松的缓冲任务')
    }
    
    // 时间分析
    const morningEvents = dayEvents.filter(e => e.startTime.getHours() < 12).length
    const afternoonEvents = dayEvents.filter(e => e.startTime.getHours() >= 12 && e.startTime.getHours() < 18).length
    const eveningEvents = dayEvents.filter(e => e.startTime.getHours() >= 18).length
    
    if (morningEvents === 0) {
      recommendations.push('• 上午时段空闲，建议安排重要任务')
    }
    if (eveningEvents > afternoonEvents + morningEvents) {
      recommendations.push('• 晚上安排较多，注意休息时间')
    }

    // 冲突处理
    const conflicts = dayEvents.filter(e => e.isConflicted)
    if (conflicts.length > 0) {
      recommendations.push(`• 发现 ${conflicts.length} 个时间冲突，需要重新安排`)
    }

    if (recommendations.length === 0) {
      recommendations.push('• 当前安排已经很优化，继续保持！')
    }

    const analysis = `🎯 ${selectedDate.toLocaleDateString('zh-CN')} 优化分析报告：

📈 时间分布：
• 上午：${morningEvents} 个事件
• 下午：${afternoonEvents} 个事件  
• 晚上：${eveningEvents} 个事件

⚡ 精力分配：
• 巅峰：${energyDistribution.peak || 0} 个
• 高能：${energyDistribution.high || 0} 个
• 中等：${energyDistribution.medium || 0} 个
• 低耗：${energyDistribution.low || 0} 个

💡 优化建议：
${recommendations.join('\n')}`

    alert(analysis)
  }

  const getCategoryColor = (category: EventCategory): string => {
    const colors = {
      [EventCategory.WORK]: '#3b82f6',
      [EventCategory.PERSONAL]: '#10b981',
      [EventCategory.MEETING]: '#f59e0b',
      [EventCategory.BREAK]: '#8b5cf6',
      [EventCategory.EXERCISE]: '#ef4444',
      [EventCategory.MEAL]: '#f97316',
      [EventCategory.TRAVEL]: '#06b6d4',
      [EventCategory.OTHER]: '#6b7280',
      [EventCategory.TRADING]: '#dc2626',
      [EventCategory.LIFE_ROUTINE]: '#059669',
      [EventCategory.PREPARATION]: '#7c3aed'
    }
    return colors[category] || '#6b7280'
  }

  const getEnergyColor = (level: EnergyLevel): string => {
    switch (level) {
      case EnergyLevel.PEAK: return 'bg-red-500/20 text-red-300 border-red-500/30'
      case EnergyLevel.HIGH: return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      case EnergyLevel.MEDIUM: return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case EnergyLevel.LOW: return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const formatDuration = (event: Event): string => {
    const duration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60)
    if (duration < 60) {
      return `${duration}分钟`
    } else {
      const hours = Math.floor(duration / 60)
      const minutes = duration % 60
      return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`
    }
  }

  const isCurrentHour = (hour: number): boolean => {
    const now = new Date()
    return now.toDateString() === selectedDate.toDateString() && now.getHours() === hour
  }

  // 计算当天统计
  const dayStats = {
    totalEvents: dayEvents.length,
    totalDuration: dayEvents.reduce((total, event) => total + event.estimatedDuration, 0),
    completed: dayEvents.filter(e => e.status === 'completed').length,
    inProgress: dayEvents.filter(e => e.status === 'in_progress').length,
    planned: dayEvents.filter(e => e.status === 'planned').length,
    highPriority: dayEvents.filter(e => e.priority === 'urgent' || e.priority === 'high').length,
    marketProtected: dayEvents.filter(e => e.isMarketProtected).length,
    conflicts: dayEvents.filter(e => e.isConflicted).length
  }

  return (
    <div className="w-full h-full bg-black/30 backdrop-blur-sm rounded-xl border border-white/10 p-6">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            size="sm"
            variant="outline"
            className="text-white border-white/20"
            onClick={onBack}
          >
            ← 返回月视图
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {selectedDate.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h2>
            <p className="text-cyan-300 text-sm">
              {selectedDate.toLocaleDateString('zh-CN', { weekday: 'long' })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* 当天统计摘要 */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="text-center">
              <div className="text-white font-semibold">{dayStats.totalEvents}</div>
              <div className="text-gray-400">事件</div>
            </div>
            <div className="text-center">
              <div className="text-cyan-300 font-semibold">{(dayStats.totalDuration / 60).toFixed(1)}h</div>
              <div className="text-gray-400">总时长</div>
            </div>
            {dayStats.conflicts > 0 && (
              <div className="text-center">
                <div className="text-red-400 font-semibold">{dayStats.conflicts}</div>
                <div className="text-gray-400">冲突</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex space-x-6 h-full">
        {/* 主时间轴区域 */}
        <div className="flex-1">
          <div className="h-full overflow-y-auto pr-4">
            <div className="space-y-1">
              {timeSlots.map(({ hour, time, events: hourEvents }) => (
                <div
                  key={hour}
                  className={`flex border-l-2 ${
                    isCurrentHour(hour) ? 'border-cyan-500 bg-cyan-500/5' : 'border-white/10'
                  } pl-4 py-2 min-h-[60px]`}
                >
                  {/* 时间标签 */}
                  <div className="w-16 flex-shrink-0">
                    <div className={`text-sm font-mono ${
                      isCurrentHour(hour) ? 'text-cyan-300 font-bold' : 'text-gray-400'
                    }`}>
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                  </div>

                  {/* 事件区域 */}
                  <div className="flex-1 ml-4">
                    {hourEvents.length === 0 ? (
                      <div className="h-full flex items-center">
                        <div className="text-gray-500 text-sm">- 空闲时间 -</div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {hourEvents.map((event) => (
                          <Card
                            key={event.id}
                            className={`p-3 cursor-pointer transition-all hover:scale-105 border ${
                              selectedEvent?.id === event.id
                                ? 'bg-cyan-600/20 border-cyan-500'
                                : 'bg-black/40 border-white/20 hover:bg-black/60'
                            } ${event.isConflicted ? 'border-red-400/50' : ''}`}
                            onClick={() => handleEventClick(event)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: getCategoryColor(event.category) }}
                                  />
                                  <h3 className="text-white font-medium text-sm">{event.title}</h3>
                                  {event.isMarketProtected && (
                                    <span className="text-yellow-400 text-xs">🛡️</span>
                                  )}
                                  {event.isConflicted && (
                                    <span className="text-red-400 text-xs">⚠️</span>
                                  )}
                                </div>
                                
                                <div className="text-xs text-gray-400 mb-2">
                                  {event.startTime.toLocaleTimeString('zh-CN', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })} - {event.endTime.toLocaleTimeString('zh-CN', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })} • {formatDuration(event)}
                                </div>
                                
                                {event.description && (
                                  <p className="text-gray-300 text-xs mb-2 line-clamp-2">
                                    {event.description}
                                  </p>
                                )}

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <span className={`text-xs px-2 py-1 rounded border ${getEnergyColor(event.energyRequired)}`}>
                                      {event.energyRequired === 'peak' ? '巅峰' :
                                       event.energyRequired === 'high' ? '高能' :
                                       event.energyRequired === 'medium' ? '中等' : '低耗'}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      event.priority === 'urgent' ? 'bg-red-500/20 text-red-300' :
                                      event.priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                                      event.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                                      'bg-green-500/20 text-green-300'
                                    }`}>
                                      {event.priority === 'urgent' ? '紧急' :
                                       event.priority === 'high' ? '高' :
                                       event.priority === 'medium' ? '中' : '低'}
                                    </span>
                                  </div>

                                  <div className={`text-xs px-2 py-1 rounded ${
                                    event.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                                    event.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300' :
                                    'bg-gray-500/20 text-gray-300'
                                  }`}>
                                    {event.status === 'completed' ? '✅ 已完成' :
                                     event.status === 'in_progress' ? '🔄 进行中' : '📋 计划中'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧详情面板 */}
        <div className="w-80 space-y-4">
          {/* 选中事件详情 */}
          {selectedEvent && (
            <Card className="bg-black/40 border-white/20 p-4">
              <h3 className="text-white font-semibold mb-3">事件详情</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="text-cyan-300 font-medium">{selectedEvent.title}</h4>
                  <p className="text-gray-300 text-sm mt-1">{selectedEvent.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400">开始时间</span>
                    <div className="text-white">
                      {selectedEvent.startTime.toLocaleTimeString('zh-CN')}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">结束时间</span>
                    <div className="text-white">
                      {selectedEvent.endTime.toLocaleTimeString('zh-CN')}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">时长</span>
                    <div className="text-white">{formatDuration(selectedEvent)}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">灵活度</span>
                    <div className="text-white">{selectedEvent.flexibilityScore}%</div>
                  </div>
                </div>

                {selectedEvent.tags.length > 0 && (
                  <div>
                    <span className="text-gray-400 text-xs">标签</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedEvent.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEvent.reminders.length > 0 && (
                  <div>
                    <span className="text-gray-400 text-xs">提醒</span>
                    <div className="mt-1 space-y-1">
                      {selectedEvent.reminders.map((reminder) => (
                        <div key={reminder.id} className="text-xs text-gray-300">
                          🔔 {reminder.time.toLocaleTimeString('zh-CN')} - {reminder.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* 当天统计 */}
          <Card className="bg-black/40 border-white/20 p-4">
            <h3 className="text-white font-semibold mb-3">当天统计</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">总事件</span>
                <span className="text-white">{dayStats.totalEvents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">总时长</span>
                <span className="text-cyan-300">{(dayStats.totalDuration / 60).toFixed(1)} 小时</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">已完成</span>
                <span className="text-green-400">{dayStats.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">进行中</span>
                <span className="text-blue-400">{dayStats.inProgress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">待执行</span>
                <span className="text-yellow-400">{dayStats.planned}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">高优先级</span>
                <span className="text-orange-400">{dayStats.highPriority}</span>
              </div>
              {dayStats.marketProtected > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">市场保护</span>
                  <span className="text-yellow-400">{dayStats.marketProtected}</span>
                </div>
              )}
              {dayStats.conflicts > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">时间冲突</span>
                  <span className="text-red-400">{dayStats.conflicts}</span>
                </div>
              )}
            </div>
          </Card>

          {/* 快速操作 */}
          <Card className="bg-black/40 border-white/20 p-4">
            <h3 className="text-white font-semibold mb-3">快速操作</h3>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full text-white border-white/20" 
                size="sm"
                onClick={handleDayAnalysis}
              >
                📊 当天分析
              </Button>
              <Button 
                variant="outline" 
                className="w-full text-white border-white/20" 
                size="sm"
                onClick={handleOptimizeAnalysis}
              >
                🎯 优化分析
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
