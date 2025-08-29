'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '../../src/components/ui/button'
import { Card } from '../../src/components/ui/card'
import { useEventStore } from '../../lib/stores/event-store'
import { Event, EventCategory, EnergyLevel } from '../../types/event'
import AddEventButton from './AddEventButton'

interface WeekViewProps {
  currentDate: Date
  onEventSelect?: (event: Event) => void
  onDateSelect?: (date: Date) => void
}

export default function WeekView({
  currentDate,
  onEventSelect,
  onDateSelect
}: WeekViewProps) {
  const { events, selectEvent, deleteEvent } = useEventStore()
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [hoveredHour, setHoveredHour] = useState<{ day: number; hour: number } | null>(null)

  // 获取一周的日期范围
  const getWeekDates = (date: Date) => {
    const week = []
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day
    startOfWeek.setDate(diff)

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      week.push(day)
    }
    return week
  }

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate])
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

  // 获取一周的所有事件
  const weekEvents = useMemo(() => {
    const startOfWeek = weekDates[0]
    const endOfWeek = new Date(weekDates[6])
    endOfWeek.setHours(23, 59, 59, 999)

    return events.filter(event => 
      event.startTime >= startOfWeek && event.startTime <= endOfWeek
    )
  }, [events, weekDates])

  // 按天分组事件
  const eventsByDay = useMemo(() => {
    const grouped: { [key: number]: Event[] } = {}
    
    weekDates.forEach((date, index) => {
      grouped[index] = weekEvents.filter(event => 
        event.startTime.toDateString() === date.toDateString()
      ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    })
    
    return grouped
  }, [weekEvents, weekDates])

  // 导航函数
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    const days = direction === 'prev' ? -7 : 7
    newDate.setDate(newDate.getDate() + days)
    onDateSelect?.(newDate)
  }

  const handleEventClick = (event: Event, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSelectedEvent(event)
    selectEvent(event.id)
    onEventSelect?.(event)
  }

  const handleDeleteEvent = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('确定要删除这个事件吗？')) {
      deleteEvent(eventId)
    }
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
      case EnergyLevel.PEAK: return 'text-red-300'
      case EnergyLevel.HIGH: return 'text-orange-300'
      case EnergyLevel.MEDIUM: return 'text-yellow-300'
      case EnergyLevel.LOW: return 'text-emerald-300'
      default: return 'text-gray-300'
    }
  }

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentHour = (date: Date, hour: number): boolean => {
    const now = new Date()
    return isToday(date) && now.getHours() === hour
  }

  const isWorkingHour = (hour: number): boolean => {
    return hour >= 9 && hour <= 18
  }

  const isTradingHour = (dayIndex: number, hour: number): boolean => {
    // 周一到周五的 18:00-23:00 是交易时段
    return dayIndex >= 1 && dayIndex <= 5 && hour >= 18 && hour <= 22
  }

  // 计算事件在时间轴上的位置和高度
  const getEventPosition = (event: Event) => {
    const startHour = event.startTime.getHours()
    const startMinute = event.startTime.getMinutes()
    const endHour = event.endTime.getHours()
    const endMinute = event.endTime.getMinutes()
    
    const top = (startHour + startMinute / 60) * 60 // 每小时60px
    const height = ((endHour + endMinute / 60) - (startHour + startMinute / 60)) * 60
    
    return { top, height: Math.max(height, 20) } // 最小高度20px
  }

  // 生成24小时时间刻度
  const timeSlots = Array.from({ length: 24 }, (_, i) => i)

  // 周统计
  const weekStats = useMemo(() => {
    const stats = {
      totalEvents: weekEvents.length,
      totalDuration: weekEvents.reduce((total, event) => 
        total + (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60), 0
      ),
      completed: weekEvents.filter(e => e.status === 'completed').length,
      highPriority: weekEvents.filter(e => e.priority === 'urgent' || e.priority === 'high').length,
      conflicts: weekEvents.filter(e => e.isConflicted).length
    }
    return stats
  }, [weekEvents])

  return (
    <div className="w-full h-full bg-black/30 backdrop-blur-sm rounded-xl border border-white/10 p-6 flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">
            {weekDates[0].toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} - 
            {weekDates[6].toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
          </h2>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              className="text-white border-white/20"
              onClick={() => navigateWeek('prev')}
            >
              ‹ 上周
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-white border-white/20"
              onClick={() => navigateWeek('next')}
            >
              下周 ›
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* 周统计摘要 */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="text-center">
              <div className="text-white font-semibold">{weekStats.totalEvents}</div>
              <div className="text-gray-400">事件</div>
            </div>
            <div className="text-center">
              <div className="text-cyan-300 font-semibold">{(weekStats.totalDuration / 60).toFixed(1)}h</div>
              <div className="text-gray-400">总时长</div>
            </div>
            {weekStats.conflicts > 0 && (
              <div className="text-center">
                <div className="text-red-400 font-semibold">{weekStats.conflicts}</div>
                <div className="text-gray-400">冲突</div>
              </div>
            )}
          </div>
          
        </div>
      </div>

      {/* 主体内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 时间刻度列 */}
        <div className="w-16 flex-shrink-0">
          <div className="h-12 mb-2"></div> {/* 对齐日期头部 */}
          <div className="overflow-y-auto pr-2" style={{ height: 'calc(100% - 3rem)' }}>
            {timeSlots.map(hour => (
              <div
                key={hour}
                className="h-[60px] flex items-start justify-end pr-2 text-xs text-gray-400 font-mono"
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>
        </div>

        {/* 日期列 */}
        <div className="flex-1 flex overflow-x-auto">
          {weekDates.map((date, dayIndex) => (
            <div key={dayIndex} className="flex-1 min-w-[120px] border-l border-white/10 first:border-l-0">
              {/* 日期头部 */}
              <div
                className={`h-12 px-2 py-1 border-b border-white/10 cursor-pointer hover:bg-white/5 ${
                  isToday(date) ? 'bg-cyan-500/10' : ''
                }`}
                onClick={() => onDateSelect?.(date)}
              >
                <div className="text-center">
                  <div className={`text-xs ${isToday(date) ? 'text-cyan-300 font-bold' : 'text-gray-400'}`}>
                    {weekDays[dayIndex]}
                  </div>
                  <div className={`text-lg font-semibold ${
                    isToday(date) ? 'text-cyan-300' : 'text-white'
                  }`}>
                    {date.getDate()}
                  </div>
                </div>
              </div>

              {/* 时间网格和事件 */}
              <div className="relative overflow-y-auto" style={{ height: 'calc(100% - 3rem)' }}>
                {/* 时间格子背景 */}
                {timeSlots.map(hour => (
                  <div
                    key={hour}
                    className={`h-[60px] border-b border-white/5 ${
                      isCurrentHour(date, hour) ? 'bg-cyan-500/5' : ''
                    } ${
                      isWorkingHour(hour) ? 'bg-white/[0.02]' : ''
                    } ${
                      isTradingHour(dayIndex, hour) ? 'bg-red-500/5' : ''
                    } hover:bg-white/5 cursor-pointer`}
                    onMouseEnter={() => setHoveredHour({ day: dayIndex, hour })}
                    onMouseLeave={() => setHoveredHour(null)}
                    onClick={() => {
                      // 可以在这里添加快速创建事件的逻辑
                    }}
                  >
                    {/* 交易时段标记 */}
                    {isTradingHour(dayIndex, hour) && (
                      <div className="absolute top-0 right-0 text-xs text-red-400 p-1">
                        📈
                      </div>
                    )}
                  </div>
                ))}

                {/* 当前时间线 */}
                {isToday(date) && (
                  <div
                    className="absolute left-0 right-0 border-t-2 border-cyan-500 pointer-events-none z-10"
                    style={{
                      top: `${(new Date().getHours() + new Date().getMinutes() / 60) * 60}px`
                    }}
                  >
                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-cyan-500 rounded-full"></div>
                  </div>
                )}

                {/* 事件 */}
                {eventsByDay[dayIndex]?.map(event => {
                  const { top, height } = getEventPosition(event)
                  return (
                    <div
                      key={event.id}
                      className={`absolute left-1 right-1 px-2 py-1 rounded cursor-pointer overflow-hidden transition-all hover:scale-105 hover:z-20 ${
                        selectedEvent?.id === event.id
                          ? 'ring-2 ring-cyan-500 shadow-lg'
                          : 'hover:shadow-md'
                      } ${event.isConflicted ? 'ring-1 ring-red-400' : ''}`}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        backgroundColor: getCategoryColor(event.category),
                        opacity: event.status === 'completed' ? 0.6 : 1
                      }}
                      onClick={(e) => handleEventClick(event, e)}
                      title={`${event.title}\n${event.startTime.toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })} - ${event.endTime.toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}`}
                    >
                      <div className="text-white text-xs">
                        <div className="font-medium truncate">
                          {event.isMarketProtected && '🛡️ '}
                          {event.status === 'completed' && '✓ '}
                          {event.title}
                        </div>
                        {height > 30 && (
                          <div className="text-white/80 text-[10px] truncate">
                            {event.startTime.toLocaleTimeString('zh-CN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                        {height > 50 && event.energyRequired && (
                          <div className={`text-[10px] ${getEnergyColor(event.energyRequired)}`}>
                            {event.energyRequired === 'peak' ? '巅峰' :
                             event.energyRequired === 'high' ? '高能' :
                             event.energyRequired === 'medium' ? '中等' : '低耗'}
                          </div>
                        )}
                      </div>
                      
                      {/* 删除按钮 */}
                      <button
                        className="absolute top-1 right-1 w-4 h-4 bg-red-500/80 rounded text-white text-xs flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteEvent(event.id, e)}
                      >
                        ×
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部提示 */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-white/10 rounded"></div>
            <span>工作时间</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500/20 rounded"></div>
            <span>交易时段</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-cyan-500 rounded"></div>
            <span>当前时间</span>
          </div>
        </div>
        
        <div>
          点击时间格创建事件 • 拖拽调整时间（开发中）
        </div>
      </div>
    </div>
  )
}
