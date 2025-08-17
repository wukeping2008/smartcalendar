'use client'

/**
 * 人际关系管理服务
 * 执行秘书核心功能：联系人管理、重要日期跟踪、人情世故自动化
 */

import {
  ExecutiveContact,
  RelationshipType,
  InteractionFrequency,
  PersonalMilestone,
  MilestoneType,
  PeriodicEvent,
  PeriodicEventType,
  RecurrenceFrequency,
  RelationshipTask,
  RelationshipTaskType,
  RelationshipTaskStatus,
  RelationshipInsight,
  InsightType,
  RelationshipMetrics,
  RelationshipRule,
  ContactPreferences
} from '../../types/relationship'
import { Priority } from '../../types/event'
import { aiService } from './AIService'

interface RelationshipDatabase {
  contacts: ExecutiveContact[]
  periodicEvents: PeriodicEvent[]
  relationshipTasks: RelationshipTask[]
  insights: RelationshipInsight[]
  rules: RelationshipRule[]
}

class RelationshipService {
  private static instance: RelationshipService
  private database: RelationshipDatabase
  private storageKey = 'smartcalendar_relationships'

  private constructor() {
    this.database = {
      contacts: [],
      periodicEvents: [],
      relationshipTasks: [],
      insights: [],
      rules: []
    }
    this.loadFromStorage()
    this.initializeDefaultRules()
  }

  static getInstance(): RelationshipService {
    if (!RelationshipService.instance) {
      RelationshipService.instance = new RelationshipService()
    }
    return RelationshipService.instance
  }

  // ==================== 联系人管理 ====================

  /**
   * 添加新联系人
   */
  addContact(contactData: Omit<ExecutiveContact, 'id' | 'createdAt' | 'updatedAt' | 'totalInteractions' | 'lastInteraction'>): ExecutiveContact {
    const contact: ExecutiveContact = {
      ...contactData,
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lastInteraction: new Date(),
      totalInteractions: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    }

    this.database.contacts.push(contact)
    this.saveToStorage()

    // 添加新联系人

    // 自动创建周期性事务（如1:1会议）
    this.autoCreatePeriodicEvents(contact)

    // 触发自动化规则
    this.triggerRules('new_contact', { contact })

    return contact
  }

  /**
   * 更新联系人信息
   */
  updateContact(contactId: string, updates: Partial<ExecutiveContact>): ExecutiveContact | null {
    const contactIndex = this.database.contacts.findIndex(c => c.id === contactId)
    if (contactIndex === -1) return null

    this.database.contacts[contactIndex] = {
      ...this.database.contacts[contactIndex],
      ...updates,
      updatedAt: new Date()
    }

    this.saveToStorage()
    return this.database.contacts[contactIndex]
  }

  /**
   * 获取联系人
   */
  getContact(contactId: string): ExecutiveContact | null {
    return this.database.contacts.find(c => c.id === contactId) || null
  }

  /**
   * 获取所有联系人
   */
  getAllContacts(): ExecutiveContact[] {
    return this.database.contacts.filter(c => c.isActive)
  }

  /**
   * 按关系类型获取联系人
   */
  getContactsByRelationship(relationship: RelationshipType): ExecutiveContact[] {
    return this.database.contacts.filter(c => c.isActive && c.relationship === relationship)
  }

  /**
   * 获取直接下属
   */
  getDirectReports(): ExecutiveContact[] {
    return this.getContactsByRelationship(RelationshipType.DIRECT_REPORT)
  }

  // ==================== 重要日期管理 ====================

  /**
   * 添加个人里程碑
   */
  addPersonalMilestone(contactId: string, milestone: Omit<PersonalMilestone, 'id'>): boolean {
    const contact = this.getContact(contactId)
    if (!contact) return false

    const newMilestone: PersonalMilestone = {
      ...milestone,
      id: `milestone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    contact.personalInfo.personalMilestones.push(newMilestone)
    this.updateContact(contactId, { personalInfo: contact.personalInfo })

    // 添加里程碑

    // 自动创建相关任务
    this.autoCreateMilestoneTask(contact, newMilestone)

    return true
  }

  /**
   * 获取即将到来的里程碑
   */
  getUpcomingMilestones(days: number = 30): Array<{
    contact: ExecutiveContact
    milestone: PersonalMilestone
    daysUntil: number
  }> {
    const now = new Date()
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    const upcoming: Array<{
      contact: ExecutiveContact
      milestone: PersonalMilestone
      daysUntil: number
    }> = []

    this.database.contacts.forEach(contact => {
      contact.personalInfo.personalMilestones.forEach(milestone => {
        const milestoneDate = new Date(milestone.date)
        
        // 处理周期性里程碑（如生日）
        if (milestone.isRecurring) {
          const thisYearDate = new Date(now.getFullYear(), milestoneDate.getMonth(), milestoneDate.getDate())
          const nextYearDate = new Date(now.getFullYear() + 1, milestoneDate.getMonth(), milestoneDate.getDate())
          
          const checkDate = thisYearDate >= now ? thisYearDate : nextYearDate
          
          if (checkDate <= endDate) {
            const daysUntil = Math.ceil((checkDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
            upcoming.push({ contact, milestone, daysUntil })
          }
        } else {
          if (milestoneDate >= now && milestoneDate <= endDate) {
            const daysUntil = Math.ceil((milestoneDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
            upcoming.push({ contact, milestone, daysUntil })
          }
        }
      })
    })

    return upcoming.sort((a, b) => a.daysUntil - b.daysUntil)
  }

  // ==================== 周期性事务管理 ====================

  /**
   * 创建周期性事务
   */
  createPeriodicEvent(eventData: Omit<PeriodicEvent, 'id' | 'createdAt' | 'updatedAt' | 'nextOccurrence'>): PeriodicEvent {
    const periodicEvent: PeriodicEvent = {
      ...eventData,
      id: `periodic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nextOccurrence: this.calculateNextOccurrence(eventData.frequency, eventData.interval, eventData.dayOfWeek),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.database.periodicEvents.push(periodicEvent)
    this.saveToStorage()

    // 创建周期性事务
    return periodicEvent
  }

  /**
   * 获取即将到来的周期性事务
   */
  getUpcomingPeriodicEvents(days: number = 7): Array<{
    event: PeriodicEvent
    contact: ExecutiveContact | null
    nextOccurrence: Date
  }> {
    const now = new Date()
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    
    return this.database.periodicEvents
      .filter(event => event.isActive && event.nextOccurrence && event.nextOccurrence <= endDate)
      .map(event => ({
        event,
        contact: this.getContact(event.contactId),
        nextOccurrence: event.nextOccurrence!
      }))
      .sort((a, b) => a.nextOccurrence.getTime() - b.nextOccurrence.getTime())
  }

  /**
   * 自动创建周期性事务（新员工入职时）
   */
  private autoCreatePeriodicEvents(contact: ExecutiveContact) {
    if (contact.relationship === RelationshipType.DIRECT_REPORT) {
      // 创建每周1:1会议
      this.createPeriodicEvent({
        contactId: contact.id,
        type: PeriodicEventType.ONE_ON_ONE,
        title: `1:1会议 - ${contact.name}`,
        description: `与${contact.name}的定期1:1会议`,
        frequency: RecurrenceFrequency.WEEKLY,
        interval: 1,
        dayOfWeek: 2, // 周二
        duration: 30,
        preferredTimeSlots: ['9:00-9:30', '10:00-10:30', '14:00-14:30'],
        location: contact.preferences.meetingPreferences.preferredLocation || 'office',
        isVirtualMeeting: contact.preferences.meetingPreferences.preferredLocation === 'video_call',
        preparationTasks: [
          {
            id: `prep_${Date.now()}`,
            title: '准备1:1会议议题',
            description: '回顾上周工作进展，准备讨论要点',
            dueMinutesBefore: 30,
            isCompleted: false
          }
        ],
        isActive: true
      })
    }
  }

  // ==================== 人情世故任务管理 ====================

  /**
   * 创建关系任务
   */
  createRelationshipTask(taskData: Omit<RelationshipTask, 'id' | 'createdAt' | 'updatedAt'>): RelationshipTask {
    const task: RelationshipTask = {
      ...taskData,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.database.relationshipTasks.push(task)
    this.saveToStorage()

    const contact = this.getContact(task.contactId)
    // 创建关系任务

    return task
  }

  /**
   * 自动创建里程碑相关任务
   */
  private autoCreateMilestoneTask(contact: ExecutiveContact, milestone: PersonalMilestone) {
    let taskType: RelationshipTaskType
    let title: string
    let description: string
    let suggestedActions: string[]

    switch (milestone.type) {
      case MilestoneType.BIRTHDAY:
        taskType = RelationshipTaskType.BIRTHDAY_WISHES
        title = `${contact.name}生日祝福`
        description = `为${contact.name}准备生日祝福和礼物`
        suggestedActions = [
          '发送生日祝福消息',
          '准备小礼物或鲜花',
          '在团队中提及生日祝福',
          '记录偏好以便来年参考'
        ]
        break
      
      case MilestoneType.CHILD_BIRTH:
        taskType = RelationshipTaskType.CONGRATULATIONS
        title = `${contact.name}新生儿祝贺`
        description = `祝贺${contact.name}新生儿诞生`
        suggestedActions = [
          '发送祝贺消息',
          '购买婴儿用品礼篮',
          '安排产假期间工作交接',
          '关心家庭适应情况'
        ]
        break
      
      case MilestoneType.PROMOTION:
        taskType = RelationshipTaskType.CONGRATULATIONS
        title = `${contact.name}升职祝贺`
        description = `祝贺${contact.name}获得晋升`
        suggestedActions = [
          '当面或电话祝贺',
          '组织小型庆祝活动',
          '更新组织架构信息',
          '讨论新角色的期望'
        ]
        break
      
      default:
        taskType = RelationshipTaskType.CONGRATULATIONS
        title = `${contact.name} - ${milestone.description}`
        description = `为${contact.name}的${milestone.description}准备相应行动`
        suggestedActions = ['发送祝贺或慰问', '准备合适的礼物', '记录重要信息']
    }

    // 根据提醒天数创建任务
    milestone.reminderDays.forEach(daysBefore => {
      const dueDate = new Date(milestone.date.getTime() - daysBefore * 24 * 60 * 60 * 1000)
      
      if (dueDate > new Date()) {
        this.createRelationshipTask({
          contactId: contact.id,
          type: taskType,
          title: daysBefore > 1 ? `${title}准备` : title,
          description: daysBefore > 1 ? `提前${daysBefore}天准备：${description}` : description,
          priority: milestone.priority,
          dueDate,
          status: RelationshipTaskStatus.PENDING,
          suggestedActions,
          budget: this.estimateTaskBudget(taskType),
          vendor: this.suggestVendor(taskType),
          triggeredBy: {
            milestoneId: milestone.id,
            automaticDetection: true
          },
          followUpRequired: daysBefore === 1 // 当天执行需要跟进
        })
      }
    })
  }

  /**
   * 获取待处理的关系任务
   */
  getPendingRelationshipTasks(): RelationshipTask[] {
    return this.database.relationshipTasks
      .filter(task => task.status === RelationshipTaskStatus.PENDING)
      .sort((a, b) => {
        // 先按优先级排序，再按截止日期
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
        const aPriority = priorityOrder[a.priority]
        const bPriority = priorityOrder[b.priority]
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority
        }
        
        if (a.dueDate && b.dueDate) {
          return a.dueDate.getTime() - b.dueDate.getTime()
        }
        
        return 0
      })
  }

  // ==================== AI增强功能 ====================

  /**
   * 生成关系洞察
   */
  async generateRelationshipInsights(): Promise<RelationshipInsight[]> {
    const insights: RelationshipInsight[] = []
    const now = new Date()

    // 1. 检查互动过期
    const overdueInteractions = this.database.contacts.filter(contact => {
      if (!contact.isActive) return false
      
      const daysSinceLastInteraction = Math.floor((now.getTime() - contact.lastInteraction.getTime()) / (24 * 60 * 60 * 1000))
      const expectedFrequencyDays = this.getFrequencyInDays(contact.interactionFrequency)
      
      return daysSinceLastInteraction > expectedFrequencyDays * 1.5
    })

    if (overdueInteractions.length > 0) {
      insights.push({
        id: `insight_${Date.now()}_overdue`,
        type: InsightType.OVERDUE_INTERACTION,
        title: `${overdueInteractions.length}位联系人互动过期`,
        description: `有${overdueInteractions.length}位重要联系人超过预期时间未互动`,
        dataPoints: overdueInteractions.map(c => `${c.name}: ${Math.floor((now.getTime() - c.lastInteraction.getTime()) / (24 * 60 * 60 * 1000))}天未互动`),
        affectedContacts: overdueInteractions.map(c => c.id),
        recommendedActions: [
          {
            action: '安排非正式沟通',
            priority: Priority.MEDIUM,
            timeline: '本周内',
            effort: 'low'
          },
          {
            action: '发送关怀信息',
            priority: Priority.HIGH,
            timeline: '今天',
            effort: 'low'
          }
        ],
        impact: 'high',
        urgency: 'medium',
        confidence: 0.9,
        generatedAt: now
      })
    }

    // 2. 即将到来的里程碑提醒
    const upcomingMilestones = this.getUpcomingMilestones(14)
    if (upcomingMilestones.length > 0) {
      insights.push({
        id: `insight_${Date.now()}_milestones`,
        type: InsightType.UPCOMING_MILESTONE,
        title: `${upcomingMilestones.length}个重要日期即将到来`,
        description: '未来2周内有重要的个人里程碑需要关注',
        dataPoints: upcomingMilestones.map(m => `${m.contact.name}: ${m.milestone.description} (${m.daysUntil}天后)`),
        affectedContacts: upcomingMilestones.map(m => m.contact.id),
        recommendedActions: [
          {
            action: '准备庆祝或慰问用品',
            priority: Priority.HIGH,
            timeline: '提前3天',
            effort: 'medium'
          }
        ],
        impact: 'high',
        urgency: 'high',
        confidence: 1.0,
        generatedAt: now,
        expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
      })
    }

    // 3. 使用AI生成更深入的洞察
    try {
      const aiInsight = await this.generateAIRelationshipInsights()
      if (aiInsight) {
        insights.push(aiInsight)
      }
    } catch (error) {
      // AI关系洞察生成失败
    }

    // 保存洞察到数据库
    this.database.insights = this.database.insights.filter(i => i.expiresAt && i.expiresAt > now)
    insights.forEach(insight => this.database.insights.push(insight))
    this.saveToStorage()

    return insights
  }

  /**
   * 使用AI生成关系洞察
   */
  private async generateAIRelationshipInsights(): Promise<RelationshipInsight | null> {
    const directReports = this.getDirectReports()
    const recentTasks = this.database.relationshipTasks.filter(task => 
      task.createdAt.getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
    )

    if (directReports.length === 0) return null

    try {
      const prompt = `作为执行秘书AI，分析以下团队关系数据并提供管理建议：

直接下属数量：${directReports.length}
最近30天人情世故任务：${recentTasks.length}个
平均互动频率：${this.calculateAverageInteractionFrequency()}

请提供3个具体的团队关系管理建议，重点关注：
1. 团队凝聚力建设
2. 个性化关怀机会
3. 沟通效率优化

请用简洁专业的中文回答。`

      const aiResponse = await aiService.chatWithClaude(prompt)

      return {
        id: `ai_insight_${Date.now()}`,
        type: InsightType.TEAM_DYNAMICS,
        title: 'AI团队关系分析',
        description: 'AI基于当前团队数据生成的管理建议',
        dataPoints: [
          `直接下属：${directReports.length}人`,
          `近期任务：${recentTasks.length}个`,
          `AI分析结果：${aiResponse.substring(0, 100)}...`
        ],
        affectedContacts: directReports.map(c => c.id),
        recommendedActions: [
          {
            action: 'AI建议的优化策略',
            priority: Priority.MEDIUM,
            timeline: '本月内',
            effort: 'medium'
          }
        ],
        impact: 'medium',
        urgency: 'low',
        confidence: 0.7,
        generatedAt: new Date()
      }
    } catch (error) {
      // AI洞察生成失败
      return null
    }
  }

  // ==================== 统计和分析 ====================

  /**
   * 获取关系管理统计
   */
  getRelationshipMetrics(): RelationshipMetrics {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const activeContacts = this.database.contacts.filter(c => c.isActive)
    
    // 按关系类型统计
    const contactsByRelationship: Record<RelationshipType, number> = {} as Record<RelationshipType, number>
    Object.values(RelationshipType).forEach(type => {
      contactsByRelationship[type] = activeContacts.filter(c => c.relationship === type).length
    })

    // 按重要性统计
    const contactsByImportance = {
      'low': activeContacts.filter(c => c.importanceLevel >= 1 && c.importanceLevel <= 3).length,
      'medium': activeContacts.filter(c => c.importanceLevel >= 4 && c.importanceLevel <= 6).length,
      'high': activeContacts.filter(c => c.importanceLevel >= 7 && c.importanceLevel <= 10).length
    }

    // 任务统计
    const allTasks = this.database.relationshipTasks
    const pendingTasks = allTasks.filter(t => t.status === RelationshipTaskStatus.PENDING).length
    const overdueTasks = allTasks.filter(t => 
      t.status === RelationshipTaskStatus.PENDING && 
      t.dueDate && 
      t.dueDate < now
    ).length
    const completedTasksThisMonth = allTasks.filter(t => 
      t.status === RelationshipTaskStatus.COMPLETED && 
      t.completionDate && 
      t.completionDate > monthAgo
    ).length

    return {
      totalContacts: this.database.contacts.length,
      activeContacts: activeContacts.length,
      contactsByRelationship,
      contactsByImportance,
      interactionsThisWeek: 0, // 需要从事件数据计算
      interactionsThisMonth: 0, // 需要从事件数据计算
      averageInteractionFrequency: this.calculateAverageInteractionFrequency(),
      pendingTasks,
      overdueTasks,
      completedTasksThisMonth,
      upcomingMilestones: this.getUpcomingMilestones(30).length,
      upcomingPeriodicEvents: this.getUpcomingPeriodicEvents(7).length,
      overallRelationshipHealth: this.calculateRelationshipHealth(),
      calculatedAt: now
    }
  }

  // ==================== 私有辅助方法 ====================

  private calculateNextOccurrence(frequency: RecurrenceFrequency, interval: number, dayOfWeek?: number): Date {
    const now = new Date()
    const nextOccurrence = new Date(now)

    switch (frequency) {
      case RecurrenceFrequency.WEEKLY:
        if (dayOfWeek !== undefined) {
          const daysUntilTarget = (dayOfWeek - now.getDay() + 7) % 7
          nextOccurrence.setDate(now.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget))
        } else {
          nextOccurrence.setDate(now.getDate() + 7 * interval)
        }
        break
      case RecurrenceFrequency.MONTHLY:
        nextOccurrence.setMonth(now.getMonth() + interval)
        break
      case RecurrenceFrequency.QUARTERLY:
        nextOccurrence.setMonth(now.getMonth() + 3 * interval)
        break
    }

    return nextOccurrence
  }

  private getFrequencyInDays(frequency: InteractionFrequency): number {
    const frequencyMap = {
      [InteractionFrequency.DAILY]: 1,
      [InteractionFrequency.WEEKLY]: 7,
      [InteractionFrequency.BIWEEKLY]: 14,
      [InteractionFrequency.MONTHLY]: 30,
      [InteractionFrequency.QUARTERLY]: 90,
      [InteractionFrequency.ADHOC]: 60
    }
    return frequencyMap[frequency]
  }

  private estimateTaskBudget(taskType: RelationshipTaskType): number {
    const budgetMap = {
      [RelationshipTaskType.BIRTHDAY_WISHES]: 200,
      [RelationshipTaskType.CONGRATULATIONS]: 300,
      [RelationshipTaskType.CONDOLENCES]: 500,
      [RelationshipTaskType.WELCOME_GIFT]: 150,
      [RelationshipTaskType.FAREWELL]: 400,
      [RelationshipTaskType.GET_WELL_WISHES]: 250,
      [RelationshipTaskType.HOLIDAY_GREETINGS]: 100,
      [RelationshipTaskType.APPRECIATION]: 200,
      [RelationshipTaskType.WORK_ANNIVERSARY]: 300,
      [RelationshipTaskType.TEAM_BUILDING]: 1000,
      [RelationshipTaskType.NETWORKING]: 500,
      [RelationshipTaskType.OTHER]: 200
    }
    return budgetMap[taskType] || 200
  }

  private suggestVendor(taskType: RelationshipTaskType): string {
    const vendorMap = {
      [RelationshipTaskType.BIRTHDAY_WISHES]: '本地花店或礼品店',
      [RelationshipTaskType.CONGRATULATIONS]: '高档礼品店',
      [RelationshipTaskType.CONDOLENCES]: '鲜花店',
      [RelationshipTaskType.GET_WELL_WISHES]: '果篮或营养品店',
      [RelationshipTaskType.WELCOME_GIFT]: '商务礼品店',
      [RelationshipTaskType.FAREWELL]: '纪念品定制店',
      [RelationshipTaskType.TEAM_BUILDING]: '活动策划公司',
      [RelationshipTaskType.HOLIDAY_GREETINGS]: '礼品卡或节日用品店',
      [RelationshipTaskType.APPRECIATION]: '高端礼品店',
      [RelationshipTaskType.WORK_ANNIVERSARY]: '纪念品定制店',
      [RelationshipTaskType.NETWORKING]: '商务俱乐部或高端餐厅',
      [RelationshipTaskType.OTHER]: '待确定'
    }
    return vendorMap[taskType] || '待确定'
  }

  private calculateAverageInteractionFrequency(): number {
    const activeContacts = this.database.contacts.filter(c => c.isActive)
    if (activeContacts.length === 0) return 0
    
    const totalFrequency = activeContacts.reduce((sum, contact) => {
      return sum + this.getFrequencyInDays(contact.interactionFrequency)
    }, 0)
    
    return totalFrequency / activeContacts.length
  }

  private calculateRelationshipHealth(): number {
    const activeContacts = this.database.contacts.filter(c => c.isActive)
    if (activeContacts.length === 0) return 100

    const now = new Date()
    let totalHealthScore = 0

    activeContacts.forEach(contact => {
      const daysSinceLastInteraction = Math.floor((now.getTime() - contact.lastInteraction.getTime()) / (24 * 60 * 60 * 1000))
      const expectedFrequencyDays = this.getFrequencyInDays(contact.interactionFrequency)
      
      // 计算健康度：按时互动得满分，超期扣分
      const healthScore = Math.max(0, 100 - (daysSinceLastInteraction - expectedFrequencyDays) * 5)
      totalHealthScore += healthScore
    })

    return Math.round(totalHealthScore / activeContacts.length)
  }

  private initializeDefaultRules() {
    // 这里可以初始化一些默认的自动化规则
    // 比如生日提醒、工作纪念日等
  }

  private triggerRules(triggerType: string, context: Record<string, unknown>) {
    // 实现规则触发逻辑
    // 触发规则
  }

  // ==================== 数据持久化 ====================

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(this.database, this.dateReplacer))
      }
    } catch (error) {
      // 保存关系数据失败
    }
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(this.storageKey)
        if (stored) {
          this.database = JSON.parse(stored, this.dateReviver)
        }
      }
    } catch (error) {
      // 加载关系数据失败
    }
  }

  private dateReplacer(key: string, value: unknown): unknown {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() }
    }
    return value
  }

  private dateReviver(key: string, value: unknown): unknown {
    if (typeof value === 'object' && value !== null && 
        value && typeof value === 'object' && 
        '__type' in value && value.__type === 'Date' &&
        'value' in value && typeof value.value === 'string') {
      return new Date(value.value)
    }
    return value
  }

  // ==================== 公共API ====================

  /**
   * 完成关系任务
   */
  completeRelationshipTask(taskId: string): boolean {
    const task = this.database.relationshipTasks.find(t => t.id === taskId)
    if (!task) return false

    task.status = RelationshipTaskStatus.COMPLETED
    task.completionDate = new Date()
    task.updatedAt = new Date()

    this.saveToStorage()
    return true
  }

  /**
   * 记录互动
   */
  recordInteraction(contactId: string, interactionType?: string) {
    const contact = this.getContact(contactId)
    if (!contact) return false

    contact.lastInteraction = new Date()
    contact.totalInteractions += 1
    this.updateContact(contactId, contact)

    // 记录互动
    return true
  }

  /**
   * 获取关系洞察
   */
  getRelationshipInsights(): RelationshipInsight[] {
    const now = new Date()
    return this.database.insights.filter(insight => 
      !insight.expiresAt || insight.expiresAt > now
    )
  }
}

// 导出单例
export const relationshipService = RelationshipService.getInstance()
export default RelationshipService
