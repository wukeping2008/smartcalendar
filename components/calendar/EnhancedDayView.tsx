'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '../../src/components/ui/button'
import { Card } from '../../src/components/ui/card'
import { Badge } from '../../src/components/ui/badge'
import { ScrollArea } from '../../src/components/ui/scroll-area'
import { useEventStore } from '../../lib/stores/event-store'
import { useCognitiveStore } from '../../lib/stores/cognitive-store'
import { Event, EventCategory, EnergyLevel, Priority } from '../../types/event'
import AddEventButton from './AddEventButton'
import VoiceInputFixed from '../voice/VoiceInputFixed'
import { 
  Calendar, 
  Clock, 
  Target, 
  AlertTriangle, 
  CheckCircle,
  Brain,
  TrendingUp,
  Zap,
  Coffee,
  Moon,
  Sun,
  Sunrise,
  ChevronLeft,
  ChevronRight,
  Plus,
  Mic,
  Bot,
  FileText,
  Activity
} from 'lucide-react'

interface EnhancedDayViewProps {
  selectedDate: Date
  onDateChange?: (date: Date) => void
  onEventSelect?: (event: Event) => void
}

export default function EnhancedDayView({ 
  selectedDate, 
  onDateChange,
  onEventSelect 
}: EnhancedDayViewProps) {
  const { events, selectEvent } = useEventStore()
  const { commitments, cognitiveLoad } = useCognitiveStore()
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showSidebar, setShowSidebar] = useState(true)

  // 更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // 每分钟更新
    return () => clearInterval(timer)
  }, [])

  // 获取选中日期的所有事件
  const dayEvents = events.filter(event => 
    event.startTime.toDateString() === selectedDate.toDateString()
  ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

  // 计算当天统计
  const dayStats = {
    totalEvents: dayEvents.length,
    totalDuration: dayEvents.reduce((total, event) => 
      total + (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60), 0
    ),
    completed: dayEvents.filter(e => e.status === 'completed').length,
    inProgress: dayEvents.filter(e => e.status === 'in_progress').length,
    planned: dayEvents.filter(e => e.status === 'planned').length,
    highPriority: dayEvents.filter(e => e.priority === Priority.URGENT || e.priority === Priority.HIGH).length,
    conflicts: dayEvents.filter(e => e.isConflicted).length,
    tradingTasks: dayEvents.filter(e => e.category === EventCategory.TRADING).length,
    meetings: dayEvents.filter(e => e.category === EventCategory.MEETING).length
  }

  // 判断是否为当前小时
  const isCurrentHour = (hour: number): boolean => {
    return currentTime.toDateString() === selectedDate.toDateString() && currentTime.getHours() === hour
  }

  // 生成时间轴（6:00 - 23:00）
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 6; hour <= 23; hour++) {
      const slotTime = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), hour)
      slots.push({
        hour,
        time: slotTime,
        events: dayEvents.filter(event => {
          const eventHour = event.startTime.getHours()
          return eventHour === hour || (eventHour < hour && event.endTime.getHours() > hour)
        }),
        isCurrent: isCurrentHour(hour),
        isPast: slotTime < currentTime
      })
    }
    return slots
  }

  const timeSlots = generateTimeSlots()

  const isToday = selectedDate.toDateString() === new Date().toDateString()

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
    selectEvent(event.id)
    onEventSelect?.(event)
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    onDateChange?.(newDate)
  }

  const goToToday = () => {
    onDateChange?.(new Date())
  }

  const getCategoryColor = (category: EventCategory): string => {
    const colors = {
      [EventCategory.WORK]: 'bg-blue-500',
      [EventCategory.PERSONAL]: 'bg-green-500',
      [EventCategory.MEETING]: 'bg-amber-500',
      [EventCategory.BREAK]: 'bg-purple-500',
      [EventCategory.EXERCISE]: 'bg-red-500',
      [EventCategory.MEAL]: 'bg-orange-500',
      [EventCategory.TRAVEL]: 'bg-cyan-500',
      [EventCategory.OTHER]: 'bg-gray-500',
      [EventCategory.TRADING]: 'bg-red-600',
      [EventCategory.LIFE_ROUTINE]: 'bg-emerald-500',
      [EventCategory.PREPARATION]: 'bg-violet-500'
    }
    return colors[category] || 'bg-gray-500'
  }

  const getTimeIcon = (hour: number) => {
    if (hour >= 6 && hour < 9) return <Sunrise className="w-4 h-4 text-orange-400" />
    if (hour >= 9 && hour < 12) return <Sun className="w-4 h-4 text-yellow-400" />
    if (hour >= 12 && hour < 14) return <Coffee className="w-4 h-4 text-amber-400" />
    if (hour >= 14 && hour < 18) return <Sun className="w-4 h-4 text-yellow-500" />
    if (hour >= 18 && hour < 21) return <Sunrise className="w-4 h-4 text-orange-500" />
    return <Moon className="w-4 h-4 text-indigo-400" />
  }

  // 获取下一个事件
  const getNextEvent = () => {
    if (!isToday) return null
    return dayEvents.find(event => event.startTime > currentTime)
  }

  const nextEvent = getNextEvent()

  // 计算空闲时间
  const calculateFreeTime = () => {
    let freeMinutes = 0
    const workingHours = { start: 9, end: 18 }
    
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      const hourEvents = timeSlots.find(slot => slot.hour === hour)?.events || []
      if (hourEvents.length === 0) {
        freeMinutes += 60
      }
    }
    
    return freeMinutes / 60
  }

  const freeHours = calculateFreeTime()

  return (
    <div className="w-full h-full flex gap-4 p-4">
      {/* 主时间轴区域 */}
      <div className="flex-1 bg-gray-900/95 backdrop-blur-sm rounded-xl border border-gray-700/50 flex flex-col min-h-0">
        {/* 头部导航 - 固定高度 */}
        <div className="bg-gray-800/50 border-b border-gray-700/50 flex-shrink-0 rounded-t-xl">
          {/* 第一行 - 日期导航 */}
          <div className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigateDate('prev')}
                    className="text-gray-400 hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="text-center min-w-[120px]">
                    <h2 className="text-xl font-bold text-white">
                      {selectedDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                    </h2>
                    <p className="text-xs text-gray-400">
                      {selectedDate.toLocaleDateString('zh-CN', { weekday: 'long' })}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigateDate('next')}
                    className="text-gray-400 hover:text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                
                {!isToday && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={goToToday}
                    className="text-cyan-400 border-cyan-400/30 hover:bg-cyan-400/10"
                  >
                    回到今天
                  </Button>
                )}
              </div>

              {/* 右侧操作按钮组 */}
              <div className="flex items-center gap-2">
                {/* 语音输入按钮 */}
                <VoiceInputFixed
                  size="sm"
                  onResult={(text) => {
                    console.log('语音输入结果:', text)
                    // 这里可以触发智能事件创建
                  }}
                  className="text-purple-400 border-purple-400/30 hover:bg-purple-400/10"
                />

                {/* 创建事件按钮 */}
                <AddEventButton 
                  defaultDate={selectedDate}
                  size="sm"
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-md hover:shadow-lg transition-all"
                />

                {/* 侧边栏切换按钮（仅移动端） */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="text-gray-400 hover:text-white lg:hidden"
                >
                  <Activity className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

        </div>

        {/* 时间轴内容 - 可滚动区域 */}
        <div className="flex-1 overflow-hidden relative">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-1">
            {timeSlots.map((slot) => (
              <div 
                key={slot.hour}
                className={`relative flex gap-4 py-2 ${
                  slot.isCurrent ? 'bg-cyan-500/5' : ''
                } ${slot.isPast && !slot.isCurrent ? 'opacity-60' : ''}`}
              >
                {/* 时间标签 */}
                <div className="w-20 flex-shrink-0 flex items-start gap-2">
                  {getTimeIcon(slot.hour)}
                  <span className={`text-sm font-mono ${
                    slot.isCurrent ? 'text-cyan-400 font-bold' : 'text-gray-500'
                  }`}>
                    {slot.hour.toString().padStart(2, '0')}:00
                  </span>
                </div>

                {/* 当前时间指示线 */}
                {slot.isCurrent && (
                  <div className="absolute left-24 right-4 top-1/2 h-0.5 bg-cyan-400 opacity-50">
                    <div className="absolute -left-1 -top-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  </div>
                )}

                {/* 事件列表 */}
                <div className="flex-1 min-h-[3rem]">
                  {slot.events.length > 0 ? (
                    <div className="space-y-2">
                      {slot.events.map((event) => (
                        <Card
                          key={event.id}
                          className={`p-3 border-l-4 cursor-pointer hover:bg-gray-800/50 transition-all ${
                            selectedEvent?.id === event.id ? 'ring-2 ring-cyan-400' : ''
                          }`}
                          style={{ borderLeftColor: getCategoryColor(event.category).replace('bg-', '#').replace('500', '') }}
                          onClick={() => handleEventClick(event)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-white text-sm">{event.title}</h4>
                                {event.priority === Priority.URGENT && (
                                  <Badge className="bg-red-500/20 text-red-300 text-xs">紧急</Badge>
                                )}
                                {event.isMarketProtected && (
                                  <Badge className="bg-green-500/20 text-green-300 text-xs">市场保护</Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-400">
                                {event.startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} - 
                                {event.endTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                {event.description && ` • ${event.description.substring(0, 30)}...`}
                              </p>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${getCategoryColor(event.category)}`} />
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="h-12 flex items-center">
                      <div className="flex-1 border-t border-dashed border-gray-700/30" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* 侧边栏概览 - 可滚动 */}
      {showSidebar && (
        <div className="w-80 bg-gray-900/95 backdrop-blur-sm rounded-xl border border-gray-700/50 hidden lg:flex flex-col h-full overflow-hidden">
          <ScrollArea className="flex-1 h-full">
            <div className="p-4 space-y-4">
              {/* 今日统计 */}
              <Card className="bg-gray-800/50 border-gray-700/50 p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              今日统计
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-2xl font-bold text-white">{dayStats.totalEvents}</p>
                <p className="text-xs text-gray-400">总任务</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-cyan-400">{dayStats.totalDuration.toFixed(1)}h</p>
                <p className="text-xs text-gray-400">总时长</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">{dayStats.completed}</p>
                <p className="text-xs text-gray-400">已完成</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-400">{freeHours.toFixed(1)}h</p>
                <p className="text-xs text-gray-400">空闲时间</p>
              </div>
            </div>
              </Card>

              {/* 认知带宽 */}
              <Card className="bg-gray-800/50 border-gray-700/50 p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              认知带宽
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">当前负载</span>
                <span className="text-white">{commitments.length}/7</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    commitments.length > 5 ? 'bg-red-500' : 
                    commitments.length > 3 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${(commitments.length / 7) * 100}%` }}
                />
              </div>
              {cognitiveLoad.level === 'high' && (
                <p className="text-xs text-yellow-400 mt-2">
                  ⚠️ 认知负载较高，建议减少承诺
                </p>
              )}
            </div>
              </Card>

              {/* 下一个任务 */}
              {nextEvent && (
            <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30 p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                下一个任务
              </h3>
              <div className="space-y-2">
                <h4 className="font-medium text-white">{nextEvent.title}</h4>
                <p className="text-sm text-gray-400">
                  {nextEvent.startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-cyan-400">
                  还有 {Math.round((nextEvent.startTime.getTime() - currentTime.getTime()) / (1000 * 60))} 分钟
                </p>
              </div>
                </Card>
              )}

              {/* 重点任务 */}
              {dayStats.highPriority > 0 && (
            <Card className="bg-gray-800/50 border-gray-700/50 p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                重点任务
              </h3>
              <div className="space-y-2">
                {dayEvents
                  .filter(e => e.priority === Priority.URGENT || e.priority === Priority.HIGH)
                  .slice(0, 3)
                  .map(event => (
                    <div 
                      key={event.id}
                      className="flex items-center gap-2 p-2 bg-gray-700/30 rounded cursor-pointer hover:bg-gray-700/50"
                      onClick={() => handleEventClick(event)}
                    >
                      <div className={`w-2 h-2 rounded-full ${getCategoryColor(event.category)}`} />
                      <span className="text-sm text-white flex-1">{event.title}</span>
                      {event.status === 'completed' && (
                        <CheckCircle className="w-3 h-3 text-green-400" />
                      )}
                    </div>
                  ))}
              </div>
                </Card>
              )}

              {/* 冲突警告 */}
              {dayStats.conflicts > 0 && (
            <Card className="bg-red-500/10 border-red-500/30 p-4">
              <h3 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                时间冲突
              </h3>
              <p className="text-xs text-gray-300">
                发现 {dayStats.conflicts} 个时间冲突，请及时调整
              </p>
                </Card>
              )}

              {/* AI建议 */}
              <Card className="bg-gray-800/50 border-gray-700/50 p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-400" />
              AI建议
            </h3>
            <div className="space-y-2 text-xs text-gray-400">
              {dayStats.totalEvents === 0 && (
                <p>• 今日暂无安排，建议规划一些任务</p>
              )}
              {dayStats.totalDuration > 8 && (
                <p>• 今日安排较满，注意劳逸结合</p>
              )}
              {freeHours > 4 && (
                <p>• 有{freeHours.toFixed(1)}小时空闲，可安排学习或休息</p>
              )}
              {dayStats.meetings > 3 && (
                <p>• 会议较多，建议预留缓冲时间</p>
              )}
              {dayStats.tradingTasks > 0 && (
                <p>• 记得在Trading时段保持专注</p>
              )}
            </div>
              </Card>

              {/* 快速链接 */}
              <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 text-xs">
              <FileText className="w-3 h-3 mr-1" />
              日报
            </Button>
            <Button size="sm" variant="outline" className="flex-1 text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              分析
            </Button>
          </div>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}