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
}

export default function CalendarView({ 
  currentDate, 
  onEventSelect 
}: CalendarViewProps) {
  const { events, selectEvent } = useEventStore()
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate)
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month')
  const [dayViewDate, setDayViewDate] = useState<Date>(currentDate)

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

  const handleEventClick = (event: Event) => {
    selectEvent(event.id)
    onEventSelect?.(event)
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

  // 如果是日视图模式，渲染日视图组件
  if (viewMode === 'day') {
    return (
      <DayView
        selectedDate={dayViewDate}
        onBack={() => setViewMode('month')}
        onEventSelect={onEventSelect}
      />
    )
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
            onClick={() => {
              setSelectedDate(day.date)
              setDayViewDate(day.date)
              setViewMode('day')
            }}
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
            onClick={() => {
              setDayViewDate(new Date())
              setViewMode('day')
            }}
          >
            📅 今日详情
          </Button>
          <AddEventButton />
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
