'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useEventStore } from '../../lib/stores/event-store'
import { Event, EventCategory } from '../../types/event'
import AddEventButton from './AddEventButton'
import DayView from './DayView'

interface CalendarViewProps {
  currentDate: Date
  onEventSelect?: (event: Event) => void
  onDateSelect?: (date: Date) => void
}

export default function CalendarView({ 
  currentDate, 
  onEventSelect,
  onDateSelect 
}: CalendarViewProps) {
  const { events, selectEvent, deleteEvent } = useEventStore()
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate)
  const [showDayDetails, setShowDayDetails] = useState<boolean>(false)

  // 获取当前月份的所有日期
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDay = firstDay.getDay() // 0 = Sunday

    const days = []
    
    // 填充上个月的日期
    for (let i = 0; i < startDay; i++) {
      const prevDate = new Date(year, month, -i)
      days.unshift({
        date: prevDate,
        isCurrentMonth: false,
        events: []
      })
    }

    // 填充当前月的日期
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dayEvents = events.filter(event => 
        event.startTime.toDateString() === date.toDateString()
      )
      
      days.push({
        date,
        isCurrentMonth: true,
        events: dayEvents
      })
    }

    // 填充下个月的日期到42天 (6行 x 7天)
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day)
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        events: []
      })
    }

    return days
  }

  const days = getDaysInMonth(selectedDate)
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  
  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ]

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setSelectedDate(newDate)
  }

  const handleEventClick = (event: Event, e?: React.MouseEvent) => {
    e?.stopPropagation()
    selectEvent(event.id)
    onEventSelect?.(event)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setShowDayDetails(true)
    onDateSelect?.(date)
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
      // Trading专业类别颜色
      [EventCategory.TRADING]: '#dc2626',        // 红色 - 交易相关
      [EventCategory.LIFE_ROUTINE]: '#059669',   // 绿色 - 生活例程
      [EventCategory.PREPARATION]: '#7c3aed'     // 紫色 - 准备工作
    }
    return colors[category] || '#6b7280'
  }

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }


  return (
    <div className="w-full h-full bg-black/30 backdrop-blur-sm rounded-xl border border-white/10 p-6">
      {/* 日历头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">
            {selectedDate.getFullYear()}年 {monthNames[selectedDate.getMonth()]}
          </h2>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              className="text-white border-white/20"
              onClick={() => navigateMonth('prev')}
            >
              ‹ 上月
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-white border-white/20"
              onClick={() => navigateMonth('next')}
            >
              下月 ›
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            className="text-white border-white/20"
            onClick={() => setSelectedDate(new Date())}
          >
            今天
          </Button>
        </div>
      </div>

      {/* 星期头 */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {weekDays.map((day) => (
          <div
            key={day}
            className="h-10 flex items-center justify-center text-sm font-medium text-gray-300"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日历网格 */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {days.map((day, index) => (
          <div
            key={index}
            className={`min-h-[120px] p-2 border border-white/10 rounded-lg cursor-pointer transition-colors ${
              day.isCurrentMonth
                ? 'bg-white/5 hover:bg-white/10'
                : 'bg-black/20 opacity-60'
            } ${
              isToday(day.date) ? 'ring-2 ring-cyan-500' : ''
            } ${
              selectedDate.toDateString() === day.date.toDateString() ? 'ring-2 ring-cyan-400' : ''
            }`}
            onClick={() => handleDateClick(day.date)}
          >
            {/* 日期数字 */}
            <div className={`text-sm font-medium mb-1 ${
              day.isCurrentMonth ? 'text-white' : 'text-gray-500'
            } ${
              isToday(day.date) ? 'text-cyan-300 font-bold' : ''
            }`}>
              {day.date.getDate()}
            </div>

            {/* 事件列表 */}
            <div className="space-y-1">
              {day.events.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className={`text-xs px-2 py-1 rounded text-white cursor-pointer hover:opacity-80 ${getCategoryColor(event.category)}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEventClick(event)
                  }}
                  title={`${event.title} (${event.startTime.toLocaleTimeString('zh-CN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })})`}
                >
                  <div className="truncate">
                    {event.startTime.toLocaleTimeString('zh-CN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })} {event.title}
                  </div>
                </div>
              ))}
              
              {/* 显示更多事件的指示器 */}
              {day.events.length > 3 && (
                <div className="text-xs text-gray-400 px-2">
                  +{day.events.length - 3} 更多
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 选中日期详情 */}
      {showDayDetails && (
        <div className="mt-6 border-t border-white/10 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              {selectedDate.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </h3>
            <Button
              size="sm"
              variant="ghost"
              className="text-gray-400 hover:text-white"
              onClick={() => setShowDayDetails(false)}
            >
              ✕ 收起
            </Button>
          </div>
          
          {/* 该日期的事件列表 */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {events
              .filter(event => event.startTime.toDateString() === selectedDate.toDateString())
              .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
              .map((event) => (
                <div
                  key={event.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors bg-black/20 border-white/10 hover:bg-black/40 ${
                    event.isConflicted ? 'border-red-400/50' : ''
                  }`}
                  onClick={() => handleEventClick(event)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getCategoryColor(event.category) }}
                        />
                        <h4 className="text-white font-medium text-sm">{event.title}</h4>
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
                        })} • {Math.round((event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60))}分钟
                      </div>
                      
                      {event.description && (
                        <p className="text-gray-300 text-xs mb-2 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded ${ 
                            event.energyRequired === 'peak' ? 'bg-red-500/20 text-red-300' :
                            event.energyRequired === 'high' ? 'bg-orange-500/20 text-orange-300' :  
                            event.energyRequired === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-emerald-500/20 text-emerald-300'
                          }`}>
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

                        <div className="flex items-center space-x-1">
                          <div className={`text-xs px-2 py-1 rounded ${
                            event.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                            event.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {event.status === 'completed' ? '✅ 已完成' :
                             event.status === 'in_progress' ? '🔄 进行中' : '📋 计划中'}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 h-6 w-6"
                            onClick={(e) => handleDeleteEvent(event.id, e)}
                            title="删除事件"
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            ))}
            
            {events.filter(event => event.startTime.toDateString() === selectedDate.toDateString()).length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 text-sm mb-2">该日期暂无事件</div>
                <AddEventButton />
              </div>
            )}
          </div>
          
          {/* 快速操作 */}
          {events.filter(event => event.startTime.toDateString() === selectedDate.toDateString()).length > 0 && (
            <div className="mt-4 flex justify-center">
              <AddEventButton />
            </div>
          )}
        </div>
      )}

      {/* 底部操作区 */}
      <div className="mt-6 flex justify-between items-center">
        <div className="text-sm text-gray-400">
          共 {events.length} 个事件 • 点击日期查看详情
        </div>
        
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            className="text-white border-white/20"
            onClick={() => handleDateClick(new Date())}
          >
            📅 查看今日
          </Button>
        </div>
      </div>

      {/* 图例 */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-gray-300">工作</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span className="text-gray-300">会议</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-300">个人</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-orange-500 rounded"></div>
          <span className="text-gray-300">用餐</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-gray-300">运动</span>
        </div>
      </div>
    </div>
  )
}
