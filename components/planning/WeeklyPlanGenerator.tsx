'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Event, EventCategory, Priority, EnergyLevel, EventStatus } from '../../types/event'
import { useEventStore } from '../../lib/stores/event-store'

// 智能周计划生成器属性
interface WeeklyPlanGeneratorProps {
  className?: string
  // 输入源配置
  inputSources: {
    quarterlyGoals: Goal[]      // 季度目标拆解
    previousWeekIncomplete: Task[] // 上周未完成
    sopTasks: SOPTask[]         // 多维SOP任务
    inboxTasks: InboxTask[]     // 收集箱新任务
  }
  // 生成配置
  generation: {
    autoSchedule: boolean
    conflictResolution: boolean
    energyOptimization: boolean
    marketProtection: boolean
  }
}

// 季度目标类型
interface Goal {
  id: string
  title: string
  quarter: string
  totalHours: number
  deadline: Date
  milestones: Milestone[]
  progress: number
}

interface Milestone {
  id: string
  title: string
  hours: number
  deadline: Date
  completed: boolean
}

// 任务类型
interface Task {
  id: string
  title: string
  category: EventCategory
  estimatedHours: number
  priority: Priority
  energyRequired: EnergyLevel
  deadline?: Date
  dependencies: string[]
  flexibility: number // 0-100
}

// SOP任务类型
interface SOPTask {
  id: string
  name: string
  type: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  day?: number // 周几执行
  time?: string // 执行时间
  duration: number
  category: EventCategory
  isFixed: boolean
}

// 收集箱任务类型
interface InboxTask {
  id: string
  title: string
  description: string
  estimatedTime: number
  priority: Priority
  category: EventCategory
  createdAt: Date
  gtdCategory: '2min' | 'plan' | 'delegate' | 'defer'
}

// 时间段类型
interface TimeSlot {
  startTime: Date
  endTime: Date
  available: boolean
}

// 周计划类型
interface WeeklyPlan {
  weekStart: Date
  weekEnd: Date
  totalTasks: number
  scheduledTasks: Event[]
  unscheduledTasks: Task[]
  conflicts: string[]
  recommendations: string[]
}

// 智能周计划生成引擎
class WeeklyPlanEngine {
  
  // 多维SOP系统 - 升级版
  static readonly SOP_TEMPLATES = {
    // 周例行
    weekly: {
      sunday: [
        { name: '周计划制定', time: '09:00', duration: 60, category: EventCategory.WORK },
        { name: '周复盘总结', time: '20:00', duration: 90, category: EventCategory.WORK },
        { name: '财务数据录入', time: '21:30', duration: 30, category: EventCategory.WORK },
        { name: '给爸爸电话', time: '19:00', duration: 30, category: EventCategory.PERSONAL }
      ],
      monday: [
        { name: '业务会议', time: '14:00', duration: 180, category: EventCategory.MEETING }
      ],
      tuesday: [
        { name: '财务会议', time: '15:00', duration: 90, category: EventCategory.MEETING }
      ],  
      saturday: [
        { name: 'Sabbath学习', time: '09:00', duration: 360, category: EventCategory.PERSONAL },
        { name: '发朋友圈', time: '20:00', duration: 30, category: EventCategory.PERSONAL }
      ]
    }
  }

  // 计算任务优先级得分
  static calculateTaskScore(task: Task, currentWeek: Date): number {
    let score = 0
    
    // 优先级权重 (40%)
    const priorityWeights = {
      [Priority.URGENT]: 40,
      [Priority.HIGH]: 30,
      [Priority.MEDIUM]: 20,
      [Priority.LOW]: 10
    }
    score += priorityWeights[task.priority] || 10
    
    // 截止日期紧迫性 (30%)
    if (task.deadline) {
      const daysUntilDeadline = Math.ceil(
        (task.deadline.getTime() - currentWeek.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysUntilDeadline <= 3) score += 30
      else if (daysUntilDeadline <= 7) score += 20
      else if (daysUntilDeadline <= 14) score += 10
    }
    
    // 依赖关系 (20%)
    score += Math.max(0, 20 - task.dependencies.length * 5)
    
    // 灵活度 (10%) - 灵活度低的任务优先安排
    score += (100 - task.flexibility) * 0.1
    
    return score
  }

  // 生成周计划
  static generateWeeklyPlan(
    inputSources: WeeklyPlanGeneratorProps['inputSources'],
    generation: WeeklyPlanGeneratorProps['generation']
  ): WeeklyPlan {
    
    const currentWeek = new Date()
    const weekStart = new Date(currentWeek)
    weekStart.setDate(currentWeek.getDate() - currentWeek.getDay()) // 周日开始
    
    const plan: WeeklyPlan = {
      weekStart,
      weekEnd: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
      totalTasks: 0,
      scheduledTasks: [],
      unscheduledTasks: [],
      conflicts: [],
      recommendations: []
    }
    
    // 1. 首先安排固定SOP任务
    const sopEvents = this.scheduleSopTasks(weekStart)
    plan.scheduledTasks.push(...sopEvents)
    
    // 2. 处理季度目标拆解的任务
    const goalTasks = this.processQuarterlyGoals(inputSources.quarterlyGoals, currentWeek)
    
    // 3. 添加上周未完成任务
    const incompleteTasks = inputSources.previousWeekIncomplete.map(task => ({
      ...task,
      priority: task.priority === Priority.LOW ? Priority.MEDIUM : task.priority // 提升优先级
    }))
    
    // 4. 处理收集箱任务
    const inboxTasks = this.processInboxTasks(inputSources.inboxTasks)
    
    // 5. 合并所有任务并排序
    const allTasks = [...goalTasks, ...incompleteTasks, ...inboxTasks]
      .sort((a, b) => this.calculateTaskScore(b, currentWeek) - this.calculateTaskScore(a, currentWeek))
    
    plan.totalTasks = allTasks.length + sopEvents.length
    plan.unscheduledTasks = allTasks
    
    return plan
  }

  // 安排SOP任务
  static scheduleSopTasks(weekStart: Date): Event[] {
    const events: Event[] = []
    
    // 处理每日SOP
    Object.entries(this.SOP_TEMPLATES.weekly).forEach(([day, tasks]) => {
      const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(day)
      const targetDate = new Date(weekStart)
      targetDate.setDate(weekStart.getDate() + dayIndex)
      
      tasks.forEach(task => {
        const [hour, minute] = task.time.split(':').map(Number)
        const startTime = new Date(targetDate)
        startTime.setHours(hour, minute, 0, 0)
        
        const endTime = new Date(startTime.getTime() + task.duration * 60 * 1000)
        
        events.push({
          id: `sop-${day}-${task.name}`,
          title: task.name,
          description: `每周固定SOP任务`,
          startTime,
          endTime,
          category: task.category,
          priority: Priority.HIGH,
          status: EventStatus.PLANNED,
          energyRequired: EnergyLevel.MEDIUM,
          estimatedDuration: task.duration,
          isMarketProtected: task.category === EventCategory.TRADING,
          flexibilityScore: 20, // SOP任务灵活度较低
          position: { x: 0, y: 0, z: 0 },
          size: { width: 1, height: 1, depth: 1 },
          color: '#7c3aed',
          opacity: 0.8,
          isSelected: false,
          isDragging: false,
          isHovered: false,
          isConflicted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['SOP', day],
          reminders: []
        })
      })
    })
    
    return events
  }

  // 处理季度目标拆解
  static processQuarterlyGoals(goals: Goal[], currentWeek: Date): Task[] {
    const tasks: Task[] = []
    
    goals.forEach(goal => {
      goal.milestones.forEach(milestone => {
        if (!milestone.completed && milestone.deadline >= currentWeek) {
          // 将里程碑拆解为周任务
          const weeklyHours = milestone.hours / 4 // 假设分4周完成
          
          tasks.push({
            id: `goal-${goal.id}-${milestone.id}`,
            title: `${goal.title} - ${milestone.title}`,
            category: EventCategory.WORK,
            estimatedHours: weeklyHours,
            priority: Priority.HIGH,
            energyRequired: EnergyLevel.HIGH,
            deadline: milestone.deadline,
            dependencies: [],
            flexibility: 60
          })
        }
      })
    })
    
    return tasks
  }

  // 处理收集箱任务
  static processInboxTasks(inboxTasks: InboxTask[]): Task[] {
    return inboxTasks
      .filter(task => task.gtdCategory === 'plan') // 只处理需要计划的任务
      .map(task => ({
        id: task.id,
        title: task.title,
        category: task.category,
        estimatedHours: task.estimatedTime / 60,
        priority: task.priority,
        energyRequired: EnergyLevel.MEDIUM,
        dependencies: [],
        flexibility: 80
      }))
  }
}

// 主组件 - 智能周计划生成器
export default function WeeklyPlanGenerator({
  className = "",
  inputSources = {
    quarterlyGoals: [],
    previousWeekIncomplete: [],
    sopTasks: [],
    inboxTasks: []
  },
  generation = {
    autoSchedule: true,
    conflictResolution: true,
    energyOptimization: true,
    marketProtection: true
  }
}: WeeklyPlanGeneratorProps) {
  
  const { events, addEvent } = useEventStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<WeeklyPlan | null>(null)

  // 模拟季度目标数据
  const mockQuarterlyGoals: Goal[] = useMemo(() => [
    {
      id: 'goal-1',
      title: '完成策略优化',
      quarter: '2025Q1', 
      totalHours: 80,
      deadline: new Date('2025-03-31'),
      progress: 0.3,
      milestones: [
        {
          id: 'milestone-1',
          title: '策略回测系统搭建',
          hours: 20,
          deadline: new Date('2025-02-15'),
          completed: false
        },
        {
          id: 'milestone-2',
          title: '参数优化算法实现',
          hours: 30,
          deadline: new Date('2025-03-01'),
          completed: false
        }
      ]
    }
  ], [])

  // 模拟上周未完成任务
  const mockIncompleteTask: Task[] = useMemo(() => [
    {
      id: 'incomplete-1',
      title: '完成API文档更新',
      category: EventCategory.WORK,
      estimatedHours: 3,
      priority: Priority.MEDIUM,
      energyRequired: EnergyLevel.MEDIUM,
      dependencies: [],
      flexibility: 70
    }
  ], [])

  // 模拟收集箱任务
  const mockInboxTasks: InboxTask[] = useMemo(() => [
    {
      id: 'inbox-1',
      title: '研究新的交易指标',
      description: '分析布林带和RSI组合策略',
      estimatedTime: 120, // 分钟
      priority: Priority.HIGH,
      category: EventCategory.TRADING,
      createdAt: new Date(),
      gtdCategory: 'plan'
    }
  ], [])

  // 生成周计划
  const handleGeneratePlan = useCallback(async () => {
    setIsGenerating(true)
    
    try {
      // 模拟AI处理时间
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const plan = WeeklyPlanEngine.generateWeeklyPlan(
        {
          quarterlyGoals: mockQuarterlyGoals,
          previousWeekIncomplete: mockIncompleteTask,
          sopTasks: [],
          inboxTasks: mockInboxTasks
        },
        generation
      )
      
      setGeneratedPlan(plan)
      
      // 自动添加生成的SOP事件到日程
      if (generation.autoSchedule) {
        plan.scheduledTasks.forEach(event => {
          addEvent(event)
        })
      }
      
    } catch (error) {
      console.error('生成周计划失败:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [mockQuarterlyGoals, mockIncompleteTask, mockInboxTasks, generation, addEvent])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 智能周计划生成器 */}
      <Card className="bg-black/30 border-white/20 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">🗓️ 智能周计划生成器</h3>
          <button
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg text-sm transition-colors"
          >
            {isGenerating ? '🔄 生成中...' : '✨ 生成本周计划'}
          </button>
        </div>

        {/* 输入源概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="text-center p-2 bg-blue-500/10 border border-blue-500/20 rounded">
            <div className="text-blue-300 font-semibold">{mockQuarterlyGoals.length}</div>
            <div className="text-gray-400 text-xs">季度目标</div>
          </div>
          <div className="text-center p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
            <div className="text-yellow-300 font-semibold">{mockIncompleteTask.length}</div>
            <div className="text-gray-400 text-xs">上周未完成</div>
          </div>
          <div className="text-center p-2 bg-green-500/10 border border-green-500/20 rounded">
            <div className="text-green-300 font-semibold">7</div>
            <div className="text-gray-400 text-xs">SOP任务</div>
          </div>
          <div className="text-center p-2 bg-purple-500/10 border border-purple-500/20 rounded">
            <div className="text-purple-300 font-semibold">{mockInboxTasks.length}</div>
            <div className="text-gray-400 text-xs">收集箱</div>
          </div>
        </div>

        {/* 生成配置 */}
        <div className="p-3 bg-gray-500/10 border border-gray-500/20 rounded">
          <div className="text-gray-300 text-sm mb-2">🛠️ 生成配置</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${generation.autoSchedule ? 'bg-green-500' : 'bg-gray-500'}`} />
              <span className="text-gray-300">自动安排</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${generation.conflictResolution ? 'bg-green-500' : 'bg-gray-500'}`} />
              <span className="text-gray-300">冲突解决</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${generation.energyOptimization ? 'bg-green-500' : 'bg-gray-500'}`} />
              <span className="text-gray-300">精力优化</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${generation.marketProtection ? 'bg-green-500' : 'bg-gray-500'}`} />
              <span className="text-gray-300">市场保护</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 生成结果展示 */}
      {generatedPlan && (
        <Card className="bg-black/30 border-white/20 p-4">
          <h3 className="text-white font-semibold mb-3">📋 本周计划结果</h3>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-green-500/10 border border-green-500/20 rounded">
              <div className="text-green-300 font-semibold">{generatedPlan.scheduledTasks.length}</div>
              <div className="text-gray-400 text-sm">已安排任务</div>
            </div>
            <div className="text-center p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
              <div className="text-yellow-300 font-semibold">{generatedPlan.unscheduledTasks.length}</div>
              <div className="text-gray-400 text-sm">待安排任务</div>
            </div>
            <div className="text-center p-3 bg-purple-500/10 border border-purple-500/20 rounded">
              <div className="text-purple-300 font-semibold">{generatedPlan.totalTasks}</div>
              <div className="text-gray-400 text-sm">总任务数</div>
            </div>
          </div>

          {/* 已安排任务列表 */}
          <div className="space-y-2">
            <div className="text-white text-sm font-medium">✅ 已安排SOP任务</div>
            {generatedPlan.scheduledTasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center justify-between p-2 bg-gray-500/10 rounded">
                <div>
                  <div className="text-white text-sm">{task.title}</div>
                  <div className="text-gray-400 text-xs">
                    {task.startTime.toLocaleDateString('zh-CN', { weekday: 'short' })} {' '}
                    {task.startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="text-purple-300 text-xs">
                  {task.estimatedDuration}分钟
                </div>
              </div>
            ))}
            
            {generatedPlan.scheduledTasks.length > 5 && (
              <div className="text-gray-400 text-xs text-center py-2">
                还有 {generatedPlan.scheduledTasks.length - 5} 个任务...
              </div>
            )}
          </div>

          {/* 待安排任务提示 */}
          {generatedPlan.unscheduledTasks.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
              <div className="text-yellow-300 text-sm mb-2">⏳ 待安排任务建议</div>
              <div className="text-gray-300 text-xs space-y-1">
                {generatedPlan.unscheduledTasks.slice(0, 3).map(task => (
                  <div key={task.id}>• {task.title} ({task.estimatedHours}小时)</div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
