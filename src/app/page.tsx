'use client'

import React, { useState, useEffect } from 'react'
import EnhancedFlowCanvas from '../../components/timeflow/FlowCanvas'
import CalendarContainer from '../../components/calendar/CalendarContainer'
import Link from 'next/link'
import { Settings, Brain, HelpCircle, Sparkles } from 'lucide-react'
import SmartEventCreator from '../../components/calendar/SmartEventCreator'
import VoiceInputButton from '../../components/voice/VoiceInputButton'
import TimeFlowGuide from '../../components/help/TimeFlowGuide'
import FeatureGuideModal from '../../components/help/FeatureGuideModal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Event, EventCategory, Priority, EventStatus, ReminderType, EnergyLevel } from '../../types/event'
import { useEventStore } from '../../lib/stores/event-store'
import EnhancedWorkHoursBudgetComponent from '../../components/budget/WorkHoursBudget'
import MarketStatusBar from '../../components/market/MarketStatusBar'
import ConflictResolver from '../../components/optimization/ConflictResolver'
import AIAssistant from '../../components/ai/AIAssistant'
import WeeklyPlanGenerator from '../../components/planning/WeeklyPlanGenerator'
// import RelationshipManager from '../../components/relationship/RelationshipManager' // 已合并到PersonCardPanel
// v4.0 新组件
import ContextMonitor from '../../components/context/ContextMonitor'
import SOPExecutor from '../../components/context/SOPExecutor'
import InboxPanel from '../../components/inbox/InboxPanel'
// 时间预算系统组件
import TimeTrackerWidget from '../../components/timebudget/TimeTrackerWidget'
import TimeBudgetDashboard from '../../components/timebudget/TimeBudgetDashboard'
import TimeBankPanel from '../../components/timebudget/TimeBankPanel'
// 浮动面板系统
import { FloatingPanelSystem } from '../../components/layout/FloatingPanelSystem'
// 温暖引导系统
import WarmGuidanceOverlay from '../../components/guidance/WarmGuidanceOverlay'

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
  const { events, selectEvent, addEvent, deleteEvent, loadEvents, isLoaded } = useEventStore()
  const [currentTime] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [initialized, setInitialized] = useState(false)
  const [viewMode, setViewMode] = useState<'flow' | 'calendar'>('calendar')
  const [showFeatureGuide, setShowFeatureGuide] = useState(false)

  // 初始化：加载存储的事件或创建样本数据
  useEffect(() => {
    // 不再自动显示功能指南，需要用户手动点击
    // const hasSeenGuide = localStorage.getItem('hasSeenV4Guide')
    // if (!hasSeenGuide) {
    //   setShowFeatureGuide(true)
    //   localStorage.setItem('hasSeenV4Guide', 'true')
    // }
    
    // 加载存储的事件
    if (!isLoaded) {
      loadEvents().then(() => {
        // 如果没有事件，创建样本数据
        if (events.length === 0 && !initialized) {
          initializeSampleEvents(addEvent)
          setInitialized(true)
        }
      })
    }
  }, [isLoaded, loadEvents, events.length, initialized, addEvent])

  const timeRange = {
    start: new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), 0, 0),
    end: new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), 23, 59)
  }

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event)
    selectEvent(event.id)
    // Event selected
  }

  const handleEventDrag = (eventId: string, newPosition: { x: number; y: number; z: number }) => {
    // Event dragged
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      {/* 头部导航 - 响应式设计优化 */}
      <header className="bg-gray-900/90 backdrop-blur-md border-b border-gray-700/50 shadow-xl sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                <span className="hidden sm:inline">智能日历系统</span>
                <span className="sm:hidden">智能日历</span>
              </h1>
              <div className="hidden sm:flex px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full border border-cyan-500/30">
                <span className="text-sm text-cyan-300 font-medium">
                  {viewMode === 'calendar' ? '📅 日历视图' : '🌊 时间流'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-4">
              <div className="flex bg-gray-800/50 rounded-lg border border-gray-600/50 p-1 shadow-inner">
                <Button
                  size="sm"
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  className={viewMode === 'calendar' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg text-xs sm:text-sm px-2 sm:px-3' : 'text-gray-300 hover:bg-gray-700/50 hover:text-white transition-safe text-xs sm:text-sm px-2 sm:px-3'}
                  onClick={() => setViewMode('calendar')}
                >
                  <span className="sm:hidden">📅</span>
                  <span className="hidden sm:inline">📅 日历视图</span>
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'flow' ? 'default' : 'ghost'}
                  className={viewMode === 'flow' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg text-xs sm:text-sm px-2 sm:px-3' : 'text-gray-300 hover:bg-gray-700/50 hover:text-white transition-safe text-xs sm:text-sm px-2 sm:px-3'}
                  onClick={() => setViewMode('flow')}
                >
                  <span className="sm:hidden">🌊</span>
                  <span className="hidden sm:inline">🌊 时间流</span>
                </Button>
              </div>
              
              <Link 
                href="/settings" 
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 hover:border-blue-400/50 text-white transition-safe hover:shadow-lg hover:shadow-blue-500/20"
              >
                <Brain className="h-4 w-4" />
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">AI助手</span>
              </Link>
              <Link 
                href="/settings" 
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white transition-safe border border-gray-600/50 hover:border-gray-500/50"
              >
                <Settings className="h-4 w-4" />
                <span className="text-xs sm:text-sm hidden sm:inline">设置</span>
              </Link>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowFeatureGuide(true)}
                className="flex items-center gap-1 sm:gap-2 text-gray-300 hover:text-white border-gray-600/50 hover:bg-gray-700/50 hover:border-gray-500/50 transition-safe px-2 sm:px-3"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="text-xs sm:text-sm hidden lg:inline">功能指南</span>
              </Button>
              <div className="hidden sm:flex px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-500/30">
                <span className="text-sm text-purple-300 font-medium">✨ v4.0</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 - 响应式优化 */}
      <main className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 p-3 sm:p-6">
            {viewMode === 'calendar' ? (
              /* 传统日历视图 - 主视图 */
              <>
                <CalendarContainer
                  initialDate={currentTime}
                  initialView="month"
                />
                
                {/* 日历视图中的浮动语音按钮 - 仅在日历模式下显示 */}
                
                {/* 空状态提示 */}
                {events.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm rounded-xl">
                    <Card className="bg-gray-800/90 backdrop-blur-sm border-gray-700/50 shadow-2xl p-8 text-center max-w-md">
                      <div className="text-6xl mb-4">🚀</div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                        欢迎使用智能日历 v4.0
                      </h3>
                      <p className="text-gray-400 mb-4">
                        全新升级！从时间管理到智能生活管家
                      </p>
                      <Button
                        onClick={() => setShowFeatureGuide(true)}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white mb-3 shadow-lg transition-safe"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        查看新功能
                      </Button>
                      <div className="text-sm text-gray-500 text-center">
                        点击右侧图标开始体验
                      </div>
                    </Card>
                  </div>
                )}
              </>
            ) : (
              /* 3D时间流视图 - 辅助功能 */
              <>
                <div className="w-full h-full rounded-xl bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 overflow-hidden relative shadow-2xl">
                  <EnhancedFlowCanvas
                    events={events}
                    currentTime={currentTime}
                    timeRange={timeRange}
                    onEventSelect={handleEventSelect}
                    onEventDrag={handleEventDrag}
                    riverFlow={{
                      enabled: true,
                      flowSpeed: 1.0,
                      currentTimeCenter: true,
                      rippleEffects: true
                    }}
                    smartInteraction={{
                      dragPreview: true,
                      conflictAvoidance: true,
                      snapToSlots: true,
                      energyOptimization: true
                    }}
                    className="w-full h-full"
                  />
                  
                  {/* 3D视图说明 */}
                  <div className="absolute top-4 left-4">
                    <Card className="bg-gray-800/90 backdrop-blur-sm border-gray-700/50 p-3 shadow-lg">
                      <p className="text-xs text-cyan-400">
                        🌊 3D时间流可视化 • 拖拽旋转 • 滚轮缩放 • 点击选择
                      </p>
                    </Card>
                  </div>
                  
                  {/* 空状态提示 */}
                  {events.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Card className="bg-gray-800/90 backdrop-blur-sm border-gray-700/50 shadow-2xl p-8 text-center max-w-md">
                        <div className="text-6xl mb-4">🌊</div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                          3D时间流体验
                        </h3>
                        <p className="text-gray-400 mb-4">
                          创建事件后可以在这里体验革命性的3D时间管理方式！
                        </p>
                        <Button
                          variant="outline"
                          className="text-gray-300 hover:text-white border-gray-600/50 hover:bg-gray-700/50 transition-safe"
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
                  <Card className="bg-gray-800/90 backdrop-blur-sm border-gray-700/50 p-4 shadow-xl">
                    <div className="text-center mb-3">
                      <p className="text-xs text-gray-500">时间流控制器</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-gray-300 hover:text-white border-gray-600/50 hover:bg-gray-700/50 transition-safe"
                        title="回到今天"
                      >
                        ⏮️ 今天
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-gray-300 hover:text-white border-gray-600/50 hover:bg-gray-700/50 transition-safe"
                        title="暂停时间流动画"
                      >
                        ⏸️ 暂停
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-gray-300 hover:text-white border-gray-600/50 hover:bg-gray-700/50 transition-safe"
                        title="播放时间流动画"
                      >
                        ⏯️ 播放
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-gray-300 hover:text-white border-gray-600/50 hover:bg-gray-700/50 transition-safe"
                        title="查看明天"
                      >
                        ⏭️ 明天
                      </Button>
                    </div>
                    <div className="text-center mt-2">
                      <p className="text-xs text-gray-500/80">切换到日历视图可获得更好的规划体验</p>
                    </div>
                  </Card>
                </div>
              </>
            )}
          </div>
      </main>

      {/* 浮动面板系统 - 替代原有侧边栏 */}
      <FloatingPanelSystem 
        selectedEvent={selectedEvent}
        onTaskSchedule={(task: any) => {
          console.log('Schedule task:', task)
        }}
      />

      {/* v4.0 功能指南弹窗 - 只通过点击导航栏按钮显示 */}
      <FeatureGuideModal 
        isOpen={showFeatureGuide}
        onClose={() => setShowFeatureGuide(false)}
      />
      
      {/* 温暖引导系统 */}
      <WarmGuidanceOverlay />
    </div>
  )
}
