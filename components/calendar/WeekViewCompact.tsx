'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useEventStore } from '../../lib/stores/event-store'
import { Event, EventCategory, Priority, EnergyLevel } from '../../types/event'
import { Clock, Calendar, AlertCircle, TrendingUp, Coffee } from 'lucide-react'

interface WeekViewCompactProps {
  currentDate: Date
  onEventSelect?: (event: Event) => void
  onDateSelect?: (date: Date) => void
}

export default function WeekViewCompact({
  currentDate,
  onEventSelect,
  onDateSelect
}: WeekViewCompactProps) {
  const { events, selectEvent, deleteEvent, addEvent } = useEventStore()
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [expandedDay, setExpandedDay] = useState<number | null>(null)

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

  // 获取每天的统计信息
  const getDayStats = (dayIndex: number) => {
    const dayEvents = eventsByDay[dayIndex] || []
    return {
      eventCount: dayEvents.length,
      totalHours: dayEvents.reduce((total, event) => 
        total + (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60), 0
      ),
      hasHighPriority: dayEvents.some(e => e.priority === Priority.URGENT || e.priority === Priority.HIGH),
      hasConflict: dayEvents.some(e => e.isConflicted),
      categories: [...new Set(dayEvents.map(e => e.category))]
    }
  }

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
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(null)
      }
    }
  }

  const getCategoryColor = (category: EventCategory): string => {
    const colors = {
      [EventCategory.WORK]: 'bg-blue-500',
      [EventCategory.PERSONAL]: 'bg-emerald-500',
      [EventCategory.MEETING]: 'bg-amber-500',
      [EventCategory.BREAK]: 'bg-purple-500',
      [EventCategory.EXERCISE]: 'bg-red-500',
      [EventCategory.MEAL]: 'bg-orange-500',
      [EventCategory.TRAVEL]: 'bg-cyan-500',
      [EventCategory.OTHER]: 'bg-gray-500',
      [EventCategory.TRADING]: 'bg-red-600',
      [EventCategory.LIFE_ROUTINE]: 'bg-green-600',
      [EventCategory.PREPARATION]: 'bg-violet-600'
    }
    return colors[category] || 'bg-gray-500'
  }

  const getPriorityBadge = (priority: Priority) => {
    const badges = {
      [Priority.URGENT]: { text: '紧急', className: 'bg-red-500/20 text-red-400 border-red-500/50' },
      [Priority.HIGH]: { text: '高', className: 'bg-orange-500/20 text-orange-400 border-orange-500/50' },
      [Priority.MEDIUM]: { text: '中', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' },
      [Priority.LOW]: { text: '低', className: 'bg-green-500/20 text-green-400 border-green-500/50' }
    }
    return badges[priority] || badges[Priority.MEDIUM]
  }

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isWeekend = (dayIndex: number): boolean => {
    return dayIndex === 0 || dayIndex === 6
  }

  // 获取当前时间进度
  const getCurrentTimeProgress = (date: Date): number => {
    if (!isToday(date)) return -1
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0)
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59)
    const progress = ((now.getTime() - startOfDay.getTime()) / (endOfDay.getTime() - startOfDay.getTime())) * 100
    return progress
  }

  // 格式化时间显示
  const formatEventTime = (event: Event) => {
    const start = event.startTime.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
    const end = event.endTime.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
    return `${start} - ${end}`
  }

  // 周统计
  const weekStats = useMemo(() => {
    const stats = {
      totalEvents: weekEvents.length,
      totalHours: weekEvents.reduce((total, event) => 
        total + (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60), 0
      ),
      completed: weekEvents.filter(e => e.status === 'completed').length,
      highPriority: weekEvents.filter(e => e.priority === Priority.URGENT || e.priority === Priority.HIGH).length
    }
    return stats
  }, [weekEvents])

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-4 flex flex-col">
      {/* 头部导航和统计 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-white">
              {weekDates[0].toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })} - 
              {weekDates[6].toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}日
            </h2>
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="ghost"
                className="text-gray-300 hover:text-white hover:bg-white/10 h-8"
                onClick={() => navigateWeek('prev')}
              >
                ← 上周
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-gray-300 hover:text-white hover:bg-white/10 h-8"
                onClick={() => onDateSelect?.(new Date())}
              >
                本周
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-gray-300 hover:text-white hover:bg-white/10 h-8"
                onClick={() => navigateWeek('next')}
              >
                下周 →
              </Button>
            </div>
          </div>
          
          {/* 周统计卡片 */}
          <div className="flex items-center space-x-3">
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 px-2 py-1">
              <Calendar className="h-3 w-3 mr-1" />
              {weekStats.totalEvents} 事件
            </Badge>
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50 px-2 py-1">
              <Clock className="h-3 w-3 mr-1" />
              {weekStats.totalHours.toFixed(1)}h
            </Badge>
            {weekStats.highPriority > 0 && (
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50 px-2 py-1">
                <AlertCircle className="h-3 w-3 mr-1" />
                {weekStats.highPriority} 重要
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* 主体内容 - 一周7天平铺 */}
      <div className="flex-1 grid grid-cols-7 gap-2 min-h-0">
        {weekDates.map((date, dayIndex) => {
          const dayStats = getDayStats(dayIndex)
          const dayEvents = eventsByDay[dayIndex] || []
          const timeProgress = getCurrentTimeProgress(date)
          const isExpanded = expandedDay === dayIndex

          return (
            <div
              key={dayIndex}
              className={`flex flex-col bg-black/30 backdrop-blur-sm rounded-lg border transition-all ${
                isToday(date)
                  ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                  : isWeekend(dayIndex)
                  ? 'border-gray-700/50'
                  : 'border-gray-700/30'
              } ${
                isExpanded ? 'col-span-2 row-span-2 z-10' : ''
              } hover:border-gray-600/50`}
            >
              {/* 日期头部 */}
              <div
                className={`px-3 py-2 border-b cursor-pointer ${
                  isToday(date)
                    ? 'bg-cyan-500/10 border-cyan-500/30'
                    : 'border-gray-700/30 hover:bg-white/5'
                }`}
                onClick={() => {
                  onDateSelect?.(date)
                  setExpandedDay(expandedDay === dayIndex ? null : dayIndex)
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-xs ${
                      isToday(date) ? 'text-cyan-300 font-bold' : 'text-gray-400'
                    }`}>
                      {weekDays[dayIndex]}
                    </div>
                    <div className={`text-lg font-bold ${
                      isToday(date) ? 'text-cyan-300' : 'text-white'
                    }`}>
                      {date.getDate()}
                    </div>
                  </div>
                  {dayStats.eventCount > 0 && (
                    <div className="flex items-center space-x-1">
                      {dayStats.hasHighPriority && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                      )}
                      {dayStats.hasConflict && (
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                      <Badge className="bg-gray-700/50 text-gray-300 text-xs px-1.5 py-0.5">
                        {dayStats.eventCount}
                      </Badge>
                    </div>
                  )}
                </div>
                
                {/* 当天进度条 */}
                {timeProgress >= 0 && (
                  <div className="mt-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 transition-all"
                      style={{ width: `${timeProgress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* 事件列表 */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
                {dayEvents.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-xs text-gray-500">暂无安排</p>
                  </div>
                ) : (
                  dayEvents.map((event, eventIndex) => (
                    <Card
                      key={event.id}
                      className={`p-2 cursor-pointer transition-all hover:scale-[1.02] ${
                        selectedEvent?.id === event.id
                          ? 'ring-1 ring-cyan-500 bg-cyan-500/10'
                          : 'bg-gray-800/50 hover:bg-gray-700/50'
                      } ${
                        event.isConflicted ? 'ring-1 ring-red-400' : ''
                      } ${
                        event.status === 'completed' ? 'opacity-60' : ''
                      }`}
                      onClick={(e) => handleEventClick(event, e)}
                    >
                      {/* 时间和标题 */}
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                          <div className="text-xs text-gray-400 mb-0.5">
                            {event.startTime.toLocaleTimeString('zh-CN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className="text-sm font-medium text-white truncate">
                            {event.status === 'completed' && '✓ '}
                            {event.isMarketProtected && '🛡️ '}
                            {event.title}
                          </div>
                        </div>
                        {/* 删除按钮 */}
                        <button
                          className="ml-1 w-4 h-4 rounded bg-red-500/20 text-red-400 text-xs opacity-0 hover:opacity-100 hover:bg-red-500/40 transition-opacity"
                          onClick={(e) => handleDeleteEvent(event.id, e)}
                        >
                          ×
                        </button>
                      </div>

                      {/* 分类和优先级标签 */}
                      <div className="flex items-center justify-between">
                        <div className={`w-2 h-2 rounded-full ${getCategoryColor(event.category)}`} />
                        {(event.priority === Priority.URGENT || event.priority === Priority.HIGH) && (
                          <div className="text-[10px] text-orange-400">
                            {event.priority === Priority.URGENT ? '!' : '↑'}
                          </div>
                        )}
                      </div>

                      {/* 展开时显示更多信息 */}
                      {isExpanded && (
                        <div className="mt-2 pt-2 border-t border-gray-700/30">
                          <div className="text-xs text-gray-400">
                            {formatEventTime(event)}
                          </div>
                          {event.description && (
                            <div className="text-xs text-gray-500 mt-1 truncate">
                              {event.description}
                            </div>
                          )}
                          <div className="flex items-center space-x-2 mt-1">
                            {event.energyRequired && (
                              <Badge className="text-[10px] px-1 py-0">
                                {event.energyRequired === EnergyLevel.PEAK ? '巅峰' :
                                 event.energyRequired === EnergyLevel.HIGH ? '高能' :
                                 event.energyRequired === EnergyLevel.MEDIUM ? '中等' : '低耗'}
                              </Badge>
                            )}
                            <Badge className={`text-[10px] px-1 py-0 ${getPriorityBadge(event.priority).className}`}>
                              {getPriorityBadge(event.priority).text}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>

              {/* 快速添加按钮 */}
              <div className="p-2 border-t border-gray-700/30">
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full h-7 text-xs text-gray-400 hover:text-white hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation()
                    // 创建新事件
                    const newEvent = {
                      title: '新事件',
                      description: '',
                      startTime: new Date(date.setHours(9, 0, 0, 0)),
                      endTime: new Date(date.setHours(10, 0, 0, 0)),
                      category: EventCategory.OTHER,
                      priority: Priority.MEDIUM,
                      status: 'planned' as const,
                      position: { x: 0, y: 0, z: 0 },
                      size: { width: 200, height: 80, depth: 20 },
                      color: '#6b7280',
                      opacity: 0.8,
                      isSelected: false,
                      isDragging: false,
                      isHovered: false,
                      isConflicted: false,
                      tags: [],
                      reminders: [],
                      energyRequired: EnergyLevel.MEDIUM,
                      estimatedDuration: 60,
                      isMarketProtected: false,
                      flexibilityScore: 50
                    }
                    addEvent(newEvent)
                  }}
                >
                  + 添加
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* 底部图例 */}
      <div className="mt-3 flex items-center justify-center space-x-4 text-xs text-gray-400">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>工作</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
          <span>会议</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span>运动</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          <span>休息</span>
        </div>
        <div className="flex items-center space-x-1">
          <TrendingUp className="h-3 w-3 text-red-400" />
          <span>交易</span>
        </div>
      </div>
    </div>
  )
}