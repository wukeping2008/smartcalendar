'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import CalendarView from './CalendarView'
import WeekView from './WeekView'
import DayView from './DayView'
import { Event } from '../../types/event'

type ViewMode = 'day' | 'week' | 'month'

interface CalendarContainerProps {
  initialDate?: Date
  initialView?: ViewMode
}

export default function CalendarContainer({
  initialDate = new Date(),
  initialView = 'month'
}: CalendarContainerProps) {
  const [currentDate, setCurrentDate] = useState(initialDate)
  const [viewMode, setViewMode] = useState<ViewMode>(initialView)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showDayView, setShowDayView] = useState(false)
  const [dayViewDate, setDayViewDate] = useState<Date>(new Date())

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date)
    
    // 从月视图或周视图点击日期时，切换到日视图
    if (viewMode === 'month' || viewMode === 'week') {
      setDayViewDate(date)
      setShowDayView(true)
    }
  }

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event)
  }

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode)
    setShowDayView(false)
  }

  const handleBackFromDayView = () => {
    setShowDayView(false)
  }

  // 快速导航到今天
  const goToToday = () => {
    setCurrentDate(new Date())
    setDayViewDate(new Date())
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* 视图切换器 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* 视图模式按钮组 */}
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-1 flex space-x-1">
            <Button
              size="sm"
              variant={viewMode === 'day' && !showDayView ? 'default' : 'ghost'}
              className={`${
                viewMode === 'day' && !showDayView
                  ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                  : 'text-white hover:bg-white/10'
              }`}
              onClick={() => handleViewChange('day')}
            >
              日
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'week' && !showDayView ? 'default' : 'ghost'}
              className={`${
                viewMode === 'week' && !showDayView
                  ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                  : 'text-white hover:bg-white/10'
              }`}
              onClick={() => handleViewChange('week')}
            >
              周
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'month' && !showDayView ? 'default' : 'ghost'}
              className={`${
                viewMode === 'month' && !showDayView
                  ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                  : 'text-white hover:bg-white/10'
              }`}
              onClick={() => handleViewChange('month')}
            >
              月
            </Button>
          </div>

          {/* 分隔线 */}
          <div className="h-6 w-px bg-white/20"></div>

          {/* 今天按钮 */}
          <Button
            size="sm"
            variant="outline"
            className="text-white border-white/20 hover:bg-white/10"
            onClick={goToToday}
          >
            今天
          </Button>
        </div>

        {/* 右侧快捷操作 */}
        <div className="flex items-center space-x-2">
          {selectedEvent && (
            <div className="text-sm text-gray-300">
              已选择: <span className="text-cyan-300">{selectedEvent.title}</span>
            </div>
          )}
        </div>
      </div>

      {/* 日历视图内容 */}
      <div className="flex-1 min-h-0">
        {showDayView ? (
          <DayView
            selectedDate={dayViewDate}
            onBack={handleBackFromDayView}
            onEventSelect={handleEventSelect}
          />
        ) : (
          <>
            {viewMode === 'month' && (
              <CalendarView
                currentDate={currentDate}
                onDateSelect={handleDateSelect}
                onEventSelect={handleEventSelect}
              />
            )}
            
            {viewMode === 'week' && (
              <WeekView
                currentDate={currentDate}
                onDateSelect={handleDateSelect}
                onEventSelect={handleEventSelect}
              />
            )}
            
            {viewMode === 'day' && (
              <DayView
                selectedDate={currentDate}
                onBack={() => handleViewChange('month')}
                onEventSelect={handleEventSelect}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}