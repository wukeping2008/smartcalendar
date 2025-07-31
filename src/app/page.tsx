'use client'

import React, { useState, useEffect } from 'react'
import FlowCanvas from '../../components/timeflow/FlowCanvas'
import CalendarView from '../../components/calendar/CalendarView'
import SmartEventCreator from '../../components/calendar/SmartEventCreator'
import VoiceInputButton from '../../components/voice/VoiceInputButton'
import TimeFlowGuide from '../../components/help/TimeFlowGuide'
import FloatingTips from '../../components/help/FloatingTips'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Event, EventCategory, Priority, EventStatus, ReminderType, EnergyLevel } from '../../types/event'
import { useEventStore } from '../../lib/stores/event-store'
import WorkHoursBudgetComponent from '../../components/budget/WorkHoursBudget'
import MarketStatusBar from '../../components/market/MarketStatusBar'
import ConflictResolver from '../../components/optimization/ConflictResolver'

// 初始化秉笔太监智能秘书系统演示数据
const initializeSampleEvents = (addEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => void) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  const demoEvents = [
    // === 今日Trading专业任务演示 ===
    {
      title: '扫watchlist',
      description: '每小时整点扫描watchlist - 秉笔太监SOP任务',
      startTime: new Date(today.getTime() + 17 * 60 * 60 * 1000), // 17:00
      endTime: new Date(today.getTime() + 17 * 60 * 60 * 1000 + 5 * 60 * 1000), // 5分钟
      category: EventCategory.TRADING,
      priority: Priority.HIGH,
      status: EventStatus.PLANNED,
      position: { x: -3, y: 1, z: 0 },
      size: { width: 200, height: 80, depth: 20 },
      color: '#dc2626',
      opacity: 0.8,
      isSelected: false,
      isDragging: false,
      isHovered: false,
      isConflicted: false,
      energyRequired: EnergyLevel.PEAK,
      estimatedDuration: 5,
      isMarketProtected: true,
      flexibilityScore: 20,
      tags: ['Trading', 'watchlist', '整点'],
      reminders: [
        {
          id: 'watchlist-30m',
          eventId: '',
          type: ReminderType.NOTIFICATION,
          time: new Date(today.getTime() + 16 * 60 * 60 * 1000 + 30 * 60 * 1000),
          message: '30分钟后扫watchlist',
          isTriggered: false
        }
      ]
    },
    {
      title: 'key in 数据',
      description: '每15分钟录入交易数据 - 秉笔太监SOP任务',
      startTime: new Date(today.getTime() + 16 * 60 * 60 * 1000 + 30 * 60 * 1000), // 16:30
      endTime: new Date(today.getTime() + 16 * 60 * 60 * 1000 + 32 * 60 * 1000), // 2分钟
      category: EventCategory.TRADING,
      priority: Priority.MEDIUM,
      status: EventStatus.COMPLETED,
      position: { x: -1, y: 0.5, z: 0 },
      size: { width: 200, height: 80, depth: 20 },
      color: '#dc2626',
      opacity: 0.8,
      isSelected: false,
      isDragging: false,
      isHovered: false,
      isConflicted: false,
      energyRequired: EnergyLevel.LOW,
      estimatedDuration: 2,
      isMarketProtected: true,
      flexibilityScore: 30,
      tags: ['Trading', 'data', '15分钟'],
      reminders: []
    },
    {
      title: '捕兽夹正常版本',
      description: '会议前后空闲时间执行30分钟版本 - 秉笔太监SOP',
      startTime: new Date(today.getTime() + 18 * 60 * 60 * 1000 + 30 * 60 * 1000), // 18:30
      endTime: new Date(today.getTime() + 19 * 60 * 60 * 1000), // 30分钟
      category: EventCategory.TRADING,
      priority: Priority.MEDIUM,
      status: EventStatus.PLANNED,
      position: { x: 1, y: 1.5, z: 0 },
      size: { width: 200, height: 80, depth: 20 },
      color: '#dc2626',
      opacity: 0.8,
      isSelected: false,
      isDragging: false,
      isHovered: false,
      isConflicted: false,
      energyRequired: EnergyLevel.HIGH,
      estimatedDuration: 30,
      isMarketProtected: false,
      flexibilityScore: 70,
      tags: ['Trading', '捕兽夹', '灵活时间'],
      reminders: [
        {
          id: 'beast-trap-30m',
          eventId: '',
          type: ReminderType.NOTIFICATION,
          time: new Date(today.getTime() + 18 * 60 * 60 * 1000),
          message: '30分钟后执行捕兽夹',
          isTriggered: false
        }
      ]
    },
    {
      title: 'TABATA锻炼',
      description: '会议间隙5分钟高效锻炼 - 秉笔太监能量管理',
      startTime: new Date(today.getTime() + 20 * 60 * 60 * 1000 + 15 * 60 * 1000), // 20:15
      endTime: new Date(today.getTime() + 20 * 60 * 60 * 1000 + 20 * 60 * 1000), // 5分钟
      category: EventCategory.EXERCISE,
      priority: Priority.MEDIUM,
      status: EventStatus.PLANNED,
      position: { x: 3, y: 0, z: 0 },
      size: { width: 200, height: 80, depth: 20 },
      color: '#ef4444',
      opacity: 0.8,
      isSelected: false,
      isDragging: false,
      isHovered: false,
      isConflicted: false,
      energyRequired: EnergyLevel.MEDIUM,
      estimatedDuration: 5,
      isMarketProtected: false,
      flexibilityScore: 80,
      tags: ['锻炼', 'TABATA', '能量管理'],
      reminders: []
    },

    // === 智能语音创建示例演示 ===
    {
      title: '明天客户会议',
      description: '语音创建：明天下午2点和小王开会，提前1小时提醒发材料',
      startTime: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000), // 明天14:00
      endTime: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000), // 1小时
      category: EventCategory.MEETING,
      priority: Priority.HIGH,
      status: EventStatus.PLANNED,
      position: { x: 0, y: 2, z: 1 },
      size: { width: 200, height: 80, depth: 20 },
      color: '#f59e0b',
      opacity: 0.8,
      isSelected: false,
      isDragging: false,
      isHovered: false,
      isConflicted: false,
      energyRequired: EnergyLevel.HIGH,
      estimatedDuration: 60,
      isMarketProtected: false,
      flexibilityScore: 30,
      tags: ['语音创建', '会议', '智能解析'],
      reminders: [
        {
          id: 'meeting-1h',
          eventId: '',
          type: ReminderType.NOTIFICATION,
          time: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000),
          message: '1小时后会议，请发送材料',
          isTriggered: false
        },
        {
          id: 'meeting-30m',
          eventId: '',
          type: ReminderType.NOTIFICATION,
          time: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000 + 30 * 60 * 1000),
          message: '30分钟后开会',
          isTriggered: false
        }
      ]
    },
    {
      title: '发送会议材料',
      description: '自动创建的准备任务 - 智能提醒系统生成',
      startTime: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000), // 明天13:00
      endTime: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000 + 15 * 60 * 1000), // 15分钟
      category: EventCategory.PREPARATION,
      priority: Priority.HIGH,
      status: EventStatus.PLANNED,
      position: { x: -1, y: 2, z: 1 },
      size: { width: 200, height: 80, depth: 20 },
      color: '#7c3aed',
      opacity: 0.8,
      isSelected: false,
      isDragging: false,
      isHovered: false,
      isConflicted: false,
      energyRequired: EnergyLevel.LOW,
      estimatedDuration: 15,
      isMarketProtected: false,
      flexibilityScore: 90,
      tags: ['准备任务', '自动创建', '材料'],
      reminders: []
    },

    // === 生活例程演示 ===
    {
      title: '晨间例程',
      description: '秉笔太监生活管理 - 起床20分钟例程',
      startTime: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000), // 明天7:00
      endTime: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000 + 20 * 60 * 1000), // 20分钟
      category: EventCategory.LIFE_ROUTINE,
      priority: Priority.HIGH,
      status: EventStatus.PLANNED,
      position: { x: -2, y: 0, z: 1 },
      size: { width: 200, height: 80, depth: 20 },
      color: '#059669',
      opacity: 0.8,
      isSelected: false,
      isDragging: false,
      isHovered: false,
      isConflicted: false,
      energyRequired: EnergyLevel.LOW,
      estimatedDuration: 20,
      isMarketProtected: false,
      flexibilityScore: 40,
      tags: ['生活例程', '晨间', '冥想'],
      reminders: []
    },
    {
      title: '晚餐时间',
      description: '秉笔太监SOP - 晚间用餐50分钟',
      startTime: new Date(today.getTime() + 19 * 60 * 60 * 1000), // 今天19:00
      endTime: new Date(today.getTime() + 19 * 60 * 60 * 1000 + 50 * 60 * 1000), // 50分钟
      category: EventCategory.MEAL,
      priority: Priority.MEDIUM,
      status: EventStatus.PLANNED,
      position: { x: 2, y: 1, z: 0 },
      size: { width: 200, height: 80, depth: 20 },
      color: '#f97316',
      opacity: 0.8,
      isSelected: false,
      isDragging: false,
      isHovered: false,
      isConflicted: false,
      energyRequired: EnergyLevel.LOW,
      estimatedDuration: 50,
      isMarketProtected: false,
      flexibilityScore: 50,
      tags: ['用餐', '生活例程'],
      reminders: []
    },

    // === 冲突检测演示 ===
    {
      title: '重要工作任务',
      description: '与晚餐时间冲突 - 演示冲突检测功能',
      startTime: new Date(today.getTime() + 19 * 60 * 60 * 1000 + 15 * 60 * 1000), // 19:15
      endTime: new Date(today.getTime() + 19 * 60 * 60 * 1000 + 45 * 60 * 1000), // 30分钟
      category: EventCategory.WORK,
      priority: Priority.URGENT,
      status: EventStatus.PLANNED,
      position: { x: 2.5, y: 0.5, z: 0 },
      size: { width: 200, height: 80, depth: 20 },
      color: '#3b82f6',
      opacity: 0.8,
      isSelected: false,
      isDragging: false,
      isHovered: false,
      isConflicted: true, // 标记为冲突
      energyRequired: EnergyLevel.HIGH,
      estimatedDuration: 30,
      isMarketProtected: false,
      flexibilityScore: 60,
      tags: ['工作', '冲突检测'],
      reminders: []
    },

    // === 当前正在进行的任务 ===
    {
      title: '系统开发',
      description: '当前进行中 - 秉笔太监智能秘书系统功能完善',
      startTime: new Date(today.getTime() + 15 * 60 * 60 * 1000), // 15:00
      endTime: new Date(today.getTime() + 18 * 60 * 60 * 1000), // 3小时
      category: EventCategory.WORK,
      priority: Priority.URGENT,
      status: EventStatus.IN_PROGRESS,
      position: { x: 0, y: 0, z: 0 },
      size: { width: 200, height: 80, depth: 20 },
      color: '#3b82f6',
      opacity: 0.8,
      isSelected: false,
      isDragging: false,
      isHovered: false,
      isConflicted: false,
      energyRequired: EnergyLevel.PEAK,
      estimatedDuration: 180,
      isMarketProtected: false,
      flexibilityScore: 20,
      tags: ['开发', '当前进行'],
      reminders: []
    }
  ]

  // 添加所有演示事件
  demoEvents.forEach(event => addEvent(event))
}

export default function HomePage() {
  const { events, selectEvent, addEvent, deleteEvent } = useEventStore()
  const [currentTime] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [initialized, setInitialized] = useState(false)
  const [viewMode, setViewMode] = useState<'flow' | 'calendar'>('calendar')

  // 初始化样本数据（仅一次）
  useEffect(() => {
    if (!initialized && events.length === 0) {
      initializeSampleEvents(addEvent)
      setInitialized(true)
    }
  }, [initialized, events.length, addEvent])

  const timeRange = {
    start: new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), 0, 0),
    end: new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), 23, 59)
  }

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event)
    selectEvent(event.id)
    console.log('Selected event:', event.title)
  }

  const handleEventDrag = (eventId: string, newPosition: { x: number; y: number; z: number }) => {
    console.log('Drag event:', eventId, newPosition)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleDeleteEvent = (eventId: string) => {
    deleteEvent(eventId)
    // 如果删除的是当前选中的事件，清除选中状态
    if (selectedEvent?.id === eventId) {
      setSelectedEvent(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900">
      {/* 头部导航 */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">
                秉笔太监智能日历系统
              </h1>
              <span className="text-sm text-cyan-300">
                {viewMode === 'calendar' ? '专业日历规划' : '3D时间流体验'}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex bg-black/30 rounded-lg border border-white/20 p-1">
                <Button
                  size="sm"
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  className={viewMode === 'calendar' ? 'bg-cyan-600 text-white' : 'text-white hover:bg-white/10'}
                  onClick={() => setViewMode('calendar')}
                >
                  📅 日历视图
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'flow' ? 'default' : 'ghost'}
                  className={viewMode === 'flow' ? 'bg-cyan-600 text-white' : 'text-white hover:bg-white/10'}
                  onClick={() => setViewMode('flow')}
                >
                  🌊 时间流
                </Button>
              </div>
              <div className="flex space-x-2">
                <SmartEventCreator />
                <TimeFlowGuide />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="flex-1 flex">
        {/* 主视图区域 */}
        <div className="flex-1 relative">
          <div className="absolute inset-4">
            {viewMode === 'calendar' ? (
              /* 传统日历视图 - 主视图 */
              <>
                <CalendarView
                  currentDate={currentTime}
                  onEventSelect={handleEventSelect}
                  onDateSelect={handleDateSelect}
                />
                
                {/* 空状态提示 */}
                {events.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl">
                    <Card className="bg-black/80 backdrop-blur-sm border-cyan-500/50 p-8 text-center max-w-md">
                      <div className="text-6xl mb-4">📅</div>
                      <h3 className="text-xl font-bold text-cyan-300 mb-2">
                        欢迎使用智能日历
                      </h3>
                      <p className="text-gray-300 mb-4">
                        开始创建您的第一个事件，体验智能日历管理！
                      </p>
                      <div className="flex space-x-2 justify-center">
                        <SmartEventCreator />
                      </div>
                    </Card>
                  </div>
                )}
              </>
            ) : (
              /* 3D时间流视图 - 辅助功能 */
              <>
                <div className="w-full h-full rounded-xl bg-black/30 backdrop-blur-sm border border-white/10 overflow-hidden relative">
                  <FlowCanvas
                    events={events}
                    currentTime={currentTime}
                    timeRange={timeRange}
                    onEventSelect={handleEventSelect}
                    onEventDrag={handleEventDrag}
                    className="w-full h-full"
                  />
                  
                  {/* 3D视图说明 */}
                  <div className="absolute top-4 left-4">
                    <Card className="bg-black/80 backdrop-blur-sm border-cyan-500/50 p-3">
                      <p className="text-xs text-cyan-300">
                        🌊 3D时间流可视化 • 拖拽旋转 • 滚轮缩放 • 点击选择
                      </p>
                    </Card>
                  </div>
                  
                  {/* 空状态提示 */}
                  {events.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Card className="bg-black/80 backdrop-blur-sm border-cyan-500/50 p-8 text-center max-w-md">
                        <div className="text-6xl mb-4">🌊</div>
                        <h3 className="text-xl font-bold text-cyan-300 mb-2">
                          3D时间流体验
                        </h3>
                        <p className="text-gray-300 mb-4">
                          创建事件后可以在这里体验革命性的3D时间管理方式！
                        </p>
                        <Button
                          variant="outline"
                          className="text-white border-white/20"
                          onClick={() => setViewMode('calendar')}
                        >
                          ← 返回日历视图
                        </Button>
                      </Card>
                    </div>
                  )}
                </div>
                
                {/* 时间流控制器 */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                  <Card className="bg-black/40 backdrop-blur-sm border-white/20 p-4">
                    <div className="text-center mb-3">
                      <p className="text-xs text-gray-400">时间流控制器</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-white border-white/20 hover:bg-white/10"
                        title="回到今天"
                      >
                        ⏮️ 今天
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-white border-white/20 hover:bg-white/10"
                        title="暂停时间流动画"
                      >
                        ⏸️ 暂停
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-white border-white/20 hover:bg-white/10"
                        title="播放时间流动画"
                      >
                        ⏯️ 播放
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-white border-white/20 hover:bg-white/10"
                        title="查看明天"
                      >
                        ⏭️ 明天
                      </Button>
                    </div>
                    <div className="text-center mt-2">
                      <p className="text-xs text-gray-500">切换到日历视图可获得更好的规划体验</p>
                    </div>
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 侧边栏 */}
        <div className="w-96 bg-black/20 backdrop-blur-sm border-l border-white/10 p-6">
          <div className="space-y-6">
            {/* 市场状态栏 */}
            <MarketStatusBar />

            {/* 工时预算组件 */}
            <WorkHoursBudgetComponent />

            {/* 智能冲突解决 */}
            <ConflictResolver />

            {/* 语音创建 */}
            <Card className="bg-black/30 border-white/20 p-4">
              <h3 className="text-white font-semibold mb-3">智能事件创建</h3>
              <SmartEventCreator />
            </Card>

            {/* 选中事件详情 */}
            {selectedEvent && (
              <Card className="bg-black/30 border-white/20 p-4">
                <h3 className="text-white font-semibold mb-2">事件详情</h3>
                <div className="space-y-2">
                  <p className="text-cyan-300 font-medium">{selectedEvent.title}</p>
                  <p className="text-sm text-gray-400">{selectedEvent.description}</p>
                  <div className="text-xs text-gray-500">
                    <p>开始: {selectedEvent.startTime.toLocaleString('zh-CN')}</p>
                    <p>结束: {selectedEvent.endTime.toLocaleString('zh-CN')}</p>
                    <p>优先级: {selectedEvent.priority}</p>
                    <p>状态: {selectedEvent.status}</p>
                    <p>精力需求: {selectedEvent.energyRequired}</p>
                    <p>预估时长: {selectedEvent.estimatedDuration} 分钟</p>
                    <p>灵活度: {selectedEvent.flexibilityScore}%</p>
                    {selectedEvent.isMarketProtected && (
                      <p className="text-yellow-400">🛡️ 市场保护时段</p>
                    )}
                    {selectedEvent.isConflicted && (
                      <p className="text-red-400">⚠️ 存在时间冲突</p>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* 今日事件列表 */}
            <Card className="bg-black/30 border-white/20 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">今日事件</h3>
                <span className="text-sm text-gray-400">({events.filter(event => 
                  event.startTime.toDateString() === currentTime.toDateString()
                ).length})</span>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {events.filter(event => 
                  event.startTime.toDateString() === currentTime.toDateString()
                ).map((event) => (
                  <div 
                    key={event.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedEvent?.id === event.id 
                        ? 'bg-cyan-600/20 border-cyan-500' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    } ${
                      event.isConflicted ? 'border-red-400/50' : ''
                    }`}
                    onClick={() => handleEventSelect(event)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white font-medium">{event.title}</p>
                      <div className="flex items-center space-x-1">
                        {event.isMarketProtected && (
                          <span className="text-yellow-400 text-xs">🛡️</span>
                        )}
                        {event.isConflicted && (
                          <span className="text-red-400 text-xs">⚠️</span>
                        )}
                        <span className={`w-2 h-2 rounded-full ${
                          event.priority === 'urgent' ? 'bg-red-500' : 
                          event.priority === 'high' ? 'bg-orange-500' : 
                          event.priority === 'medium' ? 'bg-yellow-500' : 'bg-emerald-500'
                        }`} />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {event.startTime.toLocaleTimeString('zh-CN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })} - {event.endTime.toLocaleTimeString('zh-CN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-cyan-300 capitalize">
                        {event.category}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        event.energyRequired === 'peak' ? 'bg-red-500/20 text-red-300' :
                        event.energyRequired === 'high' ? 'bg-orange-500/20 text-orange-300' :
                        event.energyRequired === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {event.energyRequired}
                      </span>
                    </div>
                  </div>
                ))}
                {events.length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">
                    暂无事件
                  </p>
                )}
              </div>
            </Card>

            {/* 统计信息 */}
            <Card className="bg-black/30 border-white/20 p-4">
              <h3 className="text-white font-semibold mb-4">今日统计</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">总事件</span>
                  <span className="text-white">{events.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">已完成</span>
                  <span className="text-green-400">
                    {events.filter(e => e.status === 'completed').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">进行中</span>
                  <span className="text-blue-400">
                    {events.filter(e => e.status === 'in_progress').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">待执行</span>
                  <span className="text-cyan-400">
                    {events.filter(e => e.status === 'planned').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">市场保护</span>
                  <span className="text-yellow-400">
                    {events.filter(e => e.isMarketProtected).length}
                  </span>
                </div>
                {events.filter(e => e.isConflicted).length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">冲突事件</span>
                    <span className="text-red-400">
                      {events.filter(e => e.isConflicted).length}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* 浮动提示系统 */}
      <FloatingTips 
        currentView={viewMode === 'flow' ? 'flow-view' : 'calendar'}
        isVisible={true}
      />
    </div>
  )
}
